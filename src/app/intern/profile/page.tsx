import { StudentProfileFlowPage } from "./student-profile-flow";

export default function InternProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{
    step?: string;
  }>;
}) {
  return <StudentProfileFlowPage searchParams={searchParams} />;
}