'use client';

import React, { useState, useMemo } from 'react';
import { X, Users, CheckSquare, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import TeamMemberPicker from '@/components/common/TeamMemberPicker';
import { authFetch } from '@/lib/apiClient';

interface DistributeProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  employees: any[];
  tasks?: any[];
  onProjectUpdated: () => void;
  onOpenCreateTask?: (projectId: string) => void;
}

export default function DistributeProjectModal({
  isOpen,
  onClose,
  project,
  employees,
  tasks = [],
  onProjectUpdated,
  onOpenCreateTask,
}: DistributeProjectModalProps) {
  const currentMemberIds = useMemo(() => {
    if (!project?.teamMembers) return [];
    return project.teamMembers.map((m: any) =>
      typeof m === 'string' ? m : m._id || m.id
    ).filter(Boolean);
  }, [project]);

  const [selectedMembers, setSelectedMembers] = useState<string[]>(currentMemberIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Restrict assignable members to Developers, Interns, and Team Leads
  const assignableEmployees = useMemo(() => {
    const allowed = ['web_developer', 'android_developer', 'intern', 'team_lead'];
    return (employees || []).filter((emp) => {
      const r = String(emp.role || '').toLowerCase().trim();
      return (
        allowed.includes(r) ||
        r.includes('developer') ||
        r.includes('intern') ||
        r.includes('lead')
      );
    });
  }, [employees]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await authFetch(`/api/projects/${project._id || project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamMembers: selectedMembers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update team distribution');
      }

      onProjectUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error distributing project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_-10px_rgba(15,23,42,0.25),0_10px_24px_-4px_rgba(15,23,42,0.10)] border border-white/90 p-6 md:p-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#635BFF]/10 border border-[#635BFF]/20 flex items-center justify-center text-[#635BFF]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Distribute Project to Developers
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Team Lead Workspace • Assign engineering team members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Project Context Summary Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">{project.title}</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-[#635BFF] border border-indigo-200">
              {project.status || 'Active'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Client: <strong className="text-slate-700">{project.client}</strong>
            {project.budget ? ` • Budget: $${Number(project.budget).toLocaleString()}` : ''}
          </p>
          {project.clientRequirements && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
              <span className="font-bold text-indigo-700 block mb-0.5">What the Client Wants:</span>
              <p className="italic line-clamp-2 bg-white/70 p-2 rounded-xl border border-slate-100">
                "{project.clientRequirements}"
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Team Member Picker */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <TeamMemberPicker
            label="Select Developers & Interns for this Deliverable"
            employees={assignableEmployees}
            selectedIds={selectedMembers}
            onChange={setSelectedMembers}
            tasks={tasks}
            multiple={true}
            allowedRoles={['web_developer', 'android_developer', 'intern', 'team_lead']}
          />

          {/* Quick Task Delegation Helper */}
          {onOpenCreateTask && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Delegate Specific Tasks</span>
                  <span className="text-[11px] text-slate-500">Assign sprint tasks to developers</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateTask(project._id || project.id);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-[#635BFF] text-xs font-bold flex items-center space-x-1 shadow-2xs hover:shadow-xs transition-all"
              >
                <span>+ Create Task</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving Distribution...' : 'Save & Distribute'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
