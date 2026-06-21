/**
 * Normalizes a range string by removing all spaces and currency symbols.
 * Example: "$ 50 - 100 " -> "50-100"
 */
export const normalizeRange = (rangeStr: string): string => {
  if (!rangeStr) return '';
  // Remove currency symbols and spaces
  return rangeStr.replace(/[\s$€£¥₦]/g, '');
};

/**
 * Normalizes a receipt type string by replacing spaces with underscores
 * and converting to uppercase.
 * Example: "e code" -> "E_CODE"
 */
export const normalizeReceiptType = (receiptTypeStr: string): string => {
  if (!receiptTypeStr) return '';
  return receiptTypeStr.trim().replace(/\s+/g, '_').toUpperCase();
};
