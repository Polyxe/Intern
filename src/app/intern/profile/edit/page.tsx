import { StudentProfileFlowPage } from "../student-profile-flow";

export default function InternProfileEditPage({
  searchParams,
}: {
  searchParams?: Promise<{
    step?: string;
  }>;
}) {
  return <StudentProfileFlowPage searchParams={searchParams} requestedEdit />;
}