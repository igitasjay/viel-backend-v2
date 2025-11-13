// src/controllers/fiat/fiat.controller.ts
import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import CryptoAsset from '@/models/crypto.model';
import Transaction from '@/models/transaction.model';
import { fetchLiveRate } from '@/lib/twelve-data';
import { logger } from '@/lib/winston';
import { getNextSequence } from '@/lib/sequence';
import { initializeTransaction, verifyTransaction } from '@/lib/paystack';
import config from '@/config';

const buyValidation = [
  body('coin').trim().notEmpty().toUpperCase(),
  body('network').trim().notEmpty().toUpperCase(),
  body('amount').isFloat({ min: 0 }),
  body('receiveAddress').trim().notEmpty(),
];

export const initializeBuyCrypto = [
  ...buyValidation,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ code: 'ValidationError', errors: errors.array() });
      return;
    }

    const { coin, network, amount: cryptoAmountStr, receiveAddress } = req.body;
    const cryptoAmount = parseFloat(cryptoAmountStr!);

    try {
      // Find asset & network
      const asset = await CryptoAsset.findOne({
        code: coin,
        status: 1,
        'networks.code': network,
        'networks.enabled': true,
      }).lean();

      if (!asset) {
        res.status(404).json({
          code: 'NotFound',
          message: 'Coin or network not supported.',
        });
        return;
      }

      const net = asset.networks.find((n: any) => n.code === network);
      if (!net) {
        res
          .status(404)
          .json({ code: 'NotFound', message: 'Network not enabled.' });
        return;
      }

      // Validate receive address
      const addressRegex = new RegExp(net.addressRegex);
      if (!addressRegex.test(receiveAddress)) {
        res.status(400).json({
          code: 'InvalidAddress',
          message: 'Invalid receive address format.',
        });
        return;
      }

      // Check minimum (reuse deposit min as buy min for simplicity)
      if (cryptoAmount < parseFloat(net.minimum)) {
        res.status(400).json({
          code: 'BelowMinimum',
          message: `Minimum buy amount: ${net.minimum} ${coin}`,
        });
        return;
      }

      // Live rate
      const live = await fetchLiveRate(asset.code);
      const rate = parseFloat(String(live?.ngn ?? asset.naira_rate));
      const nairaAmount = cryptoAmount * rate;

      // Generate reference
      const reference = `buy_${req.userId}_${Date.now()}`;

      // Create transaction
      const txId = await getNextSequence('transactionId');
      const tx = await Transaction.create({
        id: txId,
        userId: req.userId,
        type: 'buy_crypto' as const,
        coin,
        network,
        crypto_amount: cryptoAmount.toFixed(asset.maximumDecimalPlaces),
        fiat_amount: nairaAmount.toFixed(2),
        receive_address: receiveAddress,
        reference,
        status: 'pending',
      });

      // Initialize Paystack
      const paystackRes = await initializeTransaction({
        email: req.body.email,
        amount: nairaAmount,
        reference,
        callback_url: `${config.FRONTEND_URL}/pay/success?ref=${reference}`,
        metadata: { txId, coin, crypto_amount: cryptoAmount },
      });

      if (!paystackRes.status) {
        await tx.deleteOne();
        res.status(500).json({
          code: 'PaystackError',
          message: 'Payment initialization failed.',
        });
        return;
      }

      await Transaction.updateOne(
        { id: txId },
        {
          status: 'initialized',
          paystack_data: paystackRes.data,
        },
      );

      logger.info('Paystack payment initialized', {
        txId,
        reference,
        nairaAmount,
      });

      res.status(201).json({
        message: 'Payment initialized successfully.',
        data: {
          reference,
          naira_amount: nairaAmount.toFixed(2),
          authorization_url: paystackRes.data.authorization_url,
          access_code: paystackRes.data.access_code,
        },
      });
    } catch (error) {
      logger.error('Initialize buy failed:', error);
      res
        .status(500)
        .json({ code: 'ServerError', message: 'Initialization failed.' });
    }
  },
];

export const verifyPayment = [
  param('reference').trim().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    const { reference } = req.params;

    try {
      const paystackData = await verifyTransaction(reference);
      if (
        paystackData.status !== true ||
        paystackData.data.status !== 'success'
      ) {
        await Transaction.updateOne({ reference }, { status: 'failed' });
        res.status(400).json({
          code: 'PaymentFailed',
          message: 'Payment was not successful.',
        });
        return;
      }

      const tx = await Transaction.findOne({ reference });
      if (!tx || (tx.status !== 'pending' && tx.status !== 'initialized')) {
        res.status(400).json({
          code: 'InvalidTx',
          message: 'Transaction not found or already processed.',
        });
        return;
      }

      // Update to paid
      await Transaction.updateOne(
        { id: tx.id },
        {
          status: 'paid',
          paystack_data: paystackData.data,
        },
      );

      // TODO: Dispatch crypto (integrate your Ethers.js scripts here)
      // Example stub:
      logger.info('Payment verified - Dispatch crypto:', {
        txId: tx.id,
        coin: tx.coin,
        amount: tx.crypto_amount,
        to: tx.receive_address,
      });
      // await sendCrypto(tx.coin!, tx.network!, tx.crypto_amount!, tx.receive_address!);
      // await Transaction.updateOne({ id: tx.id }, { status: 'completed' });

      logger.info('Buy crypto payment completed', { reference });
      res.json({
        message: 'Payment verified successfully. Crypto dispatch initiated.',
        data: paystackData.data,
      });
    } catch (error: any) {
      logger.error('Verify failed:', error);
      res
        .status(500)
        .json({ code: 'ServerError', message: 'Verification failed.' });
    }
  },
];
