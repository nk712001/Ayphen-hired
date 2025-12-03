import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json();

    // Simple validation
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { 
        email: email.toLowerCase().trim() 
      } 
    });

    console.log('Registration attempt:', { 
      attemptedEmail: email,
      existingUser: existingUser ? 'found' : 'not found'
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: fullName,
        role,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Determine redirect URL based on role
    let redirectUrl = '/auth/login?registered=1';
    if (role === 'interviewer') {
      redirectUrl = '/auth/interviewer/login?registered=1';
    } else if (role === 'admin') {
      redirectUrl = '/auth/admin/login?registered=1';
    }

    return NextResponse.json({ 
      user,
      redirectUrl
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

