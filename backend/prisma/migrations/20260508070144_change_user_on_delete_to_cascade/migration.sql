-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_residentId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
