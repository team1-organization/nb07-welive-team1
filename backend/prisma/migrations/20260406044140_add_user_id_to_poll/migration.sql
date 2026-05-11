/*
  Warnings:

  - Added the required column `userId` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "userId" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "Poll_userId_idx" ON "Poll"("userId");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
