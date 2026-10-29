'use client';

import React from 'react';
import LoginPage from './LoginPage';

interface LoginViewProps {
  onSuccess?: () => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  return <LoginPage onSuccess={onSuccess} />;
}
