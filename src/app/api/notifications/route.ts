import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Notification from '@/models/Notification';
import Task from '@/models/Task';
import Project from '@/models/Project';
import Lead from '@/models/Lead';
import Ticket from '@/models/Ticket';
import { requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;
    const tenantCompanyId = authUser.company_id || DEFAULT_COMPANY_ID;

    await connectToDatabase();
    const userId = authUser.id;
    const userEmail = authUser.email?.toLowerCase();

    // Fetch existing stored notifications within this tenant
    let query: any = {};
    if (userId || userEmail) {
      query = {
        $or: [
          { userId: 'all' },
          ...(userId ? [{ userId: String(userId) }] : []),
          ...(userEmail ? [{ userId: userEmail }] : []),
        ],
      };
    }

    const scopedQuery = buildTenantFilter(authUser, query);
    let notifications = await Notification.find(scopedQuery).sort({ createdAt: -1 }).limit(30);

    // If notifications store is empty for this tenant, generate initial contextual notifications
    if (!notifications || notifications.length === 0) {
      const initialNotifs: any[] = [];
      const tenantFilter = authResult.isSuperAdmin ? {} : { company_id: tenantCompanyId };

      // 1. Check for on-hold projects in tenant
      const onHoldProjects = await Project.find({ ...tenantFilter, status: 'on_hold' }).limit(2);
      for (const p of onHoldProjects) {
        initialNotifs.push({
          company_id: tenantCompanyId,
          userId: 'all',
          title: `Project On Hold: ${p.title}`,
          message: `Work on "${p.title}" (${p.client}) has been placed on hold. Associated tasks are paused.`,
          type: 'project_status',
          linkTab: 'projects',
          isRead: false,
          createdAt: p.updatedAt || new Date(Date.now() - 3600000 * 2),
        });
      }

      // 2. Check for assigned tasks in tenant
      if (userId || userEmail) {
        const myTasks = await Task.find({
          ...tenantFilter,
          $or: [
            ...(userId ? [{ assignedTo: userId }] : []),
            ...(userEmail ? [{ assignedTo: userEmail }] : []),
          ],
        }).sort({ createdAt: -1 }).limit(3);

        for (const t of myTasks) {
          initialNotifs.push({
            company_id: tenantCompanyId,
            userId: String(userId || userEmail),
            title: `Assigned Task: ${t.title}`,
            message: `Priority: ${t.priority?.toUpperCase() || 'MEDIUM'}. Due by ${
              t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'scheduled date'
            }.`,
            type: 'task_assigned',
            linkTab: 'tasks',
            isRead: false,
            createdAt: t.createdAt || new Date(Date.now() - 3600000 * 4),
          });
        }
      }

      // 3. Check for recently won leads in tenant
      const wonLeads = await Lead.find({ ...tenantFilter, status: 'won' }).sort({ updatedAt: -1 }).limit(2);
      for (const l of wonLeads) {
        initialNotifs.push({
          company_id: tenantCompanyId,
          userId: 'all',
          title: `Deal Won: ${l.company}`,
          message: `${l.name} closed a deal worth ₹${(l.value || 0).toLocaleString()}!`,
          type: 'lead_won',
          linkTab: 'leads',
          isRead: false,
          createdAt: l.updatedAt || new Date(Date.now() - 3600000 * 8),
        });
      }

      // 4. Check for active tickets in tenant
      const recentTickets = await Ticket.find(tenantFilter).sort({ createdAt: -1 }).limit(1);
      for (const tk of recentTickets) {
        initialNotifs.push({
          company_id: tenantCompanyId,
          userId: 'all',
          title: `Internal Support: ${tk.title}`,
          message: `Ticket flagged as ${tk.priority?.toUpperCase()} priority under ${tk.category}.`,
          type: 'ticket_updated',
          linkTab: 'support',
          isRead: true,
          createdAt: tk.createdAt || new Date(Date.now() - 3600000 * 12),
        });
      }

      for (const item of initialNotifs) {
        const created = await Notification.create(item);
        if (created) notifications.push(created);
      }
    }

    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const body = await req.json();

    if (!body.title || !body.message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const companyId = authUser.company_id || DEFAULT_COMPANY_ID;

    const notif = await Notification.create({
      company_id: companyId,
      userId: body.userId || 'all',
      title: body.title,
      message: body.message,
      type: body.type || 'general',
      linkTab: body.linkTab,
      isRead: false,
      metadata: body.metadata || {},
      createdAt: new Date(),
    });

    return NextResponse.json(notif, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;
    const tenantCompanyId = authUser.company_id || DEFAULT_COMPANY_ID;

    await connectToDatabase();
    const body = await req.json();

    if (body.markAllRead) {
      const filter = authResult.isSuperAdmin ? {} : { company_id: tenantCompanyId };
      const userNotifs = await Notification.find(filter);
      for (const n of userNotifs) {
        await Notification.findByIdAndUpdate(n._id || n.id, { isRead: true });
      }
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (body.id) {
      const existing = await Notification.findById(body.id);
      if (existing && (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== tenantCompanyId)) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      const updated = await Notification.findByIdAndUpdate(
        body.id,
        { isRead: true },
        { new: true }
      );
      return NextResponse.json(updated);
    }

    return NextResponse.json({ message: 'No action taken' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;
    const tenantCompanyId = authUser.company_id || DEFAULT_COMPANY_ID;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const existing = await Notification.findById(id);
      if (existing && (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== tenantCompanyId)) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      await Notification.findByIdAndDelete(id);
      return NextResponse.json({ message: 'Notification deleted' });
    }

    // Delete all within tenant
    const deleteFilter = authResult.isSuperAdmin ? {} : { company_id: tenantCompanyId };
    await Notification.deleteMany(deleteFilter);
    return NextResponse.json({ message: 'All notifications cleared for organization' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
