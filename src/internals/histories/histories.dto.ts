import Decimal from "decimal.js";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { decrypt } from "@shared/utils/encryption";
import { logger } from "@/lib/winston";

export class TransactionDTO {
  id: string;
  category: string;
  // narration?: string | null;
  status: string;
  type?: string | null;
  provider?: string | null;

  reference: string;
  sessionId?: string | null;
  dataPlan: string | null;
  cablePlan: string | null;

  amount: string;
  currency: string;
  fee?: string | null;
  usdValue?: string | null;
  transactionValue?: string | null;

  recipient?: string | null;
  sender?: string | null;
  institutionBank?: string | null;
  institutionAccountNo?: string | null;
  meterNo?: string | null;
  metertoken?: string | null;
  txHash?: string | null;
  rate?: string | null;
  value?: string | null;
  totalAmount?: string | null;

  createdAt: string;
  updatedAt: string;

  imageUrl?: string | null;

  eventDetails?: {
    eventName?: string | null;
    eventDate?: string | null;
    eventLocation?: string | null;
    eventImageUrls?: string[] | null;
    tierName?: string | null;
    quantity?: number | null;
  } | null;

  giftCardSaleDetails?: {
    cardType?: string | null;
    country?: string | null;
    cardRange?: string | null;
    cardValue?: string | null;
    cardCurrency?: string | null;
    quantity?: number | null;
    receiptType?: string | null;
    buyingRate?: string | null;
    totalCardValue?: string | null;
    // promoCode?: string | null;
    // promoDiscount?: string | null;
    images?: string[] | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    reviewNotes?: string | null;
    rejectionReason?: string | null;
    paidAt?: string | null;
    acceptedCardId?: string | null;
  } | null;

  giftCardPurchaseDetails?: {
    codes?: Array<{
      codeId: string;
      code: string;
      pin: string | null;
      redemptionUrl: string | null;
      status: string;
      deliveredAt: string | null;
    }>;
    quantity?: number | null;
    cardType?: string | null;
    cardValue?: string | null;
  } | null;

  // giftCardDetails?: {
  //   saleId: string;
  //   saleReference: string;
  //   cardType: string;
  //   country: string;
  //   cardRange: string;
  //   cardValue: string;
  //   cardCurrency: string;
  //   quantity: number;
  //   receiptType: string;
  //   buyingRate: string;
  //   totalCardValue: string;
  //   payoutAmount: string;
  //   promoDiscount?: string;
  //   status: string;
  //   images?: string[];
  //   reviewedAt?: string | null;
  //   reviewNotes?: string | null;
  //   rejectionReason?: string | null;
  //   paidAt?: string | null;
  // } | null;

  constructor(tx: any) {
    this.id = tx.id;
    this.category = tx.category;
    // this.narration = tx.narration;
    this.status = tx.status;
    this.type = tx.type;
    this.provider = tx.provider;

    this.reference = tx.reference;
    this.sessionId = tx.sessionId;
    this.dataPlan = tx.dataPlan;
    this.cablePlan = tx.cablePlan;

    this.amount = (tx.amount as Decimal).toFixed(2);

    this.currency = tx.currency;
    this.fee = tx.fee ? (tx.fee as Decimal).toFixed(2) : null;
    const totalAmount = Number(tx.amount) + Number(tx.fee || 0);
    this.totalAmount = totalAmount.toFixed(2);
    this.usdValue = tx.usdValue ? (tx.usdValue as Decimal).toFixed(2) : null;
    this.transactionValue = tx.transactionValue
      ? Number(tx.transactionValue).toFixed(2)
      : null;

    this.recipient = tx.recipient;
    this.sender = tx.sender;
    this.institutionBank = tx.institutionBank;
    this.institutionAccountNo = tx.institutionAccountNo;
    this.meterNo = tx.meterNo;
    this.metertoken = tx.metertoken;
    this.txHash = tx.txHash;
    this.rate = tx.rate ? Number(tx.rate).toFixed(2) : null;
    this.value = tx.transactionValue;

    const timeZone = "Africa/Lagos";
    this.createdAt = format(
      toZonedTime(tx.createdAt, timeZone),
      "yyyy-MM-dd HH:mm:ss",
    );
    this.updatedAt = format(
      toZonedTime(tx.updatedAt, timeZone),
      "yyyy-MM-dd HH:mm:ss",
    );

    this.imageUrl = tx.imageUrl || null;

    if (tx.category === "EVENTS") {
      const meta = tx.meta as any;
      this.eventDetails = {
        eventName: meta?.eventName || tx.event?.title || null,
        eventDate: meta?.eventDate
          ? format(
            toZonedTime(new Date(meta.eventDate), "Africa/Lagos"),
            "yyyy-MM-dd HH:mm:ss",
          )
          : tx.event?.date
            ? format(
              toZonedTime(new Date(tx.event.date), "Africa/Lagos"),
              "yyyy-MM-dd HH:mm:ss",
            )
            : null,
        eventLocation: meta?.eventLocation || tx.event?.location || null,
        eventImageUrls: meta?.eventImageUrls || tx.event?.imageUrls || null,
        tierName: meta?.tierName || null,
        quantity: meta?.quantity || null,
      };
    }

    if (tx.category === "GIFTCARDS") {
      const meta = tx.meta as any;

      if (tx.giftcardSaleId || tx.gcCountry) {
        this.giftCardSaleDetails = {
          cardType: tx.giftCardType || null,
          country: tx.gcCountry || null,
          cardRange: tx.gcCardRange || null,
          cardValue: tx.giftCardValue
            ? (tx.giftCardValue as Decimal).toFixed(2)
            : null,
          cardCurrency: tx.gcCardCurrency || null,
          quantity: tx.giftCardQuantity || null,
          receiptType: tx.giftCardReceipt || null,
          buyingRate: tx.rate || null,
          totalCardValue: tx.giftCardValue
            ? (tx.giftCardValue as Decimal).toFixed(2)
            : null,
          // promoCode: meta?.promoCode || null,
          // promoDiscount: meta?.promoDiscount || null,
          images: meta?.cardImages || null,
          reviewedAt: meta?.reviewedAt
            ? format(
              toZonedTime(new Date(meta.reviewedAt), "Africa/Lagos"),
              "yyyy-MM-dd HH:mm:ss",
            )
            : null,
          reviewedBy: meta?.reviewedBy || null,
          reviewNotes: meta?.reviewNotes || null,
          rejectionReason: meta?.rejectionReason || null,
          paidAt: meta?.paidAt
            ? format(
              toZonedTime(new Date(meta.paidAt), "Africa/Lagos"),
              "yyyy-MM-dd HH:mm:ss",
            )
            : null,
          acceptedCardId: tx.gcAcceptedCardId || null,
        };
      }

      // Check both meta.giftcardPurchaseCodes and meta.giftcard.giftcardPurchaseCodes
      const purchaseCodes =
        meta?.giftcardPurchaseCodes || meta?.giftcard?.giftcardPurchaseCodes;

      if (
        purchaseCodes &&
        Array.isArray(purchaseCodes) &&
        purchaseCodes.length > 0
      ) {
        this.giftCardPurchaseDetails = {
          codes: purchaseCodes.map((code: any) => {
            let decryptedCode = code.code;
            let decryptedPin = code.pin;

            try {
              if (code.code) {
                decryptedCode = decrypt(code.code);
              }
            } catch (error) {
              logger.error(
                `Failed to decrypt gift card code for transaction ${tx.id}:`,
                error as any,
              );
              decryptedCode = "DECRYPTION_FAILED";
            }

            try {
              if (code.pin) {
                decryptedPin = decrypt(code.pin);
              }
            } catch (error) {
              logger.error(
                `Failed to decrypt gift card PIN for transaction ${tx.id}:`,
                error as any,
              );
              decryptedPin = null;
            }

            return {
              codeId: code.codeId,
              code: decryptedCode,
              pin: decryptedPin || null,
              redemptionUrl: code.redemptionUrl || null,
              status: code.status,
              deliveredAt: code.deliveredAt
                ? format(
                  toZonedTime(new Date(code.deliveredAt), "Africa/Lagos"),
                  "yyyy-MM-dd HH:mm:ss",
                )
                : null,
            };
          }),
          quantity: purchaseCodes.length,
          cardType:
            tx.giftCardType ||
            meta?.cardType ||
            meta?.giftcard?.cardType ||
            null,
          cardValue: tx.giftCardValue
            ? (tx.giftCardValue as Decimal).toFixed(2)
            : null,
        };
      }
    }

    // if (tx.category === 'GIFTCARDS') {
    //   logger.debug(`Processing GIFTCARDS transaction ${tx.id}:`, {
    //     hasGiftcardCodes: !!tx.giftcardCodes,
    //     codesLength: tx.giftcardCodes?.length || 0,
    //     hasGiftcardSale: !!tx.giftcardSale,
    //   });

    //   if (tx.giftcardCodes && Array.isArray(tx.giftcardCodes) && tx.giftcardCodes.length > 0) {
    //     logger.info(`Decrypting ${tx.giftcardCodes.length} giftcard codes for transaction ${tx.id}`);
    //     this.giftCardCodes = tx.giftcardCodes.map((code: any) => {
    //       try {
    //         return {
    //           codeId: code.id,
    //           code: decrypt(code.encryptedCode),
    //           pin: code.encryptedPin ? decrypt(code.encryptedPin) : null,
    //           redemptionUrl: code.redemptionUrl,
    //           status: code.status,
    //           deliveredAt: code.deliveredAt?.toISOString() || null,
    //         };
    //       } catch (error) {
    //         return {
    //           codeId: code.id,
    //           code: "DECRYPTION_FAILED",
    //           pin: null,
    //           redemptionUrl: code.redemptionUrl,
    //           status: code.status,
    //           deliveredAt: code.deliveredAt?.toISOString() || null,
    //         };
    //       }
    //     });
    // }

    // if (tx.giftcardSale) {
    //   const sale = tx.giftcardSale;
    //   this.giftCardDetails = {
    //     saleId: sale.id,
    //     saleReference: sale.saleReference,
    //     cardType: sale.cardType,
    //     country: sale.country,
    //     cardRange: sale.cardRange,
    //     cardValue: sale.cardValue?.toString(),
    //     cardCurrency: sale.cardCurrency,
    //     quantity: sale.quantity,
    //     receiptType: sale.receiptType,
    //     buyingRate: sale.buyingRate?.toString(),
    //     totalCardValue: sale.totalCardValue?.toString(),
    //     payoutAmount: sale.payoutAmount?.toString(),
    //     promoDiscount: sale.promoDiscount ? sale.promoDiscount.toString() : undefined,
    //     status: sale.status,
    //     images: sale.cardImages,
    //     reviewedAt: sale.reviewedAt ? format(toZonedTime(sale.reviewedAt, "Africa/Lagos"), "yyyy-MM-dd HH:mm:ss") : null,
    //     reviewNotes: sale.reviewNotes,
    //     rejectionReason: sale.rejectionReason,
    //     paidAt: sale.paidAt ? format(toZonedTime(sale.paidAt, "Africa/Lagos"), "yyyy-MM-dd HH:mm:ss") : null,
    //   };
    // }
  }
}
// }
