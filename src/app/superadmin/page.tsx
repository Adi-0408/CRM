'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/super-admin');
  }, [router]);

  return null;
}
