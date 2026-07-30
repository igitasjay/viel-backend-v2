import { prisma } from "@shared/db/prisma";
import { adminAuthValidation } from "../validations/auth.validation";
import { Asyncly } from "@shared/extensions/asyncly";
import { logger } from "@/lib/winston";
import { config } from "@shared/config/config";
import { TokenService } from "@shared/guards/tokens";
import { AuthTokens } from "@/shared/guards/hash";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import {
    ForbiddenException,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from "@shared/exceptions/exceptions";

const createAdminUser = Asyncly(async (req, res) => {
    logger.info("createAdminUser: Request received", { body: req.body });

    const data = adminAuthValidation.createAdminUserSchema.parse(req.body);

    const hashedPassword = await AuthTokens.hashPassword(data.password);

    const newAdmin = await prisma.admin.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            isAdmin: true,
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    logger.info("createAdminUser: Admin user created successfully");
    return res.status(httpStatus.CREATED).json({
        message: "Admin user created successfully.",
        user: newAdmin,
    });
});

const login = Asyncly(async (req, res) => {
    const data = adminAuthValidation.loginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({
        where: { email: data.email },
    });

    if (!admin) {
        logger.warn("login: Admin not found");
        throw new ForbiddenException("not authorized");
    }

    if (!admin.isActive) {
        throw new ForbiddenException(
            "This administrator account is currently deactivated. Please contact system support.",
        );
    }

    const passwordMatch = await AuthTokens.comparePassword(
        data.password,
        admin.password,
    );
    if (!passwordMatch) {
        logger.warn("login: Password mismatch");
        throw new BadRequestException("Invalid email or password.");
    }

    const tokenPayload: AuthAdmin = {
        id: admin.id,
        email: admin.email,
        name: `${admin.name}`,
    };

    const accessToken = TokenService.generateAdminToken(tokenPayload);
    const refreshToken = TokenService.generateAdminRefreshToken(tokenPayload);

    const isProduction = config.env === "production";

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: config.jwt.accessTokenExpires * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: config.jwt.refreshTokenExpires * 24 * 60 * 60 * 1000,
    });

    logger.info("login: Login successful");
    return res.status(httpStatus.OK).json({
        message: "Login successful.",
        accessToken,
        refreshToken,
        admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            isSuper: admin.isSuper,
            isAdmin: admin.isAdmin,
        },
    });
});

const adminLogout = Asyncly(async (req, res) => {
    const accessToken = req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
        logger.warn("adminLogout: No access token provided");
        throw new BadRequestException("session expired");
    }

    const decoded = TokenService.decodeToken(accessToken);
    if (!decoded || !decoded.payload || !decoded.payload.id) {
        logger.error("adminLogout: Invalid token");
        throw new UnauthorizedException("Invalid token");
    }

    logger.info("adminLogout: Logout successful");
    res.status(httpStatus.OK).json({
        success: true,
        message: "Admin logout successful",
    });
});

const changePasswordAdmin = Asyncly(async (req, res) => {
    const adminId = req.currentAdmin?.id;
    const data = adminAuthValidation.passwordChangeSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
    });

    if (!admin) {
        throw new NotFoundException("Admin not found");
    }

    const isPasswordValid = await AuthTokens.comparePassword(
        data.currentPassword,
        admin.password,
    );

    if (!isPasswordValid) {
        throw new BadRequestException("Invalid current password");
    }

    if (data.currentPassword === data.newPassword) {
        throw new BadRequestException(
            "New password cannot be the same as current password",
        );
    }

    const hashedNewPassword = await AuthTokens.hashPassword(data.newPassword);
    await prisma.admin.update({
        where: { id: adminId },
        data: { password: hashedNewPassword },
    });

    const tokenPayload: AuthAdmin = {
        id: admin.id,
        email: admin.email,
        name: `${admin.name}`,
    };

    const accessToken = TokenService.generateAdminToken(tokenPayload);
    const refreshToken = TokenService.generateAdminRefreshToken(tokenPayload);

    res.status(httpStatus.OK).json({
        message: "Password changed successfully",
        accessToken: accessToken,
        refreshToken: refreshToken,
    });
});

const getAdminProfile = Asyncly(async (req, res) => {
    const adminId = req.currentAdmin?.id;
    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
            id: true,
            name: true,
            profilePicture: true,
            email: true,
        },
    });

    if (!admin) {
        throw new NotFoundException("Admin not found");
    }
    res.status(httpStatus.OK).json({
        message: "retrived profile successfully",
        admin,
    });
});

const getAllAdmin = Asyncly(async (_req, res) => {
    const admins = await prisma.admin.findMany();
    res.status(httpStatus.OK).json({
        message: "retrived admins successfully",
        admins,
    });
});

const suspendAdmin = Asyncly(async (req, res) => {
    const adminId = req.params.adminId as string;
    const data = adminAuthValidation.suspendAdminSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
    });

    if (!admin) {
        throw new NotFoundException("Admin not found");
    }

    if (admin.isSuper) {
        throw new ForbiddenException("Cannot suspend a Super Admin");
    }

    if (admin.isActive === data.isActive) {
        throw new BadRequestException(
            `Admin is already ${data.isActive ? "active" : "suspended"}`,
        );
    }

    await prisma.admin.update({
        where: { id: adminId },
        data: { isActive: data.isActive },
    });

    if (!data.isActive) {
        await TokenService.invalidateAdminTokens(adminId);
    }

    logger.info(`Admin ${adminId} ${data.isActive ? "activated" : "suspended"}`);
    return res.status(httpStatus.OK).json({
        message: `Admin ${data.isActive ? "activated" : "suspended"} successfully`,
    });
});

const deleteAdmin = Asyncly(async (req, res) => {
    const adminId = req.params.adminId as string;

    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
    });

    if (!admin) {
        throw new NotFoundException("Admin not found");
    }

    if (admin.isSuper) {
        throw new ForbiddenException("Cannot delete a Super Admin");
    }

    await prisma.admin.delete({
        where: { id: adminId },
    });

    await TokenService.invalidateAdminTokens(adminId);

    logger.info(`Admin ${adminId} deleted`);
    return res.status(httpStatus.OK).json({
        message: "Admin account deleted successfully",
    });
});

const resetAdminPassword = Asyncly(async (req, res) => {
    const adminId = req.params.adminId as string;
    const data = adminAuthValidation.superAdminResetPasswordSchema.parse(
        req.body,
    );

    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
    });

    if (!admin) {
        throw new NotFoundException("Admin not found");
    }

    const hashedNewPassword = await AuthTokens.hashPassword(data.newPassword);
    await prisma.admin.update({
        where: { id: adminId },
        data: {
            password: hashedNewPassword,
            isActive: false,
        },
    });

    await TokenService.invalidateAdminTokens(adminId);

    logger.info(`Password reset for Admin ${adminId}`);
    return res.status(httpStatus.OK).json({
        message: "Admin password reset successfully",
    });
});

const refreshAdminToken = Asyncly(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        throw new UnauthorizedException("Refresh token missing");
    }

    try {
        const payload = TokenService.verifyAdminRefreshToken(refreshToken);

        // Optional: check if admin still exists and is active
        const admin = await prisma.admin.findUnique({
            where: { id: payload.id },
        });

        if (!admin || !admin.isActive) {
            throw new UnauthorizedException("Admin account is inactive or not found");
        }

        const tokenPayload: AuthAdmin = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            isSuper: admin.isSuper,
        };

        const accessToken = TokenService.generateAdminToken(tokenPayload);
        const newRefreshToken =
            TokenService.generateAdminRefreshToken(tokenPayload);

        const isProduction = config.env === "production";

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            maxAge: config.jwt.accessTokenExpires * 24 * 60 * 60 * 1000,
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            maxAge: config.jwt.refreshTokenExpires * 24 * 60 * 60 * 1000,
        });

        return res.status(httpStatus.OK).json({
            message: "Token refreshed successfully",
            accessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        logger.error("Refresh token verification failed:");
        throw new UnauthorizedException("Invalid or expired refresh token");
    }
});

export const adminAuthController = {
    createAdminUser,
    login,
    adminLogout,
    changePasswordAdmin,
    getAdminProfile,
    getAllAdmin,
    suspendAdmin,
    deleteAdmin,
    resetAdminPassword,
    refreshAdminToken,
};
