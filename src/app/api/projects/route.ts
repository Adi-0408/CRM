import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import Employee from '@/models/Employee';
import { getAuthUser, requireRoles, isValidDocId } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // DATA SCOPING: Admin (Manager) sees all projects; developers see projects they are assigned to
    if (authUser && authUser.role !== 'admin_manager') {
      if (isValidDocId(authUser.id)) {
        query.teamMembers = authUser.id;
      } else {
        const found = await Employee.findOne({ email: authUser.email.toLowerCase() });
        if (found) query.teamMembers = found._id;
      }
    }

    const projects = await Project.find(query)
      .sort({ deadline: 1 })
      .populate('teamMembers', 'name email avatar role');

    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only Admin (Manager) can create company projects
    const authResult = await requireRoles(req, ['admin_manager']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    if (!body.title || !body.client || !body.deadline) {
      return NextResponse.json(
        { error: 'Title, client and deadline are required' },
        { status: 400 }
      );
    }

    const newProject = await Project.create(body);
    const populated = await Project.findById(newProject._id).populate(
      'teamMembers',
      'name email avatar role'
    );
    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
