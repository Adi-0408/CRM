'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, RoleConfig, ROLE_CONFIGS, DEMO_CREDENTIALS } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  isAuthenticating: boolean;
  authMessage: string;
  login: (email: string, password?: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  quickLogin: (targetRole: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  roleConfig: RoleConfig;
  hasAccessTo: (tabId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMessage, setAuthMessage] = useState('Initializing CRM Workspace...');

  // 1. Initial boot check from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email && parsed.role) {
          // If the stored role is one of the old roles, reset or migrate to new 8-roles
          const validRoles: UserRole[] = [
            'admin_manager',
            'team_lead',
            'hr',
            'accounts',
            'sales',
            'web_developer',
            'android_developer',
            'tech_support',
            'intern',
          ];
          if (!validRoles.includes(parsed.role)) {
            // Clear stale session
            localStorage.removeItem('crm_auth_user');
            localStorage.removeItem('crm_auth_token');
          } else {
            setUser(parsed);
            setAuthMessage(`Restoring session for ${parsed.name}...`);
          }
        }
      }
    } catch (e) {
      console.error('Error loading session from localStorage:', e);
    } finally {
      // Transitional loader for initial boot
      const timer = setTimeout(() => {
        setLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. Login Flow with ~900ms transitional LoadingScreen
  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      setAuthMessage('Verifying credentials...');
      setIsAuthenticating(true);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'pass123' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsAuthenticating(false);
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setAuthMessage(`Signing in as ${data.user.name}...`);

      // 800ms transitional display matching user prompt
      await new Promise((r) => setTimeout(r, 800));

      setUser(data.user);
      localStorage.setItem('crm_auth_user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('crm_auth_token', data.token);
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      console.error('Login error:', err);
      // Resilient fallback to demo user if network disconnects
      const match = DEMO_CREDENTIALS.find(
        (d) => d.email.toLowerCase() === email.toLowerCase()
      );
      if (match) {
        const fallbackUser: AuthUser = {
          id: `demo_${match.role}`,
          name: match.name,
          email: match.email,
          role: match.role,
          department: match.department,
          avatar: match.avatar,
          salary: match.baseSalary,
          baseSalary: match.baseSalary,
        };
        const roleLabel = ROLE_CONFIGS[match.role]?.label || 'Workspace';
        setAuthMessage(`Preparing ${roleLabel} Dashboard...`);
        await new Promise((r) => setTimeout(r, 800));

        setUser(fallbackUser);
        localStorage.setItem('crm_auth_user', JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser };
      }
      return { success: false, error: err.message || 'Network error during login' };
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 3. Quick 1-Click Login for immediate role testing
  const quickLogin = async (targetRole: UserRole): Promise<void> => {
    const demo = DEMO_CREDENTIALS.find((d) => d.role === targetRole) || DEMO_CREDENTIALS[0];
    await login(demo.email, demo.password);
  };

  // 4. In-App Role Switcher with transitional screen
  const switchRole = async (newRole: UserRole): Promise<void> => {
    const demo = DEMO_CREDENTIALS.find((d) => d.role === newRole) || DEMO_CREDENTIALS[0];
    const roleLabel = ROLE_CONFIGS[demo.role]?.label || 'Workspace';

    setIsAuthenticating(true);
    setAuthMessage(`Switching to ${roleLabel} Dashboard...`);

    await new Promise((r) => setTimeout(r, 600));

    const switchedUser: AuthUser = {
      id: `user_${demo.role}`,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      department: demo.department,
      avatar: demo.avatar,
      salary: demo.baseSalary,
      baseSalary: demo.baseSalary,
    };
    setUser(switchedUser);
    localStorage.setItem('crm_auth_user', JSON.stringify(switchedUser));
    setIsAuthenticating(false);
  };

  // 5. Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_auth_user');
    localStorage.removeItem('crm_auth_token');
  };

  const role: UserRole = user?.role || 'admin_manager';
  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.admin_manager;

  const hasAccessTo = (tabId: string): boolean => {
    if (role === 'admin_manager') return true;
    return roleConfig.allowedViews.includes(tabId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        loading,
        isAuthenticating,
        authMessage,
        login,
        quickLogin,
        switchRole,
        logout,
        roleConfig,
        hasAccessTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
