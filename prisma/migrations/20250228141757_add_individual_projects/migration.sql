-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "teamId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
