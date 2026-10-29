'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';

interface TasksViewProps {
  tasks: any[];
  onOpenCreateTask: () => void;
  onRefresh: () => void;
}

export default function TasksView({
  tasks,
  onOpenCreateTask,
  onRefresh,
}: TasksViewProps) {
  const { user, role } = useAuth();
  const isAdminOrManager = role === 'admin_manager';

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const toggleTaskStatus = async (task: any) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await authFetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!isAdminOrManager) return;
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await authFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Scope tasks to the current user if role is employee
  const scopedTasks = useMemo(() => {
    if (isAdminOrManager) return tasks;
    return tasks.filter((t) => {
      const assignedId =
        t.assignedTo?._id ||
        t.assignedTo?.id ||
        (typeof t.assignedTo === 'string' ? t.assignedTo : null);
      const assignedEmail = t.assignedTo?.email;
      const currentUserId = user?.id || (user as any)?._id;
      return (
        (assignedId && String(assignedId) === String(currentUserId)) ||
        (assignedEmail &&
          user?.email &&
          assignedEmail.toLowerCase() === user.email.toLowerCase())
      );
    });
  }, [tasks, isAdminOrManager, user]);

  const filteredTasks = scopedTasks.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project?.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search tasks, projects, assignees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] bg-slate-50/50"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100/80 border border-slate-200/50 p-1 rounded-full">
            {['all', 'todo', 'in_progress', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  filter === st
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Create Task button: only visible to Admin & Manager */}
        {isAdminOrManager && (
          <button
            onClick={onOpenCreateTask}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all w-full md:w-auto"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task._id}
                className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/50 border-slate-200/60 opacity-80'
                    : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)]'
                }`}
              >
                <div className="flex items-start sm:items-center space-x-3.5">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 sm:mt-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-indigo-500 text-transparent'
                    }`}
                    title="Toggle Task Status"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </button>

                  <div>
                    <h4
                      className={`text-sm font-bold text-slate-800 ${
                        isCompleted ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {task.project && (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          📁 {task.project.title}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          👤 {task.assignedTo.name}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          task.priority === 'urgent' || task.priority === 'high'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : task.priority === 'medium'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'No date'}
                    </span>
                  </span>

                  {/* Delete Task button: only visible to Admin & Manager */}
                  {isAdminOrManager && (
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 text-center border-slate-100">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No tasks found</h4>
            <p className="text-xs text-slate-400 mt-1">
              {isAdminOrManager
                ? 'Click "New Task" above to add your first work item.'
                : 'No tasks currently assigned to you.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
