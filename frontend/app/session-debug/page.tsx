'use client';

import { useSession } from 'next-auth/react';

export default function SessionDebugPage() {
  const { data: session, status } = useSession();

  return (
    <div style={{ padding: 32 }}>
      <h1>Session Debug</h1>
      <p>Status: <b>{status}</b></p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
