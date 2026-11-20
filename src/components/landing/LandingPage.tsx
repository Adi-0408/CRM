'use client';

import React, { useState, useEffect } from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import RolesSection from './RolesSection';
import InquiryForm from './InquiryForm';
import LandingFooter from './LandingFooter';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

export default function LandingPage() {
  const [content, setContent] = useState<ILandingContent>(DEFAULT_LANDING_CONTENT);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await fetch('/api/landing-content');
        if (res.ok) {
          const data = await res.json();
          if (data && data.hero) {
            setContent(data);
          }
        }
      } catch {}
    };
    loadContent();
  }, []);

  return (
    <div className="fixed inset-0 z-40 h-full overflow-y-auto scroll-smooth bg-gradient-to-br from-[#f4f3fa] via-[#f8f7fd] to-[#fdfcfe] text-slate-800 flex flex-col selection:bg-[#635BFF]/15 selection:text-[#635BFF]">
      {/* Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#635BFF] text-white rounded-xl shadow-lg font-semibold text-xs"
      >
        Skip to main content
      </a>

      {/* Sticky Navigation */}
      <LandingNav />

      {/* Main Page Content */}
      <main id="main-content" className="flex-1">
        <HeroSection hero={content.hero} />
        <FeaturesSection features={content.features} />
        <HowItWorksSection howItWorks={content.howItWorks} />
        <RolesSection />
        <InquiryForm />
      </main>

      {/* Footer */}
      <LandingFooter contact={content.contact} />
    </div>
  );
}
