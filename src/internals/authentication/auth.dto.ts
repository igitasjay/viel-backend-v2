export class RegisterResponseDTO {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  referralCode?: string;
  profilePicture?: string;
  barcodeUrl: string;
  dateOfBirth?: Date;

  constructor(user: any) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
    this.referralCode = user.referralCode;
    this.profilePicture = user.profilePicture;
    this.dateOfBirth = user.dateOfBirth;
    this.barcodeUrl = user.barcodeUrl;
  }
}

export class VerifyResponseDTO {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  isBiometricEnabled: boolean;
  isTwoFactorEnabled: boolean;
  isPinSet: boolean;
  profilePicture?: string;
  accessToken: string;
  refreshToken: string;
  dateOfBirth?: Date;
  referralCode?: string;

  constructor(
    user: any,
    isVerified: boolean,
    accessToken: string,
    refreshToken: string,
  ) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.isVerified = isVerified;
    this.isBiometricEnabled = user.isBiometricEnabled;
    this.isTwoFactorEnabled = user.isTwoFactorEnabled;
    this.isPinSet = !!user.security?.isPinSet;
    this.profilePicture = user.profilePicture;
    this.dateOfBirth = user.dateOfBirth;
    this.referralCode = user.referralCode;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

export class LoginResponseDTO {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  isPinSet: boolean;
  isBiometricEnabled: boolean;
  isTwoFactorEnabled: boolean;
  profilePicture?: string;
  accessToken: string;
  refreshToken?: string;
  dateOfBirth?: Date;
  referralCode?: string;
  tagline?: string;

  constructor(
    user: any,
    accessToken: string,
    refreshToken?: string,
    tagline?: string,
  ) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.isVerified = user.isVerified;
    this.isBiometricEnabled = user.isBiometricEnabled;
    this.isPinSet = !!user.security?.isPinSet;
    this.isTwoFactorEnabled = user.isTwoFactorEnabled;
    this.profilePicture = user.profilePicture;
    this.dateOfBirth = user.dateOfBirth;
    this.referralCode = user.referralCode;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tagline = tagline;
  }
}

export class UserResponseDTO {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;

  constructor(user: any) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
  }
}

export class PasswordChangeResponseDTO {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  isBiometricEnabled: boolean;
  isPinSet: boolean;
  profilePicture?: string;
  dateOfBirth?: Date;
  referralCode?: string;

  constructor(user: any) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.isBiometricEnabled = user.isBiometricEnabled;
    this.isVerified = user.isVerified;
    this.isPinSet = !!user.security?.isPinSet;
    this.profilePicture = user.profilePicture;
    this.dateOfBirth = user.dateOfBirth;
    this.referralCode = user.referralCode;
  }
}

export class RefreshTResponseDTO {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  accessToken: string;

  constructor(user: any, accessToken: string) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.isVerified = user.isVerified;
    this.accessToken = accessToken;
  }
}

export class ReAuthResponseDTO {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  isBiometricEnabled: boolean;

  constructor(user: any) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.isVerified = user.isVerified;
    this.isBiometricEnabled = user.isBiometricEnabled;
  }
}
