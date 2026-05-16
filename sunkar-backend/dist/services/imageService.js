import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export async function uploadImageToCloudinary(base64Image, storyId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(base64Image, {
            folder: "sunkar-images",
            public_id: `story_cover_${storyId}_${Date.now()}`,
            overwrite: true,
        }, (error, result) => {
            if (error || !result) {
                reject(error || new Error("Cloudinary image upload failed"));
                return;
            }
            resolve(result.secure_url);
        });
    });
}
export function generateUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "sunkar-images";
    const signature = cloudinary.utils.api_sign_request({
        timestamp,
        folder,
    }, process.env.CLOUDINARY_API_SECRET);
    return {
        signature,
        timestamp,
        folder,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
    };
}
//# sourceMappingURL=imageService.js.map