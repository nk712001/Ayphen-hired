import re
import json
import openai
from typing import Dict, List, Any
from dataclasses import dataclass
from .resume_analyzer import ResumeProfile
from .job_description_parser import JobRequirements

@dataclass
class InterviewQuestions:
    technical: List[str]
    behavioral: List[str]
    situational: List[str]
    role_specific: List[str]
    follow_up: List[str]

class QuestionGenerator:
    def __init__(self, openai_api_key: str):
        openai.api_key = openai_api_key
    
    def generate_questions(self, resume: ResumeProfile, job_req: JobRequirements) -> InterviewQuestions:
        """Generate personalized interview questions based on candidate profile and job requirements"""
        
        technical_questions = self._generate_technical_questions(resume, job_req)
        behavioral_questions = self._generate_behavioral_questions(resume, job_req)
        situational_questions = self._generate_situational_questions(resume, job_req)
        role_specific_questions = self._generate_role_specific_questions(resume, job_req)
        follow_up_questions = self._generate_follow_up_questions(resume, job_req)
        
        return InterviewQuestions(
            technical=technical_questions,
            behavioral=behavioral_questions,
            situational=situational_questions,
            role_specific=role_specific_questions,
            follow_up=follow_up_questions
        )
    
    def _generate_technical_questions(self, resume: ResumeProfile, job_req: JobRequirements) -> List[str]:
        """Generate technical questions based on skills and requirements"""
        prompt = f"""
        Generate 5 technical interview questions for this candidate and role:
        
        Candidate Profile:
        - Skills: {', '.join(resume.skills[:10])}
        - Programming Languages: {', '.join(resume.programming_languages)}
        - Tools/Frameworks: {', '.join(resume.tools_frameworks[:8])}
        - Seniority: {resume.seniority_level}
        - Experience: {resume.years_experience} years
        
        Job Requirements:
        - Required Skills: {', '.join(job_req.required_skills[:8])}
        - Programming Languages: {', '.join(job_req.programming_languages)}
        - Tools/Frameworks: {', '.join(job_req.tools_frameworks[:8])}
        - Seniority Level: {job_req.seniority_level}
        
        Generate questions that:
        1. Test skills mentioned in both resume and job requirements
        2. Assess depth of knowledge appropriate for {job_req.seniority_level} level
        3. Include practical problem-solving scenarios
        4. Are specific to the candidate's background
        5. Avoid generic questions
        
        Return as JSON array: ["question1", "question2", ...]
        """
        
        return self._call_openai_for_questions(prompt, 5)
    
    def _generate_behavioral_questions(self, resume: ResumeProfile, job_req: JobRequirements) -> List[str]:
        """Generate behavioral questions based on experience and role requirements"""
        prompt = f"""
        Generate 4 behavioral interview questions for this candidate and role:
        
        Candidate Experience:
        - Previous roles: {[exp.get('title', '') for exp in resume.experience[:3]]}
        - Seniority: {resume.seniority_level}
        - Years of experience: {resume.years_experience}
        
        Role Requirements:
        - Responsibilities: {', '.join(job_req.role_responsibilities[:5])}
        - Seniority Level: {job_req.seniority_level}
        - Company Culture: {', '.join(job_req.company_culture[:3])}
        
        Generate STAR-method questions that:
        1. Relate to the candidate's actual experience level
        2. Assess competencies needed for the target role
        3. Explore leadership/collaboration based on seniority
        4. Are personalized to their background
        
        Return as JSON array: ["question1", "question2", ...]
        """
        
        return self._call_openai_for_questions(prompt, 4)
    
    def _generate_situational_questions(self, resume: ResumeProfile, job_req: JobRequirements) -> List[str]:
        """Generate situational questions for hypothetical scenarios"""
        prompt = f"""
        Generate 3 situational interview questions for this candidate and role:
        
        Candidate Profile:
        - Domain Knowledge: {', '.join(resume.domain_knowledge)}
        - Seniority: {resume.seniority_level}
        - Key Skills: {', '.join(resume.skills[:8])}
        
        Role Context:
        - Domain: {', '.join(job_req.domain_knowledge)}
        - Key Responsibilities: {', '.join(job_req.role_responsibilities[:5])}
        - Required Skills: {', '.join(job_req.required_skills[:8])}
        
        Generate hypothetical scenarios that:
        1. Test decision-making in relevant contexts
        2. Assess problem-solving approach
        3. Evaluate how they'd handle role-specific challenges
        4. Match the complexity to {job_req.seniority_level} level
        
        Return as JSON array: ["question1", "question2", ...]
        """
        
        return self._call_openai_for_questions(prompt, 3)
    
    def _generate_role_specific_questions(self, resume: ResumeProfile, job_req: JobRequirements) -> List[str]:
        """Generate questions specific to the role and industry"""
        prompt = f"""
        Generate 4 role-specific questions for this candidate and position:
        
        Candidate Background:
        - Domain Expertise: {', '.join(resume.domain_knowledge)}
        - Relevant Experience: {[exp.get('title', '') + ' at ' + exp.get('company', '') for exp in resume.experience[:2]]}
        - Certifications: {', '.join(resume.certifications)}
        
        Target Role:
        - Domain: {', '.join(job_req.domain_knowledge)}
        - Specific Requirements: {', '.join(job_req.required_skills[:6])}
        - Key Responsibilities: {', '.join(job_req.role_responsibilities[:4])}
        
        Generate questions that:
        1. Test deep domain knowledge
        2. Assess role-specific competencies
        3. Explore relevant industry experience
        4. Validate expertise claims from resume
        
        Return as JSON array: ["question1", "question2", ...]
        """
        
        return self._call_openai_for_questions(prompt, 4)
    
    def _generate_follow_up_questions(self, resume: ResumeProfile, job_req: JobRequirements) -> List[str]:
        """Generate probing follow-up questions for deeper assessment"""
        prompt = f"""
        Generate 5 follow-up questions for deeper assessment:
        
        Context:
        - Candidate has {resume.years_experience} years experience as {resume.seniority_level}
        - Key skills: {', '.join(resume.skills[:8])}
        - Target role: {job_req.seniority_level} level position
        
        Generate probing questions that:
        1. Dig deeper into technical claims
        2. Assess problem-solving methodology
        3. Explore leadership/mentoring experience (if senior)
        4. Validate specific achievements
        5. Test adaptability and learning approach
        
        These should be follow-ups to initial answers, starting with phrases like:
        "Can you walk me through...", "How did you handle...", "What would you do if..."
        
        Return as JSON array: ["question1", "question2", ...]
        """
        
        return self._call_openai_for_questions(prompt, 5)
    
    def _call_openai_for_questions(self, prompt: str, count: int) -> List[str]:
        """Helper method to call OpenAI and parse questions"""
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=800
            )
            
            content = response.choices[0].message.content.strip()
            
            # Try to parse as JSON first
            try:
                questions = json.loads(content)
                return questions[:count] if isinstance(questions, list) else []
            except json.JSONDecodeError:
                # Fallback: split by lines and clean up
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                questions = []
                for line in lines:
                    # Remove numbering, quotes, and clean up
                    clean_line = re.sub(r'^\d+\.?\s*', '', line)
                    clean_line = clean_line.strip('"\'')
                    if clean_line and '?' in clean_line:
                        questions.append(clean_line)
                return questions[:count]
                
        except Exception as e:
            print(f"Error generating questions: {e}")
            return [f"Sample question {i+1} for assessment" for i in range(count)]