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
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });

    console.log('Registration attempt:', { 
      attemptedEmail: email,
      existingUser: existingUser ? 'found' : 'not found',
      hasPassword: existingUser?.password ? 'yes' : 'no'
    });

    // If user exists and already has a password, they should login instead
    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please use a different email or sign in.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    
    if (existingUser && !existingUser.password) {
      // Update existing user (candidate created by interviewer) with password and role
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: fullName, // Allow updating name in case interviewer had incomplete info
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
    } else {
      // Create new user
      user = await prisma.user.create({
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
    }

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

