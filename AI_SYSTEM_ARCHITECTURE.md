# AI Interview System Architecture

## Overview
End-to-end AI system for resume-job matching and personalized interview question generation using OpenAI GPT models.

## System Components

### 1. Resume Analyzer (`resume_analyzer.py`)
- **Purpose**: Extract structured information from resume files
- **Input**: PDF/DOC resume files or text
- **Output**: ResumeProfile with skills, experience, education, certifications
- **Key Features**:
  - PDF text extraction using PyPDF2
  - OpenAI GPT-4 for structured data extraction
  - Seniority level detection
  - Years of experience calculation

### 2. Job Description Parser (`job_description_parser.py`)
- **Purpose**: Parse job requirements from job descriptions
- **Input**: Job description text
- **Output**: JobRequirements with required/preferred skills, experience needs
- **Key Features**:
  - Distinguishes required vs preferred qualifications
  - Extracts seniority level and experience requirements
  - Identifies role responsibilities and company culture

### 3. Matching Engine (`matching_engine.py`)
- **Purpose**: Calculate compatibility score between candidate and role
- **Algorithm**:
  - Skill overlap analysis (30% weight)
  - Experience relevance (25% weight)
  - Seniority alignment (20% weight)
  - Domain expertise (15% weight)
  - Tools/frameworks match (10% weight)
- **Output**: 0-100 match score with detailed breakdown

### 4. Question Generator (`question_generator.py`)
- **Purpose**: Generate personalized interview questions
- **Question Types**:
  - Technical: Role-specific technical assessments
  - Behavioral: STAR-method experience questions
  - Situational: Hypothetical scenario handling
  - Role-specific: Domain expertise validation
  - Follow-up: Probing questions for deeper assessment
- **Personalization**: Based on candidate background and job requirements

### 5. Main Orchestrator (`ai_service_main.py`)
- **Purpose**: Coordinate all components for end-to-end analysis
- **Methods**:
  - `analyze_resume_and_generate_questions()`: Full pipeline
  - `quick_match_analysis()`: Fast text-based matching

## API Integration

### Frontend APIs
- `/api/ai/analyze-resume`: Handle resume uploads and analysis
- `/api/ai/generate-test`: Generate AI-powered interview questions

### Python Wrappers
- `api_wrapper.py`: File-based resume analysis
- `question_api.py`: Question generation from text inputs

## Data Flow

```
Resume Upload → Text Extraction → AI Parsing → Profile Creation
                                                      ↓
Job Description → AI Parsing → Requirements Extraction
                                                      ↓
Profile + Requirements → Matching Engine → Match Score + Analysis
                                                      ↓
Profile + Requirements → Question Generator → Personalized Questions
                                                      ↓
Combined Results → JSON Response → Frontend Display
```

## Matching Logic

### Skill Matching
- Exact string matching (case-insensitive)
- Required skills: 80% weight
- Preferred skills: 20% weight
- Semantic similarity for related skills

### Experience Scoring
- Years of experience ratio
- Role progression analysis
- Achievement quantification
- Industry relevance

### Seniority Alignment
- Level mapping: junior(1) → mid(2) → senior(3) → lead(4) → principal(5)
- Overqualification bonus
- Underqualification penalty

## Question Generation Logic

### Technical Questions
- Based on overlapping skills between resume and job
- Difficulty adjusted for seniority level
- Practical problem-solving scenarios
- Technology-specific assessments

### Behavioral Questions
- STAR method format
- Based on candidate's actual experience
- Leadership questions for senior roles
- Collaboration and teamwork focus

### Situational Questions
- Hypothetical scenarios in relevant domain
- Decision-making assessment
- Problem-solving approach evaluation
- Role-specific challenges

## Example Output

```json
{
  "match_score": 85,
  "matched_skills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
  "missing_skills": ["GraphQL", "Docker"],
  "strengths": ["Exceeds experience requirement by 2 years"],
  "gaps": ["Missing critical skill: GraphQL"],
  "summary": "Strong candidate with 85% match. Excellent technical foundation with React and Node.js experience. Minor gap in GraphQL knowledge.",
  "interview_questions": {
    "technical": [
      "Describe your experience building scalable React applications. How do you handle state management in complex applications?",
      "Walk me through how you would design a RESTful API for a social media platform using Node.js."
    ],
    "behavioral": [
      "Tell me about a time when you had to mentor a junior developer. What was your approach?",
      "Describe a challenging technical problem you solved. What was your process?"
    ],
    "situational": [
      "How would you handle a situation where a critical production bug needs immediate fixing but you're in the middle of a major feature release?",
      "If you discovered a security vulnerability in legacy code, how would you approach fixing it?"
    ],
    "role_specific": [
      "How do you ensure database performance when dealing with large datasets in PostgreSQL?",
      "What's your approach to code reviews and maintaining code quality in a team environment?"
    ],
    "follow_up": [
      "Can you walk me through the specific steps you took to optimize that React component?",
      "How did you measure the success of that API performance improvement?",
      "What would you do differently if you encountered a similar situation again?"
    ]
  }
}
```

## Installation & Setup

1. Install Python dependencies:
```bash
cd ai_service
pip install -r requirements.txt
```

2. Set OpenAI API key:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

3. Test the system:
```bash
python modules/ai_service_main.py
```

## Usage

### Direct Python Usage
```python
from modules.ai_service_main import AIInterviewSystem

ai_system = AIInterviewSystem("your-openai-api-key")
result = ai_system.analyze_resume_and_generate_questions("resume.pdf", "job_description.txt")
```

### API Usage
```bash
# Resume analysis
curl -X POST /api/ai/analyze-resume \
  -F "resume=@resume.pdf" \
  -F "candidateId=123" \
  -F "testId=456"

# Question generation
curl -X POST /api/ai/generate-test \
  -H "Content-Type: application/json" \
  -d '{"testId":"456","candidateId":"123","jobDescription":"..."}'
```

## Performance Considerations

- **Caching**: Resume profiles and job requirements can be cached
- **Batch Processing**: Multiple candidates can be processed in parallel
- **Rate Limiting**: OpenAI API calls should be rate-limited
- **Error Handling**: Graceful fallbacks for API failures

## Security & Privacy

- Resume files are temporarily stored and immediately deleted
- No personal data is sent to OpenAI beyond professional information
- All API calls are authenticated and authorized
- Sensitive information is masked in logs