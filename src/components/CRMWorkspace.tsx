'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/LoginPage';
import LoadingScreen from '@/components/LoadingScreen';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BusinessIntelligenceNav from '@/components/BusinessIntelligenceNav';
import ErrorBoundary from '@/components/ErrorBoundary';

const OverviewView = lazy(() => import('@/components/OverviewView'));
const TasksView = lazy(() => import('@/components/views/TasksView'));
const LeadsView = lazy(() => import('@/components/views/LeadsView'));
const ProjectsView = lazy(() => import('@/components/views/ProjectsView'));
const AttendanceView = lazy(() => import('@/components/views/AttendanceView'));
const SupportView = lazy(() => import('@/components/views/SupportView'));
const PayrollView = lazy(() => import('@/components/views/PayrollView'));
const LeavesView = lazy(() => import('@/components/views/LeavesView'));
const EmployeesView = lazy(() => import('@/components/views/EmployeesView'));
const ManagementView = lazy(() => import('@/components/views/ManagementView'));
const SuperAdminView = lazy(() => import('@/components/views/SuperAdminView'));
const InquiriesPanel = lazy(() => import('@/components/views/InquiriesPanel'));

import CreateTaskModal from '@/components/modals/CreateTaskModal';
import AddLeadModal from '@/components/modals/AddLeadModal';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import AddEmployeeModal from '@/components/modals/AddEmployeeModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import MobileBottomDock from '@/components/navigation/MobileBottomDock';

const tabToRoute: Record<string, string> = {
  overview: '/dashboard',
  dashboard: '/dashboard',
  tasks: '/tasks',
  leads: '/leads',
  projects: '/projects',
  attendance: '/attendance',
  payroll: '/payroll',
  leave: '/leave',
  support: '/tech-support',
  employees: '/employees',
  management: '/management',
  branches: '/management',
};

const routeToTab: Record<string, string> = {
  '/dashboard': 'overview',
  '/tasks': 'tasks',
  '/leads': 'leads',
  '/projects': 'projects',
  '/attendance': 'attendance',
  '/payroll': 'payroll',
  '/leave': 'leave',
  '/tech-support': 'support',
  '/employees': 'employees',
  '/management': 'management',
};

interface CRMWorkspaceProps {
  initialTab?: string;
  initialSection?: 'leads' | 'quotations';
}

export default function CRMWorkspace({
  initialTab = 'overview',
  initialSection = 'leads',
}: CRMWorkspaceProps) {
  const router = useRouter();
  const {
    user,
    role,
    isAuthenticated,
    loading: authLoading,
    isAuthenticating,
    authMessage,
    hasAccessTo,
    updateUser,
  } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    role === 'platform_super_admin'
      ? 'organizations'
      : (initialTab === 'super_admin' || initialTab === 'organizations' ? 'overview' : initialTab)
  );
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadInquiriesCount, setUnreadInquiriesCount] = useState<number>(0);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);

  // Keep visited tabs alive in memory for 0ms instant tab switching
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    [initialTab]: true,
    overview: role !== 'platform_super_admin',
    dashboard: role !== 'platform_super_admin',
    organizations: role === 'platform_super_admin',
    super_admin: role === 'platform_super_admin',
  });

  useEffect(() => {
    setVisitedTabs((prev) => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
  }, [activeTab]);

  // If role is Super Admin, validate active tab; if company tenant user, forbid super_admin / organizations
  useEffect(() => {
    if (role === 'platform_super_admin') {
      const allowed = ['organizations', 'inquiries', 'landing_cms', 'super_admin'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('organizations');
      }
    } else {
      if (activeTab === 'super_admin' || activeTab === 'organizations') {
        setActiveTab('overview');
      }
    }
  }, [role, activeTab]);

  // Fetch unread inquiries count for Super Admin & Company Admin sidebar badge
  useEffect(() => {
    if (role === 'platform_super_admin' || role === 'company_admin' || role === 'admin_manager') {
      fetch('/api/super-admin/inquiries?status=new', {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.counts?.new !== undefined) {
            setUnreadInquiriesCount(data.counts.new);
          }
        })
        .catch(() => {});
    }
  }, [role, user?.id, user?.email, user?.role]);

  // If initialTab changes due to deep-linking or route change, sync activeTab
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
  const [leadsSection, setLeadsSection] = useState<'leads' | 'quotations'>(initialSection);

  const handleTabChange = (tab: string) => {
    if (role === 'platform_super_admin') {
      const allowed = ['organizations', 'inquiries', 'landing_cms', 'super_admin'];
      if (allowed.includes(tab)) {
        setActiveTab(tab === 'super_admin' ? 'organizations' : tab);
      }
      return;
    }
    // Strictly block company admins and users from entering super_admin or organizations
    if (tab === 'super_admin' || tab === 'organizations') {
      setActiveTab('overview');
      return;
    }
    setActiveTab(tab);
  };

  const navigateToTab = (tab: string, section?: 'leads' | 'quotations') => {
    if (role === 'platform_super_admin') {
      const allowed = ['organizations', 'inquiries', 'landing_cms', 'super_admin'];
      if (allowed.includes(tab)) {
        setActiveTab(tab === 'super_admin' ? 'organizations' : tab);
      }
      return;
    }
    // Strictly block company admins and users from entering super_admin or organizations
    if (tab === 'super_admin' || tab === 'organizations') {
      setActiveTab('overview');
      return;
    }
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

  // Mobile Back Button Navigation Trap & URL History Sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentTab = initialTab || 'overview';
    const initialRoute = tabToRoute[currentTab] || `/${currentTab}`;
    if (!window.history.state || !window.history.state.crmApp) {
      window.history.replaceState({ crmApp: true, tab: currentTab }, '', initialRoute);
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
      } else if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const matched = routeToTab[pathname] || 'overview';
        setActiveTab(matched);
      } else {
        setActiveTab('overview');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileMenuOpen, showCreateTask, showAddLead, showCreateProject, showAddEmployee, initialTab]);

  const [projectPrefill, setProjectPrefill] = useState<{
    client?: string;
    budget?: number;
    title?: string;
    leadId?: string;
  } | null>(null);
  const [selectedProjectIdForTask, setSelectedProjectIdForTask] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    // Platform Super Admin manages tenants only — never query or populate tenant operational CRM data
    if (role === 'platform_super_admin') {
      setSyncing(false);
      setLoading(false);
      return;
    }

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
    if (role === 'platform_super_admin') {
      const allowed = ['organizations', 'inquiries', 'landing_cms', 'super_admin'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('organizations');
      }
      return;
    }
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
    if (role === 'platform_super_admin') {
      switch (activeTab) {
        case 'inquiries':
          return 'Inquiries & Platform Leads';
        case 'landing_cms':
          return 'Landing Page CMS';
        case 'organizations':
        case 'super_admin':
        default:
          return 'Organizations & Tenants';
      }
    }
    switch (activeTab) {
      case 'super_admin':
        return 'Organizations & Tenants';
      case 'overview':
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'Task Management';
      case 'leads':
        return 'Lead Management';
      case 'inquiries':
        return 'Inquiries Inbox';
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
        unreadInquiriesCount={unreadInquiriesCount}
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
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
        />

        {/* Inner Content Area (Isolated Vertical Scrolling) */}
        <main className="p-4 sm:p-6 md:p-8 pb-24 lg:pb-8 flex-1 min-h-0 overflow-y-auto overflow-x-hidden max-w-7xl w-full mx-auto scroll-smooth focus:outline-none">
          {/* Business Intelligence Header & Pill Navigation - strictly for company tenant users */}
          {role !== 'platform_super_admin' && (
            <BusinessIntelligenceNav
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              syncing={syncing}
            />
          )}

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
          ) : role === 'platform_super_admin' ? (
            /* Super Admin Platform Console: Strictly tenant management only, zero company operational data */
            <div className="block">
              <ErrorBoundary fallbackTitle="Error loading Super Admin Console">
                <Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
                  <SuperAdminView
                    activeSection={
                      activeTab === 'inquiries'
                        ? 'inquiries'
                        : activeTab === 'landing_cms'
                        ? 'landing_cms'
                        : 'organizations'
                    }
                    onInquiriesCountChange={(cnt) => setUnreadInquiriesCount(cnt)}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          ) : (
            <ErrorBoundary fallbackTitle="Error loading workspace view">
              <Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>

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

              {/* 3b. Inquiries Management */}
              {visitedTabs.inquiries && (
                <div className={activeTab === 'inquiries' ? 'block' : 'hidden'}>
                  <InquiriesPanel onCountChange={(cnt) => setUnreadInquiriesCount(cnt)} />
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
                  <ManagementView
                    onRefresh={fetchData}
                    onOpenChangePassword={() => setShowChangePasswordModal(true)}
                  />
                </div>
              )}
              </Suspense>
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* Floating Mobile Bottom Navigation Dock (Company Users Only) */}
      {isAuthenticated && role !== 'platform_super_admin' && (
        <MobileBottomDock
          activeTab={activeTab}
          onNavigateTab={navigateToTab}
          onToggleMobileMenu={toggleMobileMenu}
        />
      )}

      {/* Change Password Modal: Forced on first login or On-Demand anytime */}
      {isAuthenticated && (showChangePasswordModal || Boolean(user?.must_change_password)) && (
        <ChangePasswordModal
          isOpen={true}
          isForced={Boolean(user?.must_change_password)}
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            setShowChangePasswordModal(false);
            updateUser({ must_change_password: false });
          }}
        />
      )}

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
