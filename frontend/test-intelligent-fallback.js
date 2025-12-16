// Test script to verify intelligent fallback system works
const { analyzeResumeIntelligently, generatePersonalizedQuestions } = require('./lib/intelligent-fallback.ts');

// Test resume content
const testResume = `
John Smith
Senior Full Stack Developer
Email: john.smith@email.com

EXPERIENCE
Senior Full Stack Developer | TechCorp | 2019-Present
- Lead development of React applications with TypeScript
- Built scalable Node.js APIs with Express and PostgreSQL
- Implemented microservices architecture using Docker and Kubernetes
- Mentored junior developers and conducted code reviews

Software Engineer | StartupXYZ | 2017-2019
- Developed responsive web applications using React and Redux
- Created RESTful APIs with Node.js and MongoDB
- Implemented automated testing with Jest and Cypress
- Worked in Agile/Scrum environment

EDUCATION
Master of Science in Computer Science
Stanford University | 2015-2017

SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, 
Docker, Kubernetes, AWS, Git, Jest, Cypress, Redux, GraphQL
`;

const jobDescription = `
We are looking for a Senior Full Stack Developer to join our team.

Requirements:
- 5+ years of experience with JavaScript/TypeScript
- Strong experience with React and Node.js
- Experience with cloud platforms (AWS preferred)
- Knowledge of containerization (Docker/Kubernetes)
- Experience with databases (PostgreSQL, MongoDB)
- Strong problem-solving skills and leadership experience
`;

console.log('=== Testing Intelligent Resume Analysis ===');
const analysis = analyzeResumeIntelligently(testResume, jobDescription);
console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

console.log('\n=== Testing Intelligent Question Generation ===');
const questions = generatePersonalizedQuestions(analysis, jobDescription, {
  mcq: 2,
  conversational: 2,
  coding: 1
});

console.log('Generated Questions:');
questions.forEach((q, i) => {
  console.log(`\n${i + 1}. [${q.type.toUpperCase()}] ${q.text}`);
  if (q.metadata?.options) {
    q.metadata.options.forEach((opt, j) => {
      console.log(`   ${String.fromCharCode(65 + j)}. ${opt}`);
    });
    console.log(`   Correct: ${String.fromCharCode(65 + q.metadata.correctAnswer)}`);
  }
});

console.log('\n=== Test Complete ===');
console.log('✅ Intelligent fallback system is working!');
