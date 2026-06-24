-- CreateEnum
CREATE TYPE "AlertRateType" AS ENUM ('SELL', 'BUY');

-- CreateEnum
CREATE TYPE "AlertTrigger" AS ENUM ('ABOVE', 'AT');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('TIER1', 'TIER2', 'TIER3');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'BVN_VERIFICATION', 'ID_VERIFICATION', 'UTILITY_BILL', 'BANK_STATEMENT', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('DEPOSIT', 'NTA_DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'REVERSAL', 'GIFTCARDS', 'CRYPTO', 'DATA', 'AIRTIME', 'CABLE', 'BETTING', 'ELECTRICITY', 'EVENTS', 'EDUCATION', 'CASHBACK', 'REFERRAL', 'CARD_CREATION', 'VOUCHER', 'CARD_FUNDING', 'P2P', 'SPIN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('UNDER_REVIEW', 'PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'PROCESSING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTION', 'WALLET', 'GIFTCARD', 'DISPUTE', 'SECURITY', 'PROMO', 'SYSTEM', 'REWARD', 'TICKET_PURCHASE', 'MARKETING', 'TEST');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ScheduledNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GiftCardOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "GiftCardCodeStatus" AS ENUM ('UNUSED', 'DELIVERED', 'REDEEMED');

-- CreateEnum
CREATE TYPE "GiftCardSaleStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('NATIONAL_ID', 'DRIVERS_LICENSE', 'VOTERS_CARD', 'PASSPORT', 'UTILITY_BILL', 'BANK_STATEMENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TierUpgradeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OtpAction" AS ENUM ('VERIFY_ACCOUNT', 'PASSWORD_RESET', 'DEVICE_VERIFICATION', 'PIN_RESET', 'KYC_VERIFICATION');

-- CreateEnum
CREATE TYPE "PrizeType" AS ENUM ('CASHBACK', 'CASH_PRIZE', 'DATA_BUNDLE', 'GIFTCARD', 'AIRTIME', 'FREE_WITHDRAWAL');

-- CreateEnum
CREATE TYPE "WinningStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReferralEarningType" AS ENUM ('SIGNUP', 'TRANSACTION', 'MILESTONE', 'TIER_UPGRADE');

-- CreateEnum
CREATE TYPE "ReferralEarningStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'REDEEMED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('CASHBACK', 'VOUCHER', 'REFERRAL_BONUS', 'PROMOTIONAL', 'CONTEST_WIN');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('REWARD', 'PROMO', 'REFERRAL', 'GIFT');

-- CreateEnum
CREATE TYPE "SpinEntryStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SupportConversationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportMessageSender" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "profilePicture" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isKycVerified" BOOLEAN NOT NULL DEFAULT false,
    "tier" "Tier" NOT NULL DEFAULT 'TIER1',
    "tierUpgradeRequestedAt" TIMESTAMP(3),
    "tierUpgradeStatus" "TierUpgradeStatus",
    "tierUpgradeReason" TEXT,
    "bvn" TEXT,
    "nin" TEXT,
    "dailyTransactionSum" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastDailyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referredById" TEXT,
    "referralSource" TEXT,
    "barcodeUrl" TEXT,
    "hasUpdatedDob" BOOLEAN NOT NULL DEFAULT false,
    "biometricPublicKey" TEXT,
    "isBiometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "obiExAccountId" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "depositBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "referralBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashBackBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT DEFAULT 'OBI',
    "asset" TEXT,
    "chain" TEXT,
    "qrCode" TEXT,

    CONSTRAINT "crypto_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,

    CONSTRAINT "virtual_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerCode" TEXT,

    CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "maskedPan" TEXT NOT NULL,
    "expiryMonth" TEXT NOT NULL,
    "expiryYear" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "availableBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "accountId" TEXT,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_security" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "sentTo" TEXT,
    "lastOtpSentAt" TIMESTAMP(3),
    "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "isPinSet" BOOLEAN NOT NULL DEFAULT false,
    "oldPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "oldPinAttemptsResetAt" TIMESTAMP(3),
    "isVerifiedForPasswordReset" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountPin" TEXT,
    "action" "OtpAction",
    "passwordAttempts" INTEGER NOT NULL DEFAULT 0,
    "passwordAttemptsResetAt" TIMESTAMP(3),

    CONSTRAINT "user_security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "userAgent" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "location" TEXT,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "deviceName" TEXT,
    "networkProvider" TEXT,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT,
    "category" "TransactionCategory" NOT NULL,
    "narration" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "type" "TransactionType",
    "provider" TEXT,
    "reference" TEXT NOT NULL,
    "sessionId" TEXT,
    "externalRef" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "fee" DECIMAL(10,2),
    "channel" TEXT,
    "meta" JSONB,
    "recipient" TEXT,
    "accountNo" TEXT,
    "meterNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "giftCardQuantity" INTEGER,
    "giftCardReceipt" TEXT,
    "giftCardType" TEXT,
    "giftCardValue" DECIMAL(10,2),
    "internalRef" TEXT,
    "metertoken" TEXT,
    "sender" TEXT,
    "virtualAccountId" TEXT,
    "usdValue" DECIMAL(10,2),
    "providerRef" TEXT,
    "waecCards" JSONB,
    "waecTokens" TEXT[],
    "jambPin" TEXT,
    "rate" TEXT,
    "txHash" TEXT,
    "rewardId" TEXT,
    "idempotencyKey" TEXT,
    "eventId" TEXT,
    "transactionValue" TEXT,
    "dataPlan" TEXT,
    "institutionBank" TEXT,
    "institutionAccountNo" TEXT,
    "giftcardSaleId" TEXT,
    "cablePlan" TEXT,
    "gcAcceptedCardId" TEXT,
    "gcCardCurrency" TEXT,
    "gcCardRange" TEXT,
    "gcCountry" TEXT,
    "gcEncryptedCode" TEXT,
    "gcEncryptedPin" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT,
    "narration" TEXT,
    "provider" TEXT,
    "reference" TEXT,
    "sessionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT,
    "channel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "internalRef" TEXT,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "status" "RewardStatus",
    "type" "RewardType",

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "metadata" JSONB,
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "filterCriteria" JSONB,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalRead" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_notification_status" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_notification_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "targetUserIds" JSONB,
    "filterCriteria" JSONB,
    "status" "ScheduledNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "deliveredAt" TIMESTAMP(3),
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableInApp" BOOLEAN NOT NULL DEFAULT true,
    "enablePush" BOOLEAN NOT NULL DEFAULT true,
    "enableEmail" BOOLEAN NOT NULL DEFAULT true,
    "mutedTypes" JSONB,
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "bankName" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT,
    "provider" TEXT,
    "username" TEXT,
    "bettingProvider" TEXT,
    "cableTv" TEXT,
    "electricityCompany" TEXT,
    "meterNumber" TEXT,
    "meterType" TEXT,
    "packageCode" TEXT,
    "smartCardNumber" TEXT,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accepted_giftcards" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardName" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "availableRanges" JSONB NOT NULL,
    "receiptTypes" JSONB NOT NULL,
    "rates" JSONB NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "accepted_giftcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giftcard_codes" (
    "id" TEXT NOT NULL,
    "encryptedCode" TEXT NOT NULL,
    "encryptedPin" TEXT,
    "status" "GiftCardCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redemptionUrl" TEXT,
    "transactionId" TEXT,

    CONSTRAINT "giftcard_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_configurations" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "feeType" TEXT NOT NULL DEFAULT 'FIXED',
    "feeValue" DECIMAL(10,2) NOT NULL,
    "minAmount" DECIMAL(10,2),
    "maxAmount" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_revenue" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "orderId" TEXT,
    "transactionId" TEXT,
    "userId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "imageUrls" TEXT[],
    "description" TEXT,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rates" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cardCountry" TEXT,
    "cardRange" INTEGER,
    "cardCategory" TEXT,
    "currentRate" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_configurations" (
    "id" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dailyDepositLimit" BIGINT,
    "description" TEXT,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "dailyDebitLimit" BIGINT NOT NULL,
    "singleDebitLimit" BIGINT NOT NULL,

    CONSTRAINT "tier_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_requirements" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "requirementType" "RequirementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_upgrades" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromTier" "Tier" NOT NULL,
    "toTier" "Tier" NOT NULL,
    "status" "TierUpgradeStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bvn" TEXT NOT NULL,

    CONSTRAINT "tier_upgrades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "imageUrls" TEXT[],

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_tiers" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "quantity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketTierId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "bonusAmount" DECIMAL(10,2) NOT NULL,
    "bonusType" TEXT NOT NULL,
    "applicableFor" TEXT NOT NULL DEFAULT 'GIFTCARD_SELL',
    "minSaleAmount" DECIMAL(10,2),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'TradeAviator Spin Wheel',
    "description" TEXT DEFAULT 'Spin once after trading $2000 worth of giftcards',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minGiftcardTradeValue" DECIMAL(10,2) NOT NULL DEFAULT 2000,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spin_wheels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prizes" (
    "id" TEXT NOT NULL,
    "wheelId" TEXT NOT NULL,
    "prizeType" "PrizeType" NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wheelId" TEXT NOT NULL,
    "prizeId" TEXT,
    "spinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_winnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spinId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "status" "WinningStatus" NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_winnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_entries" (
    "id" TEXT NOT NULL,
    "spinEligibilityId" TEXT NOT NULL,
    "status" "SpinEntryStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "spin_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_eligibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentTradeVolume" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "spin_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_earnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "earningType" "ReferralEarningType" NOT NULL DEFAULT 'SIGNUP',
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "ReferralEarningStatus",
    "expiresAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "referral_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "type" "VoucherType" NOT NULL DEFAULT 'REWARD',
    "value" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giftcards_products" (
    "id" TEXT NOT NULL,
    "reloadlyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "denomination" DECIMAL(10,2) NOT NULL,
    "minAmount" DECIMAL(10,2),
    "maxAmount" DECIMAL(10,2),
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reloadlyData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giftcards_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giftcard_sales" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acceptedCardId" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "cardRange" TEXT NOT NULL,
    "cardValue" DECIMAL(10,2) NOT NULL,
    "cardCurrency" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "receiptType" TEXT NOT NULL,
    "cardImages" TEXT[],
    "encryptedCardCode" TEXT,
    "encryptedCardPin" TEXT,
    "userNotes" TEXT,
    "buyingRate" DECIMAL(10,2) NOT NULL,
    "totalCardValue" DECIMAL(10,2) NOT NULL,
    "payoutAmount" DECIMAL(10,2) NOT NULL,
    "promoCode" TEXT,
    "promoDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "GiftCardSaleStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'WALLET',
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giftcard_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_quote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cardValue" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL,
    "promoDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "exchangeRate" DECIMAL(10,2) NOT NULL,
    "feePercentage" DECIMAL(5,2) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prize_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profilePicture" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuper" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "isGeneral" BOOLEAN NOT NULL DEFAULT false,
    "readByAdmins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appValue" TEXT[],

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_assets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "buyRate" DECIMAL(10,2),

    CONSTRAINT "crypto_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cryptoAsset" TEXT NOT NULL,
    "rateType" "AlertRateType" NOT NULL DEFAULT 'SELL',
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "triggerCondition" "AlertTrigger" NOT NULL,
    "emailNotification" BOOLEAN NOT NULL DEFAULT false,
    "pushNotification" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "category" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "SupportMessageSender" NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_referralCode_idx" ON "users"("referralCode");

-- CreateIndex
CREATE INDEX "users_tier_idx" ON "users"("tier");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_referredById_idx" ON "users"("referredById");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallets_currency_idx" ON "wallets"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_currency_key" ON "wallets"("userId", "currency");

-- CreateIndex
CREATE INDEX "crypto_wallets_userId_idx" ON "crypto_wallets"("userId");

-- CreateIndex
CREATE INDEX "crypto_wallets_chain_idx" ON "crypto_wallets"("chain");

-- CreateIndex
CREATE INDEX "crypto_wallets_address_idx" ON "crypto_wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_wallets_userId_asset_chain_key" ON "crypto_wallets"("userId", "asset", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_accounts_accountNumber_key" ON "virtual_accounts"("accountNumber");

-- CreateIndex
CREATE INDEX "virtual_accounts_userId_idx" ON "virtual_accounts"("userId");

-- CreateIndex
CREATE INDEX "virtual_accounts_provider_idx" ON "virtual_accounts"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_accounts_provider_userId_key" ON "virtual_accounts"("provider", "userId");

-- CreateIndex
CREATE INDEX "external_accounts_userId_idx" ON "external_accounts"("userId");

-- CreateIndex
CREATE INDEX "cards_userId_brand_idx" ON "cards"("userId", "brand");

-- CreateIndex
CREATE INDEX "cards_userId_idx" ON "cards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_security_userId_key" ON "user_security"("userId");

-- CreateIndex
CREATE INDEX "user_security_userId_idx" ON "user_security"("userId");

-- CreateIndex
CREATE INDEX "user_security_action_idx" ON "user_security"("action");

-- CreateIndex
CREATE INDEX "user_security_expiresAt_idx" ON "user_security"("expiresAt");

-- CreateIndex
CREATE INDEX "device_sessions_userId_idx" ON "device_sessions"("userId");

-- CreateIndex
CREATE INDEX "device_sessions_deviceType_idx" ON "device_sessions"("deviceType");

-- CreateIndex
CREATE INDEX "device_sessions_lastLoginAt_idx" ON "device_sessions"("lastLoginAt");

-- CreateIndex
CREATE UNIQUE INDEX "device_sessions_userId_deviceId_key" ON "device_sessions"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_rewardId_key" ON "transactions"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_giftcardSaleId_key" ON "transactions"("giftcardSaleId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_userId_idempotencyKey_idx" ON "transactions"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");

-- CreateIndex
CREATE INDEX "transactions_eventId_idx" ON "transactions"("eventId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_reference_idx" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_status_createdAt_idx" ON "transactions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_gcAcceptedCardId_idx" ON "transactions"("gcAcceptedCardId");

-- CreateIndex
CREATE INDEX "transactions_gcCountry_idx" ON "transactions"("gcCountry");

-- CreateIndex
CREATE INDEX "transactions_userId_category_createdAt_idx" ON "transactions"("userId", "category", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_userId_idempotencyKey_key" ON "transactions"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "rewards_reference_key" ON "rewards"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "rewards_transactionId_key" ON "rewards"("transactionId");

-- CreateIndex
CREATE INDEX "rewards_userId_idx" ON "rewards"("userId");

-- CreateIndex
CREATE INDEX "rewards_walletId_idx" ON "rewards"("walletId");

-- CreateIndex
CREATE INDEX "rewards_status_idx" ON "rewards"("status");

-- CreateIndex
CREATE INDEX "rewards_type_idx" ON "rewards"("type");

-- CreateIndex
CREATE INDEX "rewards_reference_idx" ON "rewards"("reference");

-- CreateIndex
CREATE INDEX "rewards_createdAt_idx" ON "rewards"("createdAt");

-- CreateIndex
CREATE INDEX "rewards_userId_createdAt_idx" ON "rewards"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "rewards_status_createdAt_idx" ON "rewards"("status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "broadcast_notifications_type_idx" ON "broadcast_notifications"("type");

-- CreateIndex
CREATE INDEX "broadcast_notifications_createdAt_idx" ON "broadcast_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "broadcast_notifications_targetAudience_idx" ON "broadcast_notifications"("targetAudience");

-- CreateIndex
CREATE INDEX "broadcast_notification_status_userId_idx" ON "broadcast_notification_status"("userId");

-- CreateIndex
CREATE INDEX "broadcast_notification_status_userId_isRead_idx" ON "broadcast_notification_status"("userId", "isRead");

-- CreateIndex
CREATE INDEX "broadcast_notification_status_broadcastId_idx" ON "broadcast_notification_status"("broadcastId");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_notification_status_userId_broadcastId_key" ON "broadcast_notification_status"("userId", "broadcastId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_name_idx" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "notification_templates"("type");

-- CreateIndex
CREATE INDEX "notification_templates_isActive_idx" ON "notification_templates"("isActive");

-- CreateIndex
CREATE INDEX "scheduled_notifications_scheduledFor_idx" ON "scheduled_notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "scheduled_notifications_status_idx" ON "scheduled_notifications"("status");

-- CreateIndex
CREATE INDEX "scheduled_notifications_type_idx" ON "scheduled_notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON "user_notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_notification_preferences_userId_idx" ON "user_notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "beneficiaries_userId_idx" ON "beneficiaries"("userId");

-- CreateIndex
CREATE INDEX "beneficiaries_type_idx" ON "beneficiaries"("type");

-- CreateIndex
CREATE INDEX "accepted_giftcards_cardType_idx" ON "accepted_giftcards"("cardType");

-- CreateIndex
CREATE INDEX "accepted_giftcards_isActive_idx" ON "accepted_giftcards"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "accepted_giftcards_cardType_country_key" ON "accepted_giftcards"("cardType", "country");

-- CreateIndex
CREATE INDEX "giftcard_codes_transactionId_idx" ON "giftcard_codes"("transactionId");

-- CreateIndex
CREATE INDEX "giftcard_codes_status_idx" ON "giftcard_codes"("status");

-- CreateIndex
CREATE INDEX "fee_configurations_type_idx" ON "fee_configurations"("type");

-- CreateIndex
CREATE INDEX "fee_configurations_isActive_idx" ON "fee_configurations"("isActive");

-- CreateIndex
CREATE INDEX "platform_revenue_source_idx" ON "platform_revenue"("source");

-- CreateIndex
CREATE INDEX "platform_revenue_userId_idx" ON "platform_revenue"("userId");

-- CreateIndex
CREATE INDEX "platform_revenue_createdAt_idx" ON "platform_revenue"("createdAt");

-- CreateIndex
CREATE INDEX "disputes_userId_idx" ON "disputes"("userId");

-- CreateIndex
CREATE INDEX "disputes_transactionId_idx" ON "disputes"("transactionId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_createdAt_idx" ON "disputes"("createdAt");

-- CreateIndex
CREATE INDEX "rates_type_idx" ON "rates"("type");

-- CreateIndex
CREATE INDEX "rates_cardCountry_idx" ON "rates"("cardCountry");

-- CreateIndex
CREATE UNIQUE INDEX "tier_configurations_tier_key" ON "tier_configurations"("tier");

-- CreateIndex
CREATE INDEX "tier_requirements_tierId_idx" ON "tier_requirements"("tierId");

-- CreateIndex
CREATE INDEX "tier_requirements_requirementType_idx" ON "tier_requirements"("requirementType");

-- CreateIndex
CREATE INDEX "tier_upgrades_userId_idx" ON "tier_upgrades"("userId");

-- CreateIndex
CREATE INDEX "tier_upgrades_status_idx" ON "tier_upgrades"("status");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "ticket_tiers_eventId_idx" ON "ticket_tiers"("eventId");

-- CreateIndex
CREATE INDEX "ticket_tiers_isActive_idx" ON "ticket_tiers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_isActive_idx" ON "promo_codes"("isActive");

-- CreateIndex
CREATE INDEX "promo_codes_validFrom_validUntil_idx" ON "promo_codes"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "promo_codes_applicableFor_idx" ON "promo_codes"("applicableFor");

-- CreateIndex
CREATE INDEX "spin_wheels_isActive_idx" ON "spin_wheels"("isActive");

-- CreateIndex
CREATE INDEX "prizes_wheelId_idx" ON "prizes"("wheelId");

-- CreateIndex
CREATE INDEX "prizes_isActive_idx" ON "prizes"("isActive");

-- CreateIndex
CREATE INDEX "spins_wheelId_idx" ON "spins"("wheelId");

-- CreateIndex
CREATE INDEX "spins_spinDate_idx" ON "spins"("spinDate");

-- CreateIndex
CREATE UNIQUE INDEX "user_winnings_spinId_key" ON "user_winnings"("spinId");

-- CreateIndex
CREATE UNIQUE INDEX "user_winnings_claimCode_key" ON "user_winnings"("claimCode");

-- CreateIndex
CREATE INDEX "user_winnings_userId_idx" ON "user_winnings"("userId");

-- CreateIndex
CREATE INDEX "user_winnings_status_idx" ON "user_winnings"("status");

-- CreateIndex
CREATE INDEX "user_winnings_expiresAt_idx" ON "user_winnings"("expiresAt");

-- CreateIndex
CREATE INDEX "spin_entries_spinEligibilityId_idx" ON "spin_entries"("spinEligibilityId");

-- CreateIndex
CREATE INDEX "spin_entries_status_idx" ON "spin_entries"("status");

-- CreateIndex
CREATE INDEX "spin_entries_expiresAt_idx" ON "spin_entries"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "spin_eligibility_userId_key" ON "spin_eligibility"("userId");

-- CreateIndex
CREATE INDEX "spin_eligibility_userId_idx" ON "spin_eligibility"("userId");

-- CreateIndex
CREATE INDEX "referral_earnings_userId_idx" ON "referral_earnings"("userId");

-- CreateIndex
CREATE INDEX "referral_earnings_referredUserId_idx" ON "referral_earnings"("referredUserId");

-- CreateIndex
CREATE INDEX "referral_earnings_earningType_idx" ON "referral_earnings"("earningType");

-- CreateIndex
CREATE INDEX "referral_earnings_status_idx" ON "referral_earnings"("status");

-- CreateIndex
CREATE INDEX "referral_earnings_expiresAt_idx" ON "referral_earnings"("expiresAt");

-- CreateIndex
CREATE INDEX "kyc_session_userId_idx" ON "kyc_session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_code_key" ON "voucher"("code");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_isActive_idx" ON "device_tokens"("isActive");

-- CreateIndex
CREATE INDEX "device_tokens_token_idx" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "device_tokens_deviceId_idx" ON "device_tokens"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "giftcards_products_reloadlyId_key" ON "giftcards_products"("reloadlyId");

-- CreateIndex
CREATE INDEX "giftcards_products_countryCode_idx" ON "giftcards_products"("countryCode");

-- CreateIndex
CREATE INDEX "giftcards_products_country_idx" ON "giftcards_products"("country");

-- CreateIndex
CREATE INDEX "giftcards_products_isActive_idx" ON "giftcards_products"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "giftcard_sales_transactionId_key" ON "giftcard_sales"("transactionId");

-- CreateIndex
CREATE INDEX "giftcard_sales_createdAt_idx" ON "giftcard_sales"("createdAt");

-- CreateIndex
CREATE INDEX "giftcard_sales_reviewedAt_idx" ON "giftcard_sales"("reviewedAt");

-- CreateIndex
CREATE INDEX "giftcard_sales_status_idx" ON "giftcard_sales"("status");

-- CreateIndex
CREATE INDEX "giftcard_sales_userId_idx" ON "giftcard_sales"("userId");

-- CreateIndex
CREATE INDEX "prize_quote_expiresAt_idx" ON "prize_quote"("expiresAt");

-- CreateIndex
CREATE INDEX "prize_quote_userId_expiresAt_idx" ON "prize_quote"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admin_notifications_adminId_idx" ON "admin_notifications"("adminId");

-- CreateIndex
CREATE INDEX "admin_notifications_isGeneral_idx" ON "admin_notifications"("isGeneral");

-- CreateIndex
CREATE INDEX "admin_notifications_createdAt_idx" ON "admin_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "admin_notifications_type_idx" ON "admin_notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE INDEX "app_settings_key_idx" ON "app_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_assets_code_key" ON "crypto_assets"("code");

-- CreateIndex
CREATE INDEX "crypto_assets_code_idx" ON "crypto_assets"("code");

-- CreateIndex
CREATE INDEX "crypto_assets_isActive_idx" ON "crypto_assets"("isActive");

-- CreateIndex
CREATE INDEX "price_alerts_userId_idx" ON "price_alerts"("userId");

-- CreateIndex
CREATE INDEX "price_alerts_isActive_idx" ON "price_alerts"("isActive");

-- CreateIndex
CREATE INDEX "price_alerts_cryptoAsset_idx" ON "price_alerts"("cryptoAsset");

-- CreateIndex
CREATE INDEX "support_conversations_userId_idx" ON "support_conversations"("userId");

-- CreateIndex
CREATE INDEX "support_conversations_status_idx" ON "support_conversations"("status");

-- CreateIndex
CREATE INDEX "support_conversations_assignedTo_idx" ON "support_conversations"("assignedTo");

-- CreateIndex
CREATE INDEX "support_conversations_createdAt_idx" ON "support_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "support_messages_conversationId_idx" ON "support_messages"("conversationId");

-- CreateIndex
CREATE INDEX "support_messages_createdAt_idx" ON "support_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crypto_wallets" ADD CONSTRAINT "crypto_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_security" ADD CONSTRAINT "user_security_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_giftcardSaleId_fkey" FOREIGN KEY ("giftcardSaleId") REFERENCES "giftcard_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_virtualAccountId_fkey" FOREIGN KEY ("virtualAccountId") REFERENCES "virtual_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_notification_status" ADD CONSTRAINT "broadcast_notification_status_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "broadcast_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_notification_status" ADD CONSTRAINT "broadcast_notification_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giftcard_codes" ADD CONSTRAINT "giftcard_codes_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_requirements" ADD CONSTRAINT "tier_requirements_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "tier_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_upgrades" ADD CONSTRAINT "tier_upgrades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_ticketTierId_fkey" FOREIGN KEY ("ticketTierId") REFERENCES "ticket_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_wheelId_fkey" FOREIGN KEY ("wheelId") REFERENCES "spin_wheels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spins" ADD CONSTRAINT "spins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spins" ADD CONSTRAINT "spins_wheelId_fkey" FOREIGN KEY ("wheelId") REFERENCES "spin_wheels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_winnings" ADD CONSTRAINT "user_winnings_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_winnings" ADD CONSTRAINT "user_winnings_spinId_fkey" FOREIGN KEY ("spinId") REFERENCES "spins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_winnings" ADD CONSTRAINT "user_winnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_entries" ADD CONSTRAINT "spin_entries_spinEligibilityId_fkey" FOREIGN KEY ("spinEligibilityId") REFERENCES "spin_eligibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_eligibility" ADD CONSTRAINT "spin_eligibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giftcard_sales" ADD CONSTRAINT "giftcard_sales_acceptedCardId_fkey" FOREIGN KEY ("acceptedCardId") REFERENCES "accepted_giftcards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giftcard_sales" ADD CONSTRAINT "giftcard_sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_quote" ADD CONSTRAINT "prize_quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "support_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
