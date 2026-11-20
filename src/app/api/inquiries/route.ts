import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

// In-memory rate limiting: max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

// Clean up stale rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of Array.from(rateLimitMap.entries())) {
    if (now > record.expiresAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function stripHtml(str: string): string {
  return String(str || '').replace(/<[^>]*>?/gm, '').trim();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Spam protection: Honeypot field 'website'
    // If bots populate this hidden input, drop silently with 200 { ok: true }
    if (body.website && String(body.website).trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 2. In-memory IP rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'anonymous';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions from this connection. Please wait 10 minutes before trying again.' },
        { status: 429 }
      );
    }

    // 3. Validation & Sanitization
    const name = stripHtml(body.name || '');
    const email = stripHtml(body.email || '').toLowerCase();
    const message = stripHtml(body.message || '');
    const companyName = stripHtml(body.companyName || '');
    const interest = stripHtml(body.interest || '');
    const rawPhone = body.phone ? String(body.phone).trim() : '';

    if (!name || name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: 'Name is required and must be between 2 and 80 characters.' },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email) || email.length > 120) {
      return NextResponse.json(
        { error: 'A valid email address (max 120 characters) is required.' },
        { status: 400 }
      );
    }

    if (!message || message.length < 10 || message.length > 1000) {
      return NextResponse.json(
        { error: 'Message is required and must be between 10 and 1000 characters.' },
        { status: 400 }
      );
    }

    if (companyName && companyName.length > 120) {
      return NextResponse.json(
        { error: 'Company name cannot exceed 120 characters.' },
        { status: 400 }
      );
    }

    let cleanPhone: string | undefined = undefined;
    if (rawPhone) {
      const digitsOnly = rawPhone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        return NextResponse.json(
          { error: 'Mobile number must be exactly 10 digits.' },
          { status: 400 }
        );
      }
      cleanPhone = digitsOnly;
    }

    const teamSize = ['1-10', '11-50', '51-200', '200+'].includes(body.teamSize)
      ? body.teamSize
      : undefined;

    // 4. Persistence
    await connectToDatabase();

    await Inquiry.create({
      name,
      email,
      phone: cleanPhone,
      companyName: companyName || undefined,
      teamSize,
      interest: interest || undefined,
      message,
      status: 'new',
      source: 'landing_page',
    });

    // 5. Create notification for Platform Super Admin
    try {
      await Notification.create({
        type: 'general',
        title: 'New website inquiry',
        message: `${name} from ${companyName || 'an individual'} sent an inquiry`,
        userId: 'all',
        isRead: false,
      });
    } catch (notifErr) {
      // Wrap in try/catch so notification failure never fails the inquiry request
      console.warn('Inquiry notification creation error:', notifErr);
    }

    // 6. Return 201 without leaking the saved document
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    console.error('Inquiry submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing inquiry.' },
      { status: 500 }
    );
  }
}
