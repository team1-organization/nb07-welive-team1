/*
  Warnings:

  - You are about to drop the column `userId` on the `Resident` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[residentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_userId_fkey";

-- DropIndex
DROP INDEX "Resident_userId_key";

-- AlterTable
ALTER TABLE "Resident" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "residentId" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "User_residentId_key" ON "User"("residentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
