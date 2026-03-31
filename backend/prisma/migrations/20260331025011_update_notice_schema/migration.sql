/*
  Warnings:

  - The values [VOTE] on the enum `NoticeCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NoticeCategory_new" AS ENUM ('MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'ETC');
ALTER TABLE "Notice" ALTER COLUMN "category" TYPE "NoticeCategory_new" USING ("category"::text::"NoticeCategory_new");
ALTER TYPE "NoticeCategory" RENAME TO "NoticeCategory_old";
ALTER TYPE "NoticeCategory_new" RENAME TO "NoticeCategory";
DROP TYPE "public"."NoticeCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "Notice" ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;
