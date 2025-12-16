'use client';

import { useEffect, useState } from 'react';

export default function TestDataPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-db')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      
      {data?.success ? (
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded">
            <h2 className="font-bold text-green-800">✅ Database Connected!</h2>
          </div>
          
          <div className="bg-white p-4 border rounded">
            <h3 className="font-bold mb-2">Database Stats:</h3>
            <p>Users: {data.data.userCount}</p>
            <p>Organizations: {data.data.orgCount}</p>
            <p>Companies: {data.data.companyCount}</p>
            <p>Database Path: {data.data.databasePath}</p>
          </div>
          
          <div className="bg-white p-4 border rounded">
            <h3 className="font-bold mb-2">Sample Users:</h3>
            {data.data.users.map((user: any, i: number) => (
              <div key={i} className="text-sm">
                {user.email} ({user.role}) - {user.name}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="font-bold text-red-800">❌ Database Error</h2>
          <p>{data?.error}</p>
        </div>
      )}
    </div>
  );
}