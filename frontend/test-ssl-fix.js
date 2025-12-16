// Test script to verify SSL fix works
const assignmentId = 'cmih0at920007xzhy76nx5w3s';

console.log('🔍 Testing SSL Fix for Question Generation...');
console.log('Assignment ID:', assignmentId);

// Test the question generation with the SSL fix
fetch(`http://localhost:3000/api/assignments/${assignmentId}/generate-questions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Generate Questions API Status:', response.status);
  if (response.status === 200) {
    console.log('🎉 SSL issue appears to be fixed!');
  }
  return response.text();
})
.then(text => {
  console.log('Response length:', text.length);
  try {
    const data = JSON.parse(text);
    if (data.questions && data.questions.length > 0) {
      console.log(`✅ Successfully generated ${data.questions.length} questions`);
      console.log('Question types:', data.questions.map(q => q.type));
    } else if (data.error) {
      console.log('❌ Error:', data.error);
    }
  } catch (e) {
    console.log('Response preview:', text.substring(0, 200) + '...');
  }
})
.catch(error => {
  console.error('❌ Request still failing:', error.message);
});

// Also test the AI endpoint directly with HTTP
console.log('\n🤖 Testing AI Endpoint with HTTP...');
setTimeout(() => {
  fetch('http://localhost:3000/api/ai/generate-test-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      testId: 'cmieh2qzs0003xzfq9ykbwj39',
      candidateId: 'cmiejg7tp0000xztd0kp74b1z',
      assignmentId: assignmentId,
      jobDescription: 'We are looking for a skilled JavaScript developer with React experience.',
      mcqCount: 2,
      conversationalCount: 2,
      codingCount: 1,
      personalized: true
    })
  })
  .then(response => {
    console.log('✅ AI Endpoint Status:', response.status);
    return response.text();
  })
  .then(text => {
    try {
      const data = JSON.parse(text);
      if (data.questions) {
        console.log(`✅ AI endpoint generated ${data.questions.length} questions`);
        console.log('Sample question:', data.questions[0]?.text?.substring(0, 80) + '...');
      }
    } catch (e) {
      console.log('AI Response preview:', text.substring(0, 200) + '...');
    }
  })
  .catch(error => {
    console.error('❌ AI Endpoint Error:', error.message);
  });
}, 2000);
