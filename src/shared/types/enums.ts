// Betting providers
export enum BettingProviderCode {
  Bet9ja = "BET9JA",
  Bangbet = "BANGBET",
  Sportybet = "SPORTYBET",
  Betking = "BETKING",
  OneXBet = "ONE_XBET",
  Betway = "BETWAY",
  Merrybet = "MERRYBET",
  Melbet = "MELBET",
  Betlion = "BETLION",
  Bet9jaAgent = "BET9JA_AGENT",
  Naijabet = "NAIJABET",
  MyLottoHub = "MYLOTTOHUB",
  Cloudbet = "CLOUDBET",
  Paripesa = "PARIPESA",
  NairaMillion = "NAIRAMILLION",
  Nairabet = "NAIRABET",
}

// Electricity companies
export enum ElectricityCompany {
  EKEDC = "eko-electric",
  IKEDC = "ikeja-electric",
  AEDC = "abuja-electric",
  KEDCO = "kano-electric",
  PHED = "portharcourt-electric",
  JED = "jos-electric",
  IBEDC = "ibadan-electric",
  KAEDCO = "kaduna-electric",
  EEDC = "enugu-electric",
  BEDC = "benin-electric",
  YEDC = "yola-electric",
  ABA = "aba-electric",
}

// Cable TV providers
export enum CableTVProviderCode {
  DSTV = "dstv",
  GOTV = "gotv",
  STARTIMES = "startimes",
}

// Mobile networks
export enum MobileNetworkCode {
  MTN = "mtn",
  GLO = "glo",
  AIRTEL = "airtel",
  "9MOBILE" = "9mobile",
}

// Data Plans
export enum DataServiceID {
  MTN = "mtn-data",
  GLO = "glo-data",
  GLO_SME = "glo-sme-data",
  AIRTEL = "airtel-data",
  ETISALAT = "etisalat-data",
}

// Beneficiary
export enum BeneficiaryType {
  BANK = "bank",
  WALLET = "wallet",
  UTILITY = "utility",
  ELECTRICITY = "electricity",
  CABLE = "cable",
  BETTING = "betting",
}

export enum ReferralSource {
  FACEBOOK = "Facebook",
  INSTAGRAM = "Instagram",
  TWITTER = "X (formerly Twitter)",
  GOOGLE = "Google",
  TIKTOK = "TikTok",
  INFLUENCER = "Influencer",
  OTHERS = "Others",
}

export enum PaymentMethod {
  WALLET = "wallet",
  VIRTUAL = "virtual",
}

export enum ServiceID {
  WAEC = "waec-registration",
  CHECKER = "waec",
}

export enum JambVariationCode {
  DIRECT_ENTRY = "de",
  UTME_WITH_MOCK = "utme-mock",
  UTME_WITHOUT_MOCK = "utme-no-mock",
}

export enum RewardsType {
  // CASHBACK = 10,
  REFERRAL = 1000,
}

export enum ReferralConstants {
  MIN_REFERRAL_TRANSACTION_USD = 10,
}

export enum ReferralCodeCount {
  SIGNUP = 10,
}

export enum TransferFee {
  CHARGES = 50,
}

export enum DisputeReason {
  MONEY_NOT_RECEIVED = "money-not-received",
  INCORRECT_AMOUNT = "incorrect-amount",
  DELAYED_TRANSACTION = "delayed-transaction",
  INCORRECT_TRANSACTION = "incorrect-transaction",
  INCORRECT_PROVIDER = "incorrect-provider",
  UNAUTHORIZED_TRANSACTION = "unauthorized-transaction",
  DUPLICATE_CHARGE = "duplicate-charge",
  INVALID_PROVIDER = "invalid-provider",
  OTHERS = "others",
}
