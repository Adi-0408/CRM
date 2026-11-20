'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is PrismCRM?',
      a: 'PrismCRM is an all-in-one multi-tenant enterprise operating system designed to unify sales pipelines, GST billing, project task management, smart geofenced attendance, automated payroll, and customer technical support inside a single, company-specific workspace.',
    },
    {
      q: 'Which business operations can PrismCRM manage?',
      a: 'PrismCRM manages 8 core operational domains: Lead Management & Quotations, GST Invoicing & Accounting, Project Delivery, Drag-and-drop Task Kanban Boards, Employee Directory & Leave, Smart GPS & Selfie Attendance, Payroll & Payslips, and Post-sale Customer Support Ticketing.',
    },
    {
      q: 'Can multiple companies use the platform?',
      a: 'Yes. PrismCRM is natively architected as a multi-tenant platform. Each registered company receives an independent, isolated operational instance, complete with their own staff records, client leads, and branch parameters.',
    },
    {
      q: 'Does every company receive its own workspace?',
      a: 'Yes. Every company accesses their own dedicated workspace. All operational records, documents, and credentials belong strictly to that company and are shielded by server-side authorization boundaries.',
    },
    {
      q: 'Can companies customize their branding?',
      a: 'Absolutely. Company Administrators can upload their corporate logo and select a custom theme color palette. The entire workspace UI dynamically adapts to match the company’s brand identity.',
    },
    {
      q: 'Does PrismCRM support multiple branches?',
      a: 'Yes. Organizations can set up multiple physical office branches. For each branch, you define its exact GPS latitude and longitude coordinates along with a custom geofence radius (e.g., 50m, 100m, 200m) to enforce attendance proximity.',
    },
    {
      q: 'What user roles are supported?',
      a: 'PrismCRM provides 8 distinct authenticated roles: Platform Super Admin, Company Administrator, Admin Manager / Team Lead, HR Manager, Accounts & Finance, Sales Executive, Developer (Web/Android), Technical Support, and Intern.',
    },
    {
      q: 'How does company onboarding work?',
      a: 'Onboarding is simple: 1) Submit an inquiry with your organization details; 2) The PrismCRM platform team reviews and provisions your company instance with initial admin credentials; 3) You log in to set up your branches, invite staff, and begin operations.',
    },
    {
      q: 'How can I request a workspace?',
      a: 'You can request a workspace immediately by filling out the Organization Inquiry Form below on this page. Specify your estimated team size and module interests, and our team will get in touch.',
    },
    {
      q: 'How do I contact the PrismCRM team?',
      a: 'You can reach us through the inquiry form below, via email at contact@prismcrm.com, or by calling our enterprise support line at +91 98765 43210. Our team responds promptly during standard business hours.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 relative overflow-hidden bg-white border-t border-slate-200/70">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Everything You Need to Know.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Common questions regarding PrismCRM multi-tenant architecture, modules, security, and deployment.
          </p>
        </div>

        {/* Accordions */}
        <div className="mt-14 space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-slate-50/80 border-[#635BFF]/40 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-[#635BFF] rounded-2xl"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-[#635BFF] text-white rotate-180' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 pt-1 text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-200/50 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
