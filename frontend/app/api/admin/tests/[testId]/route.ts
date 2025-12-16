import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        organization: {
          select: { name: true }
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            text: true,
            order: true,
            difficulty: true
          }
        },
        _count: {
          select: {
            assignments: true,
            questions: true
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const testWithOrgName = {
      ...test,
      organizationName: test.organization?.name
    };

    return NextResponse.json({ test: testWithOrgName });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const { title, description, duration } = await request.json();

    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: {
        title,
        jobDescription: description,
        duration
      }
    });

    return NextResponse.json({ test: updatedTest });
  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}