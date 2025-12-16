// Test script to verify assignment preview API
const assignmentId = 'cmigzxlco0005xzhye1i2ykpe';

console.log('Testing assignment preview API...');
console.log('Assignment ID:', assignmentId);

// Test the preview API endpoint
fetch(`http://localhost:3000/api/assignments/${assignmentId}/preview`)
  .then(response => {
    console.log('Preview API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Preview API Response:', JSON.stringify(data, null, 2));
    
    if (data.questions && data.questions.length > 0) {
      console.log(`✅ Found ${data.questions.length} questions`);
      data.questions.forEach((q, i) => {
        console.log(`Question ${i + 1}: ${q.type} - ${q.text.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No questions found, testing question generation...');
      
      // Test question generation
      return fetch(`http://localhost:3000/api/assignments/${assignmentId}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  })
  .then(response => {
    if (response) {
      console.log('Generate Questions API Response Status:', response.status);
      return response.json();
    }
  })
  .then(data => {
    if (data) {
      console.log('Generate Questions API Response:', JSON.stringify(data, null, 2));
      if (data.questions && data.questions.length > 0) {
        console.log(`✅ Generated ${data.questions.length} questions`);
      }
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
