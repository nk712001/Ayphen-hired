import re
import json
from typing import Dict, List, Any
from dataclasses import dataclass
import openai
from pathlib import Path

@dataclass
class ResumeProfile:
    skills: List[str]
    experience: List[Dict[str, Any]]
    education: List[Dict[str, str]]
    certifications: List[str]
    tools_frameworks: List[str]
    programming_languages: List[str]
    domain_knowledge: List[str]
    seniority_level: str
    years_experience: int

class ResumeAnalyzer:
    def __init__(self, openai_api_key: str):
        openai.api_key = openai_api_key
        
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF resume"""
        try:
            import PyPDF2
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return ""
    
    def parse_resume(self, resume_text: str) -> ResumeProfile:
        """Parse resume using OpenAI to extract structured information"""
        prompt = f"""
        Analyze this resume and extract the following information in JSON format:
        
        Resume Text:
        {resume_text}
        
        Extract:
        {{
            "skills": ["list of technical and soft skills"],
            "experience": [
                {{
                    "title": "job title",
                    "company": "company name",
                    "duration": "duration",
                    "responsibilities": ["key responsibilities"],
                    "achievements": ["quantifiable achievements"]
                }}
            ],
            "education": [
                {{
                    "degree": "degree name",
                    "institution": "institution name",
                    "year": "graduation year"
                }}
            ],
            "certifications": ["list of certifications"],
            "tools_frameworks": ["tools, frameworks, libraries"],
            "programming_languages": ["programming languages"],
            "domain_knowledge": ["industry domains, specializations"],
            "seniority_level": "junior/mid/senior/lead/principal",
            "years_experience": "total years of experience as number"
        }}
        
        Be precise and extract only information explicitly mentioned.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            result = json.loads(response.choices[0].message.content)
            return ResumeProfile(**result)
            
        except Exception as e:
            print(f"Error parsing resume: {e}")
            return self._create_empty_profile()
    
    def _create_empty_profile(self) -> ResumeProfile:
        return ResumeProfile(
            skills=[], experience=[], education=[], certifications=[],
            tools_frameworks=[], programming_languages=[], domain_knowledge=[],
            seniority_level="junior", years_experience=0
        )