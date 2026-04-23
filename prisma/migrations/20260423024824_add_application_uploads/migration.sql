-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImagePath" TEXT;

-- CreateTable
CREATE TABLE "InternshipApplicationAttachment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipApplicationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternshipApplicationAttachment_applicationId_idx" ON "InternshipApplicationAttachment"("applicationId");

-- AddForeignKey
ALTER TABLE "InternshipApplicationAttachment" ADD CONSTRAINT "InternshipApplicationAttachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "InternshipApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
