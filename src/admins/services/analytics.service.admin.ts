import { prisma } from "@shared/db/prisma";
import { logger } from "@/lib/winston";

export class AdminAnalyticsService {
    async getAnalyticsDashboard(dateRange: string) {
        // Parse dateRange, e.g., 'Today', '7 Days', '30 Days', '90 Days'
        const endDate = new Date();
        const startDate = new Date();
        
        let daysToSubtract = 7;
        if (dateRange === 'Today') daysToSubtract = 0;
        if (dateRange === '30 Days') daysToSubtract = 30;
        if (dateRange === '90 Days') daysToSubtract = 90;
        
        if (daysToSubtract === 0) {
            startDate.setHours(0,0,0,0);
        } else {
            startDate.setDate(startDate.getDate() - daysToSubtract);
        }

        logger.info("Fetching analytics", { dateRange, startDate, endDate });

        // 1. Daily Revenue (Last 7 days strictly for the chart, as per UI mock, but we can adapt)
        // We will generate the last 7 days regardless of the dateRange for the chart, 
        // or adapt it based on dateRange. The UI expects 7 data points.
        const chartStartDate = new Date();
        chartStartDate.setDate(chartStartDate.getDate() - 6);
        chartStartDate.setHours(0,0,0,0);

        const chartTransactions = await prisma.transaction.findMany({
            where: {
                status: 'SUCCESS',
                createdAt: { gte: chartStartDate }
            },
            select: { amount: true, createdAt: true }
        });

        const dailyRevenue = Array(7).fill(0);
        const dayLabels: string[] = [];
        
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }

        chartTransactions.forEach(tx => {
            const txDate = new Date(tx.createdAt);
            const diffTime = Math.abs(endDate.getTime() - txDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const index = 6 - diffDays;
            if (index >= 0 && index < 7) {
                dailyRevenue[index] += Number(tx.amount) || 0;
            }
        });

        // 2. Summary Stats
        const txStats = await prisma.transaction.aggregate({
            _sum: { amount: true },
            _count: { _all: true },
            where: { createdAt: { gte: startDate, lte: endDate } }
        });

        const successfulTxStats = await prisma.transaction.aggregate({
            _sum: { amount: true },
            _count: { _all: true },
            where: { status: 'SUCCESS', createdAt: { gte: startDate, lte: endDate } }
        });

        const activeUsersCount = await prisma.transaction.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: startDate, lte: endDate } }
        });

        const totalTxCount = txStats._count._all || 0;
        const successTxCount = successfulTxStats._count._all || 0;
        const conversion = totalTxCount === 0 ? 0 : (successTxCount / totalTxCount) * 100;
        
        const totalRevenue = successfulTxStats._sum.amount ? Number(successfulTxStats._sum.amount) : 0;

        // 3. Transaction Breakdown
        const breakdown = await prisma.transaction.groupBy({
            by: ['category'],
            _sum: { amount: true },
            where: { status: 'SUCCESS', createdAt: { gte: startDate, lte: endDate } }
        });

        let buyVolume = 0;
        let sellVolume = 0;
        let cryptoVolume = 0;
        let otherVolume = 0;

        breakdown.forEach(b => {
            const amount = Number(b._sum.amount || 0);
            if (b.category === 'GIFTCARDS') {
                buyVolume += amount; // We can't strictly distinguish buy/sell from category alone without checking type
            } else if (b.category === 'CRYPTO') {
                cryptoVolume += amount;
            } else {
                otherVolume += amount;
            }
        });

        const totalVolume = buyVolume + sellVolume + cryptoVolume + otherVolume;
        
        const transactionBreakdowns = [
            { label: 'Gift Card Buy', value: `₦${buyVolume.toLocaleString()}`, percentage: totalVolume ? buyVolume/totalVolume : 0, type: 'buy' },
            { label: 'Gift Card Sell', value: `₦${sellVolume.toLocaleString()}`, percentage: totalVolume ? sellVolume/totalVolume : 0, type: 'sell' },
            { label: 'Crypto', value: `₦${cryptoVolume.toLocaleString()}`, percentage: totalVolume ? cryptoVolume/totalVolume : 0, type: 'crypto' },
            { label: 'Other', value: `₦${otherVolume.toLocaleString()}`, percentage: totalVolume ? otherVolume/totalVolume : 0, type: 'other' }
        ];

        // 4. Top Products (By transactions)
        // Simplified: Group by provider or something similar
        const topProductsData = await prisma.transaction.groupBy({
            by: ['provider'],
            _count: { _all: true },
            _sum: { amount: true },
            where: { category: 'GIFTCARDS', status: 'SUCCESS', provider: { not: null }, createdAt: { gte: startDate, lte: endDate } },
            orderBy: { _sum: { amount: 'desc' } },
            take: 5
        });

        const topProducts = topProductsData.map(p => ({
            name: p.provider || 'Unknown',
            transactions: p._count._all.toString(),
            revenue: `₦${Number(p._sum.amount || 0).toLocaleString()}`
        }));

        // 5. User Growth
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0,0,0,0);

        const usersToday = await prisma.user.count({ where: { createdAt: { gte: todayStart } } });
        const usersWeek = await prisma.user.count({ where: { createdAt: { gte: weekStart } } });
        const usersTotal = await prisma.user.count();

        // 6. Recent Activity
        const recentTx = await prisma.transaction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, category: true, amount: true, status: true, reference: true, createdAt: true, user: { select: { email: true } } }
        });

        const recentActivities = recentTx.map(tx => {
            const timeDiff = Math.floor((new Date().getTime() - new Date(tx.createdAt).getTime()) / 60000); // minutes
            let timeStr = `${timeDiff} min ago`;
            if (timeDiff > 60) timeStr = `${Math.floor(timeDiff / 60)} hr ago`;
            if (timeDiff > 1440) timeStr = `${Math.floor(timeDiff / 1440)} days ago`;

            return {
                type: tx.category.toLowerCase(),
                title: `${tx.category} transaction ${tx.status.toLowerCase()}`,
                subtitle: `${tx.reference} — ₦${Number(tx.amount).toLocaleString()}`,
                time: timeStr
            };
        });

        return {
            dailyRevenue,
            dayLabels,
            summaryStats: [
                { title: 'Total Revenue', value: `₦${(totalRevenue/1000000).toFixed(1)}M`, change: '+0%', isPositive: true },
                { title: 'Transactions', value: totalTxCount.toLocaleString(), change: '+0%', isPositive: true },
                { title: 'Active Users', value: activeUsersCount.length.toLocaleString(), change: '+0%', isPositive: true },
                { title: 'Conversion', value: `${conversion.toFixed(1)}%`, change: '+0%', isPositive: conversion >= 50 }
            ],
            transactionBreakdowns,
            topProducts,
            userGrowth: {
                today: usersToday.toString(),
                thisWeek: usersWeek.toString(),
                total: usersTotal > 1000 ? `${(usersTotal/1000).toFixed(1)}K` : usersTotal.toString()
            },
            recentActivities
        };
    }
}

export const adminAnalyticsService = new AdminAnalyticsService();
