import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const extractPublicId = (url: string): string | null => {
  try {
    if (!url || !url.includes('cloudinary.com')) return null;
    // Extract everything after /upload/v123.../ and before the file extension
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
};

export const deleteCloudinaryImage = async (url: string | null): Promise<boolean> => {
  if (!url) return false;
  const publicId = extractPublicId(url);
  if (!publicId) return false;
  
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

export default cloudinary;
