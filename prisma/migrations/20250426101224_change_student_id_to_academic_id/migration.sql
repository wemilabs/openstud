/*
  Warnings:

  - You are about to drop the column `studentId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "studentId",
ADD COLUMN     "academicId" TEXT;
