'use client';

import React from 'react';
import {
  FolderKanban,
  Target,
  ListTodo,
  AlertTriangle,
  ChevronRight,
  Plus,
  Users2,
  TrendingUp,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface ManagerDashboardViewProps {
  data: any;
  onNavigate: (tab: string) => void;
  onOpenCreateTask: () => void;
  onOpenAddLead: () => void;
  onOpenCreateProject: () => void;
}

export default function ManagerDashboardView({
  data,
  onNavigate,
  onOpenCreateTask,
  onOpenAddLead,
  onOpenCreateProject,
}: ManagerDashboardViewProps) {
  const { stats, topPerformers, upcomingDeadlines, recentTickets, leadPipeline } = data || {};

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const pipelineData = leadPipeline ?? [
    { stage: 'New', count: 0, fill: '#635BFF' },
    { stage: 'Contacted', count: 0, fill: '#3B82F6' },
    { stage: 'Qualified', count: 0, fill: '#10B981' },
    { stage: 'Proposal', count: 0, fill: '#F59E0B' },
    { stage: 'Won', count: 0, fill: '#059669' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Top Action Pill Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900">
            Project &amp; Sales Management Workspace
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Monitor deliverables, sales conversion, and client milestone delivery
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
          <button
            onClick={onOpenCreateTask}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Create Task</span>
          </button>
          <button
            onClick={onOpenAddLead}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Leads</span>
          </button>
          <button
            onClick={onOpenCreateProject}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Manager KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Projects */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Active Projects
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {stats?.activeProjects ?? 0}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                In design &amp; execution
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center flex-shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Open Leads & Pipeline Value */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Pipeline Value
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                ${(stats?.totalPipelineValue ?? 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                {stats?.totalLeads ?? 0} active client prospects
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tasks in Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Tasks in Progress
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {stats?.inProgressTasks ?? stats?.totalTasks ?? 0}
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                {stats?.completedTasks ?? 0} completed
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#3B82F6] flex items-center justify-center flex-shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.05)] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Upcoming Deadlines
              </p>
              <h3 className="text-2xl font-extrabold text-rose-600 tracking-tight mt-1.5">
                {upcomingDeadlines?.length ?? 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Milestones due soon
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FFF0ED] text-[#F97316] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Panels: Top Performers & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-bold tracking-tight text-slate-900">
              Top Tasks Performers
            </h4>
            <button
              onClick={() => onNavigate('employees')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>View Team</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topPerformers && topPerformers.length > 0 ? (
              topPerformers.map((performer: any, idx: number) => (
                <div
                  key={performer._id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-[#EEF2FF] text-[#635BFF]'
                          : idx === 1
                          ? 'bg-[#E6F7F0] text-[#10B981]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800">
                        {performer.name}
                      </h5>
                      <p className="text-xs text-slate-400 font-normal">
                        {performer.role || 'Staff'} •{' '}
                        <span className="text-slate-600 font-medium">
                          {performer.completedTasksCount ?? 0} items completed
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-white text-indigo-600 font-semibold px-2.5 py-1 rounded-full border border-slate-200/70 shadow-xs">
                    ★ Rank {idx + 1}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No task performers found.
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-bold tracking-tight text-slate-900">
              Upcoming Project Deadlines
            </h4>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>Manage Projects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((item: any, idx: number) => (
                <div
                  key={item._id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-xl bg-[#FFF0ED] flex items-center justify-center text-[#F97316] flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <h5 className="text-sm font-semibold text-slate-800 truncate">
                        {item.title}
                      </h5>
                      <p className="text-xs text-slate-400">
                        {item.client || 'Project'} •{' '}
                        <span className="text-rose-500 font-medium">
                          Due in {item.diffDays} days
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200/70 px-2.5 py-1 rounded-full shadow-xs flex-shrink-0 ml-3">
                    {formatDate(item.deadline)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No upcoming deadlines.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Lead Pipeline Breakdown & Recent Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold tracking-tight text-slate-900">
                Lead Pipeline Funnel
              </h4>
              <p className="text-xs text-slate-400">Prospect stages across active accounts</p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>View Leads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {pipelineData && pipelineData.some((p: any) => p.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={11} stroke="#64748b" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#64748b" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #f1f5f9',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Target className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">
                  No leads in pipeline.
                </p>
                <button
                  onClick={onOpenAddLead}
                  className="mt-2 text-xs font-semibold text-[#635BFF] hover:underline"
                >
                  + Add First Lead
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Client Tickets */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold tracking-tight text-slate-900">
                Recent Client Support Tickets
              </h4>
              <p className="text-xs text-slate-400">Issues raised by project clients</p>
            </div>
            <button
              onClick={() => onNavigate('support')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>View Support</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTickets && recentTickets.length > 0 ? (
              recentTickets.map((t: any) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100/80 hover:bg-slate-50 transition-colors"
                >
                  <div className="truncate mr-3">
                    <span className="text-[11px] font-semibold text-[#635BFF] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                      {t.ticketNumber}
                    </span>
                    <h5 className="text-xs font-semibold text-slate-800 truncate mt-1">
                      {t.title}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      From: <span className="font-medium text-slate-600">{t.customerName}</span>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                      t.priority === 'urgent' || t.priority === 'high'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No recent support tickets.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
