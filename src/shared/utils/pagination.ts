import { prisma } from "@shared/db/prisma";
import { WithPaginationOptions } from "./interface";


export async function withPagination<T>({
    model,
    req,
    where = {},
    include,
    select,
    transform = (item) => item,
    sortBy = "createdAt",
    sortOrder = "desc",
    defaultLimit = 50,
    additional = {},
}: WithPaginationOptions<T>) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || defaultLimit;
    const skip = (page - 1) * limit;

    const [totalItems, results] = await Promise.all([
        ((prisma as any)[model] as any).count({ where }),
        ((prisma as any)[model] as any).findMany({
            where,
            ...(include && { include }),
            ...(select && { select }),
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip,
            take: limit,
        }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasMore = page * limit < totalItems;

    return {
        ...additional,
        results: await Promise.all(results.map(transform)),
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            limit,
            hasMore,
        },
    };
}
