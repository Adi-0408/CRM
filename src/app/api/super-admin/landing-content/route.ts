import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import LandingContent, { DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    const doc = await LandingContent.findById('landing_content');
    if (!doc) {
      return NextResponse.json(DEFAULT_LANDING_CONTENT, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
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

    return NextResponse.json(merged, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
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
      const existing = await LandingContent.findById('landing_content');
      if (!existing) {
        await LandingContent.create(resetPayload);
      } else {
        await LandingContent.findByIdAndUpdate('landing_content', resetPayload, { upsert: true });
      }
      return NextResponse.json({ ok: true, content: resetPayload });
    }

    const existing = await LandingContent.findById('landing_content');
    const existingData = existing && typeof existing.toObject === 'function' ? existing.toObject() : (existing || DEFAULT_LANDING_CONTENT);

    const updatedPayload = {
      _id: 'landing_content',
      id: 'landing_content',
      hero: {
        badgeText: body.hero?.badgeText !== undefined ? String(body.hero.badgeText).trim() : (existingData.hero?.badgeText || DEFAULT_LANDING_CONTENT.hero.badgeText),
        headline: body.hero?.headline !== undefined ? String(body.hero.headline).trim() : (existingData.hero?.headline || DEFAULT_LANDING_CONTENT.hero.headline),
        subheadline: body.hero?.subheadline !== undefined ? String(body.hero.subheadline).trim() : (existingData.hero?.subheadline || DEFAULT_LANDING_CONTENT.hero.subheadline),
        primaryCtaText: body.hero?.primaryCtaText !== undefined ? String(body.hero.primaryCtaText).trim() : (existingData.hero?.primaryCtaText || DEFAULT_LANDING_CONTENT.hero.primaryCtaText),
        secondaryCtaText: body.hero?.secondaryCtaText !== undefined ? String(body.hero.secondaryCtaText).trim() : (existingData.hero?.secondaryCtaText || DEFAULT_LANDING_CONTENT.hero.secondaryCtaText),
      },
      features: {
        sectionBadge: body.features?.sectionBadge !== undefined ? String(body.features.sectionBadge).trim() : (existingData.features?.sectionBadge || DEFAULT_LANDING_CONTENT.features.sectionBadge),
        sectionTitle: body.features?.sectionTitle !== undefined ? String(body.features.sectionTitle).trim() : (existingData.features?.sectionTitle || DEFAULT_LANDING_CONTENT.features.sectionTitle),
        sectionSubtitle: body.features?.sectionSubtitle !== undefined ? String(body.features.sectionSubtitle).trim() : (existingData.features?.sectionSubtitle || DEFAULT_LANDING_CONTENT.features.sectionSubtitle),
        multiTenantBannerTitle: body.features?.multiTenantBannerTitle !== undefined ? String(body.features.multiTenantBannerTitle).trim() : (existingData.features?.multiTenantBannerTitle || DEFAULT_LANDING_CONTENT.features.multiTenantBannerTitle),
        multiTenantBannerSubtitle: body.features?.multiTenantBannerSubtitle !== undefined ? String(body.features.multiTenantBannerSubtitle).trim() : (existingData.features?.multiTenantBannerSubtitle || DEFAULT_LANDING_CONTENT.features.multiTenantBannerSubtitle),
      },
      howItWorks: {
        step1Title: body.howItWorks?.step1Title !== undefined ? String(body.howItWorks.step1Title).trim() : (existingData.howItWorks?.step1Title || DEFAULT_LANDING_CONTENT.howItWorks.step1Title),
        step1Desc: body.howItWorks?.step1Desc !== undefined ? String(body.howItWorks.step1Desc).trim() : (existingData.howItWorks?.step1Desc || DEFAULT_LANDING_CONTENT.howItWorks.step1Desc),
        step2Title: body.howItWorks?.step2Title !== undefined ? String(body.howItWorks.step2Title).trim() : (existingData.howItWorks?.step2Title || DEFAULT_LANDING_CONTENT.howItWorks.step2Title),
        step2Desc: body.howItWorks?.step2Desc !== undefined ? String(body.howItWorks.step2Desc).trim() : (existingData.howItWorks?.step2Desc || DEFAULT_LANDING_CONTENT.howItWorks.step2Desc),
        step3Title: body.howItWorks?.step3Title !== undefined ? String(body.howItWorks.step3Title).trim() : (existingData.howItWorks?.step3Title || DEFAULT_LANDING_CONTENT.howItWorks.step3Title),
        step3Desc: body.howItWorks?.step3Desc !== undefined ? String(body.howItWorks.step3Desc).trim() : (existingData.howItWorks?.step3Desc || DEFAULT_LANDING_CONTENT.howItWorks.step3Desc),
      },
      contact: {
        email: body.contact?.email !== undefined ? String(body.contact.email).trim() : (existingData.contact?.email || DEFAULT_LANDING_CONTENT.contact.email),
        phone: body.contact?.phone !== undefined ? String(body.contact.phone).trim() : (existingData.contact?.phone || DEFAULT_LANDING_CONTENT.contact.phone),
        address: body.contact?.address !== undefined ? String(body.contact.address).trim() : (existingData.contact?.address || DEFAULT_LANDING_CONTENT.contact.address),
      },
      updatedAt: new Date().toISOString(),
    };

    if (!existing) {
      await LandingContent.create({
        ...updatedPayload,
        _id: 'landing_content',
        id: 'landing_content',
      });
    } else {
      await LandingContent.findByIdAndUpdate('landing_content', updatedPayload, { upsert: true });
    }

    return NextResponse.json({ ok: true, content: updatedPayload });
  } catch (error: any) {
    console.error('Super Admin landing content PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update landing content' }, { status: 500 });
  }
}
