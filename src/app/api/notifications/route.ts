import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Notification from '@/models/Notification';
import Task from '@/models/Task';
import Project from '@/models/Project';
import Leave from '@/models/Leave';
import Ticket from '@/models/Ticket';
import Lead from '@/models/Lead';
import { getAuthUser } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser(req);
    const userId = authUser?.id || (authUser as any)?._id;
    const userEmail = authUser?.email?.toLowerCase();

    // Fetch existing stored notifications
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

    let notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(30);

    // If notifications store is empty, generate initial contextual notifications from real system state
    if (!notifications || notifications.length === 0) {
      const initialNotifs: any[] = [];

      // 1. Check for on-hold projects
      const onHoldProjects = await Project.find({ status: 'on_hold' }).limit(2);
      for (const p of onHoldProjects) {
        initialNotifs.push({
          userId: 'all',
          title: `Project On Hold: ${p.title}`,
          message: `Work on "${p.title}" (${p.client}) has been placed on hold. Associated tasks are paused.`,
          type: 'project_status',
          linkTab: 'projects',
          isRead: false,
          createdAt: p.updatedAt || new Date(Date.now() - 3600000 * 2),
        });
      }

      // 2. Check for assigned tasks
      if (userId || userEmail) {
        const myTasks = await Task.find({
          $or: [
            ...(userId ? [{ assignedTo: userId }] : []),
            ...(userEmail ? [{ assignedTo: userEmail }] : []),
          ],
        }).sort({ createdAt: -1 }).limit(3);

        for (const t of myTasks) {
          initialNotifs.push({
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

      // 3. Check for recently won leads
      const wonLeads = await Lead.find({ status: 'won' }).sort({ updatedAt: -1 }).limit(2);
      for (const l of wonLeads) {
        initialNotifs.push({
          userId: 'all',
          title: `Deal Won: ${l.company}`,
          message: `${l.name} closed a deal worth ₹${(l.value || 0).toLocaleString()}!`,
          type: 'lead_won',
          linkTab: 'leads',
          isRead: false,
          createdAt: l.updatedAt || new Date(Date.now() - 3600000 * 8),
        });
      }

      // 4. Check for active tickets
      const recentTickets = await Ticket.find().sort({ createdAt: -1 }).limit(1);
      for (const tk of recentTickets) {
        initialNotifs.push({
          userId: 'all',
          title: `Internal Support: ${tk.title}`,
          message: `Ticket flagged as ${tk.priority?.toUpperCase()} priority under ${tk.category}.`,
          type: 'ticket_updated',
          linkTab: 'support',
          isRead: true,
          createdAt: tk.createdAt || new Date(Date.now() - 3600000 * 12),
        });
      }

      // Save initial generated notifications so they persist
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
    await connectToDatabase();
    const body = await req.json();

    if (!body.title || !body.message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const notif = await Notification.create({
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
    await connectToDatabase();
    const body = await req.json();
    const authUser = await getAuthUser(req);
    const userId = authUser?.id || (authUser as any)?._id;

    if (body.markAllRead) {
      // Mark all read for this user or all
      const userNotifs = await Notification.find();
      for (const n of userNotifs) {
        await Notification.findByIdAndUpdate(n._id || n.id, { isRead: true });
      }
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (body.id) {
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
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await Notification.findByIdAndDelete(id);
      return NextResponse.json({ message: 'Notification deleted' });
    }

    // Delete all
    const all = await Notification.find();
    for (const n of all) {
      await Notification.findByIdAndDelete(n._id || n.id);
    }
    return NextResponse.json({ message: 'All notifications cleared' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
