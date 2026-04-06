/*
  Warnings:

  - Added the required column `userId` to the `Notice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "userId" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "Notice_userId_idx" ON "Notice"("userId");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
