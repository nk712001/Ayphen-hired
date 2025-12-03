'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Force HTTPS for secure cookies
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Check if we need to redirect to HTTPS
    if (typeof window !== 'undefined' && 
        window.location.protocol === 'http:' && 
        process.env.NODE_ENV === 'production') {
      window.location.href = window.location.href.replace('http://', 'https://');
      return;
    }
    
    setIsReady(true);
    
    // Log session info for debugging
    console.log('Session provider initialized');
    console.log('Protocol:', typeof window !== 'undefined' ? window.location.protocol : 'unknown');
    console.log('Secure context:', typeof window !== 'undefined' ? window.isSecureContext : 'unknown');
  }, []);
  
  if (!isReady) {
    return <div>Loading secure session...</div>;
  }
  
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
