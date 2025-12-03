# Resume Upload Implementation Fix

## Issue Fixed
The UI was showing incorrect options that suggested using candidate profile resumes, but according to your requirements, **only interviewers should upload resumes during test assignment**, not candidates in their profiles.

## Changes Made

### 1. **BulkAssignTestDialog.tsx** - Updated Resume Options

#### Before (Incorrect):
```
○ Use each candidate's existing profile resume
○ Upload shared resume for all candidates (job description based)
```

#### After (Correct):
```
○ Use job description only (no resume)
○ Upload individual resume for each candidate  
○ Upload shared resume for all candidates
```

### 2. **New Functionality Added**

#### **Individual Resume Upload**
- **What**: Upload a separate resume for each selected candidate
- **When to use**: When candidates have different backgrounds and you want personalized questions
- **UI**: Shows a file upload field for each candidate with their name and email
- **Validation**: Ensures all candidates have resumes uploaded before proceeding

#### **Shared Resume Upload**  
- **What**: Upload one resume/job description for all candidates
- **When to use**: When hiring for the same role and you want consistent questions
- **UI**: Single file upload field
- **Validation**: Ensures shared resume is uploaded before proceeding

#### **Job Description Only**
- **What**: Generate questions based only on the test's job description
- **When to use**: When you don't have resumes or want generic role-based questions
- **UI**: No upload required
- **Default**: This is now the default option

### 3. **Enhanced User Experience**

#### **Individual Resume Section**
```typescript
{resumeOption === 'individual' && (
  <div className="ml-6 space-y-4">
    <p className="text-sm text-gray-600">Upload a resume for each candidate:</p>
    {selectedCandidates.map((candidate) => (
      <div key={candidate.id} className="border rounded-lg p-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">{candidate.name}</span>
          <span className="text-xs text-gray-500">{candidate.email}</span>
        </div>
        <input type="file" accept=".pdf,.doc,.docx,.txt" />
        {/* Success indicator when file selected */}
      </div>
    ))}
  </div>
)}
```

#### **Validation Logic**
```typescript
// Shared resume validation
if (resumeOption === 'shared' && !resumeFile) {
  alert('Please upload a shared resume file');
  return;
}

// Individual resume validation  
if (resumeOption === 'individual') {
  const missingResumes = selectedCandidates.filter(candidate => !individualResumes[candidate.id]);
  if (missingResumes.length > 0) {
    alert(`Please upload resumes for: ${missingResumes.map(c => c.name).join(', ')}`);
    return;
  }
}
```

### 4. **Backend Integration**

#### **Individual Resume Upload Process**
```typescript
// For each candidate with individual resume
if (resumeOption === 'individual' && individualResumes[candidate.id]) {
  const formData = new FormData();
  formData.append('resume', individualResumes[candidate.id]);
  formData.append('candidateId', candidate.id);
  formData.append('testId', selectedTest);

  // Upload to /api/tests/${testId}/upload-resume
  const uploadResponse = await fetch(`/api/tests/${selectedTest}/upload-resume`, {
    method: 'POST',
    body: formData
  });
}
```

#### **Shared Resume Upload Process**
```typescript
// Upload once for all candidates
if (resumeFile && resumeOption === 'shared') {
  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('candidateId', 'shared'); // Special identifier
  formData.append('testId', selectedTest);

  // Upload to /api/tests/${testId}/upload-resume
}
```

### 5. **EnhancedAssignTestDialog.tsx** - Single Candidate Assignment

#### Updated Options:
```
○ Use job description only (no resume)
○ Upload resume for this candidate
```

This ensures consistency between single and bulk assignment workflows.

## How It Works Now

### **Workflow 1: Individual Resumes**
1. Interviewer selects multiple candidates
2. Chooses "Upload individual resume for each candidate"
3. Uploads a resume file for each candidate
4. AI generates personalized questions based on each candidate's resume
5. Each candidate gets unique questions matching their background

### **Workflow 2: Shared Resume**
1. Interviewer selects multiple candidates  
2. Chooses "Upload shared resume for all candidates"
3. Uploads one job description or sample resume
4. AI generates the same set of questions for all candidates
5. All candidates get identical questions for fair comparison

### **Workflow 3: Job Description Only**
1. Interviewer selects candidates
2. Chooses "Use job description only"
3. No resume upload required
4. AI generates questions based on the test's job description
5. Generic role-based questions for all candidates

## Benefits

### **For Interviewers:**
- ✅ **Full control** over resume content and quality
- ✅ **Consistent process** - no dependency on candidate profiles
- ✅ **Flexible options** for different hiring scenarios
- ✅ **Clear validation** prevents incomplete assignments

### **For Candidates:**
- ✅ **Clean profiles** - no resume storage in candidate accounts
- ✅ **Privacy** - resumes only used for specific test assignments
- ✅ **Personalized experience** when individual resumes are used

### **For AI Question Generation:**
- ✅ **High-quality input** from interviewer-curated resumes
- ✅ **Consistent format** and relevant content
- ✅ **Flexible fallback** to job description when no resume provided

## File Changes Made

### **Modified Files:**
- `/components/candidates/BulkAssignTestDialog.tsx` - Updated resume options and added individual upload logic
- `/components/candidates/EnhancedAssignTestDialog.tsx` - Updated resume options for single assignment

### **New State Variables:**
```typescript
const [resumeOption, setResumeOption] = useState<'individual' | 'shared' | 'jobdesc'>('jobdesc');
const [individualResumes, setIndividualResumes] = useState<{[candidateId: string]: File}>({});
```

### **New Functions:**
```typescript
const handleIndividualResumeUpload = (candidateId: string, e: React.ChangeEvent<HTMLInputElement>) => {
  // Handle individual file uploads with validation
};
```

## Testing

### **Test Scenarios:**
1. **Individual Upload**: Select 3 candidates, upload different resumes for each
2. **Shared Upload**: Select multiple candidates, upload one job description
3. **Job Description Only**: Select candidates, proceed without any resume
4. **Validation**: Try to proceed without required files - should show error messages
5. **Mixed Scenarios**: Test switching between options

### **Expected Results:**
- ✅ AI generates appropriate questions based on selected option
- ✅ Email invitations sent successfully
- ✅ Test assignments created with proper resume associations
- ✅ Clear error messages for missing files
- ✅ Smooth user experience with progress indicators

The implementation now correctly matches your requirement that **only interviewers upload resumes during test assignment**, not from candidate profiles!
