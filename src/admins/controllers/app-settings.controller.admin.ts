import { Request, Response } from "express";
import { Asyncly } from "@/shared/extensions/asyncly";
import { prisma } from "@/shared/db/prisma";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { logger } from "@/lib/winston";

const getSettings = Asyncly(async (req: Request, res: Response) => {
    const key = req.query.key as string;
    
    if (key) {
        const setting = await prisma.appSettings.findUnique({
            where: { key }
        });
        return res.status(httpStatus.OK).json({ success: true, data: setting });
    }

    const settings = await prisma.appSettings.findMany();
    return res.status(httpStatus.OK).json({ success: true, data: settings });
});

const updateSetting = Asyncly(async (req: Request, res: Response) => {
    const { key, appValue, description } = req.body;
    
    if (!key || !appValue) {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "key and appValue are required" });
    }

    logger.info(`Admin ${req.currentAdmin?.id} updating setting ${key}`);

    const valueArray = Array.isArray(appValue) ? appValue : [appValue.toString()];

    const updatedSetting = await prisma.appSettings.upsert({
        where: { key },
        update: { 
            appValue: valueArray,
            ...(description && { description }),
            updatedBy: req.currentAdmin?.id
        },
        create: { 
            key, 
            appValue: valueArray,
            description: description || `Admin configured value for ${key}`,
            updatedBy: req.currentAdmin?.id
        },
    });

    return res.status(httpStatus.OK).json({
        success: true,
        message: `Setting ${key} updated successfully`,
        data: updatedSetting,
    });
});

export const appSettingsController = {
    getSettings,
    updateSetting,
};
