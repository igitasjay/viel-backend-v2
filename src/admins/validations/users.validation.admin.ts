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

export const adminUsersValidation = {
    getUsersQuerySchema,
    updateUserStatusSchema,
};
