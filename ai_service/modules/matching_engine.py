import numpy as np
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass
from .resume_analyzer import ResumeProfile
from .job_description_parser import JobRequirements
import openai

@dataclass
class MatchResult:
    match_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    gaps: List[str]
    summary: str

class MatchingEngine:
    def __init__(self, openai_api_key: str):
        openai.api_key = openai_api_key
        
    def calculate_match_score(self, resume: ResumeProfile, job_req: JobRequirements) -> MatchResult:
        """Calculate comprehensive match score between resume and job requirements"""
        
        # Calculate individual component scores
        skill_score = self._calculate_skill_match(resume.skills, job_req.required_skills, job_req.preferred_skills)
        experience_score = self._calculate_experience_match(resume, job_req)
        seniority_score = self._calculate_seniority_match(resume.seniority_level, job_req.seniority_level)
        domain_score = self._calculate_domain_match(resume.domain_knowledge, job_req.domain_knowledge)
        tools_score = self._calculate_tools_match(resume.tools_frameworks, job_req.tools_frameworks)
        
        # Weighted average
        weights = {
            'skills': 0.3,
            'experience': 0.25,
            'seniority': 0.2,
            'domain': 0.15,
            'tools': 0.1
        }
        
        overall_score = int(
            skill_score * weights['skills'] +
            experience_score * weights['experience'] +
            seniority_score * weights['seniority'] +
            domain_score * weights['domain'] +
            tools_score * weights['tools']
        )
        
        # Generate detailed analysis
        matched_skills = self._find_matched_skills(resume.skills, job_req.required_skills + job_req.preferred_skills)
        missing_skills = self._find_missing_skills(resume.skills, job_req.required_skills)
        strengths = self._identify_strengths(resume, job_req)
        gaps = self._identify_gaps(resume, job_req)
        summary = self._generate_summary(overall_score, resume, job_req)
        
        return MatchResult(
            match_score=overall_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            strengths=strengths,
            gaps=gaps,
            summary=summary
        )
    
    def _calculate_skill_match(self, resume_skills: List[str], required_skills: List[str], preferred_skills: List[str]) -> float:
        """Calculate skill overlap score"""
        if not required_skills:
            return 100.0
            
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        required_lower = [skill.lower() for skill in required_skills]
        preferred_lower = [skill.lower() for skill in preferred_skills]
        
        required_matches = sum(1 for skill in required_lower if skill in resume_skills_lower)
        preferred_matches = sum(1 for skill in preferred_lower if skill in resume_skills_lower)
        
        required_score = (required_matches / len(required_skills)) * 80
        preferred_score = (preferred_matches / max(len(preferred_skills), 1)) * 20
        
        return min(100.0, required_score + preferred_score)
    
    def _calculate_experience_match(self, resume: ResumeProfile, job_req: JobRequirements) -> float:
        """Calculate experience relevance score"""
        years_score = min(100.0, (resume.years_experience / max(job_req.min_years_experience, 1)) * 100)
        return min(100.0, years_score)
    
    def _calculate_seniority_match(self, resume_seniority: str, required_seniority: str) -> float:
        """Calculate seniority alignment score"""
        seniority_levels = {'junior': 1, 'mid': 2, 'senior': 3, 'lead': 4, 'principal': 5}
        
        resume_level = seniority_levels.get(resume_seniority.lower(), 1)
        required_level = seniority_levels.get(required_seniority.lower(), 1)
        
        if resume_level >= required_level:
            return 100.0
        else:
            return max(0.0, (resume_level / required_level) * 100)
    
    def _calculate_domain_match(self, resume_domains: List[str], required_domains: List[str]) -> float:
        """Calculate domain expertise match"""
        if not required_domains:
            return 100.0
            
        resume_domains_lower = [domain.lower() for domain in resume_domains]
        required_domains_lower = [domain.lower() for domain in required_domains]
        
        matches = sum(1 for domain in required_domains_lower if domain in resume_domains_lower)
        return (matches / len(required_domains)) * 100
    
    def _calculate_tools_match(self, resume_tools: List[str], required_tools: List[str]) -> float:
        """Calculate tools/frameworks match"""
        if not required_tools:
            return 100.0
            
        resume_tools_lower = [tool.lower() for tool in resume_tools]
        required_tools_lower = [tool.lower() for tool in required_tools]
        
        matches = sum(1 for tool in required_tools_lower if tool in resume_tools_lower)
        return (matches / len(required_tools)) * 100
    
    def _find_matched_skills(self, resume_skills: List[str], job_skills: List[str]) -> List[str]:
        """Find skills that match between resume and job"""
        resume_skills_lower = {skill.lower(): skill for skill in resume_skills}
        job_skills_lower = [skill.lower() for skill in job_skills]
        
        return [resume_skills_lower[skill] for skill in job_skills_lower if skill in resume_skills_lower]
    
    def _find_missing_skills(self, resume_skills: List[str], required_skills: List[str]) -> List[str]:
        """Find required skills missing from resume"""
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        return [skill for skill in required_skills if skill.lower() not in resume_skills_lower]
    
    def _identify_strengths(self, resume: ResumeProfile, job_req: JobRequirements) -> List[str]:
        """Identify candidate strengths beyond requirements"""
        strengths = []
        
        if resume.years_experience > job_req.min_years_experience:
            strengths.append(f"Exceeds experience requirement by {resume.years_experience - job_req.min_years_experience} years")
        
        extra_skills = [skill for skill in resume.skills if skill.lower() not in [s.lower() for s in job_req.required_skills + job_req.preferred_skills]]
        if extra_skills:
            strengths.append(f"Additional valuable skills: {', '.join(extra_skills[:3])}")
        
        return strengths
    
    def _identify_gaps(self, resume: ResumeProfile, job_req: JobRequirements) -> List[str]:
        """Identify potential risk areas or gaps"""
        gaps = []
        
        if resume.years_experience < job_req.min_years_experience:
            gaps.append(f"Below minimum experience requirement by {job_req.min_years_experience - resume.years_experience} years")
        
        missing_critical = self._find_missing_skills(resume.skills, job_req.required_skills[:3])  # Top 3 critical
        if missing_critical:
            gaps.append(f"Missing critical skills: {', '.join(missing_critical)}")
        
        return gaps
    
    def _generate_summary(self, score: int, resume: ResumeProfile, job_req: JobRequirements) -> str:
        """Generate AI-powered summary of the match"""
        prompt = f"""
        Generate a concise 2-3 sentence summary of this candidate-job match:
        
        Match Score: {score}/100
        Candidate: {resume.seniority_level} level with {resume.years_experience} years experience
        Role: {job_req.seniority_level} level position requiring {job_req.min_years_experience} years
        
        Key candidate skills: {', '.join(resume.skills[:5])}
        Required skills: {', '.join(job_req.required_skills[:5])}
        
        Focus on fit assessment and key strengths/concerns.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=150
            )
            return response.choices[0].message.content.strip()
        except:
            return f"Candidate shows {score}% match with the role requirements."