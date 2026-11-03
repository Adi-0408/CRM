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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import CustomSelect from '@/components/common/CustomSelect';

interface ProjectsViewProps {
  projects: any[];
  onOpenCreateProject: () => void;
  onRefresh: () => void;
}

export default function ProjectsView({
  projects,
  onOpenCreateProject,
  onRefresh,
}: ProjectsViewProps) {
  const { user, role } = useAuth();
  const isAdminOrManager = role === 'admin_manager';
  const canManageProjects = role === 'admin_manager' || role === 'team_lead';

  const [filter, setFilter] = useState('all');

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

  // Scoping projects for employees (Admin & Team Lead view all projects)
  const scopedProjects = useMemo(() => {
    if (canManageProjects) return projects;
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
  }, [projects, isAdminOrManager, user]);

  const filteredProjects = scopedProjects.filter((p) => {
    const normalized = (p.status === 'planning' ? 'new' : p.status) || 'new';
    if (filter === 'all') {
      return normalized !== 'on_hold';
    }
    return normalized === filter;
  });

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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const now = new Date();
            const deadline = new Date(project.deadline);
            const diffDays = Math.ceil(
              (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={project._id}
                className="glass-card p-5 border-slate-100 flex flex-col justify-between hover:border-amber-200 transition-all"
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
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Client: <span className="text-slate-700 font-semibold">{project.client}</span>
                  </p>

                  {project.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
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

                  <div className="flex items-center justify-between pt-1">
                    {/* Status updater for Admin/Manager/Team Lead, read-only pill for Employee */}
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
    </div>
  );
}
