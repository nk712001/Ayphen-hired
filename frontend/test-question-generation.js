// Test script to verify question generation API
const assignmentId = 'cmigzxlco0005xzhye1i2ykpe';

console.log('🔍 Testing Question Generation API...');
console.log('Assignment ID:', assignmentId);

// Test the question generation endpoint directly
fetch(`http://localhost:3000/api/assignments/${assignmentId}/generate-questions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Generate Questions API Status:', response.status);
  console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(text => {
  console.log('Raw Response:', text);
  try {
    const data = JSON.parse(text);
    console.log('Parsed Response:', data);
    
    if (data.questions && data.questions.length > 0) {
      console.log(`✅ Successfully generated ${data.questions.length} questions`);
      data.questions.forEach((q, i) => {
        console.log(`Question ${i + 1}: [${q.type}] ${q.text.substring(0, 80)}...`);
      });
    } else if (data.error) {
      console.log('❌ Error:', data.error);
      if (data.details) {
        console.log('Error Details:', data.details);
      }
    }
  } catch (e) {
    console.log('❌ Failed to parse JSON:', e.message);
  }
})
.catch(error => {
  console.error('❌ Request Error:', error);
});

// Also test the AI endpoint directly
console.log('\n🤖 Testing AI Endpoint Directly...');
setTimeout(() => {
  fetch('http://localhost:3000/api/ai/generate-test-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      testId: 'test123',
      candidateId: 'candidate123',
      assignmentId: assignmentId,
      jobDescription: 'We are looking for a skilled JavaScript developer with React experience.',
      mcqCount: 2,
      conversationalCount: 2,
      codingCount: 1,
      personalized: true
    })
  })
  .then(response => {
    console.log('AI Endpoint Status:', response.status);
    return response.text();
  })
  .then(text => {
    console.log('AI Endpoint Raw Response:', text);
    try {
      const data = JSON.parse(text);
      console.log('AI Endpoint Parsed:', data);
      if (data.questions) {
        console.log(`✅ AI endpoint generated ${data.questions.length} questions`);
      }
    } catch (e) {
      console.log('❌ Failed to parse AI response:', e.message);
    }
  })
  .catch(error => {
    console.error('❌ AI Endpoint Error:', error);
  });
}, 3000);
