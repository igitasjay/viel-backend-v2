// BASE PROFILE RESPONSE DTO
export class ProfileResponseDTO {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phone: string;
  profilePicture?: string;
  dateOfBirth: string | null;
  isActive: boolean;
  isVerified: boolean;
  isKycVerified: boolean;
  tier: string;
  referralCode: string;
  barcodeUrl: string;
  hasUpdatedDob: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(user: any) {
    this.id = user.id;
    this.fullName = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.phone = user.phone;
    this.profilePicture = user.profilePicture;
    this.dateOfBirth =
      user.dateOfBirth instanceof Date
        ? user.dateOfBirth.toISOString().split("T")[0]
        : (user.dateOfBirth ?? null);
    this.isActive = user.isActive;
    this.isVerified = user.isVerified;
    this.isKycVerified = user.isKycVerified;
    this.tier = user.tier;
    this.referralCode = user.referralCode;
    this.barcodeUrl = user.barcodeUrl;
    this.hasUpdatedDob = user.hasUpdatedDob || false;
    this.createdAt = user.createdAt.toISOString();
    this.updatedAt = user.updatedAt.toISOString();
  }
}

// PROFILE UPDATE RESPONSE DTO
export class ProfileUpdateResponseDTO {
  id: string;
  updatedFields: string[];
  profile: ProfileResponseDTO;
  message: string;
  updated: boolean;

  constructor(user: any, updatedFields: string[], message: string) {
    this.id = user.id;
    this.updatedFields = updatedFields;
    this.profile = new ProfileResponseDTO(user);
    this.message = message;
    this.updated = !!user.hasUpdatedDob;
  }
}

// PROFILE PICTURE RESPONSE DTO
export class ProfilePictureResponseDTO {
  id: string;
  profilePicture: string;
  cloudinaryId: string;
  uploadedAt: string;

  constructor(data: any) {
    this.id = data.id;
    this.profilePicture = data.profilePicture;
    this.cloudinaryId = data.cloudinaryId;
    this.uploadedAt =
      data.uploadedAt?.toISOString() || new Date().toISOString();
  }
}
