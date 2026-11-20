'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginPage from '@/components/LoginPage';

function LoginContent() {
  const searchParams = useSearchParams();
  const companySlug = searchParams.get('company') || undefined;

  return <LoginPage companySlug={companySlug} />;
}

export default function LoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
