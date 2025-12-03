# End-to-End Workflow Test Guide

This guide provides step-by-step instructions to test the complete candidate test assignment workflow.

## Prerequisites

1. **Environment Setup**
   ```bash
   # Install dependencies
   cd frontend
   npm install

   # Set up environment variables
   cp .env.example .env.local
   ```

2. **Required Environment Variables**
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # NextAuth
   NEXTAUTH_URL="https://localhost:3000"
   NEXTAUTH_SECRET="your-secret"
   
   # OpenAI (for AI questions)
   OPENAI_API_KEY="your-openai-key"
   
   # Email Service
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT="587"
   EMAIL_SECURE="false"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   ```

3. **Start Services**
   ```bash
   # Start database
   docker-compose up -d postgres redis
   
   # Run migrations
   npx prisma migrate dev
   
   # Start frontend
   npm run dev
   
   # Start AI service (in separate terminal)
   cd ../ai_service
   python main.py
   ```

## Test Scenarios

### Scenario 1: Single Candidate Assignment with Email

#### Step 1: Create Test Data
1. Navigate to `http://localhost:3000/interviewer/candidates`
2. Click "Add Candidate"
3. Fill in candidate details:
   - Name: "John Doe"
   - Email: "john.doe@example.com"
4. Click "Save"

#### Step 2: Create Test
1. Navigate to `http://localhost:3000/interviewer/tests`
2. Click "Create Test"
3. Fill in test details:
   - Title: "Frontend Developer Assessment"
   - Duration: 60 minutes
   - Job Description: "React developer with 3+ years experience"
4. Click "Save"

#### Step 3: Assign Test with Email
1. Go back to Candidates page
2. Find "John Doe" and click "Assign Test"
3. Select the test created above
4. Choose "Upload new resume for this test"
5. Upload a sample resume (PDF/DOC)
6. Check "Send invitation email"
7. Enter company name: "Test Company"
8. Click "Preview Test" to see AI-generated questions
9. Click "Confirm Assignment"

#### Expected Results:
- ✅ Assignment created successfully
- ✅ Email sent to candidate
- ✅ AI questions generated based on resume
- ✅ Unique test link created

#### Step 4: Test Candidate Experience
1. Check email inbox for invitation
2. Click "Preview Test" button in email
3. Verify preview shows:
   - Test overview
   - Question types and counts
   - Technical requirements
   - Sample questions
4. Click "Start Test" to begin actual test
5. Verify test session loads with AI-generated questions

### Scenario 2: Bulk Assignment

#### Step 1: Add Multiple Candidates
1. Navigate to Candidates page
2. Click "Import Candidates"
3. Upload CSV with multiple candidates:
   ```csv
   name,email
   Alice Smith,alice@example.com
   Bob Johnson,bob@example.com
   Carol Wilson,carol@example.com
   ```

#### Step 2: Bulk Assignment
1. Select checkboxes for all three candidates
2. Click "Assign Test to 3 Selected"
3. Select test and configure options
4. Choose "Upload shared resume for all candidates"
5. Upload job description or sample resume
6. Enable email sending
7. Click "Assign to 3 Candidates"

#### Expected Results:
- ✅ All assignments created
- ✅ Emails sent to all candidates
- ✅ Shared resume used for AI question generation
- ✅ Bulk assignment results displayed

### Scenario 3: Assignment Management

#### Step 1: View Assignment Status
1. Navigate to `http://localhost:3000/interviewer/assignments`
2. Verify assignment tracker shows:
   - All assignments with status
   - Summary statistics
   - Filter and search options

#### Step 2: Test Assignment Actions
1. For pending assignments:
   - Click "Resend Email"
   - Click "Copy Link"
   - Click "Cancel" (with confirmation)
2. For completed assignments:
   - Click "View Results"

### Scenario 4: Test Preview System

#### Step 1: Access Preview
1. Use preview link from email or copy from assignment tracker
2. Verify preview shows:
   - Personalized content for candidate
   - AI-generated sample questions
   - Technical requirements checklist
   - Job context

#### Step 2: Preview to Test Flow
1. From preview page, click "Start Test"
2. Verify seamless transition to test session
3. Confirm AI-generated questions load correctly

## Validation Checklist

### Email Functionality
- [ ] Email service connects successfully
- [ ] Invitation emails are sent
- [ ] Email templates render correctly
- [ ] Preview and start links work
- [ ] Resend email functionality works

### AI Question Generation
- [ ] Resume upload and analysis works
- [ ] AI generates personalized questions
- [ ] Fallback questions work when AI fails
- [ ] Questions match job description and resume

### Test Preview System
- [ ] Unique previews per assignment
- [ ] Sample questions don't spoil test
- [ ] Technical requirements displayed
- [ ] Responsive design works

### Assignment Management
- [ ] Bulk assignment works
- [ ] Status tracking accurate
- [ ] Assignment actions functional
- [ ] Search and filtering work

### Security & Privacy
- [ ] Unique links are secure
- [ ] Resume files stored securely
- [ ] Email content appropriate
- [ ] No data leakage between assignments

## Troubleshooting

### Email Issues
```bash
# Test email connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

### AI Service Issues
```bash
# Check AI service status
curl http://localhost:8000/health

# Test AI question generation
curl -X POST http://localhost:3000/api/ai/generate-test-questions \
  -H "Content-Type: application/json" \
  -d '{"testId":"test-id","candidateId":"candidate-id","mcqCount":3,"conversationalCount":2,"codingCount":1}'
```

### Database Issues
```bash
# Check database connection
npx prisma db push

# View data
npx prisma studio
```

## Performance Testing

### Load Testing
```bash
# Test bulk assignment with 50 candidates
# Monitor memory usage and response times
# Verify email delivery rates
```

### Concurrent Users
```bash
# Test multiple simultaneous assignments
# Verify no race conditions
# Check database performance
```

## Success Criteria

The workflow is considered successful when:

1. **Functional Requirements**
   - ✅ Candidates can be assigned tests individually or in bulk
   - ✅ Email invitations are sent automatically
   - ✅ AI generates personalized questions from resumes
   - ✅ Test previews work for all assignments
   - ✅ Assignment status tracking is accurate

2. **Performance Requirements**
   - ✅ Email sending completes within 30 seconds
   - ✅ AI question generation completes within 60 seconds
   - ✅ Bulk assignment of 10 candidates completes within 2 minutes
   - ✅ Test preview loads within 5 seconds

3. **User Experience Requirements**
   - ✅ Clear error messages for failures
   - ✅ Professional email templates
   - ✅ Intuitive assignment interface
   - ✅ Responsive design on all devices

4. **Security Requirements**
   - ✅ Unique links cannot be guessed
   - ✅ Resume files are stored securely
   - ✅ Email content doesn't expose sensitive data
   - ✅ Assignment data is properly isolated

## Reporting Issues

When reporting issues, include:
1. **Environment details** (OS, browser, Node version)
2. **Steps to reproduce** the issue
3. **Expected vs actual behavior**
4. **Console logs and error messages**
5. **Screenshots or videos** if applicable

## Continuous Testing

Set up automated tests for:
1. **API endpoints** - Unit and integration tests
2. **Email delivery** - Mock and real email tests
3. **AI question generation** - Consistency and quality tests
4. **Database operations** - Performance and integrity tests
5. **End-to-end workflows** - Automated browser tests
