ALTER TYPE "InternshipApplicationApprovalStatus" RENAME TO "InternshipApplicationStatus";

ALTER TYPE "InternshipApplicationStatus" RENAME VALUE 'Approved' TO 'Ongoing';

ALTER TYPE "InternshipApplicationStatus" ADD VALUE 'Finished';

ALTER TABLE "InternshipApplication"
ADD COLUMN "finishedAt" TIMESTAMP(3);