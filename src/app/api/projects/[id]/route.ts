import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import Employee from '@/models/Employee';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'web_developer', 'android_developer', 'intern']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    // Verify team members if being updated
    if (Array.isArray(body.teamMembers) && body.teamMembers.length > 0) {
      const allowedRoles = ['web_developer', 'android_developer', 'intern'];
      const members = await Promise.all(
        body.teamMembers.map((id: string) => Employee.findById(id))
      );
      const invalid = members.find(
        (m) =>
          m &&
          !allowedRoles.includes(String(m.role || '').toLowerCase().trim()) &&
          !String(m.role || '').toLowerCase().includes('developer') &&
          !String(m.role || '').toLowerCase().includes('intern')
      );
      if (invalid) {
        return NextResponse.json(
          { error: `Projects can only be assigned to Developers and Interns. (${invalid.name} has role: ${invalid.role})` },
          { status: 400 }
        );
      }
    }
    const updated = await Project.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate('teamMembers', 'name email avatar role');

    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager']);
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
