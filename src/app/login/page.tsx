'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';

export default function LoginRoutePage() {
  const router = useRouter();

  return (
    <LoginPage
      onSuccess={() => {
        router.push('/');
      }}
    />
  );
}
