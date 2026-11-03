import { v2 as cloudinary } from 'cloudinary';

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'fjnxnivd',
    api_key: process.env.CLOUDINARY_API_KEY || '247959386251382',
    api_secret: process.env.CLOUDINARY_API_SECRET || '0jQATntUSU0BI1j302CVVB4xgsM',
    secure: true,
  });
  return cloudinary;
}

// Ensure configured at module load as well
configureCloudinary();

export interface UploadOptions {
  customFilename?: string;
  employeeName?: string;
  date?: string;
  action?: 'clock_in' | 'clock_out' | 'punch_in' | 'punch_out' | string;
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
}

/**
 * Uploads a base64 or file buffer to Cloudinary in a designated folder.
 * For attendance photos, generates a human-readable Public ID and Display Name
 * featuring the employee name, date, and clock action.
 */
export async function uploadToCloudinary(
  fileData: string,
  folder: 'avatars' | 'projects' | 'tasks' | 'leads' | 'attendance' = 'avatars',
  options?: UploadOptions
): Promise<UploadResult> {
  const client = configureCloudinary();
  try {
    let publicIdOption: string | undefined = undefined;
    let displayNameOption: string | undefined = undefined;

    if (folder === 'attendance') {
      const cleanName = (options?.employeeName || 'Employee')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');
      const actionName = (options?.action || 'punch').toLowerCase().replace('punch', 'clock');
      const datePart = options?.date || new Date().toISOString().split('T')[0];
      const now = new Date();
      const timePart = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('-');

      // Human-readable Public ID: e.g. "Smita_Desai_2026-11-03_clock_in_10-25-30"
      publicIdOption = `${cleanName}_${datePart}_${actionName}_${timePart}`;
      displayNameOption = `${options?.employeeName || 'Employee'} - ${actionName.replace('_', ' ').toUpperCase()} (${datePart} ${timePart.replace(/-/g, ':')})`;
    } else if (options?.customFilename) {
      publicIdOption = options.customFilename;
    }

    const result = await client.uploader.upload(fileData, {
      folder: `crm/${folder}`,
      public_id: publicIdOption,
      display_name: displayNameOption,
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
      transformation:
        folder === 'avatars'
          ? [{ width: 400, height: 400, crop: 'thumb', gravity: 'face' }]
          : folder === 'attendance'
          ? [{ width: 640, height: 480, crop: 'limit', quality: 'auto:good' }]
          : undefined,
      tags: folder === 'attendance' ? ['attendance_selfie', 'expire_30d'] : undefined,
    });

    console.log(`[Cloudinary] Successfully uploaded ${folder} photo:`, result.secure_url, result.public_id);

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('⚠️ Cloudinary upload failed:', error);
    // For attendance selfies, never discard the actual photo; preserve the real image data URL
    if (folder === 'attendance') {
      const localId = `local_attendance_${Date.now()}`;
      return {
        publicId: localId,
        url: fileData,
        secureUrl: fileData,
        format: 'jpeg',
        bytes: fileData.length,
      };
    }

    const mockId = `fallback_${folder}_${Date.now()}`;
    const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockId}`;
    return {
      publicId: mockId,
      url: fallbackAvatar,
      secureUrl: fallbackAvatar,
      format: 'svg',
      bytes: 256,
    };
  }
}

/**
 * Deletes an asset from Cloudinary by its publicId.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (error) {
    console.error('Error deleting asset from Cloudinary:', error);
    return false;
  }
}

/**
 * Deletes multiple assets from Cloudinary in batch by their publicIds.
 */
export async function deleteMultipleFromCloudinary(publicIds: string[]): Promise<number> {
  const validIds = (publicIds || []).filter(
    (id) => id && typeof id === 'string' && !id.startsWith('fallback_')
  );
  if (validIds.length === 0) return 0;

  try {
    const res = await cloudinary.api.delete_resources(validIds);
    const deletedCount = Object.keys(res.deleted || {}).length;
    return deletedCount;
  } catch (error) {
    console.error('Error batch deleting assets from Cloudinary:', error);
    return 0;
  }
}

export default cloudinary;
