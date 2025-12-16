import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST RESUME UPLOAD START ===');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', { userId: session?.user?.id, role: session?.user?.role });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    console.log('File:', { name: file?.name, size: file?.size });
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    try {
      const { prisma } = await import('@/lib/prisma');
      console.log('✅ Prisma imported');
      
      const userCount = await prisma.user.count();
      console.log('✅ Database works, users:', userCount);
      
      return NextResponse.json({ success: true, message: 'All tests passed' });
      
    } catch (prismaError) {
      console.error('❌ Prisma error:', prismaError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}