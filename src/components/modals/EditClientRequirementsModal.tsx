'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, FileText, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

interface EditClientRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onProjectUpdated?: () => void;
  onSuccess?: () => void;
}

export default function EditClientRequirementsModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
  onSuccess,
}: EditClientRequirementsModalProps) {
  const [clientRequirements, setClientRequirements] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setClientRequirements(project.clientRequirements || '');
      setDescription(project.description || '');
      setError('');
    }
  }, [project, isOpen]);

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
          clientRequirements: clientRequirements.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update client requirements');
      }

      if (onProjectUpdated) onProjectUpdated();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating client requirements');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Edit What the Client Wants
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Sales Authority • Update client requirements, features &amp; scope
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

        {/* Project Context Info Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">{project.title}</span>
            <span className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Client: <strong className="text-slate-700">{project.client}</strong></span>
            </span>
          </div>
          {project.budget && (
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60 font-mono">
              ${Number(project.budget).toLocaleString()}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. What the Client Wants (Primary Field) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>What the Client Wants / Requirements &amp; Deliverables</span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                Visible to Engineering Team
              </span>
            </label>
            <textarea
              rows={5}
              value={clientRequirements}
              onChange={(e) => setClientRequirements(e.target.value)}
              placeholder="Detail what the client specifically requested: key features, user flows, platform targets (iOS/Android/Web), compliance needs, brand colors, delivery expectations..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The assigned developers and Team Lead will refer to these specifications during implementation.
            </p>
          </div>

          {/* 2. High Level Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Project Overview / Scope Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of the overall deliverable..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-sm hover:shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Client Scope'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
