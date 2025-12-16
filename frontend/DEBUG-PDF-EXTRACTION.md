# 🔍 PDF Extraction Debugging Guide

## 🚨 **Current Issue:**
The PDF extraction is not working as expected, and questions are still generic instead of being personalized based on actual resume content.

## 🔧 **Debugging Steps:**

### **Step 1: Test PDF Extraction Directly**

Use the debug endpoint to test PDF extraction:

```bash
# Replace with your actual resume URL path
curl "http://localhost:3000/api/debug/test-pdf?url=/uploads/resumes/resume_cmih22aoy000uxzoiwig326tm_cmiejx5bg0041xztdexjg9qim_1764225104303.pdf"
```

Or visit in browser:
```
http://localhost:3000/api/debug/test-pdf?url=/uploads/resumes/resume_cmih22aoy000uxzoiwig326tm_cmiejx5bg0041xztdexjg9qim_1764225104303.pdf
```

### **Step 2: Check Server Console Logs**

When you generate questions, look for these log messages:

#### **Expected Success Flow:**
```
=== RESUME PROCESSING START ===
Original resume URL: /uploads/resumes/resume_...pdf
Converted relative path to full URL: http://localhost:3000/uploads/resumes/resume_...pdf
Resume content type: application/pdf
=== PDF PROCESSING START ===
PDF resume detected, extracting actual text content
Importing PDF extractor module...
PDF extractor module imported successfully
Starting PDF extraction from: http://localhost:3000/uploads/resumes/resume_...pdf
=== PDF EXTRACTION SUCCESS ===
PDF extraction results: { pages: 2, wordCount: 847, textLength: 4521, ... }
=== ENHANCED ANALYSIS CREATED ===
Enhanced resume analysis length: 5200
```

#### **Possible Error Scenarios:**

**A. Module Import Error:**
```
PDF extraction error: Cannot find module '@/lib/pdf-extractor'
```
**Solution:** Check if the pdf-extractor.ts file exists and is properly compiled.

**B. PDF Parse Error:**
```
PDF extraction error: Error: Failed to extract text from PDF
```
**Solution:** The PDF might be corrupted, password-protected, or image-only.

**C. Network Error:**
```
Error fetching resume: TypeError: Failed to parse URL
```
**Solution:** URL conversion issue - check the resume URL format.

**D. Content Type Error:**
```
Resume content type: text/html
```
**Solution:** The file server is not serving PDFs with correct content type.

### **Step 3: Verify Resume Analysis Output**

Look for the analysis results in logs:

#### **Success Indicators:**
```
Resume analysis completed: {
  skills: ["javascript", "typescript", "react", "node.js", "aws", "docker"],  // Multiple real skills
  seniority: "senior",  // Appropriate level
  domains: ["Full Stack Development"],  // Relevant domains
  achievements: 3  // Found achievements
}
```

#### **Failure Indicators:**
```
Resume analysis completed: {
  skills: ["figma"],  // Only generic skill from job description
  seniority: "junior",  // Default fallback
  domains: ["Software Development"],  // Generic domain
  achievements: 0  // No achievements found
}
```

### **Step 4: Check Question Generation**

Look for personalized question samples:

#### **Success (Personalized):**
```
Sample questions generated:
- [essay] I notice you have experience with react, typescript, node.js. Can you describe a challenging project where you utilized react and explain how you overcame any technical obstacles?
- [multiple_choice] In typescript, which approach is considered a best practice for error handling in senior-level development?
```

#### **Failure (Generic):**
```
Sample questions generated:
- [essay] I notice you have experience with figma. Can you describe a challenging project...
- [multiple_choice] In figma, which approach is considered a best practice...
```

## 🛠️ **Common Solutions:**

### **1. PDF File Issues**
- **Check if PDF is accessible:** Visit the full URL directly in browser
- **Verify content type:** Should be `application/pdf`
- **Test with different PDF:** Try with a simple text-based PDF

### **2. Module Import Issues**
- **Restart Next.js server:** `npm run dev`
- **Check TypeScript compilation:** Look for build errors
- **Verify file paths:** Ensure `@/lib/pdf-extractor` resolves correctly

### **3. Network/URL Issues**
- **Check NEXTAUTH_URL:** Should be set to `http://localhost:3000`
- **Verify file server:** Ensure uploaded files are accessible
- **Test URL conversion:** Check if relative paths are converted correctly

### **4. Fallback Behavior**
If PDF extraction fails, the system should still use enhanced job description analysis instead of just "figma".

## 🎯 **Next Steps:**

1. **Run the debug endpoint** with your actual resume URL
2. **Generate questions** and check server console for detailed logs
3. **Identify the specific failure point** from the logs
4. **Apply appropriate solution** based on the error type

## 📊 **Expected Final Result:**

Once working correctly, you should see:
- **Different skills** extracted for each candidate
- **Personalized questions** mentioning actual technologies from resumes
- **Appropriate difficulty** based on experience level
- **Specific project references** in conversational questions

**The debug endpoint and enhanced logging will help identify exactly where the PDF extraction is failing so we can fix it!** 🔍
