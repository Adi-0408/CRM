'use client';

import React from 'react';
import {
  Users,
  FolderKanban,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Plus,
  Target,
  UserPlus,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import HRDashboardView from '@/components/dashboards/HRDashboardView';
import ManagerDashboardView from '@/components/dashboards/ManagerDashboardView';
import EmployeeDashboardView from '@/components/dashboards/EmployeeDashboardView';
import AttendanceAnalyticsChart from '@/components/attendance/AttendanceAnalyticsChart';

interface OverviewViewProps {
  data: {
    stats: {
      totalEmployees: number;
      activeProjects: number;
      attendanceRate: number;
      totalLeads?: number;
      totalPipelineValue?: number;
      totalTasks?: number;
      completedTasks?: number;
      inProgressTasks?: number;
      todoTasks?: number;
    };
    topPerformers: Array<{
      _id: string;
      name: string;
      role: string;
      completedTasksCount: number;
      avatar?: string;
    }>;
    upcomingDeadlines: Array<{
      _id: string;
      title: string;
      client: string;
      deadline: string;
      diffDays: number;
      priority: string;
      status: string;
    }>;
    projectStatusDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    recentTickets: Array<{
      _id: string;
      ticketNumber: string;
      title: string;
      customerName: string;
      priority: string;
      status: string;
      createdAt: string;
    }>;
  };
  employees?: any[];
  onNavigate: (tab: string) => void;
  onOpenCreateTask?: () => void;
  onOpenAddLead?: () => void;
  onOpenCreateProject?: () => void;
  onOpenAddEmployee?: () => void;
}

export default function OverviewView({
  data,
  employees = [],
  onNavigate,
  onOpenCreateTask,
  onOpenAddLead,
  onOpenCreateProject,
  onOpenAddEmployee,
}: OverviewViewProps) {
  const { role } = useAuth();

  // 1. Delegate to Role-Specific Dashboard Views
  if (role === 'hr') {
    return <HRDashboardView onNavigate={onNavigate} onOpenAddEmployee={onOpenAddEmployee} />;
  }

  if (role === 'sales' || role === 'accounts') {
    return (
      <ManagerDashboardView
        data={data}
        onNavigate={onNavigate}
        onOpenCreateTask={onOpenCreateTask || (() => {})}
        onOpenAddLead={onOpenAddLead || (() => {})}
        onOpenCreateProject={onOpenCreateProject || (() => {})}
      />
    );
  }

  if (
    role === 'web_developer' ||
    role === 'android_developer' ||
    role === 'tech_support' ||
    role === 'intern'
  ) {
    return (
      <EmployeeDashboardView
        onNavigate={onNavigate}
        onOpenCreateTask={onOpenCreateTask || (() => {})}
      />
    );
  }

  // 2. Default: Super Admin Dashboard View
  const {
    stats,
    topPerformers,
    upcomingDeadlines,
    projectStatusDistribution,
    recentTickets,
  } = data;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-150">
      {/* Admin Action Banner */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-4 sm:p-5 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.10),0_4px_10px_-2px_rgba(15,23,42,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 transition-all duration-200">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900">
            Company Executive Overview
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Full organizational controls, enterprise cross-module telemetry &amp; delegation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onOpenCreateTask && (
            <button
              onClick={onOpenCreateTask}
              className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-bold text-slate-700 bg-white/90 hover:bg-white border border-slate-200/90 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.10)] hover:shadow-[0_8px_18px_-2px_rgba(15,23,42,0.15)] active:scale-95 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Create Task</span>
            </button>
          )}
          {onOpenAddLead && (
            <button
              onClick={onOpenAddLead}
              className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-bold text-white bg-gradient-to-r from-[#635BFF] via-[#7067FF] to-[#7B73FF] hover:brightness-105 shadow-[0_6px_20px_-2px_rgba(99,91,255,0.40)] hover:shadow-[0_10px_25px_-2px_rgba(99,91,255,0.50)] border-t border-white/30 active:scale-95 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Leads</span>
            </button>
          )}
          {onOpenAddEmployee && (
            <button
              onClick={onOpenAddEmployee}
              className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-105 shadow-[0_6px_20px_-2px_rgba(16,185,129,0.40)] hover:shadow-[0_10px_25px_-2px_rgba(16,185,129,0.50)] border-t border-white/30 active:scale-95 transition-all duration-200 hover:-translate-y-0.5"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Stat KPI Cards (Adaptive 1 col mobile, 2 tablet, 4 desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {/* Total Employees -> Redirects to Employees */}
        <div
          onClick={() => onNavigate('employees')}
          role="button"
          tabIndex={0}
          className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-4 sm:p-5 lg:p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_4px_10px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.16),0_8px_18px_-4px_rgba(99,91,255,0.16)] hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group select-none"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Employees
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              {stats?.totalEmployees ?? 0}
            </h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">
              Active company team
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Projects -> Redirects to Projects */}
        <div
          onClick={() => onNavigate('projects')}
          role="button"
          tabIndex={0}
          className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-4 sm:p-5 lg:p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_4px_10px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.16),0_8px_18px_-4px_rgba(16,185,129,0.16)] hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group select-none"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Projects
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              {stats?.activeProjects ?? 0}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Live client engagements
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* Attendance Rate -> Redirects to Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          role="button"
          tabIndex={0}
          className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-4 sm:p-5 lg:p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_4px_10px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.16),0_8px_18px_-4px_rgba(249,115,22,0.16)] hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group select-none"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Attendance Rate
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              {stats?.attendanceRate ?? 0}%
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">
              Daily check-in ratio
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF0ED] text-[#F97316] flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Pipeline Value -> Redirects to Leads */}
        <div
          onClick={() => onNavigate('leads')}
          role="button"
          tabIndex={0}
          className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-4 sm:p-5 lg:p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_4px_10px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.16),0_8px_18px_-4px_rgba(59,130,246,0.16)] hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group select-none"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pipeline Value
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              ${(stats?.totalPipelineValue ?? 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#635BFF] font-semibold mt-1">
              {stats?.totalLeads ?? 0} active prospects
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EEF2FF] text-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Executive Attendance Telemetry & Department Data Analysis */}
      <AttendanceAnalyticsChart
        employees={employees}
        onNavigate={onNavigate}
        title="Organization Attendance & Department Telemetry"
        subtitle="Real-time multi-department attendance distribution, employee hours logged & punctuality analytics"
      />

      {/* 3. Middle Row: Top Tasks Performers & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Tasks Performers */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 sm:p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.09),0_4px_12px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.14)] transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Top Tasks Performers
            </h3>
            <button
              onClick={() => onNavigate('employees')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 transition-colors hover:translate-x-0.5 duration-150"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topPerformers && topPerformers.length > 0 ? (
              topPerformers.map((performer, idx) => (
                <div
                  key={performer._id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    {/* Rank Badge */}
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

                    {/* Performer Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {performer.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-normal">
                        {performer.role || 'Manager'} •{' '}
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
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 sm:p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.09),0_4px_12px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.14)] transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Upcoming Deadlines
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 transition-colors hover:translate-x-0.5 duration-150"
            >
              <span>Manage Projects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden">
                    {/* Alert Icon */}
                    <div className="w-7 h-7 rounded-xl bg-[#FFF0ED] flex items-center justify-center text-[#F97316] flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>

                    {/* Project & Due Info */}
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-normal">
                        Project •{' '}
                        <span className="text-rose-500 font-medium">
                          Due in {item.diffDays} days
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Date badge */}
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200/70 px-2.5 py-1 rounded-full shadow-xs">
                      {formatDate(item.deadline)}
                    </span>
                  </div>
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

      {/* 3. Bottom Row: Project Status Distribution & Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.09),0_4px_12px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.14)] transition-all duration-300">
          <h3 className="text-base font-bold tracking-tight text-slate-900 mb-4">
            Project Status Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {projectStatusDistribution && projectStatusDistribution.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      color: '#0f172a',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                    }}
                    itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-medium text-slate-600 ml-1">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <FolderKanban className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">
                  Distribution data will update as projects are logged.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.09),0_4px_12px_-2px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.14)] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold tracking-tight text-slate-900">Recent Tickets</h3>
            <button
              onClick={() => onNavigate('support')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 transition-colors hover:translate-x-0.5 duration-150"
            >
              <span>View Support</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTickets && recentTickets.length > 0 ? (
              recentTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100/80 hover:bg-slate-50 transition-colors"
                >
                  <div className="truncate mr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-[#635BFF] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                        {ticket.ticketNumber}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-800 truncate">
                        {ticket.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      From: <span className="font-medium text-slate-600">{ticket.customerName}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        ticket.priority === 'urgent' || ticket.priority === 'high'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : ticket.priority === 'medium'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        ticket.status === 'resolved' || ticket.status === 'closed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-[#EEF2FF] text-[#635BFF] border border-indigo-100'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
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
