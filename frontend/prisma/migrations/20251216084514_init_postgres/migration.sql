-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#de065d',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'trial',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "maxUsers" INTEGER NOT NULL DEFAULT 50,
    "maxOrganizations" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'RECRUITER',
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecruiterOrganization" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "RecruiterOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Test" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jobDescription" TEXT,
    "resumeUrl" TEXT,
    "duration" INTEGER NOT NULL,
    "requiresSecondaryCamera" BOOLEAN NOT NULL DEFAULT false,
    "mcqQuestions" INTEGER NOT NULL DEFAULT 5,
    "conversationalQuestions" INTEGER NOT NULL DEFAULT 3,
    "codingQuestions" INTEGER NOT NULL DEFAULT 2,
    "companyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" TEXT NOT NULL,
    "testId" TEXT,
    "companyId" TEXT,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "metadata" TEXT,
    "timeToStart" INTEGER,
    "difficulty" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "isLibrary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Candidate" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "resumeUrl" TEXT,
    "resumeData" TEXT,
    "skills" TEXT,
    "experienceYears" INTEGER,
    "companyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TestAssignment" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "uniqueLink" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "companyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "scheduledStartTime" TIMESTAMP(3),
    "scheduledEndTime" TIMESTAMP(3),
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "totalScore" DOUBLE PRECISION,
    "maxTotalScore" DOUBLE PRECISION,
    "cheatScore" DOUBLE PRECISION,
    "scoreBreakdown" TEXT,
    "recommendation" TEXT,

    CONSTRAINT "TestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "testAssignmentId" TEXT NOT NULL,
    "content" TEXT,
    "recordingUrl" TEXT,
    "codeSubmission" TEXT,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ANSWERED',
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "feedback" TEXT,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProctorSession" (
    "id" TEXT NOT NULL,
    "testAssignmentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "primaryCameraActive" BOOLEAN NOT NULL DEFAULT true,
    "secondaryCameraActive" BOOLEAN NOT NULL DEFAULT false,
    "secondaryCameraRequired" BOOLEAN NOT NULL DEFAULT false,
    "microphoneActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProctorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Violation" (
    "id" TEXT NOT NULL,
    "proctorSessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceUrl" TEXT,
    "cameraSource" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanySettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "emailDomain" TEXT,
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customBranding" BOOLEAN NOT NULL DEFAULT true,
    "aiProctoringLevel" TEXT NOT NULL DEFAULT 'standard',
    "dataRetention" INTEGER NOT NULL DEFAULT 365,
    "logoUrl" TEXT,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "public"."Company"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "public"."User"("companyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Organization_companyId_idx" ON "public"."Organization"("companyId");

-- CreateIndex
CREATE INDEX "RecruiterOrganization_recruiterId_idx" ON "public"."RecruiterOrganization"("recruiterId");

-- CreateIndex
CREATE INDEX "RecruiterOrganization_organizationId_idx" ON "public"."RecruiterOrganization"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterOrganization_recruiterId_organizationId_key" ON "public"."RecruiterOrganization"("recruiterId", "organizationId");

-- CreateIndex
CREATE INDEX "Test_companyId_idx" ON "public"."Test"("companyId");

-- CreateIndex
CREATE INDEX "Test_organizationId_idx" ON "public"."Test"("organizationId");

-- CreateIndex
CREATE INDEX "Test_createdBy_idx" ON "public"."Test"("createdBy");

-- CreateIndex
CREATE INDEX "Question_testId_idx" ON "public"."Question"("testId");

-- CreateIndex
CREATE INDEX "Question_companyId_idx" ON "public"."Question"("companyId");

-- CreateIndex
CREATE INDEX "Question_isLibrary_idx" ON "public"."Question"("isLibrary");

-- CreateIndex
CREATE INDEX "Candidate_companyId_idx" ON "public"."Candidate"("companyId");

-- CreateIndex
CREATE INDEX "Candidate_organizationId_idx" ON "public"."Candidate"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_companyId_organizationId_key" ON "public"."Candidate"("email", "companyId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TestAssignment_uniqueLink_key" ON "public"."TestAssignment"("uniqueLink");

-- CreateIndex
CREATE INDEX "TestAssignment_companyId_idx" ON "public"."TestAssignment"("companyId");

-- CreateIndex
CREATE INDEX "TestAssignment_organizationId_idx" ON "public"."TestAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "TestAssignment_testId_idx" ON "public"."TestAssignment"("testId");

-- CreateIndex
CREATE INDEX "TestAssignment_candidateId_idx" ON "public"."TestAssignment"("candidateId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "public"."AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "public"."AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "public"."CompanySettings"("companyId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecruiterOrganization" ADD CONSTRAINT "RecruiterOrganization_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecruiterOrganization" ADD CONSTRAINT "RecruiterOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Test" ADD CONSTRAINT "Test_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Test" ADD CONSTRAINT "Test_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Test" ADD CONSTRAINT "Test_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "public"."Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TestAssignment" ADD CONSTRAINT "TestAssignment_testId_fkey" FOREIGN KEY ("testId") REFERENCES "public"."Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TestAssignment" ADD CONSTRAINT "TestAssignment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TestAssignment" ADD CONSTRAINT "TestAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_testAssignmentId_fkey" FOREIGN KEY ("testAssignmentId") REFERENCES "public"."TestAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProctorSession" ADD CONSTRAINT "ProctorSession_testAssignmentId_fkey" FOREIGN KEY ("testAssignmentId") REFERENCES "public"."TestAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Violation" ADD CONSTRAINT "Violation_proctorSessionId_fkey" FOREIGN KEY ("proctorSessionId") REFERENCES "public"."ProctorSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanySettings" ADD CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
