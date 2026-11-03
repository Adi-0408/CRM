'use client';

import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Plus,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Trash2,
  AlertTriangle,
  Sparkles,
  FileEdit,
  CheckSquare,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import CustomSelect from '@/components/common/CustomSelect';
import { canDistributeProject, canSalesEditProject } from '@/lib/permissions';
import DistributeProjectModal from '@/components/modals/DistributeProjectModal';
import EditClientRequirementsModal from '@/components/modals/EditClientRequirementsModal';

interface ProjectsViewProps {
  projects: any[];
  employees?: any[];
  tasks?: any[];
  leads?: any[];
  onOpenCreateProject: () => void;
  onOpenCreateTask?: (projectId: string) => void;
  onRefresh: () => void;
}

export default function ProjectsView({
  projects,
  employees = [],
  tasks = [],
  leads = [],
  onOpenCreateProject,
  onOpenCreateTask,
  onRefresh,
}: ProjectsViewProps) {
  const { user, role } = useAuth();
  const isAdminOrManager = role === 'admin_manager';
  const canManageProjects = role === 'admin_manager' || role === 'team_lead';
  const canDistribute = canDistributeProject(user);

  const [filter, setFilter] = useState('all');
  const [distributeModalProject, setDistributeModalProject] = useState<any>(null);
  const [requirementsModalProject, setRequirementsModalProject] = useState<any>(null);

  const updateStatus = async (id: string, status: string) => {
    if (!canManageProjects) return;
    try {
      await authFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating project status:', err);
    }
  };

  const deleteProject = async (id: string) => {
    if (!canManageProjects) return;
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // Scoping projects: Admin, Team Lead, and Sales view all company projects; developers view assigned projects
  const scopedProjects = useMemo(() => {
    if (canManageProjects || role === 'sales') return projects;
    const currentUserId = user?.id || (user as any)?._id;
    const currentUserEmail = user?.email?.toLowerCase();

    return projects.filter((p) => {
      if (!Array.isArray(p.teamMembers)) return false;
      return p.teamMembers.some((member: any) => {
        if (!member) return false;
        if (typeof member === 'string') {
          return (
            member === currentUserId ||
            (currentUserEmail && member.toLowerCase() === currentUserEmail)
          );
        }
        const memberId = member._id || member.id;
        const memberEmail = member.email?.toLowerCase();
        return (
          (memberId && String(memberId) === String(currentUserId)) ||
          (memberEmail && memberEmail === currentUserEmail)
        );
      });
    });
  }, [projects, canManageProjects, role, user]);

  const filteredProjects = scopedProjects.filter((p) => {
    const normalized = (p.status === 'planning' ? 'new' : p.status) || 'new';
    if (filter === 'all') {
      return normalized !== 'on_hold';
    }
    return normalized === filter;
  });

  // Find linked lead for a project to determine salesperson ownership
  const getMatchingLead = (project: any) => {
    if (!Array.isArray(leads)) return null;
    return leads.find(
      (l) =>
        (project.leadId &&
          (String(l._id) === String(project.leadId) || String(l.id) === String(project.leadId))) ||
        (l.projectId &&
          (String(l.projectId) === String(project._id) || String(l.projectId) === String(project.id))) ||
        (project.client && l.company && l.company.trim().toLowerCase() === project.client.trim().toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto p-1 bg-slate-100/80 border border-slate-200/50 rounded-full">
          {['all', 'new', 'in_progress', 'completed', 'on_hold'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === st
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st === 'on_hold' ? 'On Hold' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Role Helper Banner */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {role === 'sales' && (
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sales Workspace: You can edit scope for deals won by you</span>
            </span>
          )}

          {role === 'team_lead' && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Team Lead: Distribute projects &amp; assign tasks</span>
            </span>
          )}

          {/* Create Project button: visible to Admin, Manager & Team Lead */}
          {canManageProjects && (
            <button
              onClick={onOpenCreateProject}
              className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const now = new Date();
            const deadline = new Date(project.deadline);
            const diffDays = Math.ceil(
              (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            const matchingLead = getMatchingLead(project);
            const canEditRequirements = canSalesEditProject(user, project, matchingLead);

            return (
              <div
                key={project._id}
                className="glass-card p-5 border-slate-100 flex flex-col justify-between hover:border-amber-200 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          project.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : project.priority === 'high'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {project.priority} priority
                      </span>
                      {project.status === 'on_hold' && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                          On Hold
                        </span>
                      )}
                    </div>

                    {/* Delete Project button: visible to Admin, Manager & Team Lead */}
                    {canManageProjects && (
                      <button
                        onClick={() => deleteProject(project._id)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {project.title}
                  </h4>
                  <div className="text-xs text-slate-500 font-medium mt-1 flex items-center flex-wrap gap-x-2">
                    <span>
                      Client: <strong className="text-slate-700">{project.client}</strong>
                    </span>
                    {project.salesRep && (
                      <span className="text-[11px] text-slate-400">
                        • Won by: <strong className="text-slate-600">{project.salesRep?.name || 'Sales'}</strong>
                      </span>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* What the Client Wants Section */}
                  {project.clientRequirements ? (
                    <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[10px] text-amber-900 uppercase tracking-wider flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>What Client Wants</span>
                        </span>
                        {canEditRequirements && (
                          <button
                            onClick={() => setRequirementsModalProject(project)}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center space-x-0.5"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed italic line-clamp-3">
                        "{project.clientRequirements}"
                      </p>
                    </div>
                  ) : canEditRequirements ? (
                    <button
                      onClick={() => setRequirementsModalProject(project)}
                      className="mt-3 w-full py-2 px-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50 text-amber-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>+ Specify What the Client Wants</span>
                    </button>
                  ) : null}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {/* Assigned Developers Row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-400">Engineering Team:</span>
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {Array.isArray(project.teamMembers) && project.teamMembers.length > 0 ? (
                        project.teamMembers.map((m: any, mIdx: number) => {
                          const name = typeof m === 'object' ? (m.name || 'Developer') : 'Developer';
                          const roleLabel = typeof m === 'object' ? (m.role || 'dev') : 'dev';
                          return (
                            <div
                              key={m?._id || mIdx}
                              className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 border-2 border-white flex items-center justify-center text-[9px] font-black text-white uppercase shadow-2xs"
                              title={`${name} (${roleLabel})`}
                            >
                              {name ? name[0] : 'D'}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No devs assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Progress</span>
                      <span className="text-amber-600 font-bold">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center space-x-1 font-bold text-slate-900">
                      <span>${(project.budget || 0).toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                    </span>
                  </div>

                  {/* Team Lead Distribution & Task Delegation Action Bar */}
                  {(canDistribute || canEditRequirements) && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      {canDistribute && (
                        <button
                          onClick={() => setDistributeModalProject(project)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#635BFF] text-xs font-bold flex items-center justify-center space-x-1 transition-all"
                          title="Distribute this project between developers"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Distribute Team</span>
                        </button>
                      )}

                      {canDistribute && onOpenCreateTask && (
                        <button
                          onClick={() => onOpenCreateTask(project._id || project.id)}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1 transition-all"
                          title="Assign a new sprint task to developers on this project"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Task</span>
                        </button>
                      )}

                      {canEditRequirements && !canDistribute && (
                        <button
                          onClick={() => setRequirementsModalProject(project)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center space-x-1 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit Client Scope</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {/* Status updater for Admin/Manager/Team Lead, read-only pill for Employee/Sales */}
                    {canManageProjects ? (
                      <CustomSelect
                        value={project.status === 'planning' ? 'new' : project.status || 'new'}
                        onChange={(val) => updateStatus(project._id, val)}
                        size="xs"
                        position="top"
                        buttonClassName="uppercase font-bold text-[10px] text-slate-800 bg-white"
                        options={[
                          { value: 'new', label: 'NEW' },
                          { value: 'in_progress', label: 'IN PROGRESS' },
                          { value: 'completed', label: 'COMPLETED' },
                          { value: 'on_hold', label: 'ON HOLD' },
                        ]}
                      />
                    ) : (
                      <span
                        className={`text-[11px] font-bold uppercase rounded-lg px-2.5 py-1 border ${
                          project.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : project.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : project.status === 'on_hold'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {project.status === 'in_progress'
                          ? 'In Progress'
                          : project.status === 'completed'
                          ? 'Completed'
                          : project.status === 'on_hold'
                          ? 'On Hold'
                          : 'New'}
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-semibold ${
                        diffDays < 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      {diffDays < 0 ? `${Math.abs(diffDays)}d overdue` : `${diffDays}d left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full glass-card p-12 text-center border-slate-100">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No projects found</h4>
            <p className="text-xs text-slate-400 mt-1">
              {canManageProjects
                ? 'Click "New Project" above to create one.'
                : 'No projects currently assigned to your team.'}
            </p>
          </div>
        )}
      </div>

      {/* Team Lead Distribution Modal */}
      {distributeModalProject && (
        <DistributeProjectModal
          isOpen={Boolean(distributeModalProject)}
          onClose={() => setDistributeModalProject(null)}
          project={distributeModalProject}
          employees={employees}
          tasks={tasks}
          onProjectUpdated={onRefresh}
          onOpenCreateTask={onOpenCreateTask}
        />
      )}

      {/* Sales Client Requirements Modal */}
      {requirementsModalProject && (
        <EditClientRequirementsModal
          isOpen={Boolean(requirementsModalProject)}
          onClose={() => setRequirementsModalProject(null)}
          project={requirementsModalProject}
          onProjectUpdated={onRefresh}
        />
      )}
    </div>
  );
}

