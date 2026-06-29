import { Resend } from "resend";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { config } from "@/shared/config/config";
import * as repo from "./repo";
import { OtpAction } from "@prisma/client";
import { logger } from "@/lib/winston";

// resend transporter adapter
const resend = new Resend(config.mail.resendApiKey);

const transporter = {
    sendMail: async (options: { from: string; to: string; subject: string; html: string }) => {
        const { data, error } = await resend.emails.send(options);
        if (error) {
            throw error;
        }
        return { ...data, messageId: data?.id };
    }
};

export function generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString().padStart(6, "0");
}

function getEmailTemplate(
    templateName: string,
    context: Record<string, string>,
) {
    let templatePath: string;

    // Try dist location first (production/Docker)
    templatePath = path.join(
        process.cwd(),
        "dist",
        "externals",
        "templates",
        `${templateName}.html`,
    );

    if (!fs.existsSync(templatePath)) {
        // Fallback to src location (development)
        templatePath = path.join(
            process.cwd(),
            "src",
            "templates",
            `${templateName}.html`,
        );
    }

    if (!fs.existsSync(templatePath)) {
        console.log("Template not found. Searched in:");
        console.log("1. dist/externals/templates/", templateName + ".html");
        console.log("2. src/templates/", templateName + ".html");
        console.log("Current working directory:", process.cwd());
        throw new Error(`Template not found: ${templateName}.html`);
    }

    let template = fs.readFileSync(templatePath, "utf-8");
    const fullContext = { ...context, year: new Date().getFullYear().toString() };

    for (const [key, value] of Object.entries(fullContext)) {
        template = template.replace(new RegExp(`\\$${key}`, "g"), value);
    }

    return template;
}

export async function sendEmailVerificationOtp(
    recipient: string,
    fullName: string,
    userId: string,
) {
    if (!recipient) throw new Error("Recipient email is required");

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await repo.updateOrCreateOtp(
        userId,
        otp,
        expiresAt,
        OtpAction.VERIFY_ACCOUNT,
        "email",
    );

    const emailContent = getEmailTemplate("verify-account", {
        title: "🔑 Verify Your Email",
        message: "Use the OTP below to verify your email.",
        name: fullName,
        otp,
        appName: "Viel",
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "Your OTP for Email Verification",
            html: emailContent,
        });
    } catch (err) {
        await repo.clearOtp(userId, OtpAction.VERIFY_ACCOUNT);
        throw new Error("Failed to send email verification OTP: " + err);
    }
}

export async function sendPasswordReset(
    recipient: string,
    fullName: string,
    userId: string,
) {
    if (!recipient) throw new Error("Recipient email is required");

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await repo.updateOrCreateOtp(
        userId,
        otp,
        expiresAt,
        OtpAction.PASSWORD_RESET,
        "email",
    );

    const emailContent = getEmailTemplate("password-reset", {
        title: "🔒 Reset Your Password",
        message: "Use the OTP below to reset your password",
        name: fullName,
        otp,
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "Your OTP for Email Verification",
            html: emailContent,
        });
    } catch (err) {
        await repo.clearOtp(userId, OtpAction.VERIFY_ACCOUNT);
        throw new Error("Failed to send email verification OTP: " + err);
    }
}

export async function sendForgotPin(
    recipient: string,
    fullName: string,
    userId: string,
) {
    if (!recipient) throw new Error("Recipient email is required");

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await repo.updateOrCreateOtp(
        userId,
        otp,
        expiresAt,
        OtpAction.PIN_RESET,
        "email",
    );

    const emailContent = getEmailTemplate("account-pin-reset", {
        title: "🔒 Reset Your Pin",
        message: "Use the OTP below to reset your pin",
        name: fullName,
        otp,
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "Your OTP for Email Verification",
            html: emailContent,
        });
    } catch (err) {
        await repo.clearOtp(userId, OtpAction.PIN_RESET);
        throw new Error("Failed to send email verification OTP: " + err);
    }
}

export async function sendNewDeviceOtp(
    recipient: string,
    fullName: string,
    userId: string,
    deviceId: string,
    deviceInfo: any,
    _ipAddress: string,
    timestamp: string,
) {
    if (!recipient) throw new Error("Recipient email is required");

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await repo.updateOrCreateOtp(
        userId,
        otp,
        expiresAt,
        OtpAction.DEVICE_VERIFICATION,
        "email",
        deviceId,
    );

    const loginDate = new Date(timestamp);
    const emailContent = getEmailTemplate("device-verification", {
        name: fullName,
        appName: "Viel",
        deviceName: deviceInfo.deviceName || deviceInfo.deviceType,
        location: deviceInfo.location || "Unknown",
        osVersion: deviceInfo.osVersion,
        loginTime: loginDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }),
        loginDate: loginDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        otp,
        supportEmail: "Support@myviel.com",
        supportPhone: "07041300082",
    });

    try {
        logger.info(
            `Sending device verification email to ${recipient} with OTP: ${otp}`,
        );
        const result = await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "New Device Login - Verification Required",
            html: emailContent,
        });
        logger.info(
            `Device verification email sent successfully to ${recipient}. MessageId: ${result.messageId}`,
        );
        return result;
    } catch (err) {
        logger.error(
            `Failed to send device verification email to ${recipient}: ${err}`,
        );
        await repo.clearOtp(userId, OtpAction.DEVICE_VERIFICATION);
        throw new Error("Failed to send device verification OTP: " + err);
    }
}

export async function sendGiftcardPurchaseEmail(
    recipient: string,
    fullName: string,
    orderDetails: {
        orderId: string;
        orderReference: string;
        productName: string;
        quantity: number;
        cardValue: string;
        totalAmount: number;
        status: string;
        purchasedAt: string;
        codes?: Array<{
            code: string;
            pin: string | null;
            redemptionUrl: string | null;
        }>;
    },
) {
    if (!recipient) throw new Error("Recipient email is required");

    // Determine email title and message based on status
    const isSuccess = orderDetails.status === "SUCCESS";
    const isProcessing = orderDetails.status === "PROCESSING";

    const emailTitle = isSuccess
        ? "Order Confirmed!"
        : isProcessing
            ? "Order Processing"
            : "Order Received";

    const emailMessage = isSuccess
        ? "Thank you for your gift card purchase! Your order has been successfully processed and your codes are ready."
        : isProcessing
            ? "Thank you for your gift card purchase! Your order is being processed. You'll receive your codes shortly via email and in-app."
            : "Thank you for your gift card purchase! Your order has been received and is being processed.";

    const codesSection =
        orderDetails.codes && orderDetails.codes.length > 0
            ? orderDetails.codes
                .map(
                    (codeItem, index) => `
        ${index === 0 ? '<div style="border-top: 1px solid #bbf7d0; margin-top: 10px; padding-top: 8px;"></div>' : ""}
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bbf7d0;">
          <span style="color: #15803d; font-weight: 500;">Redeem Code${orderDetails.codes!.length > 1 ? ` (${index + 1}/${orderDetails.codes!.length})` : ""}:</span>
          <span style="color: #166534; font-weight: 600; font-family: 'Courier New', monospace;">${codeItem.code}</span>
        </div>
        ${codeItem.pin
                            ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bbf7d0;">
          <span style="color: #15803d; font-weight: 500;">PIN${orderDetails.codes!.length > 1 ? ` (${index + 1}/${orderDetails.codes!.length})` : ""}:</span>
          <span style="color: #166534; font-weight: 600; font-family: 'Courier New', monospace;">${codeItem.pin}</span>
        </div>
        `
                            : ""
                        }
        ${codeItem.redemptionUrl
                            ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bbf7d0;">
          <span style="color: #15803d; font-weight: 500;">Redeem URL${orderDetails.codes!.length > 1 ? ` (${index + 1}/${orderDetails.codes!.length})` : ""}:</span>
          <a href="${codeItem.redemptionUrl}" style="color: #059669; font-weight: 600; text-decoration: none;">Click to Redeem →</a>
        </div>
        `
                            : ""
                        }
      `,
                )
                .join("") +
            `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 15px; border-radius: 6px; margin-top: 20px; font-size: 14px; color: #92400e;">
        <strong>⚠️ Important:</strong> Keep these codes secure. They are as valuable as cash and can be redeemed by anyone who has them.
      </div>
      `
            : "";

    const emailContent = getEmailTemplate("purchase-confirmation", {
        name: fullName,
        emailTitle,
        emailMessage,
        orderReference: orderDetails.orderReference,
        productName: orderDetails.productName,
        quantity: orderDetails.quantity.toString(),
        cardValue: orderDetails.cardValue,
        totalAmount: `₦${orderDetails.totalAmount.toLocaleString()}`,
        status: orderDetails.status,
        purchaseDate: new Date(orderDetails.purchasedAt).toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            },
        ),
        purchaseTime: new Date(orderDetails.purchasedAt).toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            },
        ),
        appName: "Viel",
        supportEmail: "support@myviel.com",
        codesSection,
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: `Gift Card Order Confirmation - ${orderDetails.orderReference}`,
            html: emailContent,
        });
    } catch (err: any) {
        logger.error("Failed to send purchase confirmation email:", err);
        throw new Error("Failed to send purchase confirmation email: " + err);
    }
}

export async function sendGiftcardSaleSubmissionEmail(
    recipient: string,
    fullName: string,
    saleDetails: {
        saleId: string;
        cardType: string;
        country: string;
        cardRange: string;
        cardValue: number;
        cardCurrency: string;
        quantity: number;
        receiptType: string;
        payoutAmount: number;
        buyingRate: number;
        submittedAt: string;
    },
) {
    if (!recipient) throw new Error("Recipient email is required");

    const emailContent = getEmailTemplate("sale-submission", {
        name: fullName,
        cardType: saleDetails.cardType,
        country: saleDetails.country,
        cardRange: saleDetails.cardRange,
        cardValue: `${saleDetails.cardCurrency}${saleDetails.cardValue}`,
        quantity: saleDetails.quantity.toString(),
        receiptType: saleDetails.receiptType.replace(/_/g, " "),
        buyingRate: saleDetails.buyingRate.toString(),
        expectedPayout: `₦${saleDetails.payoutAmount.toLocaleString()}`,
        submittedDate: new Date(saleDetails.submittedAt).toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            },
        ),
        submittedTime: new Date(saleDetails.submittedAt).toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            },
        ),
        estimatedReviewTime: "within 24 hours",
        appName: "Viel",
        supportEmail: "support@myviel.com",
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "Gift Card Submitted for Review",
            html: emailContent,
        });
    } catch (err: any) {
        logger.error("Failed to send sale submission email:", err);
        throw new Error("Failed to send sale submission email: " + err);
    }
}

export async function sendGiftcardSaleApprovedandPayoutEmail(
    recipient: string,
    fullName: string,
    payoutDetails: {
        saleId: string;
        cardType: string;
        cardValue: number;
        quantity: number;
        payoutAmount: number;
        transactionId: string;
        paidAt: string;
    },
) {
    if (!recipient) {
        logger.error("Recipient email is required for sale approval email");
        return;
    }

    const emailContent = getEmailTemplate("sale-approved", {
        name: fullName,
        cardType: payoutDetails.cardType,
        cardValue: payoutDetails.cardValue.toString(),
        quantity: payoutDetails.quantity.toString(),
        payoutAmount: `₦${payoutDetails.payoutAmount.toLocaleString()}`,
        transactionId: payoutDetails.transactionId,
        paidDate: new Date(payoutDetails.paidAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        paidTime: new Date(payoutDetails.paidAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }),
        appName: "Viel",
        supportEmail: "support@Viel.com",
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "🎉 Payment Received - Gift Card Sale Approved",
            html: emailContent,
        });
    } catch (err: any) {
        logger.error("Failed to send sale approved email:", err);
    }
}

export async function sendGiftcardSaleRejectedEmail(
    recipient: string,
    fullName: string,
    rejectionDetails: {
        saleId: string;
        cardType: string;
        rejectionReason: string;
        reviewNotes?: string;
        rejectedAt: string;
    },
) {
    if (!recipient) throw new Error("Recipient email is required");

    const emailContent = getEmailTemplate("sale-rejected", {
        name: fullName,
        cardType: rejectionDetails.cardType,
        rejectionReason: rejectionDetails.rejectionReason,
        reviewNotes: rejectionDetails.reviewNotes || "No additional notes provided",
        rejectedDate: new Date(rejectionDetails.rejectedAt).toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            },
        ),
        rejectedTime: new Date(rejectionDetails.rejectedAt).toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            },
        ),
        appName: "Viel",
        supportEmail: "support@Viel.com",
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "Gift Card Sale Update - Action Required",
            html: emailContent,
        });
    } catch (err: any) {
        logger.error("Failed to send sale rejection email:", err);
        throw new Error("Failed to send sale rejection email: " + err);
    }
}

export async function sendGiftcardSaleCancelledEmail(
    recipient: string,
    fullName: string,
    cancellationDetails: {
        saleId: string;
        cancelledAt: string;
    },
) {
    if (!recipient) throw new Error("Recipient email is required");

    const emailContent = getEmailTemplate("sale-cancelled", {
        name: fullName,
        saleId: cancellationDetails.saleId,
        cancelledDate: new Date(cancellationDetails.cancelledAt).toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            },
        ),
        cancelledTime: new Date(cancellationDetails.cancelledAt).toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            },
        ),
        appName: "Viel",
        supportEmail: "support@Viel.com",
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: "Gift Card Sale Cancelled",
            html: emailContent,
        });
    } catch (err: any) {
        logger.error("Failed to send cancellation email:", err);
        throw new Error("Failed to send cancellation email: " + err);
    }
}

export async function sendTicketPurchaseEmail(
    recipient: string,
    fullName: string,
    ticketDetails: {
        eventTitle: string;
        eventDate: string;
        eventLocation: string;
        ticketType: string;
        quantity: number;
        totalPrice: string;
        ticketId: string;
    },
) {
    if (!recipient) throw new Error("Recipient email is required");

    const eventDateObj = new Date(ticketDetails.eventDate);

    const emailContent = getEmailTemplate("ticket-purchase", {
        name: fullName,
        eventTitle: ticketDetails.eventTitle,
        eventDate: eventDateObj.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        eventTime: eventDateObj.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }),
        eventLocation: ticketDetails.eventLocation,
        ticketType: ticketDetails.ticketType,
        quantity: ticketDetails.quantity.toString(),
        totalPrice: ticketDetails.totalPrice,
        ticketId: ticketDetails.ticketId,
        appName: "Viel",
        supportEmail: "support@Viel.com",
    });

    try {
        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: `Your Ticket for ${ticketDetails.eventTitle}`,
            html: emailContent,
        });
    } catch (err: any) {
        logger.error("Failed to send ticket purchase email:", err);
        throw new Error("Failed to send ticket purchase email: " + err);
    }
}

export async function sendNotificationEmail(
    recipient: string,
    fullName: string,
    notificationDetails: {
        notificationType:
        | "TRANSACTION"
        | "WALLET"
        | "GIFTCARD"
        | "DISPUTE"
        | "SECURITY"
        | "PROMO"
        | "SYSTEM"
        | "REWARD"
        | "TICKET_PURCHASE"
        | "MARKETING";
        title: string;
        message: string;
        metadata?: Record<string, any>;
    },
) {
    if (!recipient) {
        logger.error("Recipient email is required for notification email");
        return;
    }

    const {
        notificationType,
        title,
        message,
        metadata = {},
    } = notificationDetails;

    // Map notification type to email template and subject
    const notificationConfig: Record<
        string,
        { template: string; subject: string }
    > = {
        TRANSACTION: {
            template: "notification-transaction",
            subject: "Transaction Notification",
        },
        WALLET: {
            template: "notification-wallet",
            subject: "Wallet Update",
        },
        GIFTCARD: {
            template: "notification-giftcard",
            subject: "Gift Card Notification",
        },
        DISPUTE: {
            template: "notification-dispute",
            subject: "Dispute Notification",
        },
        SECURITY: {
            template: "notification-security",
            subject: "Security Alert",
        },
        PROMO: {
            template: "notification-promo",
            subject: "Special Offer for You",
        },
        SYSTEM: {
            template: "notification-system",
            subject: "System Notification",
        },
        REWARD: {
            template: "notification-reward",
            subject: "Reward Notification",
        },
        TICKET_PURCHASE: {
            template: "notification-ticket",
            subject: "Ticket Notification",
        },
        MARKETING: {
            template: "notification-marketing",
            subject: "Exclusive Update from Viel",
        },
    };

    const config = notificationConfig[notificationType];

    if (!config) {
        logger.error(`Unknown notification type: ${notificationType}`);
        return;
    }

    // Build template context with metadata
    const templateContext: Record<string, string> = {
        name: fullName,
        title,
        message,
        appName: "Viel",
        supportEmail: "support@Viel.com",
    };

    // Add metadata fields to context (convert all values to strings)
    if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
            templateContext[key] = String(value);
        });
    }

    try {
        const emailContent = getEmailTemplate(config.template, templateContext);

        return await transporter.sendMail({
            from: `"Viel" <no-reply@myviel.com>`,
            to: recipient,
            subject: config.subject,
            html: emailContent,
        });
    } catch (err: any) {
        logger.error(`Failed to send ${notificationType} notification email:`, err);
        // Don't throw error - email sending is optional
    }
}
