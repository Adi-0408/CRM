import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import LandingContent, { DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();
    const doc = await LandingContent.findById('landing_content');

    if (!doc) {
      return NextResponse.json(DEFAULT_LANDING_CONTENT, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    const data = typeof doc.toObject === 'function' ? doc.toObject() : doc;

    // Merge with defaults to ensure all required fields are present
    const merged = {
      id: 'landing_content',
      hero: {
        ...DEFAULT_LANDING_CONTENT.hero,
        ...(data.hero || {}),
      },
      features: {
        ...DEFAULT_LANDING_CONTENT.features,
        ...(data.features || {}),
      },
      howItWorks: {
        ...DEFAULT_LANDING_CONTENT.howItWorks,
        ...(data.howItWorks || {}),
      },
      contact: {
        ...DEFAULT_LANDING_CONTENT.contact,
        ...(data.contact || {}),
      },
      updatedAt: data.updatedAt,
    };

    return NextResponse.json(merged, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching landing content:', error);
    // Graceful fallback to default landing content on any error
    return NextResponse.json(DEFAULT_LANDING_CONTENT, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}
