import { TransactionDTO } from "./histories.dto";

export const buildEnumFilters = (
  enumObj: object,
  fieldName: string,
  query: string,
) => {
  return Object.values(enumObj)
    .filter((value) => value.toLowerCase().includes(query))
    .map((value) => ({ [fieldName]: value }));
};

export function removeNullsDeep(obj: any, seen = new WeakMap()): any {
  if (obj === null || obj === undefined) return undefined;

  if (typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle Decimal.js or similar objects with toNumber
  if (typeof obj.toNumber === "function") {
    return obj.toNumber();
  }

  // Circular dependency check
  if (seen.has(obj)) return seen.get(obj);

  if (Array.isArray(obj)) {
    const result: any[] = [];
    seen.set(obj, result);
    for (let i = 0; i < obj.length; i++) {
      const value = removeNullsDeep(obj[i], seen);
      if (value !== undefined && value !== null) {
        result.push(value);
      }
    }
    return result;
  }

  const result: Record<string, any> = {};
  seen.set(obj, result);

  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = removeNullsDeep(obj[key], seen);
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  return result;
}

export const transformTransactions = (transactions: any) => {
  return transactions.map((tx: any) => removeNullsDeep(new TransactionDTO(tx)));
};
