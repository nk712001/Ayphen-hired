// Test script to verify resume-specific question generation
const assignmentIds = [
  'cmih0np210001xzoipmr583qj', // Replace with your actual assignment IDs
  'cmigzxlco0005xzhye1i2ykpe'  // Replace with second assignment ID
];

console.log('🧪 Testing Resume-Specific Question Generation...');

async function testAssignment(assignmentId, index) {
  console.log(`\n📋 Testing Assignment ${index + 1}: ${assignmentId}`);
  
  try {
    // First, check the assignment details
    const previewResponse = await fetch(`http://localhost:3000/api/assignments/${assignmentId}/preview`);
    const previewData = await previewResponse.json();
    
    console.log('Assignment Details:');
    console.log('- Candidate:', previewData.assignment?.candidate?.name);
    console.log('- Test Resume URL:', previewData.assignment?.test?.resumeUrl || 'None');
    console.log('- Candidate Resume URL:', previewData.assignment?.candidate?.resumeUrl || 'None');
    
    const hasResume = !!(previewData.assignment?.test?.resumeUrl || previewData.assignment?.candidate?.resumeUrl);
    console.log('- Has Resume:', hasResume);
    
    if (!hasResume) {
      console.log('⚠️ No resume found for this assignment');
      return null;
    }
    
    // Generate questions
    console.log('\n🔄 Generating questions...');
    const generateResponse = await fetch(`http://localhost:3000/api/assignments/${assignmentId}/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId: assignmentId,
        personalized: true
      })
    });
    
    if (!generateResponse.ok) {
      const errorData = await generateResponse.json();
      console.error('❌ Generation failed:', errorData);
      return null;
    }
    
    const questionsData = await generateResponse.json();
    console.log(`✅ Generated ${questionsData.questions?.length || 0} questions`);
    
    // Extract first few questions for comparison
    const sampleQuestions = questionsData.questions?.slice(0, 3).map(q => ({
      type: q.type,
      text: q.text.substring(0, 100) + '...',
      difficulty: q.difficulty
    })) || [];
    
    return {
      assignmentId,
      candidate: previewData.assignment?.candidate?.name,
      resumeUrl: previewData.assignment?.test?.resumeUrl || previewData.assignment?.candidate?.resumeUrl,
      sampleQuestions,
      resumeAnalysis: questionsData.resumeAnalysis
    };
    
  } catch (error) {
    console.error(`❌ Error testing assignment ${assignmentId}:`, error.message);
    return null;
  }
}

async function runTests() {
  const results = [];
  
  for (let i = 0; i < assignmentIds.length; i++) {
    const result = await testAssignment(assignmentIds[i], i);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n🔍 COMPARISON RESULTS:');
  console.log('='.repeat(50));
  
  if (results.length >= 2) {
    console.log('\nCandidate 1:', results[0].candidate);
    console.log('Resume URL:', results[0].resumeUrl);
    console.log('Sample Questions:');
    results[0].sampleQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.type}] ${q.text}`);
    });
    
    console.log('\nCandidate 2:', results[1].candidate);
    console.log('Resume URL:', results[1].resumeUrl);
    console.log('Sample Questions:');
    results[1].sampleQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.type}] ${q.text}`);
    });
    
    // Check if questions are different
    const questionsAreDifferent = results[0].sampleQuestions.some((q1, i) => {
      const q2 = results[1].sampleQuestions[i];
      return q2 && q1.text !== q2.text;
    });
    
    console.log('\n📊 ANALYSIS:');
    console.log('Questions are different:', questionsAreDifferent ? '✅ YES' : '❌ NO');
    
    if (!questionsAreDifferent) {
      console.log('⚠️ Questions appear to be the same - personalization may not be working correctly');
    } else {
      console.log('🎉 Questions are personalized for each candidate!');
    }
  } else {
    console.log('❌ Need at least 2 assignments with resumes to compare');
  }
}

runTests().catch(console.error);
