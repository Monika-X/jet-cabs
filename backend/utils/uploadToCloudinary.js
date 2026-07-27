const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer from multer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} - Resolves with Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'car-rental') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary
 * @param {String} publicId - The public ID of the image
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Error deleting image ${publicId} from Cloudinary:`, error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
