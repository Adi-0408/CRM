'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';

interface DailyStandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  tasks?: any[];
}

export default function DailyStandupModal({
  isOpen,
  onClose,
  onSubmitted,
  tasks = [],
}: DailyStandupModalProps) {
  const { user } = useAuth();
  const [completedToday, setCompletedToday] = useState('');
  const [plannedTomorrow, setPlannedTomorrow] = useState('');
  const [hasBlockers, setHasBlockers] = useState(false);
  const [blockers, setBlockers] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract completed and pending tasks for current user
  useEffect(() => {
    if (!isOpen) return;

    const populateFromTasks = (taskList: any[]) => {
      if (!Array.isArray(taskList) || taskList.length === 0) return;

      const currentUserId = String(user?.id || (user as any)?._id || '');
      const currentUserEmail = user?.email?.toLowerCase();

      // Find tasks assigned to this user
      const myTasks = taskList.filter((t) => {
        const assignedId =
          t.assignedTo?._id ||
          t.assignedTo?.id ||
          (typeof t.assignedTo === 'string' ? t.assignedTo : null);
        const assignedEmail = t.assignedTo?.email?.toLowerCase();

        return (
          (assignedId && String(assignedId) === currentUserId) ||
          (assignedEmail && currentUserEmail && assignedEmail === currentUserEmail)
        );
      });

      // 1. Pre-fill completed tasks
      const completedList = myTasks.filter((t) => t.status === 'completed');
      if (completedList.length > 0 && !completedToday) {
        const formatted = completedList.map((t) => `• ${t.title}`).join('\n');
        setCompletedToday(formatted);
      }

      // 2. Suggest planned tomorrow from in-progress/new tasks
      const activeList = myTasks.filter(
        (t) => t.status === 'in_progress' || t.status === 'new'
      );
      if (activeList.length > 0 && !plannedTomorrow) {
        const formatted = activeList
          .slice(0, 2)
          .map((t) => `• ${t.title}`)
          .join('\n');
        setPlannedTomorrow(formatted);
      }
    };

    if (tasks && tasks.length > 0) {
      populateFromTasks(tasks);
    } else {
      // Auto-fetch if tasks weren't passed in props
      authFetch('/api/tasks')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) populateFromTasks(data);
        })
        .catch(() => {});
    }
  }, [isOpen, user, tasks, completedToday, plannedTomorrow]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedToday.trim() && !plannedTomorrow.trim()) {
      setError('Please provide what was completed today or planned for tomorrow.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await authFetch('/api/standups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedToday,
          plannedTomorrow,
          hasBlockers,
          blockers: hasBlockers ? (blockers.trim() || 'Unspecified blocker') : 'None',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit standup');
      }

      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.30)] border border-slate-200/90 p-4 sm:p-5 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="standup-title"
      >
        {/* Header with prominent, always-visible Close 'X' Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="standup-title" className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Daily EOD Standup
                </h3>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full leading-none">
                  1-Min
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  {user?.name || 'Staff Member'} •{' '}
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Explicit, High-Contrast Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog (Esc)"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-semibold flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Compact Form Designed to 100% Fit in Viewport Without Scrolling */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          {/* 1. What did you complete today? */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                1. What did you complete today? *
              </label>
              <span className="text-[10px] text-indigo-600 font-semibold">
                Auto-prefilled
              </span>
            </div>
            <textarea
              rows={2}
              required
              placeholder="e.g. • Completed client quotation&#10;• Fixed task filter bug"
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900 leading-relaxed font-mono resize-none placeholder:text-slate-400"
            />
          </div>

          {/* 2. What is planned for tomorrow? */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              2. What is planned for tomorrow? *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. • Integrate Razorpay webhook&#10;• Review mobile responsive layout"
              value={plannedTomorrow}
              onChange={(e) => setPlannedTomorrow(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-900 leading-relaxed font-mono resize-none placeholder:text-slate-400"
            />
          </div>

          {/* 3. Blockers Toggle */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              3. Any blockers or dependencies?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasBlockers(false)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  !hasBlockers
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>No Blockers</span>
              </button>

              <button
                type="button"
                onClick={() => setHasBlockers(true)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  hasBlockers
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>I Have a Blocker</span>
              </button>
            </div>

            {hasBlockers && (
              <div className="mt-1.5 animate-in fade-in duration-100">
                <input
                  type="text"
                  required
                  placeholder="Describe blocker (e.g. Waiting on client API key)..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Skip for Now
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-3 h-3" />
              <span>{submitting ? 'Submitting...' : 'Submit Standup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
