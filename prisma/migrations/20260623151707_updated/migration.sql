/*
  Warnings:

  - The values [DEPOSIT,NTA_DEPOSIT,WITHDRAWAL,TRANSFER,DATA,AIRTIME,CABLE,BETTING,ELECTRICITY,EVENTS,EDUCATION,CASHBACK,REFERRAL,CARD_CREATION,VOUCHER,CARD_FUNDING,P2P,SPIN] on the enum `TransactionCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `accountNo` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `dataPlan` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `jambPin` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `meterNo` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `metertoken` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `rewardId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `virtualAccountId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `waecCards` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `waecTokens` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `barcodeUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `hasUpdatedDob` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastDailyReset` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `referralSource` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tierUpgradeReason` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tierUpgradeRequestedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tierUpgradeStatus` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `beneficiaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prizes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promo_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rewards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spin_eligibility` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spin_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spin_wheels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket_tiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tier_configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tier_requirements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tier_upgrades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_winnings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `virtual_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `voucher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallets` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[txHash]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionCategory_new" AS ENUM ('REVERSAL', 'GIFTCARDS', 'CRYPTO');
ALTER TABLE "transactions" ALTER COLUMN "category" TYPE "TransactionCategory_new" USING ("category"::text::"TransactionCategory_new");
ALTER TABLE "disputes" ALTER COLUMN "category" TYPE "TransactionCategory_new" USING ("category"::text::"TransactionCategory_new");
ALTER TYPE "TransactionCategory" RENAME TO "TransactionCategory_old";
ALTER TYPE "TransactionCategory_new" RENAME TO "TransactionCategory";
DROP TYPE "public"."TransactionCategory_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_userId_fkey";

-- DropForeignKey
ALTER TABLE "cards" DROP CONSTRAINT "cards_userId_fkey";

-- DropForeignKey
ALTER TABLE "prizes" DROP CONSTRAINT "prizes_wheelId_fkey";

-- DropForeignKey
ALTER TABLE "rewards" DROP CONSTRAINT "rewards_userId_fkey";

-- DropForeignKey
ALTER TABLE "rewards" DROP CONSTRAINT "rewards_walletId_fkey";

-- DropForeignKey
ALTER TABLE "spin_eligibility" DROP CONSTRAINT "spin_eligibility_userId_fkey";

-- DropForeignKey
ALTER TABLE "spin_entries" DROP CONSTRAINT "spin_entries_spinEligibilityId_fkey";

-- DropForeignKey
ALTER TABLE "spins" DROP CONSTRAINT "spins_userId_fkey";

-- DropForeignKey
ALTER TABLE "spins" DROP CONSTRAINT "spins_wheelId_fkey";

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_ticketTierId_fkey";

-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_userId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_tiers" DROP CONSTRAINT "ticket_tiers_eventId_fkey";

-- DropForeignKey
ALTER TABLE "tier_requirements" DROP CONSTRAINT "tier_requirements_tierId_fkey";

-- DropForeignKey
ALTER TABLE "tier_upgrades" DROP CONSTRAINT "tier_upgrades_userId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_eventId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_rewardId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_virtualAccountId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_walletId_fkey";

-- DropForeignKey
ALTER TABLE "user_winnings" DROP CONSTRAINT "user_winnings_prizeId_fkey";

-- DropForeignKey
ALTER TABLE "user_winnings" DROP CONSTRAINT "user_winnings_spinId_fkey";

-- DropForeignKey
ALTER TABLE "user_winnings" DROP CONSTRAINT "user_winnings_userId_fkey";

-- DropForeignKey
ALTER TABLE "virtual_accounts" DROP CONSTRAINT "virtual_accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "voucher" DROP CONSTRAINT "voucher_userId_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_userId_fkey";

-- DropIndex
DROP INDEX "transactions_eventId_idx";

-- DropIndex
DROP INDEX "transactions_rewardId_key";

-- DropIndex
DROP INDEX "transactions_walletId_idx";

-- DropIndex
DROP INDEX "users_tier_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "accountNo",
DROP COLUMN "dataPlan",
DROP COLUMN "eventId",
DROP COLUMN "jambPin",
DROP COLUMN "meterNo",
DROP COLUMN "metertoken",
DROP COLUMN "recipient",
DROP COLUMN "rewardId",
DROP COLUMN "sender",
DROP COLUMN "virtualAccountId",
DROP COLUMN "waecCards",
DROP COLUMN "waecTokens";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "barcodeUrl",
DROP COLUMN "hasUpdatedDob",
DROP COLUMN "lastDailyReset",
DROP COLUMN "referralSource",
DROP COLUMN "tier",
DROP COLUMN "tierUpgradeReason",
DROP COLUMN "tierUpgradeRequestedAt",
DROP COLUMN "tierUpgradeStatus";

-- DropTable
DROP TABLE "beneficiaries";

-- DropTable
DROP TABLE "cards";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "prizes";

-- DropTable
DROP TABLE "promo_codes";

-- DropTable
DROP TABLE "rewards";

-- DropTable
DROP TABLE "spin_eligibility";

-- DropTable
DROP TABLE "spin_entries";

-- DropTable
DROP TABLE "spin_wheels";

-- DropTable
DROP TABLE "spins";

-- DropTable
DROP TABLE "ticket";

-- DropTable
DROP TABLE "ticket_tiers";

-- DropTable
DROP TABLE "tier_configurations";

-- DropTable
DROP TABLE "tier_requirements";

-- DropTable
DROP TABLE "tier_upgrades";

-- DropTable
DROP TABLE "user_winnings";

-- DropTable
DROP TABLE "virtual_accounts";

-- DropTable
DROP TABLE "voucher";

-- DropTable
DROP TABLE "wallets";

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "PrizeType";

-- DropEnum
DROP TYPE "RequirementType";

-- DropEnum
DROP TYPE "RewardStatus";

-- DropEnum
DROP TYPE "RewardType";

-- DropEnum
DROP TYPE "SpinEntryStatus";

-- DropEnum
DROP TYPE "Tier";

-- DropEnum
DROP TYPE "TierUpgradeStatus";

-- DropEnum
DROP TYPE "VoucherType";

-- DropEnum
DROP TYPE "WinningStatus";

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txHash_key" ON "transactions"("txHash");
