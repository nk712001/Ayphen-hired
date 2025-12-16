import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface TestInvitationData {
  candidateName: string;
  candidateEmail: string;
  testTitle: string;
  testDuration: number;
  uniqueLink: string;
  companyName: string;
  interviewerName: string;
  testPreview: {
    mcqCount: number;
    conversationalCount: number;
    codingCount: number;
    requiresSecondaryCamera: boolean;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check for email configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    // Only initialize if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
    } else {
      console.warn('Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
    }
  }

  async sendTestInvitation(data: TestInvitationData): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      const testUrl = `${process.env.NEXTAUTH_URL}/assess/${data.uniqueLink}`;

      const htmlContent = this.generateInvitationHTML(data, testUrl);
      const textContent = this.generateInvitationText(data, testUrl);

      const mailOptions = {
        from: `"${data.companyName}" <${process.env.EMAIL_USER}>`,
        to: data.candidateEmail,
        subject: `Interview Test Invitation - ${data.testTitle}`,
        text: textContent,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Test invitation sent successfully to ${data.candidateEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send test invitation:', error);
      return false;
    }
  }

  private generateInvitationHTML(data: TestInvitationData, testUrl: string): string {
    const previewUrl = `${process.env.NEXTAUTH_URL}/tests/preview/${data.uniqueLink}`;
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Test Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .test-preview { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .requirements { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        .question-type { display: inline-block; background: #e9ecef; padding: 5px 10px; border-radius: 4px; margin: 2px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Interview Test Invitation</h1>
        <p>You've been invited to take a technical assessment</p>
    </div>
    
    <div class="content">
        <h2>Hello ${data.candidateName},</h2>
        
        <p>We're excited to move forward with your application! ${data.interviewerName} has invited you to complete a technical assessment as part of our interview process.</p>
        
        <div class="test-preview">
            <h3>📋 Test Overview: ${data.testTitle}</h3>
            <p><strong>Duration:</strong> ${data.testDuration} minutes</p>
            <p><strong>Question Types:</strong></p>
            <div>
                ${data.testPreview.mcqCount > 0 ? `<span class="question-type">${data.testPreview.mcqCount} Multiple Choice</span>` : ''}
                ${data.testPreview.conversationalCount > 0 ? `<span class="question-type">${data.testPreview.conversationalCount} Short Answer</span>` : ''}
                ${data.testPreview.codingCount > 0 ? `<span class="question-type">${data.testPreview.codingCount} Coding</span>` : ''}
            </div>
            ${data.testPreview.requiresSecondaryCamera ?
        '<p><strong>📱 Note:</strong> This test requires a secondary camera (mobile device) for enhanced proctoring.</p>' :
        '<p><strong>📹 Note:</strong> This test includes AI proctoring with your webcam and microphone.</p>'
      }
        </div>
        
        <div class="requirements">
            <h4>🔧 Technical Requirements:</h4>
            <ul>
                <li>Stable internet connection</li>
                <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Webcam and microphone access</li>
                ${data.testPreview.requiresSecondaryCamera ? '<li>Mobile device for secondary camera (QR code will be provided)</li>' : ''}
                <li>Quiet, well-lit environment</li>
                <li>No interruptions during the test</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="${previewUrl}" class="cta-button" style="background: #28a745; margin-right: 10px;">👀 Preview Test</a>
            <a href="${testUrl}" class="cta-button">🚀 Start Test</a>
        </div>
        
        <p><strong>Important Notes:</strong></p>
        <ul>
            <li>This link is unique to you and cannot be shared</li>
            <li>You can only take this test once</li>
            <li>The test is timed and cannot be paused</li>
            <li>AI proctoring will monitor for any violations</li>
            <li>Make sure you're in a quiet, private space</li>
        </ul>
        
        <p>If you have any technical issues or questions, please don't hesitate to contact us.</p>
        
        <p>Good luck!</p>
        <p><strong>${data.interviewerName}</strong><br>
        ${data.companyName}</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from ${data.companyName}'s interview system.</p>
        <p>Test Link: <a href="${testUrl}">${testUrl}</a></p>
    </div>
</body>
</html>`;
  }

  private generateInvitationText(data: TestInvitationData, testUrl: string): string {
    const previewUrl = `${process.env.NEXTAUTH_URL}/tests/preview/${data.uniqueLink}`;
    return `
Interview Test Invitation

Hello ${data.candidateName},

You've been invited to complete a technical assessment as part of our interview process.

Test Details:
- Title: ${data.testTitle}
- Duration: ${data.testDuration} minutes
- Questions: ${data.testPreview.mcqCount} Multiple Choice, ${data.testPreview.conversationalCount} Short Answer, ${data.testPreview.codingCount} Coding
${data.testPreview.requiresSecondaryCamera ? '- Requires secondary camera (mobile device)' : '- Includes AI proctoring'}

Technical Requirements:
- Stable internet connection
- Modern web browser
- Webcam and microphone access
${data.testPreview.requiresSecondaryCamera ? '- Mobile device for secondary camera' : ''}
- Quiet, well-lit environment

Preview Test: ${previewUrl}
Start Test: ${testUrl}

Important:
- This link is unique and cannot be shared
- You can only take this test once
- The test is timed and cannot be paused
- AI proctoring will monitor for violations

Good luck!

${data.interviewerName}
${data.companyName}

---
This is an automated message from ${data.companyName}'s interview system.
`;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
