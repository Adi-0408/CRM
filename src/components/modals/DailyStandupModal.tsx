'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  User,
  X,
  Zap,
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

  // Extract completed and pending tasks for the current user
  useEffect(() => {
    if (!isOpen) return;

    const currentUserId = String(user?.id || (user as any)?._id || '');
    const currentUserEmail = user?.email?.toLowerCase();

    // Find tasks assigned to this user
    const myTasks = tasks.filter((t) => {
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
      const formatted = completedList.map((t) => `• Completed: ${t.title}`).join('\n');
      setCompletedToday(formatted);
    }

    // 2. Suggest planned tomorrow from in-progress/new tasks
    const activeList = myTasks.filter(
      (t) => t.status === 'in_progress' || t.status === 'new'
    );
    if (activeList.length > 0 && !plannedTomorrow) {
      const formatted = activeList
        .slice(0, 2)
        .map((t) => `• Continue: ${t.title}`)
        .join('\n');
      setPlannedTomorrow(formatted);
    }
  }, [isOpen, user, tasks]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedToday.trim() && !plannedTomorrow.trim()) {
      setError('Please provide at least one completed item or planned deliverable.');
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
          blockers: hasBlockers ? blockers : 'None',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_-10px_rgba(15,23,42,0.25),0_10px_24px_-4px_rgba(15,23,42,0.10)] border border-white/90 p-6 md:p-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">Daily EOD Standup Digest</h3>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-full">
                  1-Min Summary
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Log your end-of-day progress for your Team Lead & Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-semibold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reporter Context */}
        <div className="mt-4 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-2 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Submitting as: <strong className="text-slate-800">{user?.name || 'Staff Member'}</strong>
            </span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. What did you complete today? */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. What did you complete today? *
              </label>
              <span className="text-[10px] text-indigo-600 font-semibold">
                Auto-prefilled from completed tasks
              </span>
            </div>
            <textarea
              rows={3}
              required
              placeholder="e.g. • Implemented Room DB offline cache&#10;• Fixed geofence perimeter calibration bug"
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-900 leading-relaxed font-mono"
            />
          </div>

          {/* 2. What's planned for tomorrow? */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. What is planned for tomorrow? *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. • Work on Quotations PDF generation&#10;• Review pull requests and test build on Android emulator"
              value={plannedTomorrow}
              onChange={(e) => setPlannedTomorrow(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-900 leading-relaxed font-mono"
            />
          </div>

          {/* 3. Blockers Toggle & Input */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Any blockers or dependencies?
            </label>

            <div className="flex items-center space-x-2 mb-3">
              <button
                type="button"
                onClick={() => setHasBlockers(false)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  !hasBlockers
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>No Blockers (All Clear)</span>
              </button>

              <button
                type="button"
                onClick={() => setHasBlockers(true)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                  hasBlockers
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>I Have a Blocker</span>
              </button>
            </div>

            {hasBlockers && (
              <div className="animate-in fade-in duration-150">
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Waiting on client API credentials for Phoenix Logistics supply chain webhook..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Skip for Now
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Standup Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
