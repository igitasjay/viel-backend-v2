import { logger } from "@/lib/winston";
import { AppException } from "@/shared/exceptions/exceptions";
import { httpStatus } from "@/shared/exceptions/statusCodes";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export class ApiClient {
    private static async makeRequest<T = any>(
        url: string,
        config: AxiosRequestConfig,
        context: string,
        userFriendlyError: string = "Service temporarily unavailable",
    ): Promise<AxiosResponse<T>> {
        try {
            const response = await axios(url, config);

            logger.info(`${context} successful`, {
                method: config.method || "GET",
                status: response.status,
            });

            return response;
        } catch (error: any) {
            const errorDetails = {
                context,
                method: config.method || "GET",
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                message: error.message,
                timestamp: new Date().toISOString(),
            };

            logger.error(`${context} failed`, errorDetails);

            throw new AppException(
                error.response?.status || httpStatus.SERVICE_UNAVAILABLE,
                userFriendlyError,
            );
        }
    }

    static async get<T = any>(
        url: string,
        _data: any = null,
        config: AxiosRequestConfig = {},
        context: string = "GET request",
        userFriendlyError?: string,
    ): Promise<AxiosResponse<T>> {
        return this.makeRequest<T>(
            url,
            { ...config, method: "GET" },
            context,
            userFriendlyError,
        );
    }

    static async post<T = any>(
        url: string,
        data: any = null,
        config: AxiosRequestConfig = {},
        context: string = "POST request",
        userFriendlyError?: string,
    ): Promise<AxiosResponse<T>> {
        return this.makeRequest<T>(
            url,
            { ...config, method: "POST", data },
            context,
            userFriendlyError,
        );
    }
}
