import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';

export const metadata: Metadata = {
  title: 'PrismCRM - Enterprise Management',
  description: 'Enterprise Customer Relationship Management and Organizational Analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="antialiased min-h-screen bg-gradient-to-br from-[#f4f3fa] via-[#f8f7fd] to-[#fdfcfe] text-slate-800 p-2 sm:p-4 lg:p-6 overflow-x-hidden selection:bg-[#635BFF]/10 selection:text-[#635BFF]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
