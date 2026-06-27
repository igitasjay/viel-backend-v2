import crypto from "crypto";
import { config } from "../config/config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
// const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const ENCRYPTION_KEY = config.encryption.key;

function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(ENCRYPTION_KEY, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return (
        salt.toString("hex") +
        ":" +
        iv.toString("hex") +
        ":" +
        encrypted +
        ":" +
        tag.toString("hex")
    );
}

export function decrypt(encryptedData: string): string {
    const parts = encryptedData.split(":");

    if (parts.length !== 4) {
        throw new Error("Invalid encrypted data format");
    }

    const salt = Buffer.from(parts[0], "hex");
    const iv = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const tag = Buffer.from(parts[3], "hex");

    const key = deriveKey(ENCRYPTION_KEY, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
