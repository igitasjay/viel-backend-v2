import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '@/config/cloudinary.config';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'crypto-icons',
    allowedFormats: ['jpg', 'jpeg', 'png'],
    public_id: `${Date.now()}_${file.originalname}`,
  }),
});

export const upload = multer({ storage: storage });
