'use client';

import React from 'react';
import { Send, PhoneCall, KeyRound, ArrowRight } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Send an inquiry',
      description:
        'Submit the inquiry form below with your company name, team size, and operational requirements.',
      icon: Send,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
    },
    {
      number: '02',
      title: 'We contact you',
      description:
        'Our platform engineering team reviews your needs, schedules an alignment call, and configures your tenant instance.',
      icon: PhoneCall,
      color: 'text-purple-600 bg-purple-50 border-purple-200/60',
    },
    {
      number: '03',
      title: 'Get your workspace',
      description:
        'Receive your dedicated company portal URL, initial administrator credentials, and set up your branch geofences and staff.',
      icon: KeyRound,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
    },
  ];

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="how-it-works" className="py-16 sm:py-24 relative scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#635BFF] bg-[#F0EEFF] px-3.5 py-1.5 rounded-full border border-[#D8D4FF]">
            Onboarding Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            How to get started
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            From initial requirements to an active company workspace in three simple steps.
          </p>
        </div>

        {/* 3 Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-150 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-300 group-hover:text-[#635BFF] transition-colors">
                      {step.number}
                    </span>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Button */}
        <div className="text-center mt-12">
          <button
            type="button"
            onClick={scrollToContact}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#635BFF] hover:bg-[#5249EC] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#635BFF]/25 active:scale-95 transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            <span>Request Your Company Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
