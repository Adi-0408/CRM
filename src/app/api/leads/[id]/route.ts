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
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'sales', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const existing = await Lead.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id;

    const updated = await Lead.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Synchronize linked Project lifecycle within the same tenant
    if (body.status) {
      let linkedProjectId = updated.projectId;
      let matchingProject = linkedProjectId ? await Project.findById(linkedProjectId) : null;

      if (!matchingProject) {
        matchingProject = await Project.findOne({
          leadId: params.id,
          company_id: existing.company_id,
        });
      }
      if (!matchingProject && updated.company) {
        matchingProject = await Project.findOne({
          client: updated.company,
          company_id: existing.company_id,
        });
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
          await Project.findByIdAndUpdate(linkedProjectId, { status: 'on_hold' });
        } else if (body.status === 'won') {
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
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'sales', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const existing = await Lead.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const deleted = await Lead.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
