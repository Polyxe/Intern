-- CreateTable
CREATE TABLE "InternshipWorkFile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipWorkFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternshipWorkFile_applicationId_idx" ON "InternshipWorkFile"("applicationId");

-- AddForeignKey
ALTER TABLE "InternshipWorkFile" ADD CONSTRAINT "InternshipWorkFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "InternshipApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
