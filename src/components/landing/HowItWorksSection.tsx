'use client';

import React from 'react';
import {
  Send,
  Sliders,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

interface HowItWorksSectionProps {
  howItWorks?: ILandingContent['howItWorks'];
}

export default function HowItWorksSection({
  howItWorks = DEFAULT_LANDING_CONTENT.howItWorks,
}: HowItWorksSectionProps) {
  const steps = [
    {
      num: '01',
      icon: Send,
      title: howItWorks?.step1Title || 'Request Your Workspace',
      desc:
        howItWorks?.step1Desc ||
        'Submit your organization details, estimated team size, and operational requirements through our inquiry portal.',
      badge: 'Step 1: Consultation',
      color: 'from-[#635BFF] to-[#5249EC]',
    },
    {
      num: '02',
      icon: Sliders,
      title: howItWorks?.step2Title || 'Workspace Configuration',
      desc:
        howItWorks?.step2Desc ||
        'The PrismCRM platform engineering team provisions your isolated tenant instance, applies your custom branding, and sets initial admin access.',
      badge: 'Step 2: Setup',
      color: 'from-[#5249EC] to-[#00D4B2]',
    },
    {
      num: '03',
      icon: Rocket,
      title: howItWorks?.step3Title || 'Start Managing Your Business',
      desc:
        howItWorks?.step3Desc ||
        'Receive access to your dedicated company portal. Configure branch geofence locations, invite team members, and manage end-to-end operations.',
      badge: 'Step 3: Go Live',
      color: 'from-[#00D4B2] to-emerald-500',
    },
  ];

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>Fast Onboarding</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Get Your Business Running in Three Simple Steps.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            From initial requirement submission to full team operations in hours, not weeks.
          </p>
        </div>

        {/* Desktop Horizontal / Mobile Vertical Timeline Grid */}
        <div className="relative mt-16 sm:mt-24">
          {/* Continuous connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-gradient-to-r from-[#635BFF] via-[#5249EC] to-[#00D4B2] -translate-y-8 z-0 rounded-full opacity-60" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-[#635BFF]/50 hover:bg-white hover:shadow-[0_20px_45px_-10px_rgba(99,91,255,0.15)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    {/* Step Number & Icon Header */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow-md shadow-[#635BFF]/25 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-3xl font-black text-slate-300 font-mono group-hover:text-[#635BFF] transition-colors">
                        {step.num}
                      </span>
                    </div>

                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
                      {step.badge}
                    </span>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Zero complex server maintenance</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct CTA */}
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={scrollToContact}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#635BFF] hover:bg-[#5249EC] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#635BFF]/30 hover:shadow-xl hover:shadow-[#635BFF]/40 active:scale-95 transition-all"
          >
            <span>Request Your Workspace Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
