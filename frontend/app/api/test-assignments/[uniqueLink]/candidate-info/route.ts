import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { uniqueLink: string } }
) {
  try {
    // Get session to check if user is authenticated
    const session = await getServerSession(authOptions);
    
    // Find the test assignment
    const assignment = await prisma.testAssignment.findUnique({
      where: {
        uniqueLink: params.uniqueLink
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        test: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Test assignment not found',
        requiresSignup: true,
        redirectTo: '/auth/register'
      }, { status: 404 });
    }

    // Check if the candidate exists and is authenticated
    const candidateEmail = assignment.candidate.email;
    
    // If user is not authenticated or authenticated with different email
    if (!session || !session.user || session.user.email !== candidateEmail) {
      // Check if the candidate has ever logged in (has a password set)
      // For candidates created by interviewers, they won't have login credentials yet
      const userAccount = await prisma.user.findUnique({
        where: { email: candidateEmail || '' },
        select: { password: true, createdAt: true }
      });
      
      // If no user account exists or no password is set, redirect to register
      const shouldRegister = !userAccount || !userAccount.password;
      
      return NextResponse.json({
        candidateExists: true,
        isAuthenticated: false,
        requiresLogin: !shouldRegister,
        requiresSignup: shouldRegister,
        candidateEmail: candidateEmail,
        candidateName: assignment.candidate.name,
        testTitle: assignment.test.title,
        redirectTo: shouldRegister 
          ? `/auth/register?testLink=${params.uniqueLink}&email=${encodeURIComponent(candidateEmail || '')}&name=${encodeURIComponent(assignment.candidate.name || '')}`
          : `/auth/login?callbackUrl=/tests/preview/${params.uniqueLink}&email=${encodeURIComponent(candidateEmail || '')}`
      });
    }

    // User is authenticated and matches the candidate
    return NextResponse.json({
      candidateExists: true,
      isAuthenticated: true,
      requiresLogin: false,
      candidate: assignment.candidate,
      test: assignment.test,
      assignment: {
        id: assignment.id,
        status: assignment.status,
        uniqueLink: assignment.uniqueLink
      }
    });

  } catch (error) {
    console.error('Error checking candidate info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check candidate information',
        requiresSignup: true,
        redirectTo: '/auth/register'
      },
      { status: 500 }
    );
  }
}
