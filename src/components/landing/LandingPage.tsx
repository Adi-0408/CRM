'use client';

import React, { useState, useEffect } from 'react';
import LandingNav from './LandingNav';
import HeroSection from './HeroSection';
import TrustSection from './TrustSection';
import FeaturesSection from './FeaturesSection';
import ProductShowcaseSection from './ProductShowcaseSection';
import ArchitectureSection from './ArchitectureSection';
import HowItWorksSection from './HowItWorksSection';
import RolesSection from './RolesSection';
import SecuritySection from './SecuritySection';
import PricingSection from './PricingSection';
import FaqSection from './FaqSection';
import InquiryForm from './InquiryForm';
import LandingFooter from './LandingFooter';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

export default function LandingPage() {
  const [content, setContent] = useState<ILandingContent>(DEFAULT_LANDING_CONTENT);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await fetch('/api/landing-content', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.hero || data.contact)) {
            setContent(data);
          }
        }
      } catch {
        // Fall back to DEFAULT_LANDING_CONTENT
      }
    };
    loadContent();
  }, []);

  return (
    <div
      id="landing-scroll-container"
      className="fixed inset-0 z-40 h-full overflow-y-auto scroll-smooth bg-gradient-to-br from-[#f4f3fa] via-[#f8f7fd] to-[#fdfcfe] text-slate-800 flex flex-col selection:bg-[#635BFF]/15 selection:text-[#635BFF]"
    >
      {/* Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#635BFF] text-white rounded-xl shadow-lg font-semibold text-xs"
      >
        Skip to main content
      </a>

      {/* 1. Sticky Frosted Navigation */}
      <LandingNav />

      {/* Main Page Content Flow */}
      <main id="main-content" className="flex-1">
        {/* 2. Impressive Hero Section with Interactive Dashboard Preview */}
        <HeroSection hero={content.hero} />

        {/* 3. Trust & Unified Operations Value Strip */}
        <TrustSection sectionTitle={content.features?.sectionTitle} />

        {/* 4. Complete 8-Module Features Grid */}
        <FeaturesSection features={content.features} />

        {/* 5. Interactive Product Showcase (Tabbed Workspace Views) */}
        <ProductShowcaseSection />

        {/* 6. Multi-Tenant Architecture & Workspace Isolation Visualizer */}
        <ArchitectureSection />

        {/* 7. 3-Step Animated Onboarding Timeline */}
        <HowItWorksSection howItWorks={content.howItWorks} />

        {/* 9. Role-Based Access Control (8 Roles Grid) */}
        <RolesSection />

        {/* 10. Verified Security & Compliance Section */}
        <SecuritySection />

        {/* 11. Deployment Options & Custom Consultation */}
        <PricingSection />

        {/* 12. 10-Item Expandable FAQ Accordion */}
        <FaqSection />

        {/* 13. Upgraded Enterprise Contact & Inquiry Section */}
        <InquiryForm contact={content.contact} />
      </main>

      {/* 14. Professional 5-Column Enterprise Footer */}
      <LandingFooter contact={content.contact} />
    </div>
  );
}
