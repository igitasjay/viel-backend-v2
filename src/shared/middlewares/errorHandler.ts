import { config } from '@shared/config/config'
import { Request, Response, NextFunction } from "express";
import { logger } from "@/lib/winston";
import { Prisma } from "@prisma/client";
import {
  AppException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  ValidationException,
  RequestTimeoutException,
} from "@/shared/exceptions/exceptions";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let error: AppException;

  // Prisma Validation Error
  if (err instanceof Prisma.PrismaClientValidationError) {
    const enumErrorRegex =
      /Invalid value for argument `(\w+)`\..*?Expected (\w+)\./;
    const match = err.message.match(enumErrorRegex);

    if (match) {
      const fieldName = match[1];
      const expectedEnum = match[2];
      error = new ValidationException(
        `Invalid value for '${fieldName}'. Expected a value from enum '${expectedEnum}'.`,
        fieldName,
      );
    } else {
      error = new BadRequestException(
        `Validation error: ${err.message.split("\n").slice(-1)[0]?.trim() || "Invalid input format"
        }`,
      );
    }
  }

  // Prisma Known Request Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        const fieldMatch = err.meta?.target as string[];
        const fieldName = fieldMatch?.[0] || "field";
        error = new ConflictException(
          `A record with this ${fieldName} already exists.`,
          { field: fieldName },
          fieldName,
        );
        break;
      case "P2025":
        error = new NotFoundException(
          "We couldn't find what you were looking for",
        );
        break;
      case "P2028":
        error = new RequestTimeoutException(
          "Transaction timeout. Please try again.",
        );
        break;
      default:
        error = new InternalServerErrorException(
          config.env === "production"
            ? "A database error occurred. Please try again later."
            : `Database error: ${err.message}`,
        );
    }
  }

  // Prisma Unknown Request Error (includes connection closed)
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const isConnectionClosed =
      err.message.includes("Server has closed the connection") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("Connection terminated");

    error = new InternalServerErrorException(
      config.env === "production"
        ? isConnectionClosed
          ? "Connection was lost. Please try again later."
          : "An unexpected error occurred."
        : err.message,
      config.env === "development"
        ? { originalError: err.stack || err.message }
        : undefined,
    );
  }

  // Socket Timeout Errors
  else if (err.cause && err.cause.kind === "SocketTimeout") {
    error = new RequestTimeoutException(
      "Request timeout. The operation took too long to complete. Please try again.",
    );
  } else if (err.name === "MulterError" || err.message === "Unexpected field") {
    if (
      err.message === "Unexpected field" ||
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      const receivedField = err.field || "unknown";
      error = new BadRequestException(
        `Unexpected file field "${receivedField}". The endpoint you're calling doesn't accept this field name. Common field names are: "attachments" (support chat), "images" (giftcards/events/disputes), "profilePicture" (profile). Check your spelling and the API documentation.`,
        {
          receivedField: receivedField,
          commonFields: {
            supportChat: "attachments",
            giftcards: "images",
            profile: "profilePicture",
            events: "images",
            disputes: "images",
          },
          hint: "Make sure the field name matches exactly (case-sensitive) and check for typos.",
        },
      );
    } else {
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          error = new BadRequestException(
            `File too large. Please check the endpoint documentation for maximum file size.`,
            { field: err.field },
          );
          break;
        case "LIMIT_FILE_COUNT":
          error = new BadRequestException(
            `Too many files. Maximum ${err.limit} files allowed.`,
          );
          break;
        default:
          error = new BadRequestException(`File upload error: ${err.message}`);
      }
    }
  }

  // Wrap other errors in AppException if not already
  else if (!(err instanceof AppException)) {
    error = new InternalServerErrorException(
      config.env === "production"
        ? "Something went wrong. Please try again later."
        : err.message || "Internal server error",
      config.env === "development"
        ? { originalError: err.stack || err.message }
        : undefined,
    );
  } else {
    error = err;
  }

  // Log error internally
  try {
    logger.error(err);
  } catch (logErr) {
    console.error("Logger failed:", logErr);
  }

  // 7️⃣ Build client response
  const response: any = {
    message: error.message,
  };

  if (error.field) {
    response.field = error.field;
  }

  if (config.env === "development") {
    if (error.details && Object.keys(error.details).length > 0) {
      response.details = error.details;
    }
    response.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(response);
};
