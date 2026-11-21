'use client';

import React, { useState, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Mail,
  User,
  Phone,
  MessageSquare,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import CustomSelect from '@/components/common/CustomSelect';

interface FormState {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  teamSize: string;
  interest: string;
  message: string;
  website: string; // Honeypot field
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  message?: string;
}

const MODULE_OPTIONS = [
  'All-in-One Suite',
  'Sales & Quotations',
  'GST Invoicing & Finance',
  'Smart Attendance & Geofencing',
  'Project & Task Kanban',
  'HR & Payroll',
  'Technical Support Desk',
];

export default function InquiryForm() {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    teamSize: '11-50',
    interest: 'All-in-One Suite',
    message: '',
    website: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const validateField = (field: keyof FormState, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        if (value.trim().length > 80) return 'Name cannot exceed 80 characters.';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Work email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid work email address.';
        }
        if (value.trim().length > 120) return 'Email cannot exceed 120 characters.';
        return undefined;
      case 'phone':
        if (value.trim()) {
          const digits = value.replace(/\D/g, '');
          if (digits.length !== 10) return 'Mobile number must be exactly 10 digits.';
        }
        return undefined;
      case 'companyName':
        if (value.trim().length > 120) return 'Company name cannot exceed 120 characters.';
        return undefined;
      case 'message':
        if (!value.trim()) return 'Please describe your operational requirements.';
        if (value.trim().length < 10) return 'Message must be at least 10 characters.';
        if (value.trim().length > 1000) return 'Message cannot exceed 1000 characters.';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (serverError) setServerError(null);

    if (touched[field]) {
      const errorMsg = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTouched = {
      name: true,
      email: true,
      phone: true,
      companyName: true,
      message: true,
    };
    setTouched(newTouched);

    const newErrors: FormErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      companyName: validateField('companyName', formData.companyName),
      message: validateField('message', formData.message),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => Boolean(err))) {
      return;
    }

    try {
      setSubmitting(true);
      setServerError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setIsSuccess(true);
      } else if (res.status === 429) {
        setServerError(data.error || 'Too many submissions. Please wait a few moments before trying again.');
      } else {
        setServerError(data.error || 'Failed to submit inquiry. Please review your details and try again.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setServerError('Request timed out. Please check your network connection and try again.');
      } else {
        setServerError('Could not send inquiry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      teamSize: '11-50',
      interest: 'All-in-One Suite',
      message: '',
      website: '',
    });
    setErrors({});
    setTouched({});
    setServerError(null);
    setIsSuccess(false);
  };

  return (
    <section id="contact" className="py-20 sm:py-28 relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>Direct Enterprise Inquiries</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Let&apos;s Build a Smarter Workplace Together.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Tell us about your organization and discover how PrismCRM can simplify your business operations.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-6 sm:p-10 transition-all duration-300">
          {isSuccess ? (
            /* Success Feedback State */
            <div className="text-center py-10 sm:py-16 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-slate-900">Inquiry Received Successfully</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Thank you for your interest in PrismCRM! Our platform engineering team has received your workspace requirements and will reach out to{' '}
                  <span className="font-semibold text-slate-800">{formData.email}</span> within 24 business hours.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            /* Inquiry Input Form */
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Anti-spam Honeypot field (hidden) */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              {/* Server Error Alert */}
              {serverError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Submission Failed</div>
                    <div className="mt-0.5">{serverError}</div>
                  </div>
                </div>
              )}

              {/* Form Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="inquiry-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="inquiry-name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl border bg-slate-50/50 text-slate-900 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF] ${
                        errors.name && touched.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.name && touched.name && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="inquiry-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Work Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="inquiry-email"
                      type="email"
                      required
                      placeholder="rahul@company.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl border bg-slate-50/50 text-slate-900 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF] ${
                        errors.email && touched.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Form Row 2: Phone and Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="inquiry-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="inquiry-phone"
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl border bg-slate-50/50 text-slate-900 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF] ${
                        errors.phone && touched.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="inquiry-company" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Company / Organization Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="inquiry-company"
                      type="text"
                      placeholder="e.g. Apex Technologies Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      onBlur={() => handleBlur('companyName')}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                    />
                  </div>
                </div>
              </div>

              {/* Form Row 3: Team Size Dropdown & Primary Interest Chips */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="inquiry-teamsize" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Estimated Team Size
                    </label>
                    <CustomSelect
                      value={formData.teamSize}
                      onChange={(val) => handleChange('teamSize', val)}
                      icon={<Users className="w-4 h-4 text-slate-400" />}
                      buttonClassName="!py-3 !rounded-2xl !bg-slate-50/50 hover:!bg-white text-sm"
                      options={[
                        { value: '1-10', label: '1 - 10 Team Members' },
                        { value: '11-50', label: '11 - 50 Team Members' },
                        { value: '51-200', label: '51 - 200 Team Members' },
                        { value: '200+', label: '200+ Enterprise Staff' },
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Primary Module of Interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MODULE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('interest', opt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            formData.interest === opt
                              ? 'bg-[#635BFF] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Row 4: Message */}
              <div>
                <label htmlFor="inquiry-message" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Operational Requirements / Notes <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="inquiry-message"
                    required
                    rows={4}
                    placeholder="Describe your company branches, team structure, or specific workflows you'd like PrismCRM to manage..."
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    className={`w-full p-4 rounded-2xl border bg-slate-50/50 text-slate-900 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF] ${
                      errors.message && touched.message ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  />
                </div>
                {errors.message && touched.message ? (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.message}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Minimum 10 characters.</p>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#635BFF] via-[#5249EC] to-[#00D4B2] hover:opacity-95 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-[#635BFF]/30 active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Transmitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Organization Inquiry</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Privacy Assurance */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Your information is held in strict confidentiality. No spam.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
