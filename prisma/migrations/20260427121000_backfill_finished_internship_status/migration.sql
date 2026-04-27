UPDATE "InternshipApplication"
SET
  "approvalStatus" = 'Finished'::"InternshipApplicationStatus",
  "finishedAt" = "internshipEndDate"
WHERE "approvalStatus" = 'Ongoing'::"InternshipApplicationStatus"
  AND CURRENT_DATE > DATE("internshipEndDate");