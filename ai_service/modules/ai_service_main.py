import json
import os
from typing import Dict, Any
from .resume_analyzer import ResumeAnalyzer, ResumeProfile
from .job_description_parser import JobDescriptionParser, JobRequirements
from .matching_engine import MatchingEngine, MatchResult
from .question_generator import QuestionGenerator, InterviewQuestions

class AIInterviewSystem:
    def __init__(self, openai_api_key: str):
        self.resume_analyzer = ResumeAnalyzer(openai_api_key)
        self.jd_parser = JobDescriptionParser(openai_api_key)
        self.matching_engine = MatchingEngine(openai_api_key)
        self.question_generator = QuestionGenerator(openai_api_key)
    
    def analyze_resume_and_generate_questions(
        self, 
        resume_file_path: str, 
        job_description: str
    ) -> Dict[str, Any]:
        """
        End-to-end analysis: resume parsing, job matching, and question generation
        
        Args:
            resume_file_path: Path to resume file (PDF/DOC)
            job_description: Job description text
            
        Returns:
            Complete analysis results in JSON format
        """
        
        # Step 1: Extract and parse resume
        if resume_file_path.endswith('.pdf'):
            resume_text = self.resume_analyzer.extract_text_from_pdf(resume_file_path)
        else:
            # Handle other formats or plain text
            with open(resume_file_path, 'r', encoding='utf-8') as f:
                resume_text = f.read()
        
        resume_profile = self.resume_analyzer.parse_resume(resume_text)
        
        # Step 2: Parse job description
        job_requirements = self.jd_parser.parse_job_description(job_description)
        
        # Step 3: Calculate match score
        match_result = self.matching_engine.calculate_match_score(resume_profile, job_requirements)
        
        # Step 4: Generate personalized interview questions
        interview_questions = self.question_generator.generate_questions(resume_profile, job_requirements)
        
        # Step 5: Compile final results
        return {
            "match_score": match_result.match_score,
            "matched_skills": match_result.matched_skills,
            "missing_skills": match_result.missing_skills,
            "strengths": match_result.strengths,
            "gaps": match_result.gaps,
            "summary": match_result.summary,
            "interview_questions": {
                "technical": interview_questions.technical,
                "behavioral": interview_questions.behavioral,
                "situational": interview_questions.situational,
                "role_specific": interview_questions.role_specific,
                "follow_up": interview_questions.follow_up
            },
            "candidate_profile": {
                "seniority_level": resume_profile.seniority_level,
                "years_experience": resume_profile.years_experience,
                "key_skills": resume_profile.skills[:10],
                "domain_expertise": resume_profile.domain_knowledge
            },
            "job_requirements_summary": {
                "seniority_level": job_requirements.seniority_level,
                "min_years_experience": job_requirements.min_years_experience,
                "critical_skills": job_requirements.required_skills[:8]
            }
        }
    
    def quick_match_analysis(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Quick analysis for text-based inputs without file processing
        """
        resume_profile = self.resume_analyzer.parse_resume(resume_text)
        job_requirements = self.jd_parser.parse_job_description(job_description)
        match_result = self.matching_engine.calculate_match_score(resume_profile, job_requirements)
        
        return {
            "match_score": match_result.match_score,
            "matched_skills": match_result.matched_skills,
            "missing_skills": match_result.missing_skills,
            "strengths": match_result.strengths,
            "gaps": match_result.gaps,
            "summary": match_result.summary
        }

# Example usage and testing
def main():
    # Initialize system
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Please set OPENAI_API_KEY environment variable")
        return
    
    ai_system = AIInterviewSystem(api_key)
    
    # Example job description
    job_description = """
    Senior Software Engineer - Full Stack
    
    We are looking for a Senior Software Engineer with 5+ years of experience to join our team.
    
    Required Skills:
    - JavaScript, TypeScript, React, Node.js
    - Database design (PostgreSQL, MongoDB)
    - RESTful API development
    - Git version control
    - Agile development methodologies
    
    Preferred Skills:
    - AWS cloud services
    - Docker containerization
    - GraphQL
    - Test-driven development
    
    Responsibilities:
    - Lead feature development from conception to deployment
    - Mentor junior developers
    - Collaborate with product and design teams
    - Ensure code quality and best practices
    
    Requirements:
    - Bachelor's degree in Computer Science or related field
    - 5+ years of software development experience
    - Strong problem-solving skills
    - Excellent communication skills
    """
    
    # Example resume text
    resume_text = """
    John Doe
    Senior Software Developer
    
    Experience:
    Software Engineer at TechCorp (2019-2024)
    - Developed full-stack web applications using React and Node.js
    - Built RESTful APIs serving 100k+ daily requests
    - Implemented CI/CD pipelines using Docker and AWS
    - Mentored 3 junior developers
    
    Junior Developer at StartupXYZ (2017-2019)
    - Built responsive web interfaces using JavaScript and CSS
    - Worked with PostgreSQL databases
    - Participated in Agile development processes
    
    Skills:
    JavaScript, TypeScript, React, Node.js, PostgreSQL, MongoDB, Docker, AWS, Git, GraphQL
    
    Education:
    B.S. Computer Science, University of Technology (2017)
    
    Certifications:
    AWS Certified Developer Associate
    """
    
    # Run analysis
    try:
        result = ai_system.quick_match_analysis(resume_text, job_description)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error running analysis: {e}")

if __name__ == "__main__":
    main()