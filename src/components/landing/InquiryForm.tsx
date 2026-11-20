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
  Compass,
} from 'lucide-react';

interface FormState {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  teamSize: string;
  interest: string;
  message: string;
  website: string; // Honeypot
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  message?: string;
}

export default function InquiryForm() {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    teamSize: '1-10',
    interest: 'Everything',
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
        if (!value.trim()) return 'Message is required.';
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

    // Mark all required fields as touched
    const newTouched = {
      name: true,
      email: true,
      phone: true,
      companyName: true,
      message: true,
    };
    setTouched(newTouched);

    // Validate all fields
    const newErrors: FormErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      companyName: validateField('companyName', formData.companyName),
      message: validateField('message', formData.message),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((err) => Boolean(err));
    if (hasErrors) {
      return;
    }

    try {
      setSubmitting(true);
      setServerError(null);

      // Create abort controller for 15s timeout
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
        setServerError(data.error || 'Too many submissions. Please wait a few minutes before trying again.');
      } else {
        setServerError(data.error || 'Failed to submit inquiry. Please review your details and try again.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setServerError('Request timed out. Please verify your connection and try again.');
      } else {
        setServerError('Could not send. Please try again.');
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
      teamSize: '1-10',
      interest: 'Everything',
      message: '',
      website: '',
    });
    setErrors({});
    setTouched({});
    setServerError(null);
    setIsSuccess(false);
  };

  return (
    <section id="contact" className="py-16 sm:py-24 relative scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Send className="w-3.5 h-3.5" />
            <span>Direct Inquiries</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Request an Organization Workspace
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Tell us about your team and operational scope. Our platform team will contact you to coordinate setup.
          </p>
        </div>

        {/* Card Form Wrapper */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-[0_15px_40px_rgba(15,23,42,0.06)] relative">
          {/* Success State Card */}
          {isSuccess ? (
            <div
              className="py-12 px-4 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200"
              aria-live="polite"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100/80 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Inquiry Received!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thanks, we&apos;ll contact you soon. Our platform team has received your inquiry and will reach out via work email.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                >
                  Send another inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Hidden Honeypot Field for anti-spam bots */}
              <div
                style={{ position: 'absolute', opacity: 0, zIndex: -1, pointerEvents: 'none', height: 0, width: 0 }}
                aria-hidden="true"
              >
                <label htmlFor="landing-form-website">Website Url</label>
                <input
                  id="landing-form-website"
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Grid: Name & Work Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="inquiry-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="inquiry-name"
                      type="text"
                      required
                      readOnly={submitting}
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="Jane Doe"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'inquiry-name-error' : undefined}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all min-h-[44px] ${
                        errors.name
                          ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-[#635BFF]/20 focus:border-[#635BFF]'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p id="inquiry-name-error" role="alert" className="text-[11px] text-rose-600 mt-1.5 font-medium">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Work Email */}
                <div>
                  <label htmlFor="inquiry-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Work email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="inquiry-email"
                      type="email"
                      required
                      readOnly={submitting}
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="jane@company.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'inquiry-email-error' : undefined}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all min-h-[44px] ${
                        errors.email
                          ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-[#635BFF]/20 focus:border-[#635BFF]'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p id="inquiry-email-error" role="alert" className="text-[11px] text-rose-600 mt-1.5 font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Grid: Mobile & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Mobile Number */}
                <div>
                  <label htmlFor="inquiry-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile number <span className="text-slate-400 font-normal">(10 digits)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="inquiry-phone"
                      type="tel"
                      maxLength={10}
                      readOnly={submitting}
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      placeholder="9876543210"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'inquiry-phone-error' : undefined}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all min-h-[44px] ${
                        errors.phone
                          ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-[#635BFF]/20 focus:border-[#635BFF]'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p id="inquiry-phone-error" role="alert" className="text-[11px] text-rose-600 mt-1.5 font-medium">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label htmlFor="inquiry-company" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="inquiry-company"
                      type="text"
                      readOnly={submitting}
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      onBlur={() => handleBlur('companyName')}
                      placeholder="Acme Innovations"
                      aria-invalid={Boolean(errors.companyName)}
                      aria-describedby={errors.companyName ? 'inquiry-company-error' : undefined}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all min-h-[44px] ${
                        errors.companyName
                          ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-[#635BFF]/20 focus:border-[#635BFF]'
                      }`}
                    />
                  </div>
                  {errors.companyName && (
                    <p id="inquiry-company-error" role="alert" className="text-[11px] text-rose-600 mt-1.5 font-medium">
                      {errors.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* Grid: Team Size & What are you interested in? */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Team Size */}
                <div>
                  <label htmlFor="inquiry-teamsize" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Team size
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <select
                      id="inquiry-teamsize"
                      disabled={submitting}
                      value={formData.teamSize}
                      onChange={(e) => handleChange('teamSize', e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all min-h-[44px]"
                    >
                      <option value="1-10">1-10 Employees</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="200+">200+ Employees</option>
                    </select>
                  </div>
                </div>

                {/* Primary Interest */}
                <div>
                  <label htmlFor="inquiry-interest" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    What are you interested in?
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <select
                      id="inquiry-interest"
                      disabled={submitting}
                      value={formData.interest}
                      onChange={(e) => handleChange('interest', e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all min-h-[44px]"
                    >
                      <option value="Everything">Everything (Unified Platform)</option>
                      <option value="Leads and sales">Leads and Sales Pipeline</option>
                      <option value="Projects and tasks">Projects and Task Management</option>
                      <option value="Attendance and payroll">Attendance and Payroll</option>
                      <option value="Support desk">Support Desk & Ticketing</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="inquiry-message" className="block text-xs font-semibold text-slate-700">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-semibold ${
                    formData.message.length > 1000 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    {formData.message.length}/1000
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    id="inquiry-message"
                    rows={4}
                    required
                    readOnly={submitting}
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    placeholder="Briefly describe your company operational goals and how PrismCRM can assist..."
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'inquiry-message-error' : undefined}
                    className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-y ${
                      errors.message
                        ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-[#635BFF]/20 focus:border-[#635BFF]'
                    }`}
                  />
                </div>
                {errors.message && (
                  <p id="inquiry-message-error" role="alert" className="text-[11px] text-rose-600 mt-1.5 font-medium">
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Server / Network Error Alert */}
              {serverError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{serverError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#635BFF] hover:bg-[#5249EC] disabled:bg-slate-300 text-white font-bold text-sm sm:text-base shadow-md shadow-[#635BFF]/25 hover:shadow-lg hover:shadow-[#635BFF]/35 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Workspace Inquiry</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
