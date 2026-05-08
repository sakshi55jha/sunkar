import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if not already configured elsewhere
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageToCloudinary(base64Image: string, storyId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Image,
      {
        folder: "sunkar-images",
        public_id: `story_cover_${storyId}_${Date.now()}`,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary image upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
  });
}
