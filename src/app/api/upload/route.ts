import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { requireTenantAuth, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    const companyId = authResult.companyId || (authResult.isSuperAdmin ? 'platform' : DEFAULT_COMPANY_ID);
    let file: string | null = null;
    let folder = 'branding';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const fileEntry = formData.get('file');
      const folderEntry = formData.get('folder');
      if (typeof folderEntry === 'string') folder = folderEntry;

      if (fileEntry instanceof File) {
        const buffer = await fileEntry.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        file = `data:${fileEntry.type || 'image/png'};base64,${base64}`;
      } else if (typeof fileEntry === 'string') {
        file = fileEntry;
      }
    } else {
      const body = await req.json();
      file = body.file;
      folder = body.folder || 'branding';
    }

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
