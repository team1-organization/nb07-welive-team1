/*
  Warnings:

  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ADMIN_SIGNUP', 'USER_SIGNUP', 'NOTICE', 'POLL', 'COMPLAINT');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "referenceId" BIGINT,
ADD COLUMN     "type" "NotificationType" NOT NULL;
