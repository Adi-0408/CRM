'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import LoginPage from '@/components/LoginPage';

function BrandedLoginContent({
  initialSlug,
}: {
  initialSlug?: string;
}) {
  const routeParams = useParams();
  const slug =
    initialSlug ||
    (typeof routeParams?.companySlug === 'string'
      ? routeParams.companySlug
      : Array.isArray(routeParams?.companySlug)
        ? routeParams.companySlug[0]
        : undefined);

  return <LoginPage companySlug={slug} />;
}

export default function BrandedCompanyLoginPage({
  params,
}: {
  params?: { companySlug?: string } | Promise<{ companySlug?: string }>;
}) {
  // If params is provided as a sync object, extract it safely
  const initialSlug = params && !(params instanceof Promise) && typeof (params as any).companySlug === 'string'
    ? (params as any).companySlug
    : undefined;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-[#F4F3FA]">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <BrandedLoginContent initialSlug={initialSlug} />
    </Suspense>
  );
}
