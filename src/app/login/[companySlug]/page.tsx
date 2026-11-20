'use client';

import React, { Suspense } from 'react';
import LoginPage from '@/components/LoginPage';

export default function BrandedCompanyLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
