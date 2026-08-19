import { z } from "zod";

const getUsersQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    statusFilter: z.enum(['All', 'Active', 'Suspended', 'KYC Pending', 'KYC Verified']).optional().default('All')
});

const updateUserStatusSchema = z.object({
    isActive: z.boolean(),
});

const getUserTransactionsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});

const resetUserPasswordSchema = z.object({});

export const adminUsersValidation = {
    getUsersQuerySchema,
    updateUserStatusSchema,
    getUserTransactionsQuerySchema,
    resetUserPasswordSchema,
};
