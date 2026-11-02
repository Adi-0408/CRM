import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/apiAuth';
import { cleanupExpiredAttendancePhotos } from '@/lib/attendancePhotoCleanupService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);

    // Only Admin or HR or cron secret header can trigger cleanup
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader && process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAdminOrHR = authUser?.role === 'admin_manager' || authUser?.role === 'hr';

    if (!isCron && !isAdminOrHR) {
      return NextResponse.json(
        { error: 'Forbidden: Only HR or Admin can manually trigger photo cleanup.' },
        { status: 403 }
      );
    }

    const result = await cleanupExpiredAttendancePhotos();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
