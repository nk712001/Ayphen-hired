#!/usr/bin/env python3
"""
API wrapper for the AI Interview System
Usage: python api_wrapper.py <resume_path> <job_description>
"""

import sys
import json
import os
from modules.ai_service_main import AIInterviewSystem

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python api_wrapper.py <resume_path> <job_description>"}))
        sys.exit(1)
    
    resume_path = sys.argv[1]
    job_description = sys.argv[2]
    
    # Get OpenAI API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print(json.dumps({"error": "OPENAI_API_KEY environment variable not set"}))
        sys.exit(1)
    
    try:
        # Initialize AI system
        ai_system = AIInterviewSystem(api_key)
        
        # Run analysis
        result = ai_system.analyze_resume_and_generate_questions(resume_path, job_description)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()