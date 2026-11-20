'use client';

import React from 'react';
import LoginPage from '@/components/LoginPage';

export default function BrandedCompanyLoginPage({
  params,
}: {
  params: { companySlug: string };
}) {
  return <LoginPage companySlug={params.companySlug} />;
}
