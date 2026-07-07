import QRCode from "qrcode";

export async function generateQRCode(username: string): Promise<string> {
    try {
        const qrCode = await QRCode.toDataURL(username, {
            width: 300,
            margin: 1,
        });
        return qrCode;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw new Error("Failed to generate QR code");
    }
}

export async function generateCryptoQRCode(address: string): Promise<string> {
    try {
        const qrCode = await QRCode.toDataURL(address, {
            width: 300,
            margin: 1,
        });

        return qrCode;
    } catch (error) {
        console.error("Error generating crypto QR code:", error);
        throw new Error("Failed to generate crypto QR code");
    }
}

// add to cloudinary later
