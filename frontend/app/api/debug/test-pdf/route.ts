// Debug endpoint to test PDF extraction
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url');
  
  if (!testUrl) {
    return NextResponse.json({ 
      error: 'Please provide a URL parameter',
      example: '/api/debug/test-pdf?url=/uploads/resumes/test.pdf'
    }, { status: 400 });
  }
  
  console.log('=== PDF EXTRACTION DEBUG TEST ===');
  console.log('Testing URL:', testUrl);
  
  try {
    // Convert relative path to full URL if needed
    let fullUrl = testUrl;
    if (testUrl.startsWith('/')) {
      // Force HTTP for localhost to avoid SSL certificate issues
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const httpBaseUrl = baseUrl.replace('https://localhost', 'http://localhost');
      fullUrl = httpBaseUrl + testUrl;
      console.log('Converted to full URL (forced HTTP for localhost):', fullUrl);
    }
    
    // Test basic fetch first
    console.log('Testing basic fetch...');
    const response = await fetch(fullUrl);
    console.log('Fetch response status:', response.status);
    console.log('Fetch response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'Failed to fetch PDF',
        status: response.status,
        statusText: response.statusText,
        url: fullUrl
      }, { status: 500 });
    }
    
    const contentType = response.headers.get('content-type') || '';
    console.log('Content type:', contentType);
    
    if (!contentType.includes('application/pdf')) {
      return NextResponse.json({
        warning: 'Content type is not PDF',
        contentType,
        url: fullUrl,
        message: 'File might not be a PDF or server is not setting correct content type'
      });
    }
    
    // Test PDF extraction
    console.log('Testing PDF extraction...');
    try {
      const { fetchAndExtractPDF } = await import('@/lib/pdf-extractor');
      console.log('PDF extractor imported successfully');
      
      const extractedContent = await fetchAndExtractPDF(fullUrl);
      
      return NextResponse.json({
        success: true,
        url: fullUrl,
        extraction: {
          pages: extractedContent.metadata.pages,
          wordCount: extractedContent.metadata.wordCount,
          textLength: extractedContent.text.length,
          sectionsFound: Object.keys(extractedContent.metadata.extractedSections).length,
          sections: Object.keys(extractedContent.metadata.extractedSections),
          sampleText: extractedContent.text.substring(0, 500) + '...',
          extractedSections: extractedContent.metadata.extractedSections
        }
      });
      
    } catch (pdfError: any) {
      console.error('PDF extraction failed:', pdfError);
      
      return NextResponse.json({
        error: 'PDF extraction failed',
        details: pdfError.message,
        stack: pdfError.stack,
        url: fullUrl,
        contentType
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Debug test failed:', error);
    
    return NextResponse.json({
      error: 'Debug test failed',
      details: error.message,
      stack: error.stack,
      url: testUrl
    }, { status: 500 });
  }
}
