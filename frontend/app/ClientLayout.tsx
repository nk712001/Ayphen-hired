'use client';

import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  );
}
