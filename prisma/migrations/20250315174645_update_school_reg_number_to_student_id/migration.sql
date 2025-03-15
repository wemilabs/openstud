/*
  Warnings:

  - You are about to drop the column `schoolRegNumber` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "schoolRegNumber",
ADD COLUMN     "studentId" TEXT;
