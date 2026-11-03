'use client';

import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  FolderKanban,
  HelpCircle,
  Luggage,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

export interface NotificationItem {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type?: string;
  linkTab?: string;
  isRead?: boolean;
  createdAt?: string | Date;
}

interface NotificationDrawerProps {
  notifications: NotificationItem[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
  onClose: () => void;
}

function formatRelativeTime(dateInput?: string | Date): string {
  if (!dateInput) return 'Recently';
  const now = new Date().getTime();
  const past = new Date(dateInput).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateInput).toLocaleDateString();
}

function getNotificationVisual(type?: string) {
  switch (type) {
    case 'task_assigned':
      return {
        icon: <CheckSquare className="w-4 h-4 text-indigo-600" />,
        bg: 'bg-indigo-50 border-indigo-100',
        badge: 'Task',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'project_status':
      return {
        icon: <FolderKanban className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-100',
        badge: 'Project',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'lead_won':
      return {
        icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-100',
        badge: 'Deal Won',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'leave_status':
      return {
        icon: <Luggage className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-50 border-amber-100',
        badge: 'Leave',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'ticket_updated':
      return {
        icon: <Wrench className="w-4 h-4 text-cyan-600" />,
        bg: 'bg-cyan-50 border-cyan-100',
        badge: 'Support',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      };
    case 'standup_digest':
      return {
        icon: <Clock className="w-4 h-4 text-violet-600" />,
        bg: 'bg-violet-50 border-violet-100',
        badge: 'Standup',
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      };
    default:
      return {
        icon: <Bell className="w-4 h-4 text-slate-600" />,
        bg: 'bg-slate-50 border-slate-100',
        badge: 'Notice',
        badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}

export default function NotificationDrawer({
  notifications,
  onRefresh,
  onNavigateTab,
  onClose,
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loadingAction, setLoadingAction] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const markAllRead = async () => {
    try {
      setLoadingAction(true);
      await authFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      setLoadingAction(true);
      await authFetch('/api/notifications', { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Error clearing notifications:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    // Mark as read
    if (!item.isRead && (item._id || item.id)) {
      try {
        await authFetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item._id || item.id }),
        });
        onRefresh();
      } catch (err) {
        console.error('Error updating notification:', err);
      }
    }

    if (item.linkTab && onNavigateTab) {
      onNavigateTab(item.linkTab);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.25)] border border-slate-200/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#635BFF]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Team alerts, assignments & approvals</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs & Bulk Action Controls */}
      <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1 bg-white border border-slate-200/60 p-0.5 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filter === 'unread'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={loadingAction}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50/60 transition"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              disabled={loadingAction}
              className="p-1 text-slate-400 hover:text-rose-600 transition"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {displayNotifications.length > 0 ? (
          displayNotifications.map((item, idx) => {
            const visual = getNotificationVisual(item.type);

            return (
              <div
                key={item._id || item.id || idx}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 flex items-start space-x-3 transition-colors cursor-pointer group ${
                  item.isRead
                    ? 'hover:bg-slate-50/70 bg-white'
                    : 'bg-indigo-50/20 hover:bg-indigo-50/30'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${visual.bg}`}
                >
                  {visual.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${visual.badgeColor}`}
                    >
                      {visual.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <h5
                    className={`text-xs font-bold leading-snug truncate ${
                      item.isRead ? 'text-slate-800' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[#635BFF] shrink-0 mt-2 ring-2 ring-indigo-100" />
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">All caught up!</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filter === 'unread'
                ? 'No unread notifications to review.'
                : 'No notifications at this time.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
