/*
  Warnings:

  - You are about to drop the column `email` on the `TeamInvitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TeamInvitation" DROP COLUMN "email",
ADD COLUMN     "maxUses" INTEGER,
ADD COLUMN     "usedCount" INTEGER NOT NULL DEFAULT 0;
