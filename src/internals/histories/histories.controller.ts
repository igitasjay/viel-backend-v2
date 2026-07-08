import { Asyncly } from "@shared/extensions/asyncly";
import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";
import { removeNullsDeep } from "./histories.utils";
import { NotFoundException, BadRequestException } from "@shared/exceptions/exceptions";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { withPagination } from "@shared/utils/pagination";
import { TransactionDTO } from "./histories.dto";
import {
  ReferralEarningType,
  RewardType,
  TransactionCategory,
} from "@prisma/client";

const listTransactionHistory = Asyncly(async (req, res) => {
  const userId = req.currentUser.id;
  const type = (req.query.type as string | undefined)?.toUpperCase();

  logger.info(
    `User ${userId} requesting transaction history with type: ${type}`,
  );

  const whereClause: any = { userId };
  if (type) {
    if (
      !Object.values(TransactionCategory).includes(type as TransactionCategory)
    ) {
      logger.warn(
        `User ${userId} provided an invalid transaction type: ${type}`,
      );
      throw new BadRequestException("Invalid transaction type");
    }
    whereClause.category = type as TransactionCategory;
    logger.debug(`Filtering transactions by category: ${type}`);
  }

  logger.debug(
    `Fetching paginated transactions for userId: ${userId} with whereClause: ${JSON.stringify(whereClause)}`,
  );

  const paginated = await withPagination({
    model: "transaction",
    req,
    res,
    where: whereClause,
  });

  if (!paginated.results?.length) {
    logger.info(
      `No transactions found for user ${userId} with specified filters.`,
    );
    throw new NotFoundException("No transactions to load");
  }

  logger.info(
    `Successfully retrieved ${paginated.results.length} transactions for user ${userId}.`,
  );

  res.status(httpStatus.OK).json({
    message: "retrieved history",
    ...paginated,
    results: paginated.results.map((tx) =>
      removeNullsDeep(new TransactionDTO(tx)),
    ),
  });
});

const listRewardsHistory = Asyncly(async (req, res) => {
  const userId = req.currentUser.id;
  const type = (req.query.type as string | undefined)?.toUpperCase();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  logger.info(`User ${userId} requesting rewards history with type: ${type}`);

  // Fetch rewards count
  const rewardsCount = await prisma.rewards.count({
    where: {
      userId,
      ...(type && type !== "REFERRAL" && { type: type as RewardType }),
    },
  });

  // Fetch referrals count
  const referralsCount = await prisma.referralEarning.count({
    where: {
      userId,
      ...(type &&
        type !== "SIGNUP" && { earningType: type as ReferralEarningType }),
    },
  });

  const totalItems = rewardsCount + referralsCount;

  // Fetch ALL rewards and referrals (without pagination yet)
  const rewards = await prisma.rewards.findMany({
    where: {
      userId,
      ...(type && type !== "REFERRAL" && { type: type as RewardType }),
    },
    orderBy: { createdAt: "desc" },
  });

  const referrals = await prisma.referralEarning.findMany({
    where: {
      userId,
      ...(type &&
        type !== "SIGNUP" && { earningType: type as ReferralEarningType }),
    },
    include: {
      referredUser: {
        select: { id: true, fullname: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const transformedRewards = rewards.map((reward) => ({
    id: reward.id,
    type: "REWARD",
    amount: reward.amount,
    status: reward.status,
    narration: reward.narration,
    createdAt: reward.createdAt,
  }));

  const transformedReferrals = referrals.map((referral) => ({
    id: referral.id,
    type: "SIGNUP",
    amount: referral.amount,
    status: referral.status,
    narration: `Referral bonus from ${referral.referredUser.fullname}`,
    createdAt: referral.createdAt,
  }));

  // Combine and sort by date
  const allRewards = [...transformedRewards, ...transformedReferrals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Apply pagination AFTER combining
  const paginatedResults = allRewards.slice(skip, skip + limit);
  const totalPages = Math.ceil(totalItems / limit);
  const hasMore = page * limit < totalItems;

  logger.info(
    `Retrieved ${transformedRewards.length} rewards and ${transformedReferrals.length} referrals for user ${userId}`,
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: "Rewards and referral history retrieved",
    results: paginatedResults,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
      hasMore,
    },
  });
});

export const historyController = {
  listTransactionHistory,
  listRewardsHistory,
};
