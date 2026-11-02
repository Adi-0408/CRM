import { connectToDatabase } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { deleteMultipleFromCloudinary } from '@/lib/cloudinary';

let lastPhotoCleanupTimestamp = 0;

/**
 * Scans attendance records older than 30 days (1 month) and permanently removes
 * their clock-in and clock-out selfie photos from Cloudinary storage and database records.
 *
 * Rules:
 * - Images are kept for 30 days (1 month).
 * - After 30 days, Cloudinary assets are deleted via Cloudinary API.
 * - The session records are updated so `isPhotoExpired = true` and photo URLs are cleared.
 */
export async function cleanupExpiredAttendancePhotos(
  now: Date = new Date()
): Promise<{
  success: boolean;
  recordsCleaned: number;
  photosDeleted: number;
  timestamp: string;
}> {
  try {
    await connectToDatabase();

    // 30 days ago in milliseconds (approx. 1 month)
    const thirtyDaysAgoMs = 30 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now.getTime() - thirtyDaysAgoMs);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Find attendance records older than 30 days
    const records = await Attendance.find({
      date: { $lte: cutoffDateStr },
    });

    const publicIdsToDelete: string[] = [];
    let recordsCleaned = 0;

    for (const record of records) {
      let recordModified = false;
      const sessions = record.sessions || [];

      for (const session of sessions) {
        // Expire Clock-In Photo
        if (session.checkInPhotoPublicId) {
          publicIdsToDelete.push(session.checkInPhotoPublicId);
          session.checkInPhoto = undefined;
          session.checkInPhotoPublicId = undefined;
          session.isPhotoExpired = true;
          recordModified = true;
        } else if (
          session.checkInPhoto &&
          (session.checkInPhoto.startsWith('http') || session.checkInPhoto.startsWith('data:image/'))
        ) {
          session.checkInPhoto = undefined;
          session.isPhotoExpired = true;
          recordModified = true;
        }

        // Expire Clock-Out Photo
        if (session.checkOutPhotoPublicId) {
          publicIdsToDelete.push(session.checkOutPhotoPublicId);
          session.checkOutPhoto = undefined;
          session.checkOutPhotoPublicId = undefined;
          session.isPhotoExpired = true;
          recordModified = true;
        } else if (
          session.checkOutPhoto &&
          (session.checkOutPhoto.startsWith('http') || session.checkOutPhoto.startsWith('data:image/'))
        ) {
          session.checkOutPhoto = undefined;
          session.isPhotoExpired = true;
          recordModified = true;
        }
      }

      if (recordModified) {
        record.sessions = sessions;
        await record.save();
        recordsCleaned++;
      }
    }

    let photosDeleted = 0;
    if (publicIdsToDelete.length > 0) {
      photosDeleted = await deleteMultipleFromCloudinary(publicIdsToDelete);
    }

    lastPhotoCleanupTimestamp = Date.now();
    return {
      success: true,
      recordsCleaned,
      photosDeleted,
      timestamp: now.toISOString(),
    };
  } catch (error: any) {
    console.error('Error during expired attendance photos cleanup:', error);
    return {
      success: false,
      recordsCleaned: 0,
      photosDeleted: 0,
      timestamp: now.toISOString(),
    };
  }
}

/**
 * Throttle helper to ensure photo cleanup runs at most once every 12 hours
 */
export async function triggerPhotoCleanupIfDue(): Promise<void> {
  const now = Date.now();
  if (now - lastPhotoCleanupTimestamp > 12 * 60 * 60 * 1000) {
    await cleanupExpiredAttendancePhotos();
  }
}
