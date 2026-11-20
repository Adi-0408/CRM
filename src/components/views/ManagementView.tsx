'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  Shield,
  Layers,
  Plus,
  Edit3,
  Trash2,
  X,
  Phone,
  Mail,
  Users,
  Palette,
  Globe,
  Upload,
  Image as ImageIcon,
  Save,
  Navigation,
  Compass,
  AlertCircle,
  Check,
} from 'lucide-react';
import CustomSelect from '@/components/common/CustomSelect';
import { useTenant, CompanyBranding } from '@/context/TenantContext';

interface ManagementViewProps {
  onRefresh: () => void;
}

interface BranchItem {
  _id?: string;
  name: string;
  city: string;
  address: string;
  manager: string;
  email: string;
  phone: string;
  activeEmployees: string;
  status: 'Head Office' | 'Branch Office' | 'Regional Hub' | 'Development Hub' | 'Sales Hub';
  isHeadOffice: boolean;
  lat?: number;
  lng?: number;
  radius_meters?: number;
}

const emptyForm: BranchItem = {
  name: '',
  city: '',
  address: '',
  manager: '',
  email: '',
  phone: '',
  activeEmployees: '1 Staff',
  status: 'Branch Office',
  isHeadOffice: false,
  lat: 16.84582,
  lng: 74.60055,
  radius_meters: 250,
};

const COLOR_PRESETS = [
  { name: 'Prism Indigo', primary: '#635BFF', accent: '#00D4B2' },
  { name: 'Emerald Growth', primary: '#059669', accent: '#10B981' },
  { name: 'Ocean Sapphire', primary: '#2563EB', accent: '#38BDF8' },
  { name: 'Royal Violet', primary: '#7C3AED', accent: '#F43F5E' },
  { name: 'Crimson Tech', primary: '#DC2626', accent: '#F97316' },
  { name: 'Amber Gold', primary: '#D97706', accent: '#FBBF24' },
  { name: 'Midnight Slate', primary: '#1E293B', accent: '#64748B' },
];

const CURRENCY_OPTIONS = [
  { value: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { value: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { value: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { value: 'AED', symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham' },
  { value: 'CAD', symbol: '$', label: 'CAD ($) - Canadian Dollar' },
  { value: 'AUD', symbol: '$', label: 'AUD ($) - Australian Dollar' },
  { value: 'SGD', symbol: '$', label: 'SGD ($) - Singapore Dollar' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'America/New_York', label: 'America/New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

export default function ManagementView({ onRefresh }: ManagementViewProps) {
  const { branding, updateBranding, refreshBranding } = useTenant();

  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'branches' | 'data'>('branding');
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState<Partial<CompanyBranding>>({
    brand_name: branding.brand_name || '',
    logo_url: branding.logo_url || '',
    favicon_url: branding.favicon_url || '',
    primary_color: branding.primary_color || '#635BFF',
    accent_color: branding.accent_color || '#00D4B2',
    currency_code: branding.currency_code || 'INR',
    currency_symbol: branding.currency_symbol || '₹',
    timezone: branding.timezone || 'Asia/Kolkata',
    support_email: branding.support_email || '',
    phone: branding.phone || '',
    address: branding.address || '',
  });
  const [savingBranding, setSavingBranding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    setBrandingForm({
      brand_name: branding.brand_name || '',
      logo_url: branding.logo_url || '',
      favicon_url: branding.favicon_url || '',
      primary_color: branding.primary_color || '#635BFF',
      accent_color: branding.accent_color || '#00D4B2',
      currency_code: branding.currency_code || 'INR',
      currency_symbol: branding.currency_symbol || '₹',
      timezone: branding.timezone || 'Asia/Kolkata',
      support_email: branding.support_email || '',
      phone: branding.phone || '',
      address: branding.address || '',
    });
  }, [branding]);

  // Branch CRUD State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [formData, setFormData] = useState<BranchItem>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBranches(data);
      }
    } catch (err: any) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (branch: BranchItem) => {
    setEditingBranch(branch);
    setFormData({
      ...branch,
      lat: branch.lat || 16.84582,
      lng: branch.lng || 74.60055,
      radius_meters: branch.radius_meters || 250,
    });
    setShowModal(true);
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }));
        setMessage('📍 Captured your current GPS coordinates for this office branch.');
      },
      (err) => {
        alert(`Failed to get GPS location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length !== 10) {
      setMessage('❌ Phone number must be exactly 10 digits (no more, no less).');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      const payload = {
        ...formData,
        phone: cleanPhone,
        lat: Number(formData.lat) || 16.84582,
        lng: Number(formData.lng) || 74.60055,
        radius_meters: Number(formData.radius_meters) || 250,
      };

      if (editingBranch && editingBranch._id) {
        // Update existing
        const res = await fetch(`/api/branches/${editingBranch._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage(`✅ "${formData.name}" updated successfully!`);
          setShowModal(false);
          await fetchBranches();
        } else {
          setMessage(`❌ ${data.error || 'Failed to update'}`);
        }
      } else {
        // Create new
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage(`✅ New branch "${formData.name}" created successfully!`);
          setShowModal(false);
          await fetchBranches();
        } else {
          setMessage(`❌ ${data.error || 'Failed to create branch'}`);
        }
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (id?: string, name?: string) => {
    if (!id) return;
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Branch "${name}" deleted.`);
        await fetchBranches();
      } else {
        setMessage(`❌ ${data.error || 'Failed to delete'}`);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  // Image File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WEBP, ICO).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    try {
      if (type === 'logo') setUploadingLogo(true);
      else setUploadingFavicon(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'branding');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.secure_url;
        if (type === 'logo') {
          setBrandingForm((prev) => ({ ...prev, logo_url: url }));
        } else {
          setBrandingForm((prev) => ({ ...prev, favicon_url: url }));
        }
        setMessage(`✅ ${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully.`);
      } else {
        // Fallback: Read as base64 Data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (type === 'logo') {
            setBrandingForm((prev) => ({ ...prev, logo_url: dataUrl }));
          } else {
            setBrandingForm((prev) => ({ ...prev, favicon_url: dataUrl }));
          }
        };
        reader.readAsDataURL(file);
        setMessage(`✅ ${type === 'logo' ? 'Logo' : 'Favicon'} loaded.`);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      // Data URL fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (type === 'logo') {
          setBrandingForm((prev) => ({ ...prev, logo_url: dataUrl }));
        } else {
          setBrandingForm((prev) => ({ ...prev, favicon_url: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBranding(true);
      setMessage('');

      const success = await updateBranding(brandingForm);
      if (success) {
        setMessage('✅ White-label branding & localization settings saved and applied dynamically!');
        await refreshBranding();
        onRefresh();
      } else {
        setMessage('❌ Failed to update branding settings.');
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSavingBranding(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all database records for this company?')) return;
    try {
      setClearing(true);
      setMessage('');
      const res = await fetch('/api/seed', { method: 'DELETE' });
      const data = await res.json();
      setMessage(data.message || 'All records cleared');
      onRefresh();
    } catch (err: any) {
      setMessage(err.message || 'Error clearing database');
    } finally {
      setClearing(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setMessage('');
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Sample data populated');
      onRefresh();
      await fetchBranches();
    } catch (err: any) {
      setMessage(err.message || 'Error seeding database');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dynamic Organization Overview Card */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-sm flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: branding.primary_color || '#635BFF' }}
          >
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.brand_name} className="w-full h-full object-cover" />
            ) : (
              (branding.brand_name || 'CRM').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                {branding.brand_name || branding.name || 'Enterprise Workspace'}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                Active Tenant
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Organization Slug: <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 font-mono">{branding.slug}</code> • Currency: <span className="font-semibold text-slate-700">{branding.currency_code} ({branding.currency_symbol})</span>
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('branding')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'branding'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" style={{ color: branding.primary_color || 'var(--color-primary, #635BFF)' }} />
            <span>White-Label &amp; Branding</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('branches')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'branches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Offices &amp; Geofences</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('data')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'data'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Tenant Data</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs font-medium rounded-2xl flex items-center justify-between animate-in fade-in">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUB-TAB 1: White-Label Customization & Branding */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Main Customization Form */}
          <div className="lg:col-span-2 bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h4 className="text-base font-bold text-slate-900">White-Label &amp; Brand Identity</h4>
                <p className="text-xs text-slate-400 mt-0.5">Customize your brand name, logos, theme palette, and currency</p>
              </div>
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={savingBranding}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white btn-brand-primary shadow-sm hover:shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingBranding ? 'Saving...' : 'Save Branding'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-5 text-xs">
              {/* Brand Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Brand Name * <span className="font-normal text-slate-400">(Replaces &ldquo;PrismCRM&rdquo; across sidebar, headers, and tabs)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp CRM"
                  value={brandingForm.brand_name}
                  onChange={(e) => setBrandingForm({ ...brandingForm, brand_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900"
                />
              </div>

              {/* Logo & Favicon Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Company Logo</label>
                    <span className="text-[10px] text-slate-400">PNG / SVG / JPG</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0"
                      style={{ backgroundColor: brandingForm.primary_color || '#635BFF' }}
                    >
                      {brandingForm.logo_url ? (
                        <img src={brandingForm.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-black text-lg">
                          {(brandingForm.brand_name || 'C').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-2xs">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="hidden"
                        />
                      </label>
                      {brandingForm.logo_url && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm({ ...brandingForm, logo_url: '' })}
                          className="ml-2 text-[10px] text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter image URL"
                    value={brandingForm.logo_url}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                  />
                </div>

                {/* Favicon */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Browser Favicon</label>
                    <span className="text-[10px] text-slate-400">ICO / PNG / SVG</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {brandingForm.favicon_url ? (
                        <img src={brandingForm.favicon_url} alt="Favicon" className="w-6 h-6 object-contain" />
                      ) : (
                        <Globe className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-2xs">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>{uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'favicon')}
                          className="hidden"
                        />
                      </label>
                      {brandingForm.favicon_url && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm({ ...brandingForm, favicon_url: '' })}
                          className="ml-2 text-[10px] text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter favicon URL"
                    value={brandingForm.favicon_url}
                    onChange={(e) => setBrandingForm({ ...brandingForm, favicon_url: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                  />
                </div>
              </div>

              {/* Theme Colors with Presets */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800">Theme Color Palette</label>
                    <p className="text-[11px] text-slate-400">Controls buttons, active badges, and brand highlights dynamically</p>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setBrandingForm({
                          ...brandingForm,
                          primary_color: preset.primary,
                          accent_color: preset.accent,
                        })
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition active:scale-95 text-[11px]"
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <span className="w-2.5 h-2.5 rounded-full -ml-1 border border-white" style={{ backgroundColor: preset.accent }} />
                      <span className="font-medium text-slate-700">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingForm.primary_color || '#635BFF'}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                        className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingForm.primary_color || '#635BFF'}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingForm.accent_color || '#00D4B2'}
                        onChange={(e) => setBrandingForm({ ...brandingForm, accent_color: e.target.value })}
                        className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingForm.accent_color || '#00D4B2'}
                        onChange={(e) => setBrandingForm({ ...brandingForm, accent_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Localization & Info: Currency & Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Workspace Currency *
                  </label>
                  <CustomSelect
                    value={brandingForm.currency_code || 'INR'}
                    onChange={(val) => {
                      const match = CURRENCY_OPTIONS.find((c) => c.value === val);
                      setBrandingForm({
                        ...brandingForm,
                        currency_code: val,
                        currency_symbol: match?.symbol || '₹',
                      });
                    }}
                    options={CURRENCY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Operational Timezone *
                  </label>
                  <CustomSelect
                    value={brandingForm.timezone || 'Asia/Kolkata'}
                    onChange={(val) => setBrandingForm({ ...brandingForm, timezone: val })}
                    options={TIMEZONE_OPTIONS}
                  />
                </div>
              </div>

              {/* Contact & Legal Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    placeholder="support@company.com"
                    value={brandingForm.support_email}
                    onChange={(e) => setBrandingForm({ ...brandingForm, support_email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={brandingForm.phone}
                    onChange={(e) => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Address / Invoicing Footer</label>
                <textarea
                  rows={2}
                  placeholder="HQ Building, Tech Zone, Business District"
                  value={brandingForm.address}
                  onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
                />
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="space-y-4">
            <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Live Brand Preview
              </span>

              {/* Brand Header Preview */}
              <div className="p-3.5 rounded-2xl border border-slate-150 bg-slate-50/50 flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0 overflow-hidden"
                  style={{ backgroundColor: brandingForm.primary_color || '#635BFF' }}
                >
                  {brandingForm.logo_url ? (
                    <img src={brandingForm.logo_url} alt="Preview Logo" className="w-full h-full object-cover" />
                  ) : (
                    (brandingForm.brand_name || 'C').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {brandingForm.brand_name || 'Brand Name'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Enterprise Workspace</div>
                </div>
              </div>

              {/* Interactive Widget Samples */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Sample Active Button</span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg text-white text-[11px] font-bold shadow-xs"
                      style={{ backgroundColor: brandingForm.primary_color || '#635BFF' }}
                    >
                      Primary Action
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Currency Formatter</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {brandingForm.currency_symbol || '₹'}1,250,000
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Accent Tag</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900 border"
                      style={{ backgroundColor: `${brandingForm.accent_color || '#00D4B2'}25`, borderColor: brandingForm.accent_color || '#00D4B2' }}
                    >
                      Accent Highlight
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Saved settings apply to client navigation, browser tabs, invoices, and login screens in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Offices, Branches & Attendance Geofences */}
      {activeSubTab === 'branches' && (
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h4 className="text-lg font-bold text-slate-900">Offices, Branches &amp; Attendance Geofences</h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure office locations, managers, and GPS perimeter geofences (&le; 250m) for verified staff clock-ins
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Branch</span>
            </button>
          </div>

          {loadingBranches ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading office branches...</div>
          ) : branches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
              No branch offices recorded yet. Click &ldquo;Add New Branch&rdquo; to configure your primary HQ office.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b) => (
                <div
                  key={b._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-slate-900 text-sm">{b.name}</h5>
                          {b.isHeadOffice && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              HQ
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {b.city}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{b.address}</p>

                    <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Manager:</span>
                        <span className="font-medium text-slate-700">{b.manager || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Geofence:</span>
                        <span className="font-mono text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded">
                          &le; {b.radius_meters || 250}m ({b.lat?.toFixed(4) || 16.8458}, {b.lng?.toFixed(4) || 74.6005})
                        </span>
                      </div>
                      {b.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-mono text-slate-700">{b.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Edit Branch"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {!b.isHeadOffice && (
                      <button
                        onClick={() => handleDeleteBranch(b._id, b.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: Tenant Data Management */}
      {activeSubTab === 'data' && (
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] animate-in fade-in duration-200">
          <div className="mb-6">
            <h4 className="text-base font-bold text-slate-900">Tenant Data Isolation &amp; Environment Tools</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Actions executed here operate strictly on <span className="font-bold text-slate-700">{branding.brand_name || branding.name}</span> data records only.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <h5 className="font-bold text-slate-800 text-sm">Seed Sample Data</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Initializes clean demonstration datasets (leads, tasks, projects, employees, and invoices) specifically within this company workspace.
              </p>
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                <span>{seeding ? 'Populating...' : 'Seed Sample Data'}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-3">
              <h5 className="font-bold text-rose-800 text-sm">Clear Tenant Data</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Permanently wipes all tasks, attendance logs, invoices, and leads belonging to this organization while preserving your company credentials and branch configs.
              </p>
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 shadow-2xs transition active:scale-95 disabled:opacity-50"
              >
                <span>{clearing ? 'Clearing Data...' : 'Clear All Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Modal with GPS Geofencing inputs */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingBranch ? 'Edit Office / Branch' : 'Add New Branch'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Branch / Office Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Corporate HQ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Office Type *
                  </label>
                  <CustomSelect
                    value={formData.status}
                    onChange={(val) => {
                      setFormData({
                        ...formData,
                        status: val as any,
                        isHeadOffice: val === 'Head Office',
                      });
                    }}
                    options={[
                      { value: 'Head Office', label: 'Head Office (HQ)' },
                      { value: 'Branch Office', label: 'Branch Office' },
                      { value: 'Regional Hub', label: 'Regional Hub' },
                      { value: 'Development Hub', label: 'Development Hub' },
                      { value: 'Sales Hub', label: 'Sales Hub' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City &amp; State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore, Karnataka"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Street Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Tower 4, Tech Park, Outer Ring Road, Bangalore"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                />
              </div>

              {/* GPS Geofencing Settings */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-teal-600" />
                    Attendance GPS Geofence
                  </span>
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <Compass className="w-3 h-3" />
                    Use My GPS Location
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Radius (meters)</label>
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      required
                      value={formData.radius_meters || 250}
                      onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) || 250 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch Manager / Lead *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Varma"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff / Team Allocation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. All Core Staff"
                    value={formData.activeEmployees}
                    onChange={(e) => setFormData({ ...formData, activeEmployees: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. hq@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Phone</label>
                    <span className={`text-[10px] font-mono ${formData.phone.replace(/\D/g, '').length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {formData.phone.replace(/\D/g, '').length}/10 digits
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="10-digit phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold btn-brand-primary text-white shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBranch ? 'Update Location' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
