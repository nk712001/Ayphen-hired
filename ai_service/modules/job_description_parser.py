import json
import openai
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class JobRequirements:
    required_skills: List[str]
    preferred_skills: List[str]
    experience_requirements: Dict[str, Any]
    education_requirements: List[str]
    certifications: List[str]
    tools_frameworks: List[str]
    programming_languages: List[str]
    domain_knowledge: List[str]
    seniority_level: str
    min_years_experience: int
    role_responsibilities: List[str]
    company_culture: List[str]

class JobDescriptionParser:
    def __init__(self, openai_api_key: str):
        openai.api_key = openai_api_key
    
    def parse_job_description(self, jd_text: str) -> JobRequirements:
        """Parse job description to extract requirements"""
        prompt = f"""
        Analyze this job description and extract requirements in JSON format:
        
        Job Description:
        {jd_text}
        
        Extract:
        {{
            "required_skills": ["must-have technical and soft skills"],
            "preferred_skills": ["nice-to-have skills"],
            "experience_requirements": {{
                "min_years": "minimum years required",
                "specific_experience": ["specific experience areas"]
            }},
            "education_requirements": ["degree requirements"],
            "certifications": ["required/preferred certifications"],
            "tools_frameworks": ["required tools, frameworks, libraries"],
            "programming_languages": ["required programming languages"],
            "domain_knowledge": ["industry knowledge, specializations"],
            "seniority_level": "junior/mid/senior/lead/principal",
            "min_years_experience": "minimum years as number",
            "role_responsibilities": ["key responsibilities"],
            "company_culture": ["cultural aspects, values"]
        }}
        
        Be precise and distinguish between required vs preferred qualifications.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            result = json.loads(response.choices[0].message.content)
            return JobRequirements(**result)
            
        except Exception as e:
            print(f"Error parsing job description: {e}")
            return self._create_empty_requirements()
    
    def _create_empty_requirements(self) -> JobRequirements:
        return JobRequirements(
            required_skills=[], preferred_skills=[], 
            experience_requirements={"min_years": 0, "specific_experience": []},
            education_requirements=[], certifications=[], tools_frameworks=[],
            programming_languages=[], domain_knowledge=[], seniority_level="junior",
            min_years_experience=0, role_responsibilities=[], company_culture=[]
        )