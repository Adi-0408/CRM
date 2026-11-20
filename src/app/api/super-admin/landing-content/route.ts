import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import LandingContent, { DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    const doc = await LandingContent.findById('landing_content');
    if (!doc) {
      return NextResponse.json(DEFAULT_LANDING_CONTENT);
    }

    const data = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const merged = {
      id: 'landing_content',
      hero: { ...DEFAULT_LANDING_CONTENT.hero, ...(data.hero || {}) },
      features: { ...DEFAULT_LANDING_CONTENT.features, ...(data.features || {}) },
      howItWorks: { ...DEFAULT_LANDING_CONTENT.howItWorks, ...(data.howItWorks || {}) },
      contact: { ...DEFAULT_LANDING_CONTENT.contact, ...(data.contact || {}) },
      updatedAt: data.updatedAt,
    };

    return NextResponse.json(merged);
  } catch (error: any) {
    console.error('Super Admin landing content GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch landing content' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const body = await req.json();
    await connectToDatabase();

    // Check if reset to defaults requested
    if (body.resetToDefaults) {
      const resetPayload = {
        ...DEFAULT_LANDING_CONTENT,
        _id: 'landing_content',
        id: 'landing_content',
        updatedAt: new Date().toISOString(),
      };
      await LandingContent.findByIdAndUpdate('landing_content', resetPayload, { upsert: true });
      return NextResponse.json({ ok: true, content: resetPayload });
    }

    const existing = await LandingContent.findById('landing_content');
    const existingData = existing && typeof existing.toObject === 'function' ? existing.toObject() : (existing || DEFAULT_LANDING_CONTENT);

    const updatedPayload = {
      _id: 'landing_content',
      id: 'landing_content',
      hero: {
        badgeText: String(body.hero?.badgeText || existingData.hero?.badgeText || DEFAULT_LANDING_CONTENT.hero.badgeText).trim(),
        headline: String(body.hero?.headline || existingData.hero?.headline || DEFAULT_LANDING_CONTENT.hero.headline).trim(),
        subheadline: String(body.hero?.subheadline || existingData.hero?.subheadline || DEFAULT_LANDING_CONTENT.hero.subheadline).trim(),
        primaryCtaText: String(body.hero?.primaryCtaText || existingData.hero?.primaryCtaText || DEFAULT_LANDING_CONTENT.hero.primaryCtaText).trim(),
        secondaryCtaText: String(body.hero?.secondaryCtaText || existingData.hero?.secondaryCtaText || DEFAULT_LANDING_CONTENT.hero.secondaryCtaText).trim(),
      },
      features: {
        sectionBadge: String(body.features?.sectionBadge || existingData.features?.sectionBadge || DEFAULT_LANDING_CONTENT.features.sectionBadge).trim(),
        sectionTitle: String(body.features?.sectionTitle || existingData.features?.sectionTitle || DEFAULT_LANDING_CONTENT.features.sectionTitle).trim(),
        sectionSubtitle: String(body.features?.sectionSubtitle || existingData.features?.sectionSubtitle || DEFAULT_LANDING_CONTENT.features.sectionSubtitle).trim(),
        multiTenantBannerTitle: String(body.features?.multiTenantBannerTitle || existingData.features?.multiTenantBannerTitle || DEFAULT_LANDING_CONTENT.features.multiTenantBannerTitle).trim(),
        multiTenantBannerSubtitle: String(body.features?.multiTenantBannerSubtitle || existingData.features?.multiTenantBannerSubtitle || DEFAULT_LANDING_CONTENT.features.multiTenantBannerSubtitle).trim(),
      },
      howItWorks: {
        step1Title: String(body.howItWorks?.step1Title || existingData.howItWorks?.step1Title || DEFAULT_LANDING_CONTENT.howItWorks.step1Title).trim(),
        step1Desc: String(body.howItWorks?.step1Desc || existingData.howItWorks?.step1Desc || DEFAULT_LANDING_CONTENT.howItWorks.step1Desc).trim(),
        step2Title: String(body.howItWorks?.step2Title || existingData.howItWorks?.step2Title || DEFAULT_LANDING_CONTENT.howItWorks.step2Title).trim(),
        step2Desc: String(body.howItWorks?.step2Desc || existingData.howItWorks?.step2Desc || DEFAULT_LANDING_CONTENT.howItWorks.step2Desc).trim(),
        step3Title: String(body.howItWorks?.step3Title || existingData.howItWorks?.step3Title || DEFAULT_LANDING_CONTENT.howItWorks.step3Title).trim(),
        step3Desc: String(body.howItWorks?.step3Desc || existingData.howItWorks?.step3Desc || DEFAULT_LANDING_CONTENT.howItWorks.step3Desc).trim(),
      },
      contact: {
        email: String(body.contact?.email || existingData.contact?.email || DEFAULT_LANDING_CONTENT.contact.email).trim(),
        phone: String(body.contact?.phone || existingData.contact?.phone || DEFAULT_LANDING_CONTENT.contact.phone).trim(),
        address: String(body.contact?.address || existingData.contact?.address || DEFAULT_LANDING_CONTENT.contact.address).trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    await LandingContent.findByIdAndUpdate('landing_content', updatedPayload, { upsert: true });

    return NextResponse.json({ ok: true, content: updatedPayload });
  } catch (error: any) {
    console.error('Super Admin landing content PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update landing content' }, { status: 500 });
  }
}
