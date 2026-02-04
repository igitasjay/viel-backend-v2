import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '@/config/cloudinary.config';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'banners',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: `banner_${Date.now()}_${file.originalname.split('.')[0]}`,
  }),
});

export const uploadBanner = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
