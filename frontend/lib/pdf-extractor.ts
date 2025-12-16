// PDF text extraction utility for resume analysis
import * as pdf from 'pdf-parse';

export interface ExtractedResumeContent {
  text: string;
  metadata: {
    pages: number;
    info?: any;
    wordCount: number;
    extractedSections: {
      contact?: string;
      summary?: string;
      experience?: string;
      education?: string;
      skills?: string;
      projects?: string;
    };
  };
}

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<ExtractedResumeContent> {
  try {
    console.log('Extracting text from PDF buffer, size:', pdfBuffer.length);
    
    const data = await (pdf as any)(pdfBuffer);
    const text = data.text;
    const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    
    console.log('PDF extraction completed:', {
      pages: data.numpages,
      wordCount,
      textLength: text.length
    });
    
    // Extract structured sections from the resume
    const extractedSections = extractResumeSections(text);
    
    return {
      text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        wordCount,
        extractedSections
      }
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractResumeSections(text: string): ExtractedResumeContent['metadata']['extractedSections'] {
  const sections: ExtractedResumeContent['metadata']['extractedSections'] = {};
  const lowerText = text.toLowerCase();
  
  // Common section headers and their variations
  const sectionPatterns = {
    contact: /(?:contact|personal\s+information|phone|email|address)[\s\S]*?(?=\n\s*(?:summary|objective|experience|education|skills|projects)|$)/i,
    summary: /(?:summary|objective|profile|about)[\s\S]*?(?=\n\s*(?:experience|education|skills|projects)|$)/i,
    experience: /(?:experience|work\s+history|employment|career)[\s\S]*?(?=\n\s*(?:education|skills|projects|certifications)|$)/i,
    education: /(?:education|academic|qualifications|degrees?)[\s\S]*?(?=\n\s*(?:skills|projects|certifications|experience)|$)/i,
    skills: /(?:skills|technical\s+skills|competencies|technologies)[\s\S]*?(?=\n\s*(?:projects|certifications|education|experience)|$)/i,
    projects: /(?:projects|portfolio|work\s+samples)[\s\S]*?(?=\n\s*(?:certifications|education|skills|experience)|$)/i
  };
  
  // Extract each section
  Object.entries(sectionPatterns).forEach(([sectionName, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      sections[sectionName as keyof typeof sections] = match[0].trim();
    }
  });
  
  // If no structured sections found, try to extract key information differently
  if (Object.keys(sections).length === 0) {
    // Look for email patterns for contact
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      sections.contact = `Email: ${emailMatch[0]}`;
    }
    
    // Look for common skill keywords
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node.js', 'express', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure',
      'docker', 'kubernetes', 'git', 'html', 'css', 'bootstrap', 'tailwind'
    ];
    
    const foundSkills = skillKeywords.filter(skill => 
      lowerText.includes(skill.toLowerCase())
    );
    
    if (foundSkills.length > 0) {
      sections.skills = `Technologies: ${foundSkills.join(', ')}`;
    }
  }
  
  return sections;
}

export async function fetchAndExtractPDF(url: string): Promise<ExtractedResumeContent> {
  try {
    console.log('Fetching PDF from URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return await extractTextFromPDF(buffer);
  } catch (error) {
    console.error('Error fetching and extracting PDF:', error);
    throw error;
  }
}

// Helper function to create enhanced resume analysis text
export function createEnhancedResumeAnalysis(
  extractedContent: ExtractedResumeContent,
  jobDescription: string,
  testTitle: string
): string {
  const { text, metadata } = extractedContent;
  
  return `
COMPREHENSIVE RESUME ANALYSIS
=============================

DOCUMENT METADATA:
- Pages: ${metadata.pages}
- Word Count: ${metadata.wordCount}
- Position Applied For: ${testTitle}

EXTRACTED RESUME CONTENT:
${text}

STRUCTURED SECTIONS:
${Object.entries(metadata.extractedSections)
  .filter(([_, content]) => content)
  .map(([section, content]) => `
${section.toUpperCase()}:
${content}
`).join('\n')}

JOB REQUIREMENTS CONTEXT:
${jobDescription}

PERSONALIZATION INSTRUCTIONS:
This is a real resume with actual candidate information. Generate highly personalized questions that:
1. Reference specific technologies and skills mentioned in the resume
2. Ask about projects and experiences described in the resume
3. Match the complexity to the candidate's apparent experience level
4. Connect the candidate's background to the job requirements
5. Create scenario-based questions using their actual skill set
  `.trim();
}
