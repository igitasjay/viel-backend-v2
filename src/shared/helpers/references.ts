import { formatInTimeZone } from "date-fns-tz";
import crypto from "crypto";

export function generateTransactionReference(): string {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const time = Math.floor(Date.now() / 1000)
        .toString(36)
        .toUpperCase();
    const random = crypto.randomInt(9999).toString().padStart(4, "0");
    return `${date}${time}${random}`;
}

export function generateRequestRef(suffixLength = 12): string {
    const lagosTime = formatInTimeZone(
        new Date(),
        "Africa/Lagos",
        "yyyyMMddHHmm",
    );
    const suffix = Math.random()
        .toString(36)
        .substring(2, suffixLength + 2);

    return lagosTime + suffix;
}

export function generateSessionId(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomInt(1e12, 1e13).toString();
    return timestamp + random;
}
