/*
  Warnings:

  - You are about to drop the column `apartmentId` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `Poll` table. All the data in the column will be lost.
  - Added the required column `boardId` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `boardId` to the `Notice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `boardId` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('NOTICE', 'COMPLAINT', 'POLL');

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Notice" DROP CONSTRAINT "Notice_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_apartmentId_fkey";

-- DropIndex
DROP INDEX "Complaint_apartmentId_status_idx";

-- DropIndex
DROP INDEX "Notice_apartmentId_isPinned_createdAt_idx";

-- DropIndex
DROP INDEX "Poll_apartmentId_status_idx";

-- AlterTable
ALTER TABLE "Complaint" DROP COLUMN "apartmentId",
ADD COLUMN     "boardId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "apartmentId",
ADD COLUMN     "boardId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "apartmentId",
ADD COLUMN     "boardId" BIGINT NOT NULL;

-- CreateTable
CREATE TABLE "Board" (
    "id" BIGSERIAL NOT NULL,
    "type" "BoardType" NOT NULL,
    "apartmentId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Board_apartmentId_idx" ON "Board"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Board_apartmentId_type_key" ON "Board"("apartmentId", "type");

-- CreateIndex
CREATE INDEX "Complaint_boardId_status_idx" ON "Complaint"("boardId", "status");

-- CreateIndex
CREATE INDEX "Notice_boardId_isPinned_createdAt_idx" ON "Notice"("boardId", "isPinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Poll_boardId_status_idx" ON "Poll"("boardId", "status");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
