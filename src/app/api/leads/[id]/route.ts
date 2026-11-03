import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Lead from '@/models/Lead';
import Project from '@/models/Project';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'sales']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();
    const updated = await Lead.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Synchronize linked Project lifecycle when Lead status changes
    if (body.status) {
      let linkedProjectId = updated.projectId;
      let matchingProject = linkedProjectId ? await Project.findById(linkedProjectId) : null;

      if (!matchingProject) {
        matchingProject = await Project.findOne({ leadId: params.id });
      }
      if (!matchingProject && updated.company) {
        matchingProject = await Project.findOne({ client: updated.company });
      }

      if (matchingProject) {
        linkedProjectId = matchingProject._id || matchingProject.id;

        // Ensure cross-references are saved
        if (!updated.projectId) {
          await Lead.findByIdAndUpdate(params.id, {
            projectId: linkedProjectId,
            projectTitle: matchingProject.title,
          });
        }
        if (!matchingProject.leadId) {
          await Project.findByIdAndUpdate(linkedProjectId, { leadId: params.id });
        }

        if (body.status !== 'won') {
          // If lead is moved back to proposal, lost, etc., automatically place Project on hold
          await Project.findByIdAndUpdate(linkedProjectId, { status: 'on_hold' });
        } else if (body.status === 'won') {
          // If lead is restored to won, restore project to active
          if (matchingProject.status === 'on_hold') {
            const nextStatus = (matchingProject.progress || 0) > 0 ? 'in_progress' : 'new';
            await Project.findByIdAndUpdate(linkedProjectId, { status: nextStatus });
          }
        }
      }
    }

    const populated = await Lead.findById(params.id).populate('assignedTo', 'name email avatar role');
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
    const authResult = await requireRoles(req, ['admin_manager', 'sales']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const deleted = await Lead.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
