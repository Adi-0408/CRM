import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import Employee from '@/models/Employee';
import Lead from '@/models/Lead';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, [
      'admin_manager',
      'team_lead',
      'sales',
      'web_developer',
      'android_developer',
      'intern',
    ]);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const currentProject = await Project.findById(params.id);
    if (!currentProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await req.json();
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
          linkedLead = await Lead.findOne({ company: currentProject.client });
        }

        if (linkedLead) {
          const leadAssigned = linkedLead.assignedTo?._id || linkedLead.assignedTo?.id || linkedLead.assignedTo;
          if (leadAssigned && userIds.includes(String(leadAssigned))) {
            isOwner = true;
            // Backfill salesRep on project
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

      const updated = await Project.findByIdAndUpdate(params.id, allowedSalesUpdates, {
        new: true,
        runValidators: true,
      });

      const populated = await Project.findById(params.id)
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

    const updated = await Project.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const populated = await Project.findById(params.id)
      .populate('teamMembers', 'name email avatar role')
      .populate('salesRep', 'name email avatar role');
    return NextResponse.json(populated || updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'team_lead']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const deleted = await Project.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
