import { Request, Response } from "express";
import { Asyncly } from "@/shared/extensions/asyncly";
import { adminAnalyticsService } from "../services/analytics.service.admin";
import { httpStatus } from "@/shared/exceptions/statusCodes";

const getAnalytics = Asyncly(async (req: Request, res: Response) => {
    const dateRange = (req.query.dateRange as string) || '7 Days';
    const data = await adminAnalyticsService.getAnalyticsDashboard(dateRange);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Analytics fetched successfully",
        data,
    });
});

export const adminAnalyticsController = {
    getAnalytics,
};
