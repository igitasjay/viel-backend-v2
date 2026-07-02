import { logger } from "@/lib/winston";
import * as ex from "../../externals/index";
import * as nf from "../../internals/notification";
// import * as switchX from "../../internals/crypto";

interface JobPayload {
    type: string;
    payload: any;
}

// import { handleProfileEvents } from "../internals/profile";

export async function handleJob(job: JobPayload) {
    const { payload, type } = job;

    try {
        switch (type) {
            case "VERIFY_ACCOUNT":
                logger.info(`Worker received VERIFY_ACCOUNT for ${payload.userId}`);
                return await ex.sendEmailVerificationOtp(
                    payload.recipient!,
                    payload.fullName!,
                    payload.userId!,
                );

            case "FORGOT_PASSWORD_RESET":
                logger.info(
                    `Worker received FORGOT_PASSWORD_RESET for ${payload.userId}`,
                );
                return await ex.sendPasswordReset(
                    payload.recipient!,
                    payload.fullName!,
                    payload.userId!,
                );
            case "FORGOT_PIN_RESET":
                logger.info(`Worker received FORGOT_PIN_RESET for ${payload.userId}`);
                return await ex.sendForgotPin(
                    payload.recipient!,
                    payload.fullName!,
                    payload.userId!,
                );
            case "DEVICE_VERIFICATION":
                logger.info(
                    `Worker received DEVICE_VERIFICATION for ${payload.userId}`,
                );
                return await ex.sendNewDeviceOtp(
                    payload.recipient!,
                    payload.fullname || payload.fullName!, // support both keys
                    payload.userId!,
                    payload.deviceId!,
                    payload.deviceInfo!,
                    payload.ipAddress!,
                    payload.timestamp!,
                );
            // case "PROFILE_UPDATED":
            //   logger.info(`Worker received PROFILE_UPDATED for ${payload.userId}`);
            //   // Handle profile update notifications
            //   // return await handleProfileUpdateNotification(payload);

            case "NOTIFICATION_EVENT":
                logger.info(
                    `Worker received NOTIFICATION_EVENT for ${payload.userId}: ${payload.title}`,
                );
                return await nf.NotificationService.processNotificationEvent(
                    payload as nf.NotificationEventPayload,
                );

            //   case "INCOMING_TRANSACTION":
            //     logger.info(
            //       `Worker received INCOMING_TRANSACTION for ${payload.event.creditAccountName}`,
            //     );
            //     return await tr.handleSafeHavenWebhook(payload.event);

            // case "CREATE_CRYPTO_ACCOUNT":
            //   logger.info(
            //     `Worker received Switch X account creation for ${payload.userId}: ${payload.email}`
            //   );
            //   return await switchX.handleCreateCryptoAccount({
            //     userId: payload.userId!,
            //     email: payload.email!,
            //     fullName: payload.fullName!,
            //   });
            //   case "INCOMING_SWITCHX_TRANSACTION":
            //     logger.info(
            //       `Worker received INCOMING_SWITCHX_TRANSACTION for ${payload.event.requestId}`,
            //     );
            //     return await switchX.handleSwitchWebhook(payload.event);
            case "GIFTCARD_PURCHASED":
                logger.info(`Worker received GIFTCARD_PURCHASED for ${payload.userId}`);
                return await ex.sendGiftcardPurchaseEmail(
                    payload.recipient,
                    payload.fullName,
                    payload.orderDetails,
                );

            case "GIFTCARD_SUBMITTED":
                logger.info(`Worker received GIFTCARD_SOLD for ${payload.userId}`);
                return await ex.sendGiftcardSaleSubmissionEmail(
                    payload.recipient,
                    payload.fullName,
                    payload.saleDetails,
                );

            case "GIFTCARD_SALE_APPROVED":
                logger.info(
                    `Worker received GIFTCARD_SALE_APPROVED for ${payload.userId}`,
                );
                return await ex.sendGiftcardSaleApprovedandPayoutEmail(
                    payload.recipient,
                    payload.fullName,
                    payload.payoutDetails,
                );

            case "GIFTCARD_SALE_REJECTED":
                logger.info(
                    `Worker received GIFTCARD_SALE_REJECTED for ${payload.userId}`,
                );
                return await ex.sendGiftcardSaleRejectedEmail(
                    payload.recipient,
                    payload.fullName,
                    payload.rejectionDetails,
                );

            case "GIFTCARD_SALE_CANCELLED":
                logger.info(
                    `Worker received GIFTCARD_SALE_CANCELLED for ${payload.userId}`,
                );
                return await ex.sendGiftcardSaleCancelledEmail(
                    payload.recipient,
                    payload.fullName,
                    payload.cancellationDetails,
                );

            // case "GIFTCARD_ORDER_REFUNDED":
            //   logger.info(
            //     `Worker received GIFTCARD_ORDER_REFUNDED for ${payload.userId}`
            //   );
            //   return await ex.sendGiftcardOrderRefundedEmail(
            //     payload.recipient,
            //     payload.fullName,
            //     payload.cancellationDetails
            //   );

            case "EMAIL_NOTIFICATION":
                logger.info(
                    `Worker received EMAIL_NOTIFICATION for ${payload.recipient}: ${payload.notificationDetails.title}`,
                );
                return await ex.sendNotificationEmail(
                    payload.recipient,
                    payload.fullName,
                    payload.notificationDetails,
                );

            default:
                logger.warn(`Unknown job type: ${type}`);
                throw new Error(`Unknown job type: ${type}`);
        }
    } catch (error: any) {
        logger.error(`❌ Failed to handle job type ${type}: ${error.message}`);
        logger.error(error.stack);
        throw error;
    }
}
