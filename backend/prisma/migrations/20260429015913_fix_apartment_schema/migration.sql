/*
  Warnings:

  - You are about to drop the column `complexNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `floorNumber` on the `Apartment` table. All the data in the column will be lost.
  - Added the required column `endComplexNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDongNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endFloorNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endHoNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startComplexNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDongNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startFloorNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startHoNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "complexNumber",
DROP COLUMN "floorNumber",
ADD COLUMN     "endComplexNumber" TEXT NOT NULL,
ADD COLUMN     "endDongNumber" TEXT NOT NULL,
ADD COLUMN     "endFloorNumber" TEXT NOT NULL,
ADD COLUMN     "endHoNumber" TEXT NOT NULL,
ADD COLUMN     "startComplexNumber" TEXT NOT NULL,
ADD COLUMN     "startDongNumber" TEXT NOT NULL,
ADD COLUMN     "startFloorNumber" TEXT NOT NULL,
ADD COLUMN     "startHoNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resident" ALTER COLUMN "building" DROP NOT NULL,
ALTER COLUMN "unitNumber" DROP NOT NULL;
