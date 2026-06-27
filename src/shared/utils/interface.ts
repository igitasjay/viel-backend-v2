import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

export interface WithPaginationOptions<T> {
    model: keyof PrismaClient;
    req: Request;
    res: Response;
    where?: Record<string, any>;
    select?: Record<string, any>;
    include?: Record<string, any>;
    transform?: (item: any) => T;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    defaultLimit?: number;
    additional?: Record<string, any>;
}
