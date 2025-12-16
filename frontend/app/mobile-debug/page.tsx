'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function MobileDebugPage() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[Mobile Debug] ${message}`);
  };

  useEffect(() => {
    addLog('Page loaded');
    addLog(`URL: ${window.location.href}`);
    addLog(`Search params: ${searchParams?.toString() || 'none'}`);
    
    if (searchParams) {
      const urlSessionId = searchParams.get('sessionId');
      addLog(`Session ID from URL: ${urlSessionId}`);
      
      if (urlSessionId && urlSessionId !== 'null') {
        setSessionId(urlSessionId);
        addLog(`Session ID set to: ${urlSessionId}`);
        
        // Try to store it
        try {
          localStorage.setItem('mobileSessionId', urlSessionId);
          addLog('Session ID stored in localStorage');
        } catch (e) {
          addLog(`localStorage error: ${e}`);
        }
      } else {
        addLog('Invalid session ID from URL');
      }
    } else {
      addLog('No search params available');
    }
  }, [searchParams]);

  const testConnection = async () => {
    if (!sessionId) {
      addLog('No session ID available for test');
      return;
    }

    try {
      addLog(`Testing connection with session ID: ${sessionId}`);
      
      const response = await fetch('/api/setup/mobile-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          connected: true,
          timestamp: Date.now(),
          enhanced: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`Connection test successful: ${JSON.stringify(result)}`);
      } else {
        const errorText = await response.text();
        addLog(`Connection test failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      addLog(`Connection test error: ${error}`);
    }
  };

  const checkDebugAPI = async () => {
    if (!sessionId) {
      addLog('No session ID for debug check');
      return;
    }

    try {
      const response = await fetch(`/api/debug-mobile?sessionId=${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        addLog(`Debug API result: ${JSON.stringify(result, null, 2)}`);
      } else {
        addLog(`Debug API failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`Debug API error: ${error}`);
    }
  };

  return (
    <div className="p-4 bg-black text-white min-h-screen">
      <h1 className="text-xl font-bold mb-4">Mobile Debug Page</h1>
      
      <div className="mb-4">
        <p><strong>Session ID:</strong> {sessionId || 'None'}</p>
        <p><strong>Enhanced Mode:</strong> {searchParams?.get('enhanced') || 'false'}</p>
        <p><strong>FPS:</strong> {searchParams?.get('fps') || 'default'}</p>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testConnection}
          className="block w-full p-2 bg-blue-600 text-white rounded"
          disabled={!sessionId}
        >
          Test Connection API
        </button>
        
        <button
          onClick={checkDebugAPI}
          className="block w-full p-2 bg-green-600 text-white rounded"
          disabled={!sessionId}
        >
          Check Debug API
        </button>
        
        <button
          onClick={() => setLogs([])}
          className="block w-full p-2 bg-red-600 text-white rounded"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="text-xs space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="font-mono">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
