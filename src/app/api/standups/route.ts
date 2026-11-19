import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Standup from '@/models/Standup';
import Notification from '@/models/Notification';
import { getAuthUser } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    const query: any = {};
    if (date && date !== 'all') {
      query.date = date;
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const standups = await Standup.find(query).sort({ createdAt: -1 });
    return NextResponse.json(standups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const employeeId = body.employeeId || authUser?.id || (authUser as any)?._id || 'unknown';
    const employeeName = body.employeeName || authUser?.name || 'Staff Member';
    const employeeEmail = body.employeeEmail || authUser?.email || '';
    const employeeRole = body.employeeRole || authUser?.role || 'Developer';
    const employeeAvatar = body.employeeAvatar || (authUser as any)?.avatar;

    const todayStr =
      body.date ||
      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (!body.completedToday && !body.plannedTomorrow) {
      return NextResponse.json(
        { error: 'Please share what you completed or have planned.' },
        { status: 400 }
      );
    }

    // Upsert or create standup for today
    const existing = await Standup.findOne({ employeeId, date: todayStr });
    let result;
    if (existing) {
      result = await Standup.findByIdAndUpdate(
        existing._id || existing.id,
        {
          completedToday: body.completedToday,
          plannedTomorrow: body.plannedTomorrow,
          blockers: body.blockers || '',
          hasBlockers: Boolean(body.hasBlockers),
          employeeName,
          employeeRole,
          employeeAvatar,
          updatedAt: new Date(),
        },
        { new: true }
      );
    } else {
      result = await Standup.create({
        employeeId,
        employeeName,
        employeeEmail,
        employeeRole,
        employeeAvatar,
        date: todayStr,
        completedToday: body.completedToday,
        plannedTomorrow: body.plannedTomorrow,
        blockers: body.blockers || '',
        hasBlockers: Boolean(body.hasBlockers),
        createdAt: new Date(),
      });
    }

    // Trigger in-app notification for Team Leads & Managers
    try {
      await Notification.create({
        userId: 'all',
        title: body.hasBlockers
          ? `⚠️ Standup Blocker: ${employeeName}`
          : `EOD Standup: ${employeeName}`,
        message: body.hasBlockers
          ? `${employeeName} reported a delivery blocker: "${body.blockers?.slice(0, 80)}..."`
          : `${employeeName} submitted their daily digest for ${todayStr}.`,
        type: 'standup_digest',
        linkTab: 'attendance',
        isRead: false,
        createdAt: new Date(),
      });
    } catch (notifErr) {
      console.error('Failed to create standup notification:', notifErr);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
