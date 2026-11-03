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

  // Keep visited tabs alive in memory for 0ms instant tab switching
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    overview: true,
    dashboard: true,
  });

  useEffect(() => {
    setVisitedTabs((prev) => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
  }, [activeTab]);

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
  const [leadsSection, setLeadsSection] = useState<'leads' | 'quotations'>('leads');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.pushState({ crmApp: true, tab }, '');
    }
  };

  const navigateToTab = (tab: string, section?: 'leads' | 'quotations') => {
    if (tab === 'quotations') {
      setLeadsSection('quotations');
      handleTabChange('leads');
    } else if (tab === 'leads') {
      setLeadsSection(section || 'leads');
      handleTabChange('leads');
    } else {
      handleTabChange(tab);
    }
  };

  const openModal = (setter: (v: boolean) => void) => {
    setter(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ crmModal: true }, '');
    }
  };

  const toggleMobileMenu = () => {
    if (!mobileMenuOpen) {
      setMobileMenuOpen(true);
      if (typeof window !== 'undefined') {
        window.history.pushState({ crmMenu: true }, '');
      }
    } else {
      setMobileMenuOpen(false);
    }
  };

  // Mobile Back Button Navigation Trap (prevents accidental exit from site)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.history.state || !window.history.state.crmApp) {
      window.history.replaceState({ crmApp: true, tab: 'overview' }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      // 1. If mobile drawer is open, close it
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        return;
      }

      // 2. If any main modal is open, close it
      if (showCreateTask || showAddLead || showCreateProject || showAddEmployee) {
        setShowCreateTask(false);
        setShowAddLead(false);
        setShowCreateProject(false);
        setShowAddEmployee(false);
        return;
      }

      // 3. Tab pop
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
        if (e.state.section) {
          setLeadsSection(e.state.section);
        }
      } else {
        setActiveTab('overview');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileMenuOpen, showCreateTask, showAddLead, showCreateProject, showAddEmployee]);
  const [projectPrefill, setProjectPrefill] = useState<{
    client?: string;
    budget?: number;
    title?: string;
    leadId?: string;
  } | null>(null);
  const [selectedProjectIdForTask, setSelectedProjectIdForTask] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    try {
      setSyncing(true);
      // Phase 1: Fetch primary dashboard data & employees for immediate render
      const [dashRes, employeesRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/employees'),
      ]);

      const [dash, emps] = await Promise.all([
        dashRes.json(),
        employeesRes.json(),
      ]);

      if (dash && !dash.error) setDashboardData(dash);
      if (Array.isArray(emps)) setEmployees(emps);

      // Render Dashboard immediately without waiting for secondary tabs
      setLoading(false);

      // Phase 2: Load secondary tab stores in parallel background streams
      const [tasksRes, leadsRes, projectsRes, ticketsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/leads'),
        fetch('/api/projects'),
        fetch('/api/tickets'),
      ]);

      const [tks, lds, prjs, tcks] = await Promise.all([
        tasksRes.json(),
        leadsRes.json(),
        projectsRes.json(),
        ticketsRes.json(),
      ]);

      if (Array.isArray(tks)) setTasks(tks);
      if (Array.isArray(lds)) setLeads(lds);
      if (Array.isArray(prjs)) setProjects(prjs);
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
        return 'Tech Support';
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
    <div className="w-full flex-1 min-h-0 h-full bg-white/75 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.08)] flex overflow-hidden relative">
      {/* 1. Left Sidebar (Fixed on Desktop, Slide-Over Drawer on Mobile/Tablet) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Content Layout (Fixed Glassy Navbar + Scrolling Content View) */}
      <div className="w-full flex-1 min-w-0 h-full flex flex-col overflow-hidden relative">
        {/* Top Header with Role-Specific Actions */}
        <Header
          title={getHeaderTitle()}
          onOpenCreateTask={() => openModal(setShowCreateTask)}
          onOpenAddLead={() => openModal(setShowAddLead)}
          onOpenCreateProject={() => openModal(setShowCreateProject)}
          onOpenAddEmployee={() => openModal(setShowAddEmployee)}
          onNavigateTab={navigateToTab}
          onToggleMobileMenu={toggleMobileMenu}
        />

        {/* Inner Content Area (Isolated Vertical Scrolling) */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 min-h-0 overflow-y-auto overflow-x-hidden max-w-7xl w-full mx-auto scroll-smooth focus:outline-none">
          {/* Business Intelligence Header & Pill Navigation */}
          <BusinessIntelligenceNav
            activeTab={activeTab}
            setActiveTab={handleTabChange}
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
              {(visitedTabs.overview || visitedTabs.dashboard) && (
                <div className={activeTab === 'overview' || activeTab === 'dashboard' ? 'block' : 'hidden'}>
                  <OverviewView
                    data={dashboardData}
                    employees={employees}
                    onNavigate={navigateToTab}
                    onOpenCreateTask={() => openModal(setShowCreateTask)}
                    onOpenAddLead={() => openModal(setShowAddLead)}
                    onOpenCreateProject={() => openModal(setShowCreateProject)}
                    onOpenAddEmployee={() => openModal(setShowAddEmployee)}
                  />
                </div>
              )}

              {/* 2. Task Management */}
              {visitedTabs.tasks && (
                <div className={activeTab === 'tasks' ? 'block' : 'hidden'}>
                  <TasksView
                    tasks={tasks}
                    onOpenCreateTask={() => openModal(setShowCreateTask)}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 3. Lead Management */}
              {visitedTabs.leads && (
                <div className={activeTab === 'leads' ? 'block' : 'hidden'}>
                  <LeadsView
                    leads={leads}
                    projects={projects}
                    employees={employees}
                    initialSection={leadsSection}
                    onOpenAddLead={() => openModal(setShowAddLead)}
                    onOpenCreateProject={(prefill) => {
                      setProjectPrefill(prefill || null);
                      openModal(setShowCreateProject);
                    }}
                    onNavigateTab={navigateToTab}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 4. Project */}
              {visitedTabs.projects && (
                <div className={activeTab === 'projects' ? 'block' : 'hidden'}>
                  <ProjectsView
                    projects={projects}
                    employees={employees}
                    tasks={tasks}
                    leads={leads}
                    onOpenCreateProject={() => openModal(setShowCreateProject)}
                    onOpenCreateTask={(projId) => {
                      setSelectedProjectIdForTask(projId);
                      openModal(setShowCreateTask);
                    }}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 5. Support */}
              {visitedTabs.support && (
                <div className={activeTab === 'support' ? 'block' : 'hidden'}>
                  <SupportView
                    tickets={tickets}
                    employees={employees}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 6. Attendance */}
              {visitedTabs.attendance && (
                <div className={activeTab === 'attendance' ? 'block' : 'hidden'}>
                  <AttendanceView
                    employees={employees}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 7. Payroll & Invoicing */}
              {visitedTabs.payroll && (
                <div className={activeTab === 'payroll' ? 'block' : 'hidden'}>
                  <PayrollView
                    employees={employees}
                    projects={projects}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 8. Leave */}
              {visitedTabs.leave && (
                <div className={activeTab === 'leave' ? 'block' : 'hidden'}>
                  <LeavesView
                    employees={employees}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 9. Employee Management */}
              {visitedTabs.employees && (
                <div className={activeTab === 'employees' ? 'block' : 'hidden'}>
                  <EmployeesView
                    employees={employees}
                    onOpenAddEmployee={() => openModal(setShowAddEmployee)}
                    onRefresh={fetchData}
                  />
                </div>
              )}

              {/* 10. Management */}
              {(visitedTabs.management || visitedTabs.branches) && (
                <div className={activeTab === 'management' || activeTab === 'branches' ? 'block' : 'hidden'}>
                  <ManagementView onRefresh={fetchData} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals for Quick Actions */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => {
          setShowCreateTask(false);
          setSelectedProjectIdForTask(undefined);
        }}
        onTaskCreated={() => {
          setSelectedProjectIdForTask(undefined);
          fetchData();
        }}
        projects={projects}
        employees={employees}
        tasks={tasks}
        initialProjectId={selectedProjectIdForTask}
      />

      <AddLeadModal
        isOpen={showAddLead}
        onClose={() => setShowAddLead(false)}
        onLeadAdded={fetchData}
        employees={employees}
      />

      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => {
          setShowCreateProject(false);
          setProjectPrefill(null);
        }}
        onProjectCreated={() => {
          setShowCreateProject(false);
          setProjectPrefill(null);
          fetchData();
        }}
        employees={employees}
        tasks={tasks}
        initialClient={projectPrefill?.client}
        initialBudget={projectPrefill?.budget}
        initialTitle={projectPrefill?.title}
        initialLeadId={projectPrefill?.leadId}
      />

      <AddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onEmployeeAdded={fetchData}
      />
    </div>
  );
}
