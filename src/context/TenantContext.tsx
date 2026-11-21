'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface CompanyBranding {
  id?: string;
  name: string;
  slug: string;
  brand_name: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  accent_color: string;
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  support_email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended';
}

export const DEFAULT_BRANDING: CompanyBranding = {
  name: 'PrismCRM',
  slug: 'prism-crm',
  brand_name: 'PrismCRM',
  logo_url: '',
  favicon_url: '',
  primary_color: '#635BFF',
  accent_color: '#00D4B2',
  currency_code: 'INR',
  currency_symbol: '₹',
  timezone: 'Asia/Kolkata',
  support_email: 'support@crm.com',
  phone: '+91 99999 00000',
  address: 'Enterprise Tech Center',
  status: 'active',
};

interface TenantContextType {
  branding: CompanyBranding;
  loading: boolean;
  formatCurrency: (amount: number | string | undefined | null) => string;
  updateBranding: (updates: Partial<CompanyBranding>) => Promise<boolean>;
  refreshBranding: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [branding, setBranding] = useState<CompanyBranding>(() => {
    if (typeof window !== 'undefined') {
      try {
        // Clean up legacy global key if it exists
        localStorage.removeItem('crm_active_branding');
        const authRaw = localStorage.getItem('crm_auth_user');
        if (authRaw) {
          const authUser = JSON.parse(authRaw);
          if (authUser?.role === 'platform_super_admin') {
            return DEFAULT_BRANDING;
          }
          if (authUser?.company_id) {
            const cached = localStorage.getItem(`crm_branding_${authUser.company_id}`);
            if (cached) return JSON.parse(cached);
          }
        }
      } catch {}
    }
    return DEFAULT_BRANDING;
  });
  const [loading, setLoading] = useState(false);

  // Apply CSS Variables & Document Title dynamically
  const applyBrandingToDOM = useCallback((b: CompanyBranding) => {
    if (typeof document === 'undefined') return;

    const primary = b.primary_color || '#635BFF';
    const accent = b.accent_color || '#00D4B2';

    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-primary-hover', primary);
    document.documentElement.style.setProperty('--color-primary-light', `${primary}1a`);
    document.documentElement.style.setProperty('--color-primary-border', `${primary}33`);
    document.documentElement.style.setProperty('--color-accent', accent);
    document.documentElement.style.setProperty('--color-accent-light', `${accent}25`);

    if (b.brand_name) {
      document.title = `${b.brand_name} - Enterprise CRM`;
    }
    if (b.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = b.favicon_url;
    }
  }, []);

  const fetchCompanyBranding = useCallback(async () => {
    if (!isAuthenticated) {
      setBranding(DEFAULT_BRANDING);
      return;
    }

    // Platform Super Admin uses clean platform branding only - never any tenant's branding or custom logo
    if (user?.role === 'platform_super_admin') {
      setBranding(DEFAULT_BRANDING);
      return;
    }

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('crm_auth_token') : null;
      const res = await fetch('/api/companies/current', {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const comp = Array.isArray(data) ? data[0] : data;
        if (comp && (comp.name || comp.brand_name)) {
          const merged: CompanyBranding = {
            id: comp.id || comp._id,
            name: comp.name || 'PrismCRM',
            slug: comp.slug || 'prism-crm',
            brand_name: comp.brand_name || comp.name || 'PrismCRM',
            logo_url: comp.logo_url || '',
            favicon_url: comp.favicon_url || '',
            primary_color: comp.primary_color || '#635BFF',
            accent_color: comp.accent_color || '#00D4B2',
            currency_code: comp.currency_code || 'INR',
            currency_symbol: comp.currency_symbol || '₹',
            timezone: comp.timezone || 'Asia/Kolkata',
            support_email: comp.support_email || 'support@crm.com',
            phone: comp.phone || '',
            address: comp.address || '',
            status: comp.status || 'active',
          };

          setBranding(merged);
          const cacheKey = user?.company_id ? `crm_branding_${user.company_id}` : (comp.id || comp._id ? `crm_branding_${comp.id || comp._id}` : null);
          if (cacheKey) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(merged));
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tenant branding:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role, user?.company_id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanyBranding();
    } else {
      setBranding(DEFAULT_BRANDING);
    }
  }, [isAuthenticated, user?.company_id, user?.role, fetchCompanyBranding]);

  useEffect(() => {
    applyBrandingToDOM(branding);
  }, [branding, applyBrandingToDOM]);

  const formatCurrency = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return `${branding.currency_symbol || '₹'}0`;
    }
    const num = typeof amount === 'number' ? amount : Number(amount);
    return `${branding.currency_symbol || '₹'}${num.toLocaleString()}`;
  };

  const updateBranding = async (updates: Partial<CompanyBranding>): Promise<boolean> => {
    try {
      const res = await fetch('/api/companies/current', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) return false;

      const updated = await res.json();
      const merged: CompanyBranding = {
        ...branding,
        ...updated,
        brand_name: updated.brand_name || updated.name || branding.brand_name,
      };

      setBranding(merged);
      applyBrandingToDOM(merged);
      const cacheKey = user?.company_id ? `crm_branding_${user.company_id}` : (updated.id || updated._id ? `crm_branding_${updated.id || updated._id}` : null);
      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(merged));
        } catch {}
      }
      return true;
    } catch (err) {
      console.error('Error updating company branding:', err);
      return false;
    }
  };

  return (
    <TenantContext.Provider
      value={{
        branding,
        loading,
        formatCurrency,
        updateBranding,
        refreshBranding: fetchCompanyBranding,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
