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
                    _count: {
                        select: { transactions: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        const mappedUsers = await Promise.all(users.map(async (u) => {
            const nameParts = u.fullname.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            // Aggregate directly from transactions to handle users without wallets
            const volumeResult = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { userId: u.id, status: 'SUCCESS' }
            });
            const netTradingVolume = Number(volumeResult._sum.amount || 0);

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
                netTradingVolume,
            };
        }));

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

    async getUserTransactions(userId: string, query: { page?: number; limit?: number }) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const [transactions, totalCount] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.transaction.count({ where: { userId } })
        ]);

        return {
            transactions,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    async resetUserPassword(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        const crypto = await import('crypto');
        const tempPassword = `T3mp@${crypto.randomBytes(4).toString('hex')}`; // Meets all validation rules

        const { AuthTokens } = await import('@shared/guards/hash.js');
        const hashedPassword = await AuthTokens.hashPassword(tempPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        const { publishToQueue } = await import('@shared/workers/publisher.js');
        await publishToQueue({
            type: "EMAIL_NOTIFICATION",
            payload: {
                recipient: user.email,
                fullName: user.fullname,
                notificationDetails: {
                    notificationType: "SECURITY",
                    title: "Password Reset by Admin",
                    message: `Your password has been reset by an administrator. Your new temporary password is: ${tempPassword}. Please log in and change your password immediately.`,
                }
            }
        });

        return { success: true };
    }
}

export const adminUsersService = new AdminUsersService();
