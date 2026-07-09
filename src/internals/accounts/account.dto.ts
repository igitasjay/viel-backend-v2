export class AccountPinSetResponseDTO {
  id: string;
  fullname: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  isPinSet: boolean;

  constructor(user: any, isPinSet?: boolean) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.isActive = user.isActive;
    this.isVerified = !!user?.isVerified;
    this.isPinSet =
      isPinSet !== undefined ? isPinSet : !!user.security?.isPinSet;
  }
}

export class AccountPinChangeResponseDTO {
  id: string;
  fullname: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  isPinSet: boolean;

  constructor(user: any) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.isActive = user.isActive;
    this.isVerified = !!user?.isVerified;
    this.isPinSet = !!user.security?.isPinSet;
  }
}

export class ForgotPinResponseDTO {
  id: string;
  fullname: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  isPinSet: boolean;

  constructor(user: any, isPinSet?: boolean) {
    this.id = user.id;
    this.fullname = user.fullname;
    this.email = user.email;
    this.isActive = user.isActive;
    this.isVerified = user.isVerified;
    this.isPinSet =
      isPinSet !== undefined ? isPinSet : !!user.security?.isPinSet;
  }
}
