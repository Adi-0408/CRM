'use client';

import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  FolderKanban,
  CalendarCheck,
  Luggage,
  Clock,
  Plus,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LiveClockCard from '@/components/attendance/LiveClockCard';

interface EmployeeDashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenCreateTask: () => void;
}

export default function EmployeeDashboardView({
  onNavigate,
  onOpenCreateTask,
}: EmployeeDashboardViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const [tRes, pRes, lRes, sRes, aRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/leaves'),
        fetch('/api/tickets'),
        fetch('/api/attendance'),
      ]);

      const [tks, prjs, levs, tcks, atts] = await Promise.all([
        tRes.json(),
        pRes.json(),
        lRes.json(),
        sRes.json(),
        aRes.json(),
      ]);

      if (Array.isArray(tks)) setTasks(tks);
      if (Array.isArray(prjs)) setProjects(prjs);
      if (Array.isArray(levs)) setLeaves(levs);
      if (Array.isArray(tcks)) setTickets(tcks);
      if (Array.isArray(atts)) setAttendances(atts);
    } catch (e) {
      console.error('Employee Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  // Filter tasks assigned to current user (or all if not strictly assigned)
  const myTasks = tasks.filter(
    (t) =>
      !t.assignedTo ||
      t.assignedTo?._id === user?.id ||
      t.assignedTo?.email === user?.email ||
      t.assignedTo?.name === user?.name
  );

  const pendingTasks = myTasks.filter((t) => t.status !== 'completed');

  // Dynamic Attendance Calculation for the active employee
  const myAttendances = attendances.filter(
    (a) =>
      a.employee?._id === user?.id ||
      a.employee?.email === user?.email ||
      a.employee?._id?.toString() === user?.id?.toString()
  );
  const presentCount = myAttendances.filter(
    (a) => a.status !== 'absent'
  ).length;
  const attendanceRate =
    myAttendances.length > 0 ? Math.round((presentCount / myAttendances.length) * 100) : 0;

  // Dynamic Leave Calculation for the active employee
  const myLeaves = leaves.filter(
    (l) =>
      l.employee?._id === user?.id ||
      l.employee?.email === user?.email ||
      l.employee?._id?.toString() === user?.id?.toString()
  );
  const approvedLeaves = myLeaves.filter((l) => l.status === 'approved');
  const usedLeaveDays = approvedLeaves.reduce((acc, l) => {
    if (l.days) return acc + l.days;
    try {
      const diff = Math.max(
        1,
        Math.ceil(
          (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );
      return acc + diff;
    } catch {
      return acc + 1;
    }
  }, 0);

  const handleToggleTask = async (task: any) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchEmployeeData();
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Live Multi-Session Clock Card */}
      <LiveClockCard onPunchSuccess={fetchEmployeeData} />

      {/* 2. 4 Employee KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                My Pending Tasks
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {pendingTasks.length}
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                In your priority queue
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#635BFF] flex items-center justify-center flex-shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Assigned Projects */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Assigned Projects
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {projects.length}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                Active client sprints
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center flex-shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Monthly Attendance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                My Attendance %
              </p>
              <h3 className="text-2xl font-extrabold text-[#635BFF] tracking-tight mt-1.5">
                {attendanceRate}%
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {myAttendances.length > 0
                  ? `${presentCount} of ${myAttendances.length} days present`
                  : 'No check-ins logged'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Leave Balance
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {usedLeaveDays} / 24 <span className="text-sm font-medium text-slate-400">days used</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {24 - usedLeaveDays} annual days remaining
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FFF0ED] text-[#F97316] flex items-center justify-center flex-shrink-0">
              <Luggage className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Panels: Priority Tasks & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks List */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold tracking-tight text-slate-900">
                My Priority Tasks
              </h4>
              <p className="text-xs text-slate-400">Work items requiring your delivery</p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>View All Tasks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {myTasks.length > 0 ? (
              myTasks.slice(0, 5).map((t) => {
                const isCompleted = t.status === 'completed';
                return (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3 truncate mr-2">
                      <button
                        onClick={() => handleToggleTask(t)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-indigo-500 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <div className="truncate">
                        <h5
                          className={`text-sm font-semibold truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {t.title}
                        </h5>
                        <p className="text-xs text-slate-400">
                          {t.project?.title || 'General'} • Priority:{' '}
                          <span className="font-medium text-slate-600 capitalize">
                            {t.priority || 'medium'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                You have no pending tasks assigned.
              </p>
            )}
          </div>
        </div>

        {/* My Project Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold tracking-tight text-slate-900">
                My Project Deadlines
              </h4>
              <p className="text-xs text-slate-400">Milestone schedules for your team</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>View Projects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {projects.length > 0 ? (
              projects.slice(0, 5).map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate mr-3">
                    <div className="w-7 h-7 rounded-xl bg-[#FFF0ED] text-[#F97316] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <h5 className="text-sm font-semibold text-slate-800 truncate">
                        {p.title}
                      </h5>
                      <p className="text-xs text-slate-400">
                        {p.client || 'Client'} • Due: {new Date(p.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                    {p.progress || 0}% Done
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No active project deadlines found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
