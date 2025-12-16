// Test script to verify resume URL handling
const testUrls = [
  '/uploads/resumes/resume_cmih22aoy000uxzoiwig326tm_cmiejx5bg0041xztdexjg9qim_1764225104303.pdf',
  'https://example.com/resume.pdf',
  'http://localhost:3000/uploads/resumes/test.pdf'
];

console.log('🔗 Testing Resume URL Handling...');

testUrls.forEach((url, index) => {
  console.log(`\nTest ${index + 1}: ${url}`);
  
  // Simulate the URL conversion logic
  let fullUrl = url;
  if (url.startsWith('/')) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    fullUrl = baseUrl + url;
    console.log('✅ Converted relative path to:', fullUrl);
  } else {
    console.log('✅ Already full URL:', fullUrl);
  }
  
  // Test if URL is valid
  try {
    new URL(fullUrl);
    console.log('✅ Valid URL format');
  } catch (error) {
    console.log('❌ Invalid URL format:', error.message);
  }
});

console.log('\n📋 Expected Behavior:');
console.log('- Relative paths (starting with /) should be converted to full URLs');
console.log('- Full URLs should remain unchanged');
console.log('- All resulting URLs should be valid for fetch()');

console.log('\n🎯 Next Steps:');
console.log('1. Try generating questions again');
console.log('2. Check server logs for "Converted relative path to full URL"');
console.log('3. Verify resume content is processed (not falling back to job description)');
console.log('4. Look for enhanced skill extraction from job description context');
