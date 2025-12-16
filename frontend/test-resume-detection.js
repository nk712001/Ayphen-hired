// Test script to verify resume detection logic
const assignmentId = 'cmih0np210001xzoipmr583qj'; // Use your actual assignment ID

console.log('🔍 Testing Resume Detection Logic...');
console.log('Assignment ID:', assignmentId);

// Test the preview API to see what resume URLs are returned
fetch(`http://localhost:3000/api/assignments/${assignmentId}/preview`)
.then(response => {
  console.log('Preview API Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('\n📋 Assignment Data:');
  console.log('Assignment ID:', data.assignment?.id);
  console.log('Test ID:', data.assignment?.test?.id);
  console.log('Candidate Name:', data.assignment?.candidate?.name);
  
  console.log('\n📄 Resume URLs:');
  console.log('Test Resume URL:', data.assignment?.test?.resumeUrl || 'None');
  console.log('Candidate Resume URL:', data.assignment?.candidate?.resumeUrl || 'None');
  
  const hasTestResume = !!data.assignment?.test?.resumeUrl;
  const hasCandidateResume = !!data.assignment?.candidate?.resumeUrl;
  const hasAnyResume = hasTestResume || hasCandidateResume;
  
  console.log('\n✅ Resume Detection Results:');
  console.log('Has Test Resume (Interviewer Uploaded):', hasTestResume);
  console.log('Has Candidate Resume (Profile):', hasCandidateResume);
  console.log('Has Any Resume:', hasAnyResume);
  
  if (hasAnyResume) {
    console.log('🎉 Resume detected! Questions should be personalized.');
    console.log('Primary Resume Source:', hasTestResume ? 'Test (Interviewer)' : 'Candidate Profile');
  } else {
    console.log('⚠️ No resume found. Questions will be based on job description only.');
  }
  
  console.log('\n📝 Questions Status:');
  console.log('Existing Questions:', data.questions?.length || 0);
  console.log('Generated From Resume:', data.generatedFromResume || false);
})
.catch(error => {
  console.error('❌ Error testing resume detection:', error.message);
  console.log('Make sure the Next.js server is running with: npm run dev');
});
