import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePersonalizedQuestions as generateIntelligentQuestions, analyzeResumeIntelligently } from '@/lib/intelligent-fallback';
import { aiClient } from '@/lib/ai-client';



function generateIntelligentFallback(params: any) {
  const { jobDescription, resumeData, candidateName, mcqCount, conversationalCount, codingCount } = params;

  // Create analysis object from resume data or analyze job description
  let analysis;
  if (resumeData) {
    analysis = {
      skills: resumeData.skills || [],
      experience: resumeData.experience || '2-3 years',
      education: resumeData.education || 'Bachelor\'s Degree',
      achievements: resumeData.achievements || [],
      seniority: resumeData.seniority || 'mid',
      domains: resumeData.domains || ['Software Development']
    };
  } else {
    // Analyze job description to create intelligent questions
    analysis = analyzeResumeIntelligently(jobDescription || 'Software developer position');
  }

  return generateIntelligentQuestions(analysis, jobDescription || '', {
    mcq: mcqCount,
    conversational: conversationalCount,
    coding: codingCount
  });
}

async function generateQuestionsWithAI(params: any) {
  const { jobDescription, resumeData, candidateName, mcqCount, conversationalCount, codingCount } = params;

  const prompt = `You are an expert technical interviewer. Generate ${mcqCount + conversationalCount + codingCount} interview questions for ${candidateName} based on the job requirements and their background.

JOB DESCRIPTION:
${jobDescription || 'Software Developer position'}

CANDIDATE BACKGROUND:
- Skills: ${resumeData?.skills?.join(', ') || 'General programming skills'}
- Experience: ${resumeData?.experience || 'Entry to mid-level'}
- Education: ${resumeData?.education || 'Computer Science background'}

REQUIREMENTS:
Generate exactly ${mcqCount} multiple choice questions, ${conversationalCount} conversational questions, and ${codingCount} coding questions.

For MCQ questions, focus on:
- Technical concepts relevant to the job requirements
- Best practices in mentioned technologies
- Problem-solving scenarios they might face in this role

For conversational questions, focus on:
- Experience with specific technologies mentioned in job description
- Problem-solving approach and methodology
- How their background aligns with role requirements

For coding questions, focus on:
- Practical problems they'd solve in this role
- Technologies mentioned in job description

IMPORTANT: Return ONLY a valid JSON array. Each question must have this exact structure:
[
  {
    "id": "mcq_1",
    "type": "multiple_choice", 
    "text": "Question text here",
    "metadata": {
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    },
    "difficulty": "Medium",
    "order": 1,
    "tags": ["Tag1", "Tag2"]
  }
]
    
For each question, include a "tags" array with 1-3 specific skills or concepts tested (e.g., "React", "State Management", "Error Handling").

For conversational questions use type "essay" and for coding questions use type "code".`;

  return await aiClient.json({
    model: 'gpt-4o-mini',
    provider: 'gemini', // Prefer Free Tier
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    fallback: () => {
      console.warn('⚠️ AI Question Generation failed. Using Intelligent Fallback.');
      return generateIntelligentFallback(params);
    }
  });
}

export async function POST(request: NextRequest) {
  let mcqCount = 2, conversationalCount = 2, codingCount = 1; // Default values

  try {
    const requestData = await request.json();
    const {
      testId,
      candidateId,
      assignmentId,
      resumeUrl: providedResumeUrl,
      jobDescription: providedJobDescription,
      personalized = false
    } = requestData;

    // Extract counts with defaults
    mcqCount = requestData.mcqCount || 2;
    conversationalCount = requestData.conversationalCount || 2;
    codingCount = requestData.codingCount || 1;

    // Get test and candidate data including resume
    const testPromise = testId ? prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, jobDescription: true, resumeUrl: true, title: true }
    }) : Promise.resolve(null);

    const candidatePromise = candidateId ? prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { name: true, email: true, resumeUrl: true }
    }) : Promise.resolve(null);

    const [test, candidate] = await Promise.all([testPromise, candidatePromise]);

    if (!test && !providedJobDescription) {
      return NextResponse.json({ error: 'Test or Job Description is required' }, { status: 400 });
    }

    // Analyze resume if available (prioritize provided resume, then test's resume, then candidate's)
    let resumeData = null;
    const resumeUrl = providedResumeUrl || test?.resumeUrl || candidate?.resumeUrl;

    // Use provided job description if available, otherwise use test's job description
    const finalJobDescription = providedJobDescription || test?.jobDescription;

    if (resumeUrl) {
      try {
        console.log(`Analyzing resume from ${test?.resumeUrl ? 'interviewer upload' : 'candidate profile'}: ${resumeUrl}`);

        // Use direct service call instead of internal API fetch
        const { extractTextFromUrl, analyzeResumeWithAI } = await import('@/lib/resume-service');
        const resumeText = await extractTextFromUrl(resumeUrl);
        const analysis = await analyzeResumeWithAI(resumeText);

        resumeData = {
          success: true,
          analysis,
          message: 'Resume analyzed successfully'
        };
        console.log('Resume analyzed successfully');
      } catch (error) {
        console.log('Resume analysis failed, proceeding without it:', error);
      }
    }

    // Generate personalized questions (try AI first, fallback to intelligent system)
    console.log('Generating questions with params:', {
      hasJobDescription: !!finalJobDescription,
      hasResumeData: !!resumeData,
      candidateName: candidate?.name || 'Candidate',
      mcqCount,
      conversationalCount,
      codingCount
    });

    let aiQuestions;
    try {
      aiQuestions = await generateQuestionsWithAI({
        jobDescription: finalJobDescription || '',
        resumeData: resumeData?.analysis || null,
        candidateName: candidate?.name || 'Candidate',
        mcqCount,
        conversationalCount,
        codingCount
      });
      console.log(`Successfully generated ${aiQuestions.length} questions`);
    } catch (error) {
      console.error('AI question generation failed, using intelligent fallback:', error);
      // Use intelligent fallback
      aiQuestions = generateIntelligentFallback({
        jobDescription: finalJobDescription || '',
        resumeData: resumeData?.analysis || null,
        candidateName: candidate?.name || 'Candidate',
        mcqCount,
        conversationalCount,
        codingCount
      });
      console.log(`Fallback generated ${aiQuestions.length} questions`);
    }

    return NextResponse.json({
      questions: aiQuestions,
      resumeAnalysis: resumeData?.analysis || null,
      personalized: personalized && !!resumeUrl,
      message: `Generated ${aiQuestions.length} ${personalized && resumeUrl ? 'personalized' : 'standard'} questions`
    });
  } catch (error) {
    console.error('Error generating questions:', error);

    // Last resort: generate basic questions using intelligent fallback
    try {
      console.log('Attempting emergency fallback question generation...');
      const emergencyQuestions = generateIntelligentFallback({
        jobDescription: 'Software Developer position',
        resumeData: null,
        candidateName: 'Candidate',
        mcqCount: mcqCount || 2,
        conversationalCount: conversationalCount || 2,
        codingCount: codingCount || 1
      });

      return NextResponse.json({
        questions: emergencyQuestions,
        resumeAnalysis: null,
        personalized: false,
        message: `Generated ${emergencyQuestions.length} emergency fallback questions`,
        warning: 'Used emergency fallback due to system error'
      });
    } catch (fallbackError) {
      console.error('Emergency fallback also failed:', fallbackError);
      return NextResponse.json({
        error: 'Failed to generate questions - all systems failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
}

async function generatePersonalizedQuestions(params: any) {
  const { jobDescription, resumeData, candidateName, mcqCount, conversationalCount, codingCount } = params;

  // Extract skills from both job description and resume
  const jobSkills = extractSkillsFromJobDescription(jobDescription);
  const resumeSkills = resumeData?.skills || [];
  const resumeExperience = resumeData?.experience || '';

  // Find matching skills between job and resume
  const matchingSkills = jobSkills.filter(skill =>
    resumeSkills.some((rSkill: string) =>
      rSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(rSkill.toLowerCase())
    )
  );

  const questions = [];
  let order = 1;

  // Generate conversational questions based on job-resume match
  for (let i = 0; i < conversationalCount; i++) {
    let questionText = '';

    switch (i) {
      case 0:
        if (matchingSkills.length > 0) {
          questionText = `I noticed you have experience with ${matchingSkills.slice(0, 2).join(' and ')} which are key requirements for this role. Can you describe specific projects where you've applied these skills and the impact you made?`;
        } else if (jobSkills.length > 0) {
          questionText = `This role requires ${jobSkills.slice(0, 2).join(' and ')}. While I don't see these on your resume, tell me about your experience with similar technologies and how you'd approach learning these new ones.`;
        } else {
          questionText = `Tell me about your technical background and the programming languages or frameworks you're most comfortable with.`;
        }
        break;
      case 1:
        if (resumeExperience.includes('senior') || resumeExperience.includes('lead')) {
          questionText = `I see you have senior-level experience. This role also requires leadership. Describe a complex technical challenge you've solved and how you guided your team through it.`;
        } else {
          questionText = `Describe a challenging project you've worked on. What technical obstacles did you encounter and how did you overcome them?`;
        }
        break;
      case 2:
        questionText = resumeSkills.length > 0
          ? `Based on your background in ${resumeSkills.slice(0, 2).join(' and ')}, how would you approach the technical challenges mentioned in this job description?`
          : `How do you approach learning new technologies and staying current with industry trends?`;
        break;
      case 3:
        questionText = `Looking at both your background and this job description, what specific aspects of the role excite you most, and how do your skills align with what we're looking for?`;
        break;
      default:
        questionText = `Tell me about a time you had to learn a new technology or framework quickly for a project. How did you approach the learning process?`;
    }

    questions.push({
      id: `conv_${i + 1}`,
      type: 'essay',
      text: questionText,
      metadata: { minWords: 50, maxWords: 200 },
      difficulty: 'Medium',
      order: order++
    });
  }

  // Generate technical MCQ questions based on job requirements
  const mcqTemplates = [
    {
      template: "In {skill}, which approach is considered a best practice for {context}?",
      contexts: ["error handling", "code organization", "performance optimization", "security"],
      options: [
        "Use try-catch blocks and proper validation",
        "Ignore errors and let them propagate",
        "Use global variables for error tracking",
        "Disable all error checking in production"
      ],
      correctAnswer: 0
    },
    {
      template: "When working with {skill} in a team environment, what is the most important consideration?",
      contexts: ["version control", "code reviews", "documentation", "testing"],
      options: [
        "Following team coding standards and conventions",
        "Writing code as fast as possible",
        "Using the most advanced features available",
        "Avoiding collaboration to prevent conflicts"
      ],
      correctAnswer: 0
    },
    {
      template: "For {skill} applications, which is the recommended approach for {context}?",
      contexts: ["data management", "API design", "user interface", "deployment"],
      options: [
        "Follow industry standards and best practices",
        "Create custom solutions for everything",
        "Copy code from online tutorials without understanding",
        "Avoid using any external libraries or frameworks"
      ],
      correctAnswer: 0
    },
    {
      template: "In {skill} development, what should you prioritize when {context}?",
      contexts: ["debugging issues", "optimizing performance", "implementing features", "handling user input"],
      options: [
        "Code readability and maintainability",
        "Using the most complex algorithms available",
        "Minimizing the number of lines of code",
        "Avoiding any form of testing"
      ],
      correctAnswer: 0
    },
    {
      template: "When using {skill} for {context}, which principle should guide your decisions?",
      contexts: ["scalable architecture", "user experience", "data processing", "security implementation"],
      options: [
        "SOLID principles and clean code practices",
        "Making everything as abstract as possible",
        "Optimizing only for current requirements",
        "Avoiding any design patterns"
      ],
      correctAnswer: 0
    }
  ];

  for (let i = 0; i < mcqCount; i++) {
    const skill = jobSkills[i % jobSkills.length] || 'programming';
    const template = mcqTemplates[i % mcqTemplates.length];
    const context = template.contexts[i % template.contexts.length];

    // Customize options based on the skill
    let customOptions = [...template.options];
    if (skill.toLowerCase().includes('react')) {
      customOptions = [
        "Use hooks and functional components with proper state management",
        "Use class components for everything",
        "Avoid using any React features",
        "Mix jQuery with React components"
      ];
    } else if (skill.toLowerCase().includes('node')) {
      customOptions = [
        "Use async/await and proper error handling",
        "Use only synchronous operations",
        "Avoid using any npm packages",
        "Block the event loop with heavy computations"
      ];
    } else if (skill.toLowerCase().includes('database') || skill.toLowerCase().includes('sql')) {
      customOptions = [
        "Use parameterized queries and proper indexing",
        "Concatenate user input directly into queries",
        "Avoid using indexes for better flexibility",
        "Store all data in a single table"
      ];
    }

    questions.push({
      id: `mcq_${i + 1}`,
      type: 'multiple_choice',
      text: template.template.replace('{skill}', skill).replace('{context}', context),
      metadata: {
        options: customOptions,
        correctAnswer: 0
      },
      difficulty: 'Medium',
      order: order++
    });
  }

  // Generate coding questions based on job requirements
  for (let i = 0; i < codingCount; i++) {
    const primarySkill = jobSkills[0] || 'JavaScript';
    questions.push({
      id: `code_${i + 1}`,
      type: 'code',
      text: `Write a ${primarySkill} function that solves a common problem you might encounter in this role. Focus on clean, readable code with proper error handling.`,
      metadata: {
        language: primarySkill.toLowerCase().includes('java') ? 'javascript' : 'javascript',
        starterCode: `// Write your solution here\nfunction solution() {\n  // Your code here\n}`
      },
      difficulty: 'Hard',
      order: order++
    });
  }

  return questions;
}

function extractSkillsFromJobDescription(jobDescription: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C#', 'PHP',
    'Angular', 'Vue.js', 'Express', 'Django', 'Spring', 'Laravel', 'MongoDB', 'PostgreSQL',
    'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'REST API',
    'GraphQL', 'Microservices', 'Agile', 'Scrum', 'CI/CD', 'Testing', 'TDD'
  ];

  const foundSkills = commonSkills.filter(skill =>
    jobDescription.toLowerCase().includes(skill.toLowerCase())
  );

  return foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Node.js'];
}