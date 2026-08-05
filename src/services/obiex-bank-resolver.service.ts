import { ObiexService } from '@/externals/obiex/obiex';
import { logger } from '@/lib/winston';

/**
 * Normalizes bank names by removing common suffixes and standardizing spacing
 * so they can be matched across Monnify and Obiex.
 */
const normalizeBankName = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/\b(bank|plc|ltd|limited|microfinance|mfb)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
};

/**
 * Hardcoded fallback map for popular Nigerian banks in case string matching fails.
 * Monnify Code -> Obiex Code
 */
const STATIC_BANK_MAP: Record<string, string> = {
    '090267': '090267', // Kuda
    '058': '058',       // GTB
    '033': '033',       // UBA
    '057': '057',       // Zenith
    // We can add more as discovered
};

/**
 * Resolves the Obiex Bank Code for a given Monnify Bank Name and Code.
 */
export const resolveObiexBankCode = async (
    monnifyBankName: string,
    monnifyBankCode: string
): Promise<string | null> => {
    // 1. Check static map first
    if (STATIC_BANK_MAP[monnifyBankCode]) {
        return STATIC_BANK_MAP[monnifyBankCode];
    }

    // 2. Fetch Obiex banks and attempt string matching
    try {
        const response = await ObiexService.getBankCodes();
        
        // Obiex typically returns an array of bank objects or a data wrapper.
        // Assuming response or response.data is an array: [{ name: "Kuda", code: "090267" }, ...]
        const banks: any[] = Array.isArray(response) ? response : (response?.data || []);

        const normalizedMonnifyName = normalizeBankName(monnifyBankName);

        for (const bank of banks) {
            const obiexBankName = typeof bank === 'object' ? bank.name || bank.bankName : '';
            const obiexBankCode = typeof bank === 'object' ? bank.code || bank.bankCode : '';
            
            if (obiexBankName && obiexBankCode) {
                const normalizedObiexName = normalizeBankName(obiexBankName);
                if (normalizedObiexName === normalizedMonnifyName || 
                    normalizedObiexName.includes(normalizedMonnifyName) || 
                    normalizedMonnifyName.includes(normalizedObiexName)) {
                    return obiexBankCode;
                }
            }
        }
        
        logger.warn(`Could not resolve Obiex bank code for: ${monnifyBankName} (Monnify code: ${monnifyBankCode})`);
        return null;
    } catch (error) {
        logger.error(`Error fetching Obiex bank codes during resolution: ${error}`);
        return null;
    }
};
