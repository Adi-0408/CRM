'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/LoginPage';
import LoadingScreen from '@/components/LoadingScreen';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BusinessIntelligenceNav from '@/components/BusinessIntelligenceNav';
import OverviewView from '@/components/OverviewView';
import TasksView from '@/components/views/TasksView';
import LeadsView from '@/components/views/LeadsView';
import ProjectsView from '@/components/views/ProjectsView';
import AttendanceView from '@/components/views/AttendanceView';
import SupportView from '@/components/views/SupportView';
import PayrollView from '@/components/views/PayrollView';
import LeavesView from '@/components/views/LeavesView';
import EmployeesView from '@/components/views/EmployeesView';
import ManagementView from '@/components/views/ManagementView';

import CreateTaskModal from '@/components/modals/CreateTaskModal';
import AddLeadModal from '@/components/modals/AddLeadModal';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import AddEmployeeModal from '@/components/modals/AddEmployeeModal';

export default function CRMApp() {
  const {
    user,
    role,
    isAuthenticated,
    loading: authLoading,
    isAuthenticating,
    authMessage,
    hasAccessTo,
  } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core Data Stores (Clean 0s, no dummy data)
  const [dashboardData, setDashboardData] = useState<any>({
    stats: { totalEmployees: 0, activeProjects: 0, attendanceRate: 0 },
    topPerformers: [],
    upcomingDeadlines: [],
    projectStatusDistribution: [],
    recentTickets: [],
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  // Modals state
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const fetchData = async () => {
    try {
      setSyncing(true);
      const [dashRes, tasksRes, leadsRes, projectsRes, employeesRes, ticketsRes] =
        await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/tasks'),
          fetch('/api/leads'),
          fetch('/api/projects'),
          fetch('/api/employees'),
          fetch('/api/tickets'),
        ]);

      const [dash, tks, lds, prjs, emps, tcks] = await Promise.all([
        dashRes.json(),
        tasksRes.json(),
        leadsRes.json(),
        projectsRes.json(),
        employeesRes.json(),
        ticketsRes.json(),
      ]);

      if (dash && !dash.error) setDashboardData(dash);
      if (Array.isArray(tks)) setTasks(tks);
      if (Array.isArray(lds)) setLeads(lds);
      if (Array.isArray(prjs)) setProjects(prjs);
      if (Array.isArray(emps)) setEmployees(emps);
      if (Array.isArray(tcks)) setTickets(tcks);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, role]);

  // Ensure user cannot stay on restricted tab if role switches
  useEffect(() => {
    if (!hasAccessTo(activeTab)) {
      setActiveTab('overview');
    }
  }, [role, activeTab]);

  // 1. Initial Animated Boot or Transitional Authenticating Loader
  if (authLoading || isAuthenticating) {
    return <LoadingScreen message={authMessage} />;
  }

  // 2. Unauthenticated Gate: Clean Centered Floating Card Login Page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onSuccess={() => {
          setActiveTab('overview');
          fetchData();
        }}
      />
    );
  }

  // Map active navigation title
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'overview':
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'Task Management';
      case 'leads':
        return 'Lead Management';
      case 'projects':
        return 'Project';
      case 'support':
        return 'Support';
      case 'attendance':
        return 'Attendance';
      case 'payroll':
        return 'Payroll';
      case 'leave':
        return 'Leave';
      case 'employees':
        return 'Employee Management';
      case 'management':
      case 'branches':
        return 'Management';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)] bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.06)] flex overflow-hidden relative">
      {/* 1. Left Sidebar (Fixed on Desktop, Slide-Over Drawer on Mobile/Tablet) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Content Layout */}
      <div className="w-full flex-1 min-w-0 transition-all duration-300 flex flex-col min-h-full overflow-x-hidden">
        {/* Top Header with Role-Specific Actions */}
        <Header
          title={getHeaderTitle()}
          onOpenCreateTask={() => setShowCreateTask(true)}
          onOpenAddLead={() => setShowAddLead(true)}
          onOpenCreateProject={() => setShowCreateProject(true)}
          onOpenAddEmployee={() => setShowAddEmployee(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Inner Content Area */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto overflow-x-hidden">
          {/* Business Intelligence Header & Pill Navigation */}
          <BusinessIntelligenceNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            syncing={syncing}
          />

          {/* Section Views */}
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-slate-200/60 rounded-2xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 bg-slate-200/60 rounded-2xl" />
                <div className="h-72 bg-slate-200/60 rounded-2xl" />
              </div>
            </div>
          ) : (
            <>
              {/* 1. Dashboard (Overview) with Dynamic Role Rendering */}
              {(activeTab === 'overview' || activeTab === 'dashboard') && (
                <OverviewView
                  data={dashboardData}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenCreateTask={() => setShowCreateTask(true)}
                  onOpenAddLead={() => setShowAddLead(true)}
                  onOpenCreateProject={() => setShowCreateProject(true)}
                  onOpenAddEmployee={() => setShowAddEmployee(true)}
                />
              )}

              {/* 2. Task Management */}
              {activeTab === 'tasks' && (
                <TasksView
                  tasks={tasks}
                  onOpenCreateTask={() => setShowCreateTask(true)}
                  onRefresh={fetchData}
                />
              )}

              {/* 3. Lead Management */}
              {activeTab === 'leads' && (
                <LeadsView
                  leads={leads}
                  onOpenAddLead={() => setShowAddLead(true)}
                  onRefresh={fetchData}
                />
              )}

              {/* 4. Project */}
              {activeTab === 'projects' && (
                <ProjectsView
                  projects={projects}
                  onOpenCreateProject={() => setShowCreateProject(true)}
                  onRefresh={fetchData}
                />
              )}

              {/* 5. Support */}
              {activeTab === 'support' && (
                <SupportView
                  tickets={tickets}
                  employees={employees}
                  onRefresh={fetchData}
                />
              )}

              {/* 6. Attendance */}
              {activeTab === 'attendance' && (
                <AttendanceView
                  employees={employees}
                  onRefresh={fetchData}
                />
              )}

              {/* 7. Payroll */}
              {activeTab === 'payroll' && (
                <PayrollView
                  employees={employees}
                  onRefresh={fetchData}
                />
              )}

              {/* 8. Leave */}
              {activeTab === 'leave' && (
                <LeavesView
                  employees={employees}
                  onRefresh={fetchData}
                />
              )}

              {/* 9. Employee Management */}
              {activeTab === 'employees' && (
                <EmployeesView
                  employees={employees}
                  onOpenAddEmployee={() => setShowAddEmployee(true)}
                  onRefresh={fetchData}
                />
              )}

              {/* 10. Management */}
              {(activeTab === 'management' || activeTab === 'branches') && (
                <ManagementView onRefresh={fetchData} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals for Quick Actions */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={fetchData}
        projects={projects}
        employees={employees}
        tasks={tasks}
      />

      <AddLeadModal
        isOpen={showAddLead}
        onClose={() => setShowAddLead(false)}
        onLeadAdded={fetchData}
        employees={employees}
      />

      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onProjectCreated={fetchData}
        employees={employees}
        tasks={tasks}
      />

      <AddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onEmployeeAdded={fetchData}
      />
    </div>
  );
}
