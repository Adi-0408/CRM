import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Employee from '@/models/Employee';
import Lead from '@/models/Lead';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, [
      'admin_manager',
      'company_admin',
      'platform_super_admin',
      'team_lead',
      'sales',
      'web_developer',
      'android_developer',
      'intern',
    ]);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const currentProject = await Project.findById(resolvedParams.id);
    if (!currentProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && currentProject.company_id && currentProject.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id;

    if (body.status === 'planning') {
      body.status = 'new';
    }

    // Role-specific authorization checks
    if (authUser.role === 'sales') {
      // Sales representatives can ONLY edit projects for clients they personally won
      const currentUserId = String(authUser.id || '');
      const currentUserEmail = authUser.email?.toLowerCase().trim();
      const userIds = [currentUserId, currentUserId.replace('demo_', ''), currentUserId.replace('user_', '')];

      let isOwner = false;

      // 1. Check direct project.salesRep
      const repId = currentProject.salesRep?._id || currentProject.salesRep?.id || currentProject.salesRep;
      if (repId && userIds.includes(String(repId))) isOwner = true;
      if (currentProject.salesRep?.email && currentProject.salesRep.email.toLowerCase().trim() === currentUserEmail) {
        isOwner = true;
      }

      // 2. Check linked lead ownership if not directly matched
      if (!isOwner) {
        let linkedLead = currentProject.leadId ? await Lead.findById(currentProject.leadId) : null;
        if (!linkedLead && currentProject.client) {
          linkedLead = await Lead.findOne({ company: currentProject.client, company_id: currentProject.company_id });
        }

        if (linkedLead) {
          const leadAssigned = linkedLead.assignedTo?._id || linkedLead.assignedTo?.id || linkedLead.assignedTo;
          if (leadAssigned && userIds.includes(String(leadAssigned))) {
            isOwner = true;
            body.salesRep = leadAssigned;
          } else if (linkedLead.assignedTo?.email && linkedLead.assignedTo.email.toLowerCase().trim() === currentUserEmail) {
            isOwner = true;
            body.salesRep = currentUserId;
          }
        }
      }

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Permission denied: You can only edit project details for clients/leads won by you.' },
          { status: 403 }
        );
      }

      // Sales can only update what the client wants (clientRequirements, description, title)
      const allowedSalesUpdates: any = {};
      if (body.clientRequirements !== undefined) allowedSalesUpdates.clientRequirements = body.clientRequirements;
      if (body.description !== undefined) allowedSalesUpdates.description = body.description;
      if (body.title !== undefined) allowedSalesUpdates.title = body.title;
      if (body.salesRep !== undefined) allowedSalesUpdates.salesRep = body.salesRep;

      const updated = await Project.findByIdAndUpdate(resolvedParams.id, allowedSalesUpdates, {
        new: true,
        runValidators: true,
      });

      const populated = await Project.findById(resolvedParams.id)
        .populate('teamMembers', 'name email avatar role')
        .populate('salesRep', 'name email avatar role');
      return NextResponse.json(populated || updated);
    }

    // Verify team members if being updated (by Team Lead or Admin)
    if (Array.isArray(body.teamMembers) && body.teamMembers.length > 0) {
      const allowedRoles = ['web_developer', 'android_developer', 'intern', 'team_lead'];
      const members = await Promise.all(
        body.teamMembers.map((id: string) => Employee.findById(id))
      );
      const invalid = members.find(
        (m) =>
          m &&
          !allowedRoles.includes(String(m.role || '').toLowerCase().trim()) &&
          !String(m.role || '').toLowerCase().includes('developer') &&
          !String(m.role || '').toLowerCase().includes('intern') &&
          !String(m.role || '').toLowerCase().includes('lead')
      );
      if (invalid) {
        return NextResponse.json(
          { error: `Projects can only be assigned to Developers, Interns, and Team Leads. (${invalid.name} has role: ${invalid.role})` },
          { status: 400 }
        );
      }
    }

    const updated = await Project.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Cascade on_hold status to associated tasks in the same company
    if (body.status === 'on_hold') {
      try {
        const linkedTasks = await Task.find({ project: resolvedParams.id, company_id: currentProject.company_id });
        for (const t of linkedTasks) {
          if (t.status !== 'completed' && t.status !== 'on_hold') {
            await Task.findByIdAndUpdate(t._id || t.id, { status: 'on_hold' });
          }
        }
      } catch (taskErr) {
        console.error('Error cascading project on_hold status to tasks:', taskErr);
      }
    } else if (currentProject.status === 'on_hold' && body.status && body.status !== 'on_hold') {
      try {
        const linkedTasks = await Task.find({ project: resolvedParams.id, company_id: currentProject.company_id, status: 'on_hold' });
        const targetStatus = body.status === 'in_progress' ? 'in_progress' : 'new';
        for (const t of linkedTasks) {
          await Task.findByIdAndUpdate(t._id || t.id, { status: targetStatus });
        }
      } catch (taskErr) {
        console.error('Error restoring tasks from on_hold status:', taskErr);
      }
    }

    const populated = await Project.findById(resolvedParams.id)
      .populate('teamMembers', 'name email avatar role')
      .populate('salesRep', 'name email avatar role');
    return NextResponse.json(populated || updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'team_lead', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const existing = await Project.findById(resolvedParams.id);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const deleted = await Project.findByIdAndDelete(resolvedParams.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
