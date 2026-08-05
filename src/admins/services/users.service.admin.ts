import { prisma } from "@shared/db/prisma";
import { Prisma } from "@prisma/client";

export class AdminUsersService {
    async getUsers(query: {
        page?: number;
        limit?: number;
        search?: string;
        statusFilter?: 'All' | 'Active' | 'Suspended' | 'KYC Pending' | 'KYC Verified';
    }) {
        const { page = 1, limit = 10, search, statusFilter = 'All' } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { fullname: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } }
            ];
        }

        switch (statusFilter) {
            case 'Active':
                where.isActive = true;
                break;
            case 'Suspended':
                where.isActive = false;
                break;
            case 'KYC Pending':
                where.isKycVerified = false;
                break;
            case 'KYC Verified':
                where.isKycVerified = true;
                break;
        }

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    wallets: true,
                    _count: {
                        select: { transactions: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        const mappedUsers = users.map((u) => {
            const nameParts = u.fullname.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            // Assuming wallet.referralBalance or sum of wallets' totalTransactionVolume.
            // Wait, we need a balance. We can use total transaction volume or a wallet's balance. 
            // In the DB, there is Wallet.referralBalance and Wallet.buyVolume / sellVolume.
            // Let's sum up the referralBalance or just return 0 if no specific balance exists.
            const balance = u.wallets.reduce((acc, wallet) => acc + Number(wallet.referralBalance || 0), 0);

            return {
                id: u.id,
                firstName,
                lastName,
                email: u.email,
                status: u.isActive ? 'Active' : 'Suspended',
                kycStatus: u.isKycVerified ? 'Verified' : 'Pending',
                joinedDate: u.createdAt,
                lastActive: u.updatedAt,
                totalTxns: u._count.transactions,
                balance,
            };
        });

        return {
            users: mappedUsers,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    async updateUserStatus(userId: string, isActive: boolean) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isActive },
        });

        return { success: true };
    }
}

export const adminUsersService = new AdminUsersService();
