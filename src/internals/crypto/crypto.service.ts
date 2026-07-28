import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";
import {
  generateTransactionReference,
  generateSessionId,
} from "@shared/helpers/references";
import { publishToQueue } from "@shared/workers/publisher";
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  ReferralEarningType,
  ReferralEarningStatus,
} from "@prisma/client";
import { ReferralConstants } from "@shared/types/enums";
import { ObiexEvent } from "./interface";
import { ObiexService } from "../../externals";
// import { emitVirtualWalletUpdate } from "../wallets";
// import { spinService } from "../spin";

export async function handleSwitchWebhook(event: ObiexEvent) {
  logger.info("SWITCHX WEBHOOK RECEIVED:", {
    currency: event.currency,
    chain: event.network,
    amount: event.amount,
    hash: event.hash,
    address: event.address,
    status: event.status,
  });

  try {
    const normalizedChain = event.network.toUpperCase();
    const normalizedAsset = event.currency.toUpperCase();
    const depositAmount = Number(event.amount);

    // Validate deposit amount
    if (isNaN(depositAmount) || depositAmount <= 0) {
      logger.warn(`Invalid deposit amount: ${event.amount}`);
      return { success: false, message: "Invalid amount" };
    }

    // Find wallet
    const cryptoWallet = await prisma.cryptoWallet.findFirst({
      where: {
        address: { equals: event.address, mode: "insensitive" },
        chain: { equals: normalizedChain, mode: "insensitive" },
        asset: normalizedAsset,
      },
    });

    if (!cryptoWallet) {
      logger.warn(`Wallet not found for address ${event.address}`);
      return { success: false, message: "Unknown address" };
    }

    // Check for duplicate transactions
    const existingTx = await prisma.transaction.findFirst({
      where: { txHash: event.hash },
    });

    if (existingTx?.status === TransactionStatus.SUCCESS) {
      logger.info(`Transaction already processed: ${event.hash}`);
      return { success: true, message: "Already processed" };
    }

    if (
      existingTx?.status === TransactionStatus.PENDING &&
      event.status === "PENDING"
    ) {
      logger.info(`Pending transaction already recorded: ${event.hash}`);
      return { success: true, message: "Already recorded as pending" };
    }

    const cryptoRate = await prisma.cryptoAsset.findFirst({
      where: {
        code: normalizedAsset,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!cryptoRate || !cryptoRate.buyRate) {
      logger.warn(`No buy rate found for ${normalizedAsset}/NGN`);
      return { success: false, message: "Rate not available" };
    }

    const coinBuyRate = Number(cryptoRate.buyRate);
    logger.info(`📊 Rate for ${normalizedAsset}: ₦${coinBuyRate}/USD`);

    let usdValue = 0;
    let ngnValue = 0;
    const isStableCoin = ["USDT", "USDC", "BUSD"].includes(normalizedAsset);

    if (isStableCoin) {
      // For stablecoins: 1 coin = 1 USD
      usdValue = Math.round(depositAmount * 100) / 100; // Round to 2 decimals
      ngnValue = Math.round(usdValue * coinBuyRate * 100) / 100; // Round NGN to 2 decimals

      logger.info(
        `💱 Stablecoin: ${depositAmount} ${normalizedAsset} = $${usdValue.toFixed(2)} → ₦${ngnValue.toFixed(2)} @ ₦${coinBuyRate}/USD`,
      );
    } else {
      // For other coins (BTC, ETH, etc.): Get USD value from Obiex quote
      logger.info(
        `Fetching USDT quote for ${depositAmount} ${normalizedAsset}...`,
      );

      try {
        const quoteResponse = await ObiexService.getTradeQuote({
          sourceId: normalizedAsset,
          targetId: "USDT",
          amount: depositAmount,
          side: "SELL",
        });

        logger.info(`Obiex quote:`, {
          amount: quoteResponse.data?.amount,
          amountReceived: quoteResponse.data?.amountReceived,
          rate: quoteResponse.data?.rate,
          sourceCode: quoteResponse.data?.sourceCode,
          targetCode: quoteResponse.data?.targetCode,
        });

        // Get USDT amount
        const usdtAmount = Number(quoteResponse?.data?.amountReceived || 0);

        if (usdtAmount <= 0) {
          logger.error(`Invalid USDT amount from quote: ${usdtAmount}`);
          return { success: false, message: "Could not get USDT conversion" };
        }

        // Round USDT amount to 2 decimals and keep as NUMBER for calculations
        // USD value = USDT amount (since USDT ≈ 1 USD)
        usdValue = Math.round(usdtAmount * 100) / 100; // 6.0041 → 6.00 (as number)

        // NGN value = rounded USD × coin's buy rate
        ngnValue = Math.round(usdValue * coinBuyRate * 100) / 100; // Also round NGN

        logger.info(`💱 Conversion:`);
        logger.info(
          `   ${depositAmount} ${normalizedAsset} → ${usdValue.toFixed(2)} USDT (≈ $${usdValue.toFixed(2)})`,
        );
        logger.info(
          `   $${usdValue.toFixed(2)} × ₦${coinBuyRate} = ₦${ngnValue.toFixed(2)}`,
        );
      } catch (quoteError) {
        logger.error("Failed to fetch Obiex quote:");
        return { success: false, message: "Failed to fetch conversion rate" };
      }
    }

    const transactionTxRef = `CRP|${generateTransactionReference()}`;
    const sessionId = generateSessionId();

    // Fetch the user's NGN wallet to get the walletId
    const ngnWallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: { userId: cryptoWallet.userId, currency: "NGN" },
      },
    });

    const bankAccount = await prisma.externalAccount.findFirst({
      where: { userId: cryptoWallet.userId },
      orderBy: { createdAt: "desc" },
    });

    if (event.status === "PENDING") {
      const transaction = await prisma.transaction.create({
        data: {
          userId: cryptoWallet.userId,
          walletId: ngnWallet?.id,
          category: TransactionCategory.CRYPTO,
          type: TransactionType.CREDIT,
          amount: ngnValue, // NGN value (already rounded)
          transactionValue: depositAmount.toString(), // Crypto amount
          usdValue: usdValue.toFixed(2), // USD equivalent - "6.00" format
          rate: coinBuyRate.toFixed(2), // Buy rate from crypto_rates table
          internalRef: event.transactionId,
          reference: transactionTxRef,
          sessionId,
          externalRef: event.reference,
          currency: normalizedAsset,
          txHash: event.hash,
          provider: "Viel",
          channel: "wallet",
          narration: `Crypto Deposit (${normalizedAsset}) - Pending`,
          status: TransactionStatus.PENDING,
        },
      });

      logger.info(
        `🔔 Pending deposit: ${depositAmount} ${normalizedAsset} (≈$${usdValue.toFixed(2)} → ₦${ngnValue.toFixed(2)})`,
      );

      // Send pending notification
      setImmediate(async () => {
        try {
          await publishToQueue({
            type: "NOTIFICATION_EVENT",
            payload: {
              userId: cryptoWallet.userId,
              notificationType: "TRANSACTION",
              priority: "high",
              title: "Incoming Crypto Deposit",
              message: `We've detected an incoming deposit of ${depositAmount} ${normalizedAsset}. It will be credited once confirmed on the blockchain.`,
              deliveryChannels: ["push", "in_app"],
              meta: {
                transactionId: transaction.id,
                asset: normalizedAsset,
                amount: depositAmount,
                hash: event.hash,
              },
            },
          });
          logger.info(
            `Pending notification queued for user ${cryptoWallet.userId}`,
          );
        } catch (error) {
          logger.error("Error queuing pending notification:");
        }
      });

      return { success: true, message: "Pending transaction recorded" };
    }

    const [transaction, updatedWallet] = await prisma.$transaction([
      // Update existing pending transaction OR create new one
      existingTx && existingTx.status === TransactionStatus.PENDING
        ? prisma.transaction.update({
          where: { id: existingTx.id },
          data: {
            status: TransactionStatus.SUCCESS,
            narration: `Crypto Deposit for ${normalizedAsset} confirmed`,
          },
        })
        : prisma.transaction.create({
          data: {
            userId: cryptoWallet.userId,
            walletId: ngnWallet?.id,
            category: TransactionCategory.CRYPTO,
            type: TransactionType.CREDIT,
            amount: ngnValue, // Already rounded
            transactionValue: depositAmount.toString(),
            usdValue: usdValue.toFixed(2), // "6.00" format
            rate: coinBuyRate.toFixed(2),
            internalRef: event.transactionId,
            reference: transactionTxRef,
            sessionId,
            externalRef: event.reference,
            currency: normalizedAsset,
            txHash: event.hash,
            provider: "Viel",
            channel: "wallet",
            narration: `Crypto Deposit (${normalizedAsset})`,
            status: TransactionStatus.SUCCESS,
          },
        }),
      // Credit wallet with NGN value (upsert — creates volume tracker if first transaction)
      prisma.wallet.upsert({
        where: {
          userId_currency: { userId: cryptoWallet.userId, currency: "NGN" },
        },
        create: {
          userId: cryptoWallet.userId,
          currency: "NGN",
          sellVolume: ngnValue,
        },
        update: { sellVolume: { increment: ngnValue } },
      }),
    ]);

    logger.info(`✅ DEPOSIT SUCCESS:`);
    logger.info(`   User: ${cryptoWallet.userId}`);
    logger.info(`   Crypto: ${depositAmount} ${normalizedAsset}`);
    logger.info(`   USD Value: $${usdValue.toFixed(2)}`);
    logger.info(`   Rate: ₦${coinBuyRate}/USD`);
    logger.info(`   NGN Value: ₦${ngnValue.toFixed(2)}`);
    logger.info(`   New Balance: ₦${updatedWallet.sellVolume}`);

    // Attempt auto-payout via Obiex fiat off-ramping if bank account exists
    let payoutSuccessful = false;
    let payoutError = "";

    if (bankAccount && bankAccount.providerCode) {
      try {
        const payoutRef = `PAYOUT|${transactionTxRef}`;

        // Rate guard: fetch Obiex live NGN rate for this asset
        let payoutAmount = ngnValue;
        try {
          const ngnQuote = await ObiexService.getTradeQuote({
            sourceId: normalizedAsset,
            targetId: "NGNX",
            amount: depositAmount,
            side: "SELL",
          });

          const obiexNgnAmount = Number(ngnQuote?.data?.amountReceived || 0);
          if (obiexNgnAmount > 0 && payoutAmount > obiexNgnAmount) {
            // Our custom rate exceeds Obiex's live rate — cap at 99% of Obiex rate to retain 1% margin
            const cappedAmount = Math.round(obiexNgnAmount * 0.99 * 100) / 100;
            logger.warn(
              `⚠️ Rate guard triggered: Custom ₦${payoutAmount.toFixed(2)} > Obiex ₦${obiexNgnAmount.toFixed(2)}. Capping payout at ₦${cappedAmount.toFixed(2)} (1% margin)`
            );
            payoutAmount = cappedAmount;
          } else {
            logger.info(
              `✅ Rate guard passed: Custom ₦${payoutAmount.toFixed(2)} <= Obiex ₦${obiexNgnAmount.toFixed(2)}`
            );
          }
        } catch (quoteErr) {
          logger.warn(`⚠️ Rate guard quote failed, proceeding with custom rate ₦${payoutAmount.toFixed(2)}`, {
            error: quoteErr instanceof Error ? quoteErr.message : quoteErr,
          });
        }

        logger.info(
          `Attempting Obiex fiat withdrawal: ₦${payoutAmount.toFixed(2)} to ${bankAccount.accountNumber} (${bankAccount.bankName})`
        );

        const payoutResponse = await ObiexService.withdrawFiat({
          amount: payoutAmount,
          bankCode: bankAccount.providerCode,
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
        });

        logger.info(`Obiex withdrawal response:`, {
          message: payoutResponse.message,
          payoutStatus: payoutResponse.data?.payout?.status,
          payoutAmount: payoutResponse.data?.payout?.payoutAmount,
          reference: payoutResponse.data?.reference,
        });

        if (payoutResponse.data?.payout?.status === "APPROVED") {
          payoutSuccessful = true;

          // Deduct from wallet and record payout transaction
          await prisma.$transaction([
            prisma.transaction.create({
              data: {
                userId: cryptoWallet.userId,
                walletId: ngnWallet?.id,
                category: TransactionCategory.CRYPTO,
                type: TransactionType.DEBIT,
                amount: payoutAmount,
                reference: payoutRef,
                externalRef: payoutResponse.data.reference,
                currency: "NGN",
                provider: "Obiex",
                channel: "bank_transfer",
                narration: `Auto-payout for ${normalizedAsset} deposit`,
                status: TransactionStatus.SUCCESS,
              },
            }),
            prisma.wallet.update({
              where: { id: updatedWallet.id },
              data: { sellVolume: { decrement: payoutAmount } },
            }),
          ]);
          logger.info(`✅ Obiex auto-payout successful for transaction ${transactionTxRef}`);
        } else {
          payoutError = `Obiex payout status: ${payoutResponse.data?.payout?.status || "unknown"}`;
          logger.error(`❌ Obiex auto-payout not approved: ${payoutError}`);
        }
      } catch (error: any) {
        payoutError = error.message || "Failed to process Obiex withdrawal";
        logger.error(`❌ Obiex auto-payout failed:`, { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
      }
    } else {
      logger.warn(`No valid bank account found for user ${cryptoWallet.userId}, skipping auto-payout`);
    }

    // Prepare success notification message based on payout status
    let successMessage = `Your deposit of ${depositAmount} ${normalizedAsset} has been confirmed.`;
    if (payoutSuccessful) {
      successMessage += ` ₦${ngnValue.toFixed(2)} has been automatically transferred to your bank account (${bankAccount?.bankName} - ${bankAccount?.accountNumber}).`;
    } else {
      successMessage += ` ₦${ngnValue.toFixed(2)} has been credited to your internal wallet.`;
      if (payoutError) {
        successMessage += ` Automatic bank transfer failed: ${payoutError}. You can manually withdraw these funds at any time.`;
      }
    }

    // Emit real-time wallet update via Socket.IO
    // emitVirtualWalletUpdate(
    //   cryptoWallet.userId,
    //   updatedWallet.sellVolume.toString(),
    //   undefined,
    //   {
    //     id: transaction.id,
    //     type: TransactionType.CREDIT,
    //     amount: ngnValue.toString(),
    //     reference: transaction.reference,
    //   },
    // );

    // Send success notification
    setImmediate(async () => {
      try {
        await publishToQueue({
          type: "NOTIFICATION_EVENT",
          payload: {
            userId: cryptoWallet.userId,
            notificationType: "TRANSACTION",
            priority: "high",
            title: "Crypto Deposit Confirmed",
            message: successMessage,
            deliveryChannels: ["push", "in_app"],
            meta: {
              transactionId: transaction.id,
              reference: transaction.reference,
              amount: ngnValue,
              cryptoAmount: depositAmount,
              asset: normalizedAsset,
              chain: cryptoWallet.chain,
            },
          },
        });
        logger.info(
          `Success notification queued for user ${cryptoWallet.userId}`,
        );
      } catch (error) {
        logger.error("Error queuing success notification:");
      }
    });

    // Award referral bonus if conditions met
    setImmediate(async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: cryptoWallet.userId },
          select: {
            referredById: true,
            isKycVerified: true,
            fullname: true,
          },
        });

        if (
          user?.referredById &&
          user.isKycVerified &&
          usdValue >= ReferralConstants.MIN_REFERRAL_TRANSACTION_USD
        ) {
          const referrerId = user.referredById;

          // Check for pending referral earning
          const pendingBonus = await prisma.referralEarning.findFirst({
            where: {
              userId: referrerId,
              referredUserId: cryptoWallet.userId,
              earningType: ReferralEarningType.SIGNUP,
              status: ReferralEarningStatus.PENDING,
            },
          });

          if (pendingBonus) {
            const BONUS_AMOUNT = Number(pendingBonus.amount);

            await prisma.$transaction(async (tx) => {
              await tx.referralEarning.update({
                where: { id: pendingBonus.id },
                data: {
                  status: ReferralEarningStatus.CONFIRMED,
                  expiresAt: new Date(
                    new Date().setFullYear(new Date().getFullYear() + 1),
                  ),
                  meta: {
                    transactionId: transaction.id,
                    usdValue: usdValue,
                    earnedAt: new Date().toISOString(),
                  },
                },
              });

              await tx.wallet.updateMany({
                where: { userId: referrerId, currency: "NGN" },
                data: {
                  referralBalance: { increment: BONUS_AMOUNT },
                },
              });
            });

            logger.info(
              `✅ Referral bonus of ₦${BONUS_AMOUNT} confirmed for ${referrerId} for transaction by ${cryptoWallet.userId}`,
            );

            // Notify referrer
            await publishToQueue({
              type: "NOTIFICATION_EVENT",
              payload: {
                userId: referrerId,
                title: "Referral Bonus Confirmed!",
                message: `Congratulations! Your referral bonus for ${user.fullname} has been confirmed. You've earned ₦${BONUS_AMOUNT}.`,
                type: "REWARD",
                priority: "high",
                meta: {
                  rewardAmount: BONUS_AMOUNT,
                  referredUserName: user.fullname,
                  bonusType: "SIGNUP",
                },
              },
            });
          }
        }
      } catch (error) {
        logger.error("Error awarding referral bonus:", { error });
      }
    });

    return { success: true, message: "Deposit processed successfully" };
  } catch (err) {
    logger.error("❌ Webhook processing failed:", { error: err instanceof Error ? { message: err.message, stack: err.stack } : err });
    throw err;
  }
}
