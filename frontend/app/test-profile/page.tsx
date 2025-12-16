'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestProfile() {
  const router = useRouter();

  useEffect(() => {
    // Programmatically navigate to the profile page
    router.push('/profile');
  }, [router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Testing Profile Route</h1>
      <p>Redirecting to profile page...</p>
    </div>
  );
}
