import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file, folder } = body;

    if (!file) {
      return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }

    const uploadResult = await uploadToCloudinary(file, folder || 'avatars');
    return NextResponse.json(uploadResult);
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
