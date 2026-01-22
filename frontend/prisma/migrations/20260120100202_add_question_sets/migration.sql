-- CreateTable
CREATE TABLE "public"."QuestionSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "companyId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_QuestionToQuestionSet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuestionToQuestionSet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "QuestionSet_companyId_idx" ON "public"."QuestionSet"("companyId");

-- CreateIndex
CREATE INDEX "QuestionSet_organizationId_idx" ON "public"."QuestionSet"("organizationId");

-- CreateIndex
CREATE INDEX "QuestionSet_createdBy_idx" ON "public"."QuestionSet"("createdBy");

-- CreateIndex
CREATE INDEX "_QuestionToQuestionSet_B_index" ON "public"."_QuestionToQuestionSet"("B");

-- AddForeignKey
ALTER TABLE "public"."QuestionSet" ADD CONSTRAINT "QuestionSet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionSet" ADD CONSTRAINT "QuestionSet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionSet" ADD CONSTRAINT "QuestionSet_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_QuestionToQuestionSet" ADD CONSTRAINT "_QuestionToQuestionSet_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_QuestionToQuestionSet" ADD CONSTRAINT "_QuestionToQuestionSet_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
