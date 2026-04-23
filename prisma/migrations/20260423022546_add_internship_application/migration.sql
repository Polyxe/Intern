-- CreateEnum
CREATE TYPE "InternshipApplicationApprovalStatus" AS ENUM ('Pending', 'Approved');

-- CreateTable
CREATE TABLE "InternshipApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "yearLevel" TEXT NOT NULL,
    "internshipPosition" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companySupervisorName" TEXT NOT NULL,
    "companySupervisorRole" TEXT NOT NULL,
    "companySupervisorEmail" TEXT NOT NULL,
    "companySupervisorPhoneNumber" TEXT NOT NULL,
    "internshipStartDate" TIMESTAMP(3) NOT NULL,
    "internshipEndDate" TIMESTAMP(3) NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactRelationship" TEXT NOT NULL,
    "emergencyContactPhoneNumber" TEXT NOT NULL,
    "notes" TEXT,
    "approvalStatus" "InternshipApplicationApprovalStatus" NOT NULL DEFAULT 'Pending',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternshipApplication_userId_key" ON "InternshipApplication"("userId");

-- AddForeignKey
ALTER TABLE "InternshipApplication" ADD CONSTRAINT "InternshipApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
