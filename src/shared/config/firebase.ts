import * as admin from "firebase-admin";
import { config } from "@shared/config/config";
import { logger } from "@/lib/winston";
import * as path from "path";
import * as fs from "fs";

let firebaseApp: admin.App | null = null;

export const initializeFirebase = (): admin.App => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        let serviceAccount;

        if (config.fireBase.serviceAccount) {
            try {
                serviceAccount = JSON.parse(config.fireBase.serviceAccount);
                logger.info("Loaded Firebase credentials from environment variable");
            } catch (error) {
                logger.warn(
                    "Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable, falling back to file check.",
                );
            }
        }

        if (!serviceAccount) {
            const serviceAccountPath = path.resolve(
                "./src/shared/config/trade-aviator-firebase-adminsdk.json",
            );

            if (fs.existsSync(serviceAccountPath)) {
                serviceAccount = JSON.parse(
                    fs.readFileSync(serviceAccountPath, "utf8"),
                );
                logger.info(
                    `Loaded Firebase credentials from file: ${serviceAccountPath}`,
                );
            } else {
                throw new Error(
                    `Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT or ensure file exists at ${serviceAccountPath}`,
                );
            }
        }

        firebaseApp = admin.initializeApp({
            credential: admin.cert(serviceAccount),
            projectId: config.fireBase.projectID,
        });

        logger.info("Firebase initialized successfully for project");
        return firebaseApp;
    } catch (error) {
        logger.error("Failed to initialize Firebase:", error as object);
        throw error;
    }
};

export const getFirebaseApp = (): admin.App => {
    if (!firebaseApp) {
        return initializeFirebase();
    }
    return firebaseApp;
};

export { admin };
