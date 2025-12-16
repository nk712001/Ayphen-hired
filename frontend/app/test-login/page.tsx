'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function TestLogin() {
  const [email, setEmail] = useState('interviewer@ayphen.com');
  const [password, setPassword] = useState('interviewer123');
  const [result, setResult] = useState('');

  const handleLogin = async () => {
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    setResult(JSON.stringify(res, null, 2));
    
    if (res?.ok) {
      window.location.href = '/interviewer/dashboard';
    }
  };

  return (
    <div className="p-8">
      <h1>Test Login</h1>
      <div className="space-y-4">
        <input 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full"
          placeholder="Email"
        />
        <input 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
        />
        <button 
          onClick={handleLogin}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Login
        </button>
        <pre className="bg-gray-100 p-4 text-sm">{result}</pre>
      </div>
    </div>
  );
}