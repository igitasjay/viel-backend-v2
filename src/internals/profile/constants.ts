// FILE UPLOAD CONSTRAINTS
export const PROFILE_PICTURE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024,

  // Allowed MIME types for profile pictures
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "file/txt",
  ],

  // Allowed file extensions
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],

  // Image dimension constraints
  MIN_WIDTH: 100,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
};

export const KYC_DOCUMENT_CONSTRAINTS = {
  // Maximum file size in bytes (5MB for documents)
  MAX_SIZE: 5 * 1024 * 1024,

  // Allowed MIME types for KYC documents
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],

  // Allowed file extensions
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".pdf"],
};

// VALIDATION PATTERNS
export const VALIDATION_PATTERNS = {
  // Phone number validation (11 digits starting with 0)
  PHONE_NUMBER: /^0\d{10}$/,
};

// RESPONSE STATUS MESSAGES
export const RESPONSE_MESSAGES = {
  PROFILE: {
    FETCHED: "Profile retrieved successfully",
    UPDATED: "Profile updated successfully",
    PICTURE_UPLOADED: "Profile picture uploaded successfully",
    PICTURE_REMOVED: "Profile picture removed successfully",
    PICTURE_UPLOAD_FAILED: "Failed to upload profile picture",
    INVALID_FILE_TYPE: "Only image files are allowed",
    FILE_TOO_LARGE: "File size must be less than 5MB",
    NO_FILE_PROVIDED: "No image file provided",
    NO_PICTURE_TO_REMOVE: "No profile picture to remove",
  },
};
