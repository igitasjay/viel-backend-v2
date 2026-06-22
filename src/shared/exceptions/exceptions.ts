import { httpStatus } from "./statusCodes";

export class AppException extends Error {
    statusCode: number;
    details?: Record<string, any>;
    field?: string;

    constructor(
        statusCode: number,
        message: string,
        details?: Record<string, any>,
        field?: string,
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.details = details;
        this.field = field;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestException extends AppException {
    constructor(message: string, details?: Record<string, any>, field?: string) {
        super(httpStatus.BAD_REQUEST, message, details, field);
    }
}

export class UnauthorizedException extends AppException {
    constructor(message: string, details?: Record<string, any>, field?: string) {
        super(httpStatus.UNAUTHORIZED, message, details, field);
    }
}

export class ForbiddenException extends AppException {
    constructor(message: string, details?: Record<string, any>) {
        super(httpStatus.FORBIDDEN, message, details);
    }
}

export class NotFoundException extends AppException {
    constructor(message: string, details?: Record<string, any>) {
        super(httpStatus.NOT_FOUND, message, details);
    }
}

export class ConflictException extends AppException {
    constructor(message: string, details?: Record<string, any>, field?: string) {
        super(httpStatus.CONFLICT, message, details, field);
    }
}

export class ValidationException extends AppException {
    constructor(message: string, field?: string, details?: Record<string, any>) {
        super(httpStatus.BAD_REQUEST, message, details, field);
    }
}

export class UnprocessableEntityException extends AppException {
    constructor(message: string, details?: Record<string, any>) {
        super(httpStatus.UNPROCESSABLE_ENTITY, message, details);
    }
}

export class TooManyRequestsException extends AppException {
    constructor(
        message: string = "Too many requests",
        details?: Record<string, any>,
    ) {
        super(httpStatus.TOO_MANY_REQUESTS, message, details);
    }
}

export class InternalServerErrorException extends AppException {
    constructor(
        message: string = "Something went wrong",
        details?: Record<string, any>,
    ) {
        super(httpStatus.INTERNAL_SERVER_ERROR, message, details);
    }
}

export class ServiceUnavailableException extends AppException {
    constructor(
        message: string = "Service unavailable",
        details?: Record<string, any>,
    ) {
        super(httpStatus.SERVICE_UNAVAILABLE, message, details);
    }
}

export class RequestTimeoutException extends AppException {
    constructor(
        message: string = "Request timeout",
        details?: Record<string, any>,
    ) {
        super(httpStatus.REQUEST_TIMEOUT, message, details);
    }
}
