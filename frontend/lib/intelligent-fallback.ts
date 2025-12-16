// Intelligent fallback system for resume analysis and question generation
// This provides high-quality personalized questions without requiring OpenAI

interface ResumeAnalysis {
  skills: string[];
  experience: string;
  education: string;
  achievements: string[];
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  domains: string[];
}

interface QuestionTemplate {
  template: string;
  type: 'multiple_choice' | 'essay' | 'code';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  options?: string[];
  correctAnswer?: number;
}

// Comprehensive skill database with related technologies
const SKILL_DATABASE = {
  'javascript': {
    related: ['typescript', 'node.js', 'react', 'vue', 'angular', 'express'],
    frameworks: ['react', 'vue.js', 'angular', 'svelte', 'next.js'],
    backend: ['node.js', 'express', 'nest.js', 'fastify'],
    testing: ['jest', 'mocha', 'cypress', 'playwright']
  },
  'python': {
    related: ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
    frameworks: ['django', 'flask', 'fastapi', 'pyramid'],
    data: ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch'],
    testing: ['pytest', 'unittest', 'nose']
  },
  'java': {
    related: ['spring', 'hibernate', 'maven', 'gradle'],
    frameworks: ['spring boot', 'spring mvc', 'struts', 'jsf'],
    testing: ['junit', 'testng', 'mockito'],
    build: ['maven', 'gradle', 'ant']
  },
  'react': {
    related: ['javascript', 'typescript', 'jsx', 'hooks', 'redux'],
    state: ['redux', 'context api', 'zustand', 'recoil'],
    routing: ['react router', 'next.js', 'reach router'],
    testing: ['react testing library', 'enzyme', 'jest']
  },
  'node.js': {
    related: ['javascript', 'express', 'npm', 'mongodb'],
    frameworks: ['express', 'koa', 'fastify', 'nest.js'],
    databases: ['mongodb', 'postgresql', 'mysql', 'redis'],
    testing: ['jest', 'mocha', 'supertest']
  },
  'figma': {
    related: ['ui design', 'ux design', 'prototyping', 'wireframing', 'design systems'],
    tools: ['sketch', 'adobe xd', 'invision', 'principle', 'framer'],
    concepts: ['user interface', 'user experience', 'responsive design', 'mobile design'],
    workflow: ['design handoff', 'design tokens', 'component libraries', 'style guides']
  },
  'sketch': {
    related: ['ui design', 'ux design', 'prototyping', 'wireframing', 'design systems'],
    tools: ['figma', 'adobe xd', 'invision', 'principle', 'abstract'],
    concepts: ['user interface', 'user experience', 'responsive design', 'mobile design'],
    workflow: ['design handoff', 'symbols', 'libraries', 'plugins']
  },
  'adobe': {
    related: ['photoshop', 'illustrator', 'xd', 'creative suite', 'visual design'],
    tools: ['photoshop', 'illustrator', 'xd', 'indesign', 'after effects'],
    concepts: ['graphic design', 'visual design', 'branding', 'typography'],
    workflow: ['creative cloud', 'asset management', 'color theory', 'composition']
  },
  'ui design': {
    related: ['ux design', 'figma', 'sketch', 'adobe xd', 'prototyping'],
    concepts: ['user interface', 'responsive design', 'design systems', 'wireframing'],
    tools: ['figma', 'sketch', 'adobe xd', 'invision', 'principle'],
    skills: ['visual hierarchy', 'typography', 'color theory', 'layout design']
  },
  'ux design': {
    related: ['ui design', 'user research', 'usability testing', 'wireframing'],
    concepts: ['user experience', 'user journey', 'information architecture', 'interaction design'],
    methods: ['user research', 'personas', 'journey mapping', 'usability testing'],
    tools: ['figma', 'sketch', 'miro', 'optimal workshop', 'hotjar']
  }
};

// Advanced resume analysis without AI
export function analyzeResumeIntelligently(resumeText: string, jobDescription?: string): ResumeAnalysis {
  const text = resumeText.toLowerCase();
  const jobText = jobDescription?.toLowerCase() || '';

  // Extract skills from both resume and job description
  const resumeSkills = extractSkills(text);
  const jobSkills = extractSkills(jobText);

  // Combine and prioritize skills (job requirements + resume skills)
  const allSkills = [...new Set([...jobSkills, ...resumeSkills])];
  const skills = allSkills.length > 0 ? allSkills : ['programming', 'software development'];

  console.log('Skill extraction results:', {
    resumeSkills,
    jobSkills,
    combinedSkills: skills
  });

  // Determine experience level (enhanced for professional resume context)
  const experience = determineExperience(text, resumeText.includes('PROFESSIONAL RESUME'));

  // Extract education
  const education = extractEducation(text);

  // Extract achievements
  const achievements = extractAchievements(text);

  // Determine seniority level based on skills and context
  const seniority = determineSeniority(text, skills, resumeText.includes('experienced professional'));

  // Identify technical domains based on skills
  const domains = identifyDomains(skills, text);

  return {
    skills,
    experience,
    education,
    achievements,
    seniority,
    domains
  };
}

function extractSkills(text: string): string[] {
  // Normalize text to handle variations
  let normalizedText = text.toLowerCase()
    .replace(/core java/g, 'java')
    .replace(/my sql/g, 'mysql')
    .replace(/react\.?js/g, 'react')
    .replace(/node\.?js/g, 'node.js')
    .replace(/vue\.?js/g, 'vue')
    .replace(/golang/g, 'go'); // Normalize 'golang' to 'go' for pattern matching

  console.log('Normalized Resume Text Snippet (First 200 chars):', normalizedText.substring(0, 200));

  const skillPatterns = [
    // Programming languages (Removed 'go' to avoid false positives, 'node.js' moved to frameworks)
    /\b(javascript|typescript|python|java|c\+\+|c#|php|ruby|swift|kotlin|scala|html|css|sql|mysql|postgresql)\b/g,
    // Frameworks and libraries
    /\b(react|angular|vue|svelte|next\.?js|nuxt\.?js|express|django|flask|spring|laravel|bootstrap|tailwind|jquery|node\.?js)\b/g,
    // Databases
    /\b(mongodb|redis|elasticsearch|cassandra|dynamodb|sqlite|oracle|mariadb)\b/g,
    // Cloud and DevOps
    /\b(aws|azure|gcp|google cloud|docker|kubernetes|jenkins|gitlab|github|terraform|ansible|ci\/cd|devops)\b/g,
    // Design tools and software
    /\b(figma|sketch|adobe|photoshop|illustrator|xd|indesign|after effects|premiere|creative suite|invision|principle|framer|zeplin|marvel|abstract)\b/g,
    // UI/UX Design concepts
    /\b(ui design|ux design|user interface|user experience|wireframing|prototyping|mockups|design systems|style guides|responsive design|mobile design|web design)\b/g,
    // Design methodologies
    /\b(design thinking|user research|usability testing|a\/b testing|user personas|journey mapping|information architecture|interaction design|visual design)\b/g,
    // Development tools and technologies
    /\b(git|webpack|babel|eslint|prettier|jest|cypress|selenium|postman|api|rest|graphql|microservices)\b/g,
    // Mobile and platforms
    /\b(ios|android|react native|flutter|xamarin|cordova|ionic|mobile)\b/g,
    // Methodologies and concepts
    /\b(agile|scrum|tdd|bdd|unit testing|integration testing|oop|functional programming|mvc|mvvm)\b/g
  ];

  const skills = new Set<string>();

  skillPatterns.forEach(pattern => {
    const matches = normalizedText.match(pattern);
    if (matches) {
      matches.forEach(match => skills.add(match.replace(/\./g, '.'))); // Keep original dot for node.js etc.
    }
  });

  // Special check for 'C' language (hard to regex safely)
  if (/\b(c)\b/.test(normalizedText) && !normalizedText.includes('objective-c')) {
    // Only add C if it appears in a list context or similar
    // skipping to avoid false positives with initial 'C'
  }

  // Specific checks for multi-word skills that might have been missed or normalized
  if (normalizedText.includes('go lang')) skills.add('go'); // Add 'go' if 'go lang' is found after normalization

  // Add related skills based on found skills
  const foundSkills = Array.from(skills);
  foundSkills.forEach(skill => {
    const skillInfo = SKILL_DATABASE[skill as keyof typeof SKILL_DATABASE];
    if (skillInfo) {
      skillInfo.related.forEach(related => {
        // Use word boundary check to avoid false positives (e.g. "go" in "good")
        const regex = new RegExp(`\\b${related}\\b`, 'i');
        if (regex.test(normalizedText)) { // Use normalizedText here
          skills.add(related);
        }
      });
    }
  });

  return Array.from(skills);
}

function determineExperience(text: string, isProfessionalResume: boolean = false): string {
  const experiencePatterns = [
    { pattern: /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/g, multiplier: 1 },
    { pattern: /(\d+)\s*months?\s*(of\s*)?(experience|exp)/g, multiplier: 0.083 },
    { pattern: /\b(senior|principal|staff|architect)\b/g, years: 5 }, // stricter boundaries
    { pattern: /\b(lead|manager|head of)\b/g, years: 4 },
    { pattern: /\b(junior|entry|intern|fresh|graduate)\b/g, years: 0 }
  ];

  let totalYears = 0;
  let hasExplicitYears = false;

  experiencePatterns.forEach(({ pattern, multiplier, years }) => {
    const matches = text.match(pattern);
    if (matches) {
      if (multiplier) {
        matches.forEach(match => {
          const yearMatch = match.match(/\d+/);
          if (yearMatch) {
            totalYears += parseInt(yearMatch[0]) * multiplier;
            hasExplicitYears = true;
          }
        });
      } else if (years !== undefined) {
        // Only apply title-based years if we haven't found explicit years
        if (!hasExplicitYears) {
          totalYears = Math.max(totalYears, years);
        }
      }
    }
  });

  if (!hasExplicitYears && totalYears === 0) {
    // Default to fresher/entry level if nothing else is found
    // The previous default of 2-3 years was causing "fresher" resumes to be rated as mid-level
    if (text.includes('senior') || text.includes('lead')) totalYears = 5;
    else if (text.includes('mid') || text.includes('intermediate')) totalYears = 3;
    else totalYears = 0.5; // Default to < 1 year (Entry Level)
  }

  if (totalYears <= 1) return 'Entry Level / Fresher';
  if (totalYears <= 2) return '1-2 years';
  if (totalYears <= 4) return '2-4 years';
  if (totalYears <= 7) return '4-7 years';
  return '7+ years';
}

function extractEducation(text: string): string {
  const educationPatterns = [
    /\b(phd|ph\.d|doctorate|doctoral)\b/i,
    /\b(master|msc|ms|mba|m\.s|m\.sc)\b/i,
    /\b(bachelor|bsc|bs|ba|b\.s|b\.sc|b\.a|b\.tech|b\.e)\b/i,
    /\b(associate|diploma|certificate)\b/i,
    /\b(computer science|software engineering|information technology|electrical engineering)\b/i
  ];

  for (const pattern of educationPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].toLowerCase().includes('phd') || match[0].toLowerCase().includes('doctorate')) {
        return 'PhD/Doctorate';
      }
      if (match[0].toLowerCase().includes('master') || match[0].toLowerCase().includes('msc')) {
        return 'Master\'s Degree';
      }
      if (match[0].toLowerCase().includes('bachelor') || match[0].toLowerCase().includes('bsc')) {
        return 'Bachelor\'s Degree';
      }
    }
  }

  return 'Technical Background';
}

function extractAchievements(text: string): string[] {
  const achievementPatterns = [
    /\b(led|managed|developed|built|created|designed|implemented|optimized|improved)\s+[^.]{10,100}/g,
    /\b(increased|reduced|improved|enhanced|streamlined)\s+[^.]{10,80}/g,
    /\b(award|recognition|certification|published|patent)\s+[^.]{5,60}/g
  ];

  const achievements: string[] = [];

  achievementPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.slice(0, 3).forEach(match => {
        achievements.push(match.trim());
      });
    }
  });

  if (achievements.length === 0) {
    achievements.push('Software development experience', 'Technical problem solving');
  }

  return achievements;
}

function determineSeniority(text: string, skills: string[], isExperiencedProfessional: boolean = false): 'junior' | 'mid' | 'senior' | 'lead' {
  const seniorityIndicators = {
    lead: ['lead', 'principal', 'staff', 'architect', 'director', 'cto', 'head of'],
    senior: ['senior', 'sr.', 'expert', 'specialist', '5+ years', '6+ years', '7+ years'],
    mid: ['mid', 'intermediate', '2+ years', '3+ years', '4+ years'],
    junior: ['junior', 'jr.', 'entry', 'intern', 'graduate', 'trainee']
  };

  for (const [level, indicators] of Object.entries(seniorityIndicators)) {
    if (indicators.some(indicator => text.includes(indicator))) {
      return level as 'junior' | 'mid' | 'senior' | 'lead';
    }
  }

  // Determine by skill diversity, complexity, and professional context
  if (skills.length > 15) return 'senior';
  if (skills.length > 8) return 'mid';
  if (skills.length > 3) return 'junior';

  // Consider professional resume context for borderline cases
  if (isExperiencedProfessional && skills.length > 5) return 'mid';
  if (isExperiencedProfessional) return 'mid';

  return 'junior';
}

function identifyDomains(skills: string[], text: string): string[] {
  const domainMap = {
    'UI/UX Design': ['figma', 'sketch', 'adobe', 'ui design', 'ux design', 'wireframing', 'prototyping', 'user interface', 'user experience', 'design systems'],
    'Visual Design': ['photoshop', 'illustrator', 'adobe', 'visual design', 'graphic design', 'branding', 'typography', 'color theory'],
    'Product Design': ['figma', 'sketch', 'user research', 'design thinking', 'usability testing', 'product strategy', 'user personas'],
    'Frontend Development': ['react', 'angular', 'vue', 'javascript', 'typescript', 'css', 'html'],
    'Backend Development': ['node.js', 'python', 'java', 'express', 'django', 'spring'],
    'Full Stack Development': ['react', 'node.js', 'javascript', 'mongodb', 'express'],
    'Mobile Development': ['react native', 'flutter', 'swift', 'kotlin', 'ionic'],
    'DevOps': ['docker', 'kubernetes', 'aws', 'jenkins', 'terraform', 'ansible'],
    'Data Science': ['python', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn'],
    'Machine Learning': ['tensorflow', 'pytorch', 'scikit-learn', 'keras', 'opencv'],
    'Database': ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch']
  };

  const domains: string[] = [];

  for (const [domain, domainSkills] of Object.entries(domainMap)) {
    const matchCount = domainSkills.filter(skill => skills.includes(skill)).length;
    if (matchCount >= 2) {
      domains.push(domain);
    }
  }

  return domains.length > 0 ? domains : ['Software Development'];
}

// Generate personalized questions based on analysis
export function generatePersonalizedQuestions(
  analysis: ResumeAnalysis,
  jobDescription: string,
  counts: { mcq: number; conversational: number; coding: number }
): any[] {
  const questions: any[] = [];
  let order = 1;

  // Generate conversational questions
  for (let i = 0; i < counts.conversational; i++) {
    questions.push(generateConversationalQuestion(analysis, jobDescription, i, order++));
  }

  // Generate MCQ questions
  for (let i = 0; i < counts.mcq; i++) {
    questions.push(generateMCQQuestion(analysis, jobDescription, i, order++));
  }

  // Generate coding questions
  for (let i = 0; i < counts.coding; i++) {
    questions.push(generateCodingQuestion(analysis, jobDescription, i, order++));
  }

  return questions;
}

function generateConversationalQuestion(analysis: ResumeAnalysis, jobDescription: string, index: number, order: number): any {
  // Create a unique seed based on candidate's skills and index for consistent but different randomization
  const candidateSignature = analysis.skills.join('').toLowerCase() + analysis.experience + index;
  const seed = candidateSignature.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  // Shuffle skills for variety
  const shuffledSkills = [...analysis.skills].sort(() => (seed % 3) - 1);
  const primarySkills = shuffledSkills.slice(0, 2 + (seed % 2)); // 2-3 skills

  const templates = [
    {
      condition: () => analysis.skills.length > 0,
      template: `I notice you have experience with ${primarySkills.join(', ')}. Can you describe a challenging project where you utilized ${primarySkills[0]} and explain how you overcame any technical obstacles?`
    },
    {
      condition: () => analysis.skills.length > 2,
      template: `Your background includes ${shuffledSkills.slice(0, 3).join(', ')}. How do you decide which technology stack to use for a new project, and what factors influence your decision?`
    },
    {
      condition: () => analysis.seniority === 'senior' || analysis.seniority === 'lead',
      template: `With your ${analysis.experience} of experience in ${analysis.domains[0] || 'software development'}, describe a time when you had to mentor junior developers. What approach did you take?`
    },
    {
      condition: () => analysis.domains.includes('Full Stack Development') || analysis.skills.some(s => ['react', 'angular', 'vue', 'node.js', 'express'].includes(s.toLowerCase())),
      template: `Given your experience with ${primarySkills.filter(s => ['react', 'angular', 'vue', 'node.js', 'express', 'javascript', 'typescript'].includes(s.toLowerCase())).join(' and ')}, how do you ensure seamless integration between frontend and backend components?`
    },
    {
      condition: () => analysis.achievements.length > 0,
      template: `Tell me about a significant technical achievement in your career involving ${primarySkills[0] || 'your primary technology'}. What made it challenging and how did you measure success?`
    },
    {
      condition: () => analysis.seniority === 'junior' || analysis.seniority === 'mid',
      template: `As someone with ${analysis.experience} in ${analysis.domains[0] || 'software development'}, what's the most complex problem you've solved using ${primarySkills[0]}, and what did you learn from it?`
    },
    {
      condition: () => true,
      template: `Based on your expertise in ${primarySkills.slice(0, 2).join(' and ')}, how would you approach scaling a system that initially worked well for a small user base but now needs to handle 10x the traffic?`
    }
  ];

  const applicableTemplates = templates.filter(t => t.condition());
  const selectedTemplate = applicableTemplates[index % applicableTemplates.length];

  return {
    id: `conv_${index + 1}`,
    type: 'essay',
    text: selectedTemplate.template,
    metadata: { minWords: 50, maxWords: 200 },
    difficulty: analysis.seniority === 'junior' ? 'Easy' : analysis.seniority === 'senior' ? 'Hard' : 'Medium',
    order
  };
}

function generateMCQQuestion(analysis: ResumeAnalysis, jobDescription: string, index: number, order: number): any {
  // Create candidate-specific seed for consistent randomization
  const candidateSignature = analysis.skills.join('') + analysis.seniority + index;
  const seed = candidateSignature.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  // Select different skills for different questions
  const skillIndex = (seed + index) % analysis.skills.length;
  const primarySkill = analysis.skills[skillIndex] || 'javascript';
  const secondarySkill = analysis.skills[(skillIndex + 1) % analysis.skills.length] || 'programming';

  const templates = [
    {
      question: `In ${primarySkill}, which approach is considered a best practice for error handling in ${analysis.seniority}-level development?`,
      options: [
        `Implement comprehensive error boundaries with detailed logging and user-friendly fallbacks`,
        `Use basic try-catch blocks without specific error type handling`,
        `Let errors bubble up to global handlers to avoid code complexity`,
        `Disable error checking in production for optimal performance`
      ],
      correct: 0
    },
    {
      question: `When architecting a ${primarySkill} application for ${analysis.domains[0] || 'web development'}, what is the most critical design consideration?`,
      options: [
        `Scalable architecture with proper separation of concerns and maintainable code structure`,
        `Using the latest framework features regardless of project requirements`,
        `Minimizing code size even if it reduces readability`,
        `Avoiding any third-party dependencies to reduce complexity`
      ],
      correct: 0
    },
    {
      question: `For ${primarySkill} performance optimization in ${analysis.domains[0] || 'production environments'}, which strategy is most effective?`,
      options: [
        'Profile first, then optimize based on actual bottlenecks',
        'Optimize everything from the beginning regardless of need',
        'Focus only on algorithmic complexity and ignore other factors',
        'Use micro-optimizations without measuring impact'
      ],
      correct: 0
    }
  ];

  // Customize options based on specific skills
  if (primarySkill === 'react') {
    templates[0].options = [
      'Use Error Boundaries and proper error handling in components',
      'Let errors crash the entire application',
      'Use try-catch in every component render method',
      'Disable error reporting in production'
    ];
  } else if (primarySkill === 'node.js') {
    templates[0].options = [
      'Use async/await with proper error handling and logging',
      'Use only synchronous operations to avoid errors',
      'Let uncaught exceptions crash the process',
      'Use callbacks without error handling'
    ];
  }

  const template = templates[index % templates.length];

  return {
    id: `mcq_${index + 1}`,
    type: 'multiple_choice',
    text: template.question,
    metadata: {
      options: template.options,
      correctAnswer: template.correct
    },
    difficulty: analysis.seniority === 'junior' ? 'Easy' : 'Medium',
    order
  };
}

function generateCodingQuestion(analysis: ResumeAnalysis, jobDescription: string, index: number, order: number): any {
  // Create candidate-specific seed for consistent randomization
  const candidateSignature = analysis.skills.join('') + analysis.seniority + index;
  const seed = candidateSignature.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  const primarySkill = analysis.skills.find(s => ['javascript', 'python', 'java', 'html', 'css'].includes(s)) || 'javascript';

  const templates = [
    // JavaScript Questions
    {
      skill: 'javascript',
      question: 'Write a function that debounces another function, ensuring it only executes after a specified delay has passed since the last call.',
      starter: '// Implement a debounce function\nfunction debounce(func, delay) {\n  // Your implementation here\n}'
    },
    {
      skill: 'javascript',
      question: 'Create a function that flattens a nested array of arbitrary depth without using built-in methods like flat().',
      starter: '// Flatten nested array\nfunction flattenArray(arr) {\n  // Your implementation here\n}'
    },
    {
      skill: 'javascript',
      question: 'Implement a simple event emitter class that supports on(), off(), and emit() methods.',
      starter: '// Event Emitter implementation\nclass EventEmitter {\n  constructor() {\n    // Your implementation here\n  }\n}'
    },
    // Python Questions
    {
      skill: 'python',
      question: 'Create a function that finds the most frequent element in a list and handles edge cases appropriately.',
      starter: '# Find the most frequent element in a list\ndef most_frequent(lst):\n    # Your implementation here\n    pass'
    },
    {
      skill: 'python',
      question: 'Implement a function that checks if a string is a valid palindrome, ignoring spaces and case.',
      starter: '# Check if string is palindrome\ndef is_palindrome(s):\n    # Your implementation here\n    pass'
    },
    {
      skill: 'python',
      question: 'Write a function that generates the first n numbers in the Fibonacci sequence using memoization.',
      starter: '# Fibonacci with memoization\ndef fibonacci(n):\n    # Your implementation here\n    pass'
    },
    // Java Questions
    {
      skill: 'java',
      question: 'Implement a thread-safe singleton pattern that ensures only one instance is created even in a multi-threaded environment.',
      starter: '// Implement a thread-safe singleton\npublic class Singleton {\n    // Your implementation here\n}'
    },
    {
      skill: 'java',
      question: 'Create a generic stack implementation with push, pop, peek, and isEmpty operations.',
      starter: '// Generic Stack implementation\npublic class Stack<T> {\n    // Your implementation here\n}'
    },
    {
      skill: 'java',
      question: 'Implement a method that reverses a linked list iteratively.',
      starter: '// Reverse linked list\nclass ListNode {\n    int val;\n    ListNode next;\n}\n\npublic ListNode reverseList(ListNode head) {\n    // Your implementation here\n}'
    },
    // HTML/CSS Questions
    {
      skill: 'html',
      question: 'Create a responsive navigation menu that collapses into a hamburger menu on mobile devices.',
      starter: '<!-- Responsive Navigation -->\n<nav class="navbar">\n  <!-- Your HTML structure here -->\n</nav>\n\n<style>\n/* Your CSS here */\n</style>'
    },
    {
      skill: 'css',
      question: 'Implement a CSS-only accordion component that expands and collapses content sections.',
      starter: '<!-- CSS Accordion -->\n<div class="accordion">\n  <!-- Your HTML structure here -->\n</div>\n\n<style>\n/* Your CSS implementation here */\n</style>'
    },
    // General Programming Questions
    {
      skill: 'general',
      question: 'Write a function that finds the two numbers in an array that add up to a target sum.',
      starter: '// Two Sum Problem\nfunction twoSum(nums, target) {\n  // Your implementation here\n}'
    },
    {
      skill: 'general',
      question: 'Implement a function that removes duplicates from an array while preserving the original order.',
      starter: '// Remove duplicates\nfunction removeDuplicates(arr) {\n  // Your implementation here\n}'
    }
  ];

  // Filter templates by skill, fallback to general questions
  const skillTemplates = templates.filter(t => t.skill === primarySkill || t.skill === 'general');
  const availableTemplates = skillTemplates.length > 0 ? skillTemplates : templates;

  // Use seed and index to select different templates
  const templateIndex = (seed + index) % availableTemplates.length;
  const template = availableTemplates[templateIndex];

  return {
    id: `code_${index + 1}`,
    type: 'code',
    text: template.question,
    metadata: {
      language: template.skill === 'general' ? 'javascript' : (template.skill === 'html' || template.skill === 'css' ? 'html' : template.skill),
      starterCode: template.starter
    },
    difficulty: analysis.seniority === 'junior' ? 'Medium' : 'Hard',
    order
  };
}
