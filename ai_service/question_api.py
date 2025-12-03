#!/usr/bin/env python3
"""
Question generation API for AI Interview System
Reads JSON input from stdin and outputs generated questions
"""

import sys
import json
import os
from modules.ai_service_main import AIInterviewSystem

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        resume_text = input_data.get('resume_text', '')
        job_description = input_data.get('job_description', '')
        
        if not resume_text or not job_description:
            print(json.dumps({"error": "Missing resume_text or job_description"}))
            sys.exit(1)
        
        # Get OpenAI API key from environment
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print(json.dumps({"error": "OPENAI_API_KEY environment variable not set"}))
            sys.exit(1)
        
        # Initialize AI system
        ai_system = AIInterviewSystem(api_key)
        
        # Run quick analysis for question generation
        result = ai_system.quick_match_analysis(resume_text, job_description)
        
        # Parse resume and job description for question generation
        resume_profile = ai_system.resume_analyzer.parse_resume(resume_text)
        job_requirements = ai_system.jd_parser.parse_job_description(job_description)
        
        # Generate questions
        interview_questions = ai_system.question_generator.generate_questions(resume_profile, job_requirements)
        
        # Combine results
        final_result = {
            **result,
            "interview_questions": {
                "technical": interview_questions.technical,
                "behavioral": interview_questions.behavioral,
                "situational": interview_questions.situational,
                "role_specific": interview_questions.role_specific,
                "follow_up": interview_questions.follow_up
            }
        }
        
        # Output result as JSON
        print(json.dumps(final_result, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()