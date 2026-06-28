import { logger } from "@/lib/winston";
import { v2 as cloudinary } from "cloudinary";
import { InternalServerErrorException } from "@shared/exceptions/exceptions";

function extractPublicIdFromUrl(cloudinaryUrl: string): string | null {
    try {
        const urlParts = cloudinaryUrl.split("/");
        const uploadIndex = urlParts.findIndex((part) => part === "upload");

        if (uploadIndex === -1) return null;

        let pathStart = uploadIndex + 1;
        if (
            urlParts[pathStart]?.startsWith("v") &&
            /^\d+$/.test(urlParts[pathStart].substring(1))
        ) {
            pathStart += 1;
        }

        const pathParts = urlParts.slice(pathStart);
        const fullPath = pathParts.join("/");

        return fullPath.replace(/\.[^/.]+$/, "");
    } catch (error) {
        logger.error("Error extracting publicId from URL:", error as object);
        return null;
    }
}

const uploadMultipleToCloudinary = async (
    files: Express.Multer.File[],
    userId: string,
    folder: string = "trade-aviator/giftcard-sales",
): Promise<string[]> => {
    const uploadPromises = files.map((file, index) => {
        return new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: folder,
                    transformation: [
                        { width: 1200, height: 1200, crop: "limit" },
                        { quality: "auto:good" },
                        { format: "jpg" },
                    ],
                    public_id: `giftcard_${userId}_${Date.now()}_${index}`,
                    overwrite: true,
                },
                (error, result) => {
                    if (error) {
                        logger.error(`Cloudinary upload error for file ${index}:`, error);
                        reject(new InternalServerErrorException("Image upload failed"));
                    } else {
                        resolve(result!.secure_url);
                    }
                },
            );

            uploadStream.end(file.buffer);
        });
    });

    try {
        const urls = await Promise.all(uploadPromises);
        return urls;
    } catch (error) {
        logger.error("Failed to upload images to Cloudinary:", error as any);
        throw new InternalServerErrorException("Failed to upload images");
    }
};

interface FileAttachment {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

/**
 * Uploads support chat attachments to Cloudinary
 * @param files - Array of files from multer
 * @param userId - ID of the user or admin uploading
 * @param folder - Cloudinary folder path (default: 'trade-aviator/support-attachments')
 * @returns Array of FileAttachment objects with URLs and metadata
 */
const uploadSupportAttachments = async (
    files: Express.Multer.File[],
    userId: string,
    folder: string = "trade-aviator/support-attachments",
): Promise<FileAttachment[]> => {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map((file, index) => {
        return new Promise<FileAttachment>((resolve, reject) => {
            let resourceType: "image" | "video" | "raw" = "raw";
            if (file.mimetype.startsWith("image/")) {
                resourceType = "image";
            } else if (file.mimetype.startsWith("video/")) {
                resourceType = "video";
            }

            const uploadOptions: any = {
                resource_type: resourceType,
                folder: folder,
                public_id: `support_${userId}_${Date.now()}_${index}`,
                overwrite: false,
            };
            if (resourceType === "image") {
                uploadOptions.transformation = [
                    { width: 1920, height: 1920, crop: "limit" },
                    { quality: "auto:good" },
                ];
            }

            if (resourceType === "video") {
                uploadOptions.transformation = [
                    { width: 1280, height: 720, crop: "limit", quality: "auto" },
                ];
            }

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        logger.error(
                            `Cloudinary upload error for file ${file.originalname}:`,
                            error,
                        );
                        reject(
                            new InternalServerErrorException(
                                `Failed to upload file: ${file.originalname}`,
                            ),
                        );
                    } else {
                        resolve({
                            url: result!.secure_url,
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            fileSize: file.size,
                        });
                    }
                },
            );

            uploadStream.end(file.buffer);
        });
    });

    try {
        const attachments = await Promise.all(uploadPromises);
        logger.info(
            `Successfully uploaded ${attachments.length} support attachments for user ${userId}`,
        );
        return attachments;
    } catch (error) {
        logger.error(
            "Failed to upload support attachments to Cloudinary:",
            error as any,
        );
        throw new InternalServerErrorException("Failed to upload attachments");
    }
};

export { extractPublicIdFromUrl };
export { uploadMultipleToCloudinary };
export { uploadSupportAttachments };
