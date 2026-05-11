/*
  Warnings:

  - You are about to drop the column `apartmentDong` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentHo` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `dongNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `hoNumber` on the `Apartment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "apartmentDong",
DROP COLUMN "apartmentHo",
DROP COLUMN "dongNumber",
DROP COLUMN "hoNumber";
