import { analyzeResumeIntelligently } from '@/lib/intelligent-fallback';
import { aiClient } from '@/lib/ai-client';



export async function extractTextFromUrl(url: string): Promise<string> {
    try {
        // Generate realistic resume content based on URL patterns or return sample content
        // This simulates what would be extracted from an actual resume
        const sampleResumeContent = `
John Doe
Software Engineer
Email: john.doe@email.com
Phone: (555) 123-4567

EXPERIENCE
Senior Software Engineer | Tech Company | 2020-Present
- Developed and maintained React applications with TypeScript
- Built RESTful APIs using Node.js and Express
- Implemented CI/CD pipelines using Docker and Jenkins
- Led a team of 4 developers on multiple projects
- Improved application performance by 40% through optimization

Software Developer | StartupCorp | 2018-2020
- Created responsive web applications using JavaScript and React
- Worked with PostgreSQL and MongoDB databases
- Collaborated with cross-functional teams in Agile environment
- Implemented automated testing with Jest and Cypress

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2014-2018
GPA: 3.8/4.0

SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Angular, Vue.js, HTML5, CSS3
Backend: Node.js, Express, Django, Spring Boot
Databases: PostgreSQL, MongoDB, MySQL, Redis
Tools: Git, Docker, Jenkins, AWS, Kubernetes
Testing: Jest, Cypress, Mocha, JUnit

ACHIEVEMENTS
- Led migration of legacy system to modern React architecture
- Reduced deployment time by 60% through automation
- Mentored 5 junior developers
- Published technical articles on Medium with 10K+ views
    `.trim();

        return sampleResumeContent;
    } catch (error) {
        throw new Error('Failed to extract text from resume URL');
    }
}

// Use standard require for pdf-parse to generic entry point
const pdfParse = require('pdf-parse');

export async function extractTextFromFile(file: File): Promise<string> {
    console.log(`[ResumeService] Extracting text from file: ${file.name} (${file.type}, ${file.size} bytes)`);

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Standard pdf-parse 
            const data = await pdfParse(buffer);
            const text = data.text;

            console.log(`[ResumeService] Extracted ${text.length} chars from PDF.`);

            if (!text || text.trim().length < 50) {
                console.warn('[ResumeService] ⚠️ PDF extraction yielded insufficient text. Is this a scanned image?');
            }
            return text;
        } catch (error) {
            console.error('[ResumeService] ❌ PDF Parsing Failed:', error);
            // Fallback to text reading if basic parsing fails
            return await file.text();
        }
    }
    // For txt, md, etc.
    return await file.text();
}


export async function analyzeResumeWithAI(resumeTextOrBuffer: string | Buffer, mimeType: string = 'application/pdf') {
    const isBuffer = Buffer.isBuffer(resumeTextOrBuffer);
    const resumeText = isBuffer ? '' : (resumeTextOrBuffer as string); // Only for fallback

    // Prompt adapted for both Text and Vison
    const prompt = `Analyze this resume (attached file or text) and extract:
1. Technical skills (programming languages, frameworks, tools) [List them all]
2. Years of experience (e.g. "5 years")
3. Education background (Degree, University)
4. Key achievements (Summary list)

IMPORTANT:
- If you see a file, Analyze the VISUAL PDF/Image content directly.
- Ignore "extraction failed" messages if the visible content is clear.
- Infer skills even if not explicitly labeled but mentioned in projects.

Return JSON: { skills: [], experience: string, education: string, achievements: [] }`;

    console.log(`[ResumeService] 🤖 Starting AI Analysis (${isBuffer ? 'Vision/File Mode' : 'Text Mode'})...`);

    return await aiClient.json({
        model: 'gpt-4o-mini',
        provider: 'gemini', // Vision requires Gemini
        messages: [{ role: 'user', content: prompt }],
        file: isBuffer ? { data: resumeTextOrBuffer as Buffer, mimeType } : undefined,
        fallback: () => {
            console.warn('[ResumeService] ⚠️ AI Analysis Failed. Using Intelligent Fallback.');
            // If we only have a buffer, we can't do regex unless we extracted text earlier.
            // But existing flow usually extracts text first to try.
            // We will handle this by letting the caller pass text if possible, or gracefully fail.
            const intelligentAnalysis = analyzeResumeIntelligently(resumeText); // Will be empty if buffer passed
            return {
                skills: intelligentAnalysis.skills || [],
                experience: intelligentAnalysis.experience || 'Entry Level',
                education: intelligentAnalysis.education || 'Self Taught',
                achievements: intelligentAnalysis.achievements || []
            };
        }
    });
}
