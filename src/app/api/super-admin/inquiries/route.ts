import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get('status') || 'all').toLowerCase().trim();
    const searchParam = (searchParams.get('search') || '').toLowerCase().trim();

    // Fetch all inquiries from collection
    const allInquiries = await Inquiry.find().sort({ createdAt: -1 });

    // Calculate aggregated counts
    let total = 0;
    let newCount = 0;
    let contactedCount = 0;
    let closedCount = 0;

    for (const inq of allInquiries) {
      total += 1;
      const st = String(inq.status || 'new').toLowerCase();
      if (st === 'new') newCount += 1;
      else if (st === 'contacted') contactedCount += 1;
      else if (st === 'closed') closedCount += 1;
    }

    // Filter inquiries
    const filtered = allInquiries.filter((inq: any) => {
      // Status filter
      if (statusParam && statusParam !== 'all') {
        if (String(inq.status || 'new').toLowerCase() !== statusParam) {
          return false;
        }
      }

      // Search filter across name, email, companyName
      if (searchParam) {
        const name = String(inq.name || '').toLowerCase();
        const email = String(inq.email || '').toLowerCase();
        const comp = String(inq.companyName || '').toLowerCase();
        if (!name.includes(searchParam) && !email.includes(searchParam) && !comp.includes(searchParam)) {
          return false;
        }
      }

      return true;
    });

    return NextResponse.json({
      inquiries: filtered,
      counts: {
        total,
        new: newCount,
        contacted: contactedCount,
        closed: closedCount,
      },
    });
  } catch (error: any) {
    console.error('Super Admin inquiries GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch inquiries' }, { status: 500 });
  }
}
