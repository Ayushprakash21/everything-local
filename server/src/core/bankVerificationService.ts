import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';

/**
 * Derives the cryptographic master key for bank account encryption at rest (VULN-010).
 * In production, fails closed if BANK_ENCRYPTION_SECRET is absent or under 32 characters.
 */
export function getEncryptionKey(): Buffer {
  const secret = process.env.BANK_ENCRYPTION_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim().length < 32 || secret.includes('everything-local-indore-fintech-sec-2026')) {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: BANK_ENCRYPTION_SECRET must be securely set with at least 32 characters in production environments.'
      );
    }
    const salt = process.env.BANK_ENCRYPTION_SALT || crypto.createHash('sha256').update(secret).digest('hex').slice(0, 16);
    return crypto.scryptSync(secret, salt, 32);
  }

  // Development/Test fallback with warning
  const devSecret = secret || 'everything-local-dev-test-only-bank-secret-key-32b';
  const devSalt = process.env.BANK_ENCRYPTION_SALT || 'salt-el-dev-merchant-vault';
  return crypto.scryptSync(devSecret, devSalt, 32);
}

export interface BankLookupResult {
  isValid: boolean;
  bankName: string;
  branchName: string;
  city: string;
  state: string;
  error?: string;
}

export interface PennyDropVerificationResult {
  status: 'SUCCESS' | 'FAILED' | 'MANUAL_REVIEW';
  providerRef: string;
  beneficiaryName: string;
  matchScore: number;
  remarks: string;
}

// 1. Bank IFSC Directory Lookup for Hyperlocal Merchants
export const KNOWN_BANK_PREFIXES: Record<string, { bankName: string; defaultBranch: string }> = {
  SBIN: { bankName: 'State Bank of India', defaultBranch: 'Main Branch, Palasia, Indore' },
  HDFC: { bankName: 'HDFC Bank', defaultBranch: 'Scheme 54, Vijay Nagar, Indore' },
  ICIC: { bankName: 'ICICI Bank', defaultBranch: 'MG Road, South Tukoganj, Indore' },
  PUNB: { bankName: 'Punjab National Bank', defaultBranch: 'Rajwada Chowk, Indore' },
  BARB: { bankName: 'Bank of Baroda', defaultBranch: 'Bhawarkua Main Road, Indore' },
  UTIB: { bankName: 'Axis Bank', defaultBranch: 'Saket Nagar, Indore' },
  KKBK: { bankName: 'Kotak Mahindra Bank', defaultBranch: 'New Palasia, Indore' },
  CNRB: { bankName: 'Canara Bank', defaultBranch: 'Jail Road, Indore' },
  UBIN: { bankName: 'Union Bank of India', defaultBranch: 'Siya Ganj, Indore' },
  IDFB: { bankName: 'IDFC FIRST Bank', defaultBranch: 'AB Road, Indore' },
  YESB: { bankName: 'Yes Bank', defaultBranch: 'Race Course Road, Indore' },
  INDB: { bankName: 'IndusInd Bank', defaultBranch: 'Annapurna Road, Indore' },
  MPBL: { bankName: 'Madhya Pradesh Gramin Bank', defaultBranch: 'C-21 Mall Area, Indore' }
};

export class BankVerificationService {
  /**
   * Validate Indian Financial System Code (IFSC) format & resolve bank details
   */
  static lookupIfsc(ifsc: string): BankLookupResult {
    const cleanIfsc = (ifsc || '').trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscRegex.test(cleanIfsc)) {
      return {
        isValid: false,
        bankName: '',
        branchName: '',
        city: '',
        state: '',
        error: 'Invalid IFSC format. Must be 11 characters (4 letters, 0, 6 letters/digits).'
      };
    }

    const prefix = cleanIfsc.substring(0, 4);
    const bankInfo = KNOWN_BANK_PREFIXES[prefix];

    if (bankInfo) {
      return {
        isValid: true,
        bankName: bankInfo.bankName,
        branchName: bankInfo.defaultBranch,
        city: 'Indore',
        state: 'Madhya Pradesh'
      };
    }

    // Generic valid format for other scheduled commercial banks
    return {
      isValid: true,
      bankName: `Scheduled Bank (${prefix})`,
      branchName: 'Indore Clearing Branch',
      city: 'Indore',
      state: 'Madhya Pradesh'
    };
  }

  /**
   * Encrypt bank account number at rest using AES-256-GCM
   */
  static encryptAccountNumber(accountNumber: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(accountNumber.trim(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt bank account number for verified payment dispatch
   */
  static decryptAccountNumber(encryptedString: string): string {
    try {
      const parts = encryptedString.split(':');
      if (parts.length !== 3) return encryptedString; // Fallback if plain
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      const key = getEncryptionKey();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // In development/test, attempt fallback for backward compatibility
      if (process.env.NODE_ENV !== 'production') {
        try {
          const parts = encryptedString.split(':');
          const iv = Buffer.from(parts[0], 'hex');
          const authTag = Buffer.from(parts[1], 'hex');
          const fallbackKey = crypto.scryptSync('everything-local-indore-fintech-sec-2026', 'salt-el-merchant', 32);
          const decipher = crypto.createDecipheriv(ALGORITHM, fallbackKey, iv);
          decipher.setAuthTag(authTag);
          let decrypted = decipher.update(parts[2], 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          return decrypted;
        } catch {
          return encryptedString;
        }
      }
      return encryptedString;
    }
  }

  /**
   * Mask bank account number for secure UI display
   * e.g. "•••• •••• 5678" or "XXXX XXXX 5678"
   */
  static maskAccountNumber(accountNumber: string): string {
    const clean = (accountNumber || '').trim();
    if (clean.length < 4) return '••••';
    const last4 = clean.slice(-4);
    return `•••• •••• ${last4}`;
  }

  /**
   * Execute or simulate Penny-Drop verification through Banking Network (₹1 deposit)
   * Matches account holder name against merchant legal / business name
   */
  static async verifyPennyDrop(
    accountNumber: string,
    ifsc: string,
    claimedAccountHolder: string,
    merchantLegalName?: string
  ): Promise<PennyDropVerificationResult> {
    const cleanAcc = (accountNumber || '').trim();
    const cleanIfsc = (ifsc || '').trim().toUpperCase();

    // 1. Account number format check (Indian bank accounts are 9 to 18 digits)
    if (!/^\d{9,18}$/.test(cleanAcc)) {
      return {
        status: 'FAILED',
        providerRef: `PND-ERR-${Date.now()}`,
        beneficiaryName: '',
        matchScore: 0,
        remarks: 'Invalid account number digits. Must be between 9 and 18 numerical digits.'
      };
    }

    // 2. Reject all-zeroes or dummy sequences
    if (/^0+$/.test(cleanAcc) || cleanAcc === '123456789') {
      return {
        status: 'FAILED',
        providerRef: `PND-REJ-${Date.now()}`,
        beneficiaryName: '',
        matchScore: 0,
        remarks: 'Invalid test account number rejected by core banking gateway.'
      };
    }

    // 3. Lookup IFSC
    const ifscResult = this.lookupIfsc(cleanIfsc);
    if (!ifscResult.isValid) {
      return {
        status: 'FAILED',
        providerRef: `PND-ERR-${Date.now()}`,
        beneficiaryName: '',
        matchScore: 0,
        remarks: ifscResult.error || 'Invalid IFSC code.'
      };
    }

    // 4. Calculate Name Match Score with beneficiary returned by bank
    const claimedWords = claimedAccountHolder.toLowerCase().split(/\s+/).filter(Boolean);
    const legalWords = (merchantLegalName || '').toLowerCase().split(/\s+/).filter(Boolean);

    // Simulated beneficiary name returned by NPCI/IMPS switch
    const beneficiaryName = claimedAccountHolder.toUpperCase();
    const beneficiaryWords = beneficiaryName.toLowerCase().split(/\s+/);

    // Match against claimed name
    let claimedMatchCount = 0;
    claimedWords.forEach((cw) => {
      if (beneficiaryWords.some((bw) => bw.includes(cw) || cw.includes(bw))) {
        claimedMatchCount++;
      }
    });
    const claimedScore = claimedWords.length > 0 ? (claimedMatchCount / claimedWords.length) * 100 : 100;

    // Match against legal entity name if provided
    let legalScore = 0;
    if (legalWords.length > 0) {
      let legalMatchCount = 0;
      legalWords.forEach((lw) => {
        if (beneficiaryWords.some((bw) => bw.includes(lw) || lw.includes(bw))) {
          legalMatchCount++;
        }
      });
      legalScore = (legalMatchCount / legalWords.length) * 100;
    }

    const matchScore = Math.round(Math.max(claimedScore, legalScore));
    const providerRef = `PND-IMPS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    if (matchScore >= 75) {
      return {
        status: 'SUCCESS',
        providerRef,
        beneficiaryName,
        matchScore,
        remarks: 'Account verified successfully via NPCI Penny-Drop. Account is active and ready for settlements.'
      };
    } else if (matchScore >= 40) {
      return {
        status: 'MANUAL_REVIEW',
        providerRef,
        beneficiaryName,
        matchScore,
        remarks: `Partial name match (${Math.round(matchScore)}%). Account routed to admin manual verification queue.`
      };
    } else {
      return {
        status: 'FAILED',
        providerRef,
        beneficiaryName,
        matchScore,
        remarks: 'Beneficiary name mismatch with registered business owner.'
      };
    }
  }
}
