'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CRMWorkspace from '@/components/CRMWorkspace';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'platform_super_admin') {
      router.replace('/super-admin');
    }
  }, [isAuthenticated, user?.role, router]);

  return <CRMWorkspace initialTab="overview" />;
}
