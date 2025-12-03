import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // In a real app, you would validate the credentials against your database
    // For now, we'll just simulate a successful login
    const { email, password } = await request.json();
    
    // Simple validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In a real app, you would validate the credentials here
    // For demo purposes, we'll accept any non-empty email and password
    if (email && password) {
      return NextResponse.json({
        user: {
          id: '1',
          email,
          fullName: 'Test User',
          role: 'candidate',
        },
        token: 'dummy-jwt-token'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
