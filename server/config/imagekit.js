// config/imagekit.js
// Thin wrapper around the ImageKit SDK used for all product/banner image uploads.
// The client is created LAZILY so the API can boot even when ImageKit creds are
// absent (e.g. running the storefront read-only or seeding). Upload attempts
// without creds fail with a clear, catchable error instead of crashing startup.
import ImageKit from 'imagekit';

let _client = null;

// Build (once) and return the ImageKit client, or throw a friendly error.
const getClient = () => {
  if (_client) return _client;
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit is not configured — set IMAGEKIT_* env vars to enable image uploads.');
  }
  _client = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
  return _client;
};

// Whether ImageKit is usable (handy for health checks / conditional UI).
export const imagekitReady = () =>
  Boolean(process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT);

/**
 * Upload a single file buffer to ImageKit.
 * @returns {Promise<{url:string, fileId:string, thumbnailUrl:string}>}
 */
export const uploadToImageKit = async (buffer, fileName, folder = '/richbayy') => {
  const res = await getClient().upload({
    file: buffer,
    fileName,
    folder,
    useUniqueFileName: true,
  });
  return { url: res.url, fileId: res.fileId, thumbnailUrl: res.thumbnailUrl };
};

/**
 * Delete an asset from ImageKit by its fileId (non-fatal on error).
 */
export const deleteFromImageKit = async (fileId) => {
  if (!fileId || !imagekitReady()) return;
  try {
    await getClient().deleteFile(fileId);
  } catch (err) {
    console.warn(`⚠️  ImageKit delete failed for ${fileId}: ${err.message}`);
  }
};

/**
 * Client-side auth params for direct browser uploads (admin only).
 */
export const getImageKitAuth = () => getClient().getAuthenticationParameters();
