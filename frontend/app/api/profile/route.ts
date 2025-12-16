import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

// Types
interface ProfileData {
  name?: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string | null;
  joinDate: string;
  updatedAt?: string;
}

// Mock database - replace with your actual database calls
const profiles: Record<string, ProfileData> = {};

// Input validation schema
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^\+?[\d\s-]{6,}$/, 'Invalid phone number').optional(),
  avatar: z.string().url('Invalid URL').optional().nullable(),
}).strict();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.warn('Unauthorized - No session or email found');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In a real app, fetch from your database
    const userProfile: ProfileData = profiles[session.user.email] || {
      name: session.user.name || 'User',
      email: session.user.email,
      phone: '',
      role: 'User',
      avatar: session.user.image || null,
      joinDate: new Date().toISOString(),
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.warn('Unauthorized - No session or email found');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await request.json();
    
    // Validate request data
    const validation = updateProfileSchema.safeParse(requestData);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.flatten() 
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const validatedData = validation.data;
    const userEmail = session.user.email;

    // In a real app, update your database here
    const updatedProfile: ProfileData = {
      ...(profiles[userEmail] || {
        name: session.user.name || 'User',
        email: userEmail,
        joinDate: new Date().toISOString(),
      }),
      ...validatedData,
      email: userEmail, // Ensure email cannot be changed
      updatedAt: new Date().toISOString(),
    };

    // Update the mock database
    profiles[userEmail] = updatedProfile;

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
