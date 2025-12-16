// Test the intelligent fallback system directly
const { generatePersonalizedQuestions, analyzeResumeIntelligently } = require('./lib/intelligent-fallback');

console.log('🧠 Testing Intelligent Fallback System...');

try {
  // Test job description analysis
  const jobDescription = 'We are looking for a skilled JavaScript developer with React experience and Node.js backend knowledge.';
  
  console.log('Analyzing job description...');
  const analysis = analyzeResumeIntelligently(jobDescription);
  console.log('Analysis result:', analysis);
  
  // Test question generation
  console.log('\nGenerating questions...');
  const questions = generatePersonalizedQuestions(analysis, jobDescription, {
    mcq: 2,
    conversational: 2,
    coding: 1
  });
  
  console.log(`✅ Generated ${questions.length} questions:`);
  questions.forEach((q, i) => {
    console.log(`${i + 1}. [${q.type}] ${q.text.substring(0, 80)}...`);
    console.log(`   Difficulty: ${q.difficulty}, Order: ${q.order}`);
  });
  
  console.log('\n🎉 Intelligent fallback system working correctly!');
  
} catch (error) {
  console.error('❌ Error testing intelligent fallback:', error);
}
