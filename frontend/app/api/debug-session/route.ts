import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json({
      session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}