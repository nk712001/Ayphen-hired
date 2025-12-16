// Test script - only run AFTER starting the Next.js server with 'npm run dev'
const assignmentId = 'cmih0at920007xzhy76nx5w3s';

console.log('🔍 Testing Question Generation (Server must be running!)...');
console.log('Make sure you started the server with: npm run dev');
console.log('Assignment ID:', assignmentId);

// Test the question generation
fetch(`https://localhost:3000/api/assignments/${assignmentId}/generate-questions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Response Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Response received, length:', text.length);
  try {
    const data = JSON.parse(text);
    if (data.questions && data.questions.length > 0) {
      console.log(`✅ Successfully generated ${data.questions.length} questions`);
      console.log('Question types:', data.questions.map(q => q.type));
      console.log('First question:', data.questions[0].text.substring(0, 100) + '...');
    } else if (data.error) {
      console.log('❌ Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    } else {
      console.log('Unexpected response:', data);
    }
  } catch (e) {
    console.log('Failed to parse JSON. Raw response:');
    console.log(text.substring(0, 500) + '...');
  }
})
.catch(error => {
  console.error('❌ Request failed:', error.message);
  console.log('Make sure the Next.js server is running with: npm run dev');
});
