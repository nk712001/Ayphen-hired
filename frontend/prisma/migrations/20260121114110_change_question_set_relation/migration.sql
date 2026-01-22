/*
  Warnings:

  - You are about to drop the `_QuestionToQuestionSet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_QuestionToQuestionSet" DROP CONSTRAINT "_QuestionToQuestionSet_A_fkey";

-- DropForeignKey
ALTER TABLE "_QuestionToQuestionSet" DROP CONSTRAINT "_QuestionToQuestionSet_B_fkey";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "questionSetId" TEXT;

-- DropTable
DROP TABLE "_QuestionToQuestionSet";

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
