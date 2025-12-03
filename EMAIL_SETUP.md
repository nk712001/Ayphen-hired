# Email Service Configuration Guide

This guide explains how to configure the email service for sending test invitations with previews.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Required for email links
NEXTAUTH_URL=https://localhost:3000
```

## Email Provider Setup

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password as `EMAIL_PASS`

3. **Configuration**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Outlook/Hotmail Setup

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Custom SMTP Setup

```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Features

### Email Invitation Includes:

1. **Test Overview**
   - Test title and duration
   - Question types and counts
   - Technical requirements

2. **Two Action Buttons**
   - **Preview Test**: Shows sample questions and requirements
   - **Start Test**: Begins the actual test

3. **Personalized Content**
   - Candidate name
   - Company branding
   - AI-generated questions based on resume

4. **Technical Requirements**
   - Browser compatibility
   - Camera/microphone requirements
   - Secondary camera setup (if required)

### Test Preview Features:

- **Unique per assignment**: Each candidate gets personalized preview
- **AI-generated content**: Questions based on resume and job description
- **Sample questions**: Shows 2-3 example questions
- **Technical checklist**: Requirements validation
- **Job context**: Displays relevant job description

## Usage

### Basic Assignment with Email

```typescript
const response = await fetch(`/api/tests/${testId}/assign-with-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    candidateId: 'candidate-id',
    sendEmail: true,
    companyName: 'Your Company Name'
  })
});
```

### Assignment with Resume Upload

```typescript
const formData = new FormData();
formData.append('resume', resumeFile);
formData.append('candidateId', candidateId);

// Upload resume first
await fetch(`/api/tests/${testId}/upload-resume`, {
  method: 'POST',
  body: formData
});

// Then assign test
await fetch(`/api/tests/${testId}/assign-with-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    candidateId,
    sendEmail: true,
    companyName: 'Your Company'
  })
});
```

## Resume Handling Priority

The system prioritizes resumes in this order:

1. **Interviewer-uploaded resume** (via test assignment)
2. **Candidate profile resume** (from candidate registration)
3. **Fallback questions** (if no resume available)

## Troubleshooting

### Email Not Sending

1. **Check environment variables** are set correctly
2. **Verify SMTP credentials** with your email provider
3. **Check console logs** for specific error messages
4. **Test email configuration**:
   ```typescript
   const emailService = new EmailService();
   const isConnected = await emailService.verifyConnection();
   console.log('Email service connected:', isConnected);
   ```

### Preview Not Loading

1. **Check unique link** is valid and not expired
2. **Verify test assignment** exists in database
3. **Check API endpoint** `/api/test-assignments/[uniqueLink]/preview`

### AI Questions Not Generating

1. **Set OpenAI API key** in environment variables
2. **Check resume upload** was successful
3. **Verify job description** is provided in test
4. **Check console logs** for AI service errors

## Security Considerations

1. **Use App Passwords** instead of account passwords
2. **Enable 2FA** on email accounts
3. **Rotate credentials** regularly
4. **Monitor email logs** for suspicious activity
5. **Validate file uploads** (type, size, content)

## Email Template Customization

The email template can be customized by modifying:
- `generateInvitationHTML()` method for HTML emails
- `generateInvitationText()` method for plain text emails
- CSS styles in the HTML template
- Company branding and colors

## Testing

### Test Email Functionality

```bash
# Start the application
npm run dev

# Test assignment with email
curl -X POST http://localhost:3000/api/tests/test-id/assign-with-email \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"candidate-id","sendEmail":true,"companyName":"Test Company"}'
```

### Test Preview Functionality

```bash
# Test preview generation
curl http://localhost:3000/api/test-assignments/unique-link/preview
```

## Production Deployment

1. **Use production SMTP service** (SendGrid, AWS SES, etc.)
2. **Set proper NEXTAUTH_URL** to your domain
3. **Configure SSL certificates** for HTTPS
4. **Set up email monitoring** and logging
5. **Test email delivery** in production environment
