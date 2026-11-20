'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import CRMWorkspace from '@/components/CRMWorkspace';
import LandingPage from '@/components/landing/LandingPage';
import LoadingScreen from '@/components/LoadingScreen';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading PrismCRM..." />;
  }

  if (isAuthenticated) {
    return <CRMWorkspace initialTab="overview" />;
  }

  return <LandingPage />;
}
