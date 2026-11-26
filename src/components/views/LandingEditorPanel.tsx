'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Check,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

export default function LandingEditorPanel() {
  const [content, setContent] = useState<ILandingContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await authFetch('/api/super-admin/landing-content');
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      } else {
        setErrorMessage('Failed to fetch current landing page content.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading landing content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const res = await authFetch('/api/super-admin/landing-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setContent(data.content);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || 'Failed to save landing content.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing save.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all landing page text to system baseline defaults?')) {
      return;
    }

    try {
      setResetting(true);
      setErrorMessage(null);

      const res = await authFetch('/api/super-admin/landing-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToDefaults: true }),
      });

      if (res.ok) {
        setContent(DEFAULT_LANDING_CONTENT);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage('Failed to reset landing content.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error resetting content.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-150 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Landing Page Content Management (CMS)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize marketing copy, headlines, features description, and onboarding text.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/landing"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
            title="Open live landing page in new tab"
          >
            <ExternalLink className="w-4 h-4 text-purple-600" />
            <span>View Live Landing Page</span>
          </a>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || saving}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || resetting}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved Live!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Landing page content successfully saved! Changes are live across the website.</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-150 p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading landing page configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: Hero Banner */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Hero Section Settings</h3>
                <p className="text-xs text-slate-500">The first screen visitors see when landing on the website.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Top Pill Badge Text
                </label>
                <input
                  type="text"
                  value={content.hero.badgeText}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, badgeText: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Main Headline (H1)
                </label>
                <input
                  type="text"
                  value={content.hero.headline}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, headline: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subheadline Description
                </label>
                <textarea
                  rows={3}
                  value={content.hero.subheadline}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, subheadline: e.target.value },
                    }))
                  }
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary CTA Button Label
                </label>
                <input
                  type="text"
                  value={content.hero.primaryCtaText}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, primaryCtaText: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Secondary CTA Button Label
                </label>
                <input
                  type="text"
                  value={content.hero.secondaryCtaText}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, secondaryCtaText: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Features Section */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Features & Architecture Text</h3>
                <p className="text-xs text-slate-500">Headers and multi-tenant callout banner.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Features Badge Pill
                </label>
                <input
                  type="text"
                  value={content.features.sectionBadge}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      features: { ...prev.features, sectionBadge: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Features Section Title
                </label>
                <input
                  type="text"
                  value={content.features.sectionTitle}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      features: { ...prev.features, sectionTitle: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Features Section Subtitle
                </label>
                <input
                  type="text"
                  value={content.features.sectionSubtitle}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      features: { ...prev.features, sectionSubtitle: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Multi-Tenant Dark Banner Headline
                </label>
                <input
                  type="text"
                  value={content.features.multiTenantBannerTitle}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      features: { ...prev.features, multiTenantBannerTitle: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Multi-Tenant Dark Banner Subtitle
                </label>
                <textarea
                  rows={2}
                  value={content.features.multiTenantBannerSubtitle}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      features: { ...prev.features, multiTenantBannerSubtitle: e.target.value },
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500 resize-y"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: How It Works Steps */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <HelpCircle className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">How It Works Steps</h3>
                <p className="text-xs text-slate-500">The 3-step onboarding flow explained to visitors.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-150 space-y-3">
                <span className="text-xs font-bold text-purple-600 uppercase">Step 01</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={content.howItWorks.step1Title}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, step1Title: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={content.howItWorks.step1Desc}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, step1Desc: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white resize-y"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-150 space-y-3">
                <span className="text-xs font-bold text-purple-600 uppercase">Step 02</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={content.howItWorks.step2Title}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, step2Title: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={content.howItWorks.step2Desc}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, step2Desc: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white resize-y"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-150 space-y-3">
                <span className="text-xs font-bold text-purple-600 uppercase">Step 03</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={content.howItWorks.step3Title}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, step3Title: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={content.howItWorks.step3Desc}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        howItWorks: { ...prev.howItWorks, step3Desc: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white resize-y"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Contact & Footer Details */}
          <div className="bg-white rounded-3xl border border-slate-150 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Contact & Organization Details</h3>
                <p className="text-xs text-slate-500">Contact channels displayed in footer and communications.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Inquiries Email Address
                </label>
                <input
                  type="email"
                  value={content.contact.email}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={content.contact.phone}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Headquarters Location
                </label>
                <input
                  type="text"
                  value={content.contact.address}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, address: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Changes Saved &amp; Live!</span>
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved Live!</span>
                </>
              ) : (
                'Save All Landing Page Changes'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
