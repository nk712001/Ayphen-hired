'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState('');

  useEffect(() => {
    // Log cookies
    setCookies(document.cookie);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Session Status</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {JSON.stringify({
            status,
            session: session ? {
              user: {
                name: session.user?.name,
                email: session.user?.email,
                image: session.user?.image ? 'Image exists' : 'No image',
              },
              expires: session.expires,
            } : 'No active session',
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Cookies</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {cookies || 'No cookies found'}
        </pre>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Links</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Profile Page</h3>
            <a 
              href="/profile" 
              className="text-blue-600 hover:underline block"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/profile';
              }}
            >
              /profile (full page load)
            </a>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">API Endpoints</h3>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/profile');
                  const data = await res.json();
                  console.log('Profile API response:', data);
                  alert(`Profile API Status: ${res.status}\n${JSON.stringify(data, null, 2)}`);
                } catch (error: unknown) {
                  console.error('API Error:', error);
                  if (error instanceof Error) {
                    alert(`API Error: ${error.message}`);
                  } else {
                    alert(`API Error: ${String(error)}`);
                  }
                }
              }}
              className="text-blue-600 hover:underline"
            >
              Test /api/profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
