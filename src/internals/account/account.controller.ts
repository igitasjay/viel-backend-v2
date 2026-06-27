import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
    TooManyRequestsException,
    ConflictException,
} from "@shared/exceptions/exceptions";
import { Asyncly } from "@/shared/extensions/asyncly";
import { prisma } from "@shared/db/prisma";