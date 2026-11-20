import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { requireTenantAuth, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    const companyId = authResult.companyId || DEFAULT_COMPANY_ID;
    const body = await req.json();
    const { file, folder } = body;

    if (!file) {
      return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }

    // Isolate tenant uploads into tenant-specific directory path
    const scopedFolder = `tenants/${companyId}/${folder || 'uploads'}`;
    const uploadResult = await uploadToCloudinary(file, scopedFolder);
    return NextResponse.json(uploadResult);
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
