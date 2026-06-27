export function generateReferralCode(prefix = "V"): string {
    const randomPart = Math.random().toString(36).substring(2, 8);
    const referralCode = `${prefix}${randomPart}`.toUpperCase();
    return referralCode;
}
