import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Question, QuestionType } from '@/types/question';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId || (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionData: any = await request.json();

    // Validate: Needs either testId OR isLibrary
    if (!questionData.text || !questionData.type) {
      return NextResponse.json(
        { error: 'Missing required fields: text and type are required' },
        { status: 400 }
      );
    }

    if (!questionData.testId && !questionData.isLibrary) {
      return NextResponse.json(
        { error: 'Question must belong to a Test or the Question Bank (isLibrary)' },
        { status: 400 }
      );
    }

    // Verify test ownership if testId is provided
    if (questionData.testId) {
      const test = await prisma.test.findFirst({
        where: {
          id: questionData.testId,
          companyId: session.user.companyId
        }
      });

      if (!test) {
        return NextResponse.json({ error: 'Test not found or access denied' }, { status: 404 });
      }
    }

    // Prepare metadata based on question type
    let metadata: any = questionData.metadata || {};

    // Merge/Validate metadata based on type
    switch (questionData.type) {
      case 'multiple_choice':
        metadata = {
          ...metadata,
          options: metadata.options || questionData.options || [],
          correctAnswer: metadata.correctAnswer ?? questionData.correctAnswer ?? 0,
          points: metadata.points || questionData.points || 1
        };
        break;
      case 'short_answer':
        metadata = {
          ...metadata,
          expectedAnswer: metadata.expectedAnswer || questionData.expectedAnswer,
          acceptAlternateAnswers: metadata.acceptAlternateAnswers ?? questionData.acceptAlternateAnswers ?? false,
          alternateAnswers: metadata.alternateAnswers || questionData.alternateAnswers || [],
          points: metadata.points || questionData.points || 1
        };
        break;
      case 'essay':
        metadata = {
          ...metadata,
          minWords: metadata.minWords || questionData.minWords || 50,
          maxWords: metadata.maxWords || questionData.maxWords || 1000,
          evaluationCriteria: metadata.evaluationCriteria || questionData.evaluationCriteria || [],
          points: metadata.points || questionData.points || 10
        };
        break;
      case 'code':
        metadata = {
          ...metadata,
          language: metadata.language || questionData.language || 'javascript',
          starterCode: metadata.starterCode || questionData.starterCode || '',
          testCases: metadata.testCases || questionData.testCases || [],
          timeLimit: metadata.timeLimit || questionData.timeLimit || 30,
          memoryLimit: metadata.memoryLimit || questionData.memoryLimit || 512,
          points: metadata.points || questionData.points || 20
        };
        break;
    }

    const question = await prisma.question.create({
      data: {
        testId: questionData.testId || null,
        companyId: session.user.companyId,
        type: questionData.type,
        text: questionData.text,
        difficulty: questionData.difficulty || 'Medium',
        timeToStart: questionData.timeLimit || null,
        order: questionData.order || 0,
        isLibrary: questionData.isLibrary || false,
        isTechnical: questionData.isTechnical ?? true,
        category: questionData.category || null,
        tags: questionData.tags ? JSON.stringify(questionData.tags) : null,
        metadata: JSON.stringify(metadata)
      }
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Error creating question' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId || (session.user.role !== 'RECRUITER' && session.user.role !== 'COMPANY_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const type = searchParams.get('type') as QuestionType | null;
    const isLibrary = searchParams.get('isLibrary') === 'true';

    const where: any = {};

    if (isLibrary) {
      where.companyId = session.user.companyId;
      where.isLibrary = true;
    } else if (testId) {
      where.testId = testId;
      // Verify test belongs to company implicitly via relation logic or pre-check?
      // Better: where.test.companyId check is safe if relation exists
      // But question table now has companyId. Is it populated for OLD questions?
      // OLD questions might NOT have companyId populated.
      // So relying on `companyId` directly on Question is risky for OLD data unless we backfilled.
      // For test questions, stick to `test: { companyId }`.

      where.test = {
        companyId: session.user.companyId
      };
    } else {
      return NextResponse.json({ error: 'Must provide testId or isLibrary=true' }, { status: 400 });
    }

    if (type) {
      where.type = type;
    }

    const difficulty = searchParams.get('difficulty');
    if (difficulty) {
      where.difficulty = difficulty;
    }

    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { text: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }

    const category = searchParams.get('category');
    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive'
      };
    }

    const tags = searchParams.get('tags');
    if (tags) {
      where.tags = {
        contains: tags,
        mode: 'insensitive'
      };
    }

    const isTechnical = searchParams.get('isTechnical');
    if (isTechnical !== null) {
      where.isTechnical = isTechnical === 'true';
    }

    const language = searchParams.get('language');
    if (language) {
      const languageFilter = {
        OR: [
          {
            metadata: {
              contains: `"language":"${language.toLowerCase()}"`
            }
          },
          {
            tags: {
              contains: language,
              mode: 'insensitive'
            }
          }
        ]
      };

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          languageFilter
        ];
        delete where.OR;
      } else {
        Object.assign(where, languageFilter);
      }
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: isLibrary ? { createdAt: 'desc' } : { order: 'asc' },
        skip,
        take: limit
      }),
      prisma.question.count({ where })
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      debug: {
        userCompanyId: session.user.companyId,
        queryWhere: where,
        isLibraryParam: isLibrary
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Error fetching questions' },
      { status: 500 }
    );
  }
}
