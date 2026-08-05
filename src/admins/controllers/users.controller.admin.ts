import { Request, Response } from "express";
import { Asyncly } from "@/shared/extensions/asyncly";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import { adminUsersService } from "../services/users.service.admin";
import { adminUsersValidation } from "../validations/users.validation.admin";

const getUsers = Asyncly(async (req: Request, res: Response) => {
    const query = adminUsersValidation.getUsersQuerySchema.parse(req.query);
    
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    
    const data = await adminUsersService.getUsers({
        page,
        limit,
        search: query.search,
        statusFilter: query.statusFilter,
    });

    res.status(httpStatus.OK).json({
        success: true,
        message: "Users fetched successfully",
        data,
    });
});

const updateUserStatus = Asyncly(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const body = adminUsersValidation.updateUserStatusSchema.parse(req.body);

    await adminUsersService.updateUserStatus(userId, body.isActive);

    res.status(httpStatus.OK).json({
        success: true,
        message: `User ${body.isActive ? 'unsuspended' : 'suspended'} successfully`,
    });
});

export const adminUsersController = {
    getUsers,
    updateUserStatus,
};
