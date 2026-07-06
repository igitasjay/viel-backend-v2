import { Request, Response } from "express";
import { Asyncly } from "@/shared/extensions/asyncly";
import { prisma } from "@/shared/db/prisma";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { logger } from "@/lib/winston";

const getExchangeRates = Asyncly(async (req: Request, res: Response) => {
    logger.info(`Admin ${req.currentAdmin?.id} requested exchange rates`);

    const rates = await prisma.exchangeRate.findMany({
        orderBy: { currency: "asc" },
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: "Exchange rates retrieved successfully",
        data: rates,
    });
});

const createOrUpdateExchangeRate = Asyncly(async (req: Request, res: Response) => {
    const { currency, rate } = req.body;
    
    const formattedCurrency = currency.toUpperCase();

    logger.info(`Admin ${req.currentAdmin?.id} updating exchange rate for ${formattedCurrency} to ${rate}`);

    const updatedRate = await prisma.exchangeRate.upsert({
        where: { currency: formattedCurrency },
        update: { rate: Number(rate) },
        create: { currency: formattedCurrency, rate: Number(rate) },
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: `Exchange rate for ${formattedCurrency} updated successfully`,
        data: updatedRate,
    });
});

const deleteExchangeRate = Asyncly(async (req: Request, res: Response) => {
    const { id } = req.params;

    logger.info(`Admin ${req.currentAdmin?.id} deleting exchange rate ${id}`);

    await prisma.exchangeRate.delete({
        where: { id },
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: "Exchange rate deleted successfully",
    });
});

export const exchangeRateController = {
    getExchangeRates,
    createOrUpdateExchangeRate,
    deleteExchangeRate,
};
