import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

/**
 * Upload a buffer to Cloudinary using stream
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<{public_id: string, url: string}>}
 */
export const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `propertyhub/${folder}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new Error('Failed to upload image to Cloudinary'));
        }
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an asset from Cloudinary
 * @param {string} public_id - Cloudinary public ID
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error(`Failed to delete image ${public_id} from Cloudinary:`, error.message);
  }
};
