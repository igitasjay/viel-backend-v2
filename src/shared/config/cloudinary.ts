import { v2 as cloudinary } from "cloudinary";
import { config } from "@/shared/config/config";

cloudinary.config({
    cloud_name: config.cloudinary.name,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.secretKey,
    secure: true,
});

export { cloudinary };
