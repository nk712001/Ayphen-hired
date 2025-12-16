// Test script to verify PDF text extraction
const { fetchAndExtractPDF, createEnhancedResumeAnalysis } = require('./lib/pdf-extractor');

console.log('🔍 Testing PDF Text Extraction...');

// Test with a sample PDF URL (you can replace with actual resume URL)
const testPdfUrl = 'http://localhost:3000/uploads/resumes/resume_cmih22aoy000uxzoiwig326tm_cmiejx5bg0041xztdexjg9qim_1764225104303.pdf';

async function testPDFExtraction() {
  try {
    console.log('Testing PDF extraction with URL:', testPdfUrl);
    
    const extractedContent = await fetchAndExtractPDF(testPdfUrl);
    
    console.log('\n📄 PDF Extraction Results:');
    console.log('Pages:', extractedContent.metadata.pages);
    console.log('Word Count:', extractedContent.metadata.wordCount);
    console.log('Text Length:', extractedContent.text.length);
    console.log('Sections Found:', Object.keys(extractedContent.metadata.extractedSections).length);
    
    console.log('\n📝 Extracted Sections:');
    Object.entries(extractedContent.metadata.extractedSections).forEach(([section, content]) => {
      if (content) {
        console.log(`${section.toUpperCase()}:`);
        console.log(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
        console.log('---');
      }
    });
    
    console.log('\n📋 Sample Text (first 500 characters):');
    console.log(extractedContent.text.substring(0, 500) + '...');
    
    // Test enhanced analysis creation
    const jobDescription = 'We are looking for a skilled React developer with Node.js experience';
    const testTitle = 'Senior Frontend Developer';
    
    const enhancedAnalysis = createEnhancedResumeAnalysis(
      extractedContent,
      jobDescription,
      testTitle
    );
    
    console.log('\n🧠 Enhanced Analysis Created:');
    console.log('Length:', enhancedAnalysis.length);
    console.log('Sample (first 800 characters):');
    console.log(enhancedAnalysis.substring(0, 800) + '...');
    
    console.log('\n✅ PDF extraction test completed successfully!');
    
  } catch (error) {
    console.error('❌ PDF extraction test failed:', error.message);
    console.log('\nPossible issues:');
    console.log('1. PDF file not accessible at the URL');
    console.log('2. PDF file is corrupted or password protected');
    console.log('3. Network connectivity issues');
    console.log('4. PDF parsing library issues');
    
    console.log('\nFallback behavior will be used in the actual application.');
  }
}

testPDFExtraction();
