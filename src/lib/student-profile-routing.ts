import {
  normalizeInternshipApplicationWizardStep,
  type InternshipApplicationWizardStep,
} from "@/lib/internship-application-form";

type StudentInternshipProfileHrefOptions = {
  edit?: boolean;
  step?: InternshipApplicationWizardStep | string | null | undefined;
};

export function getStudentInternshipProfileHref(options?: StudentInternshipProfileHrefOptions) {
  const basePath = options?.edit ? "/intern/profile/edit" : "/intern/profile";
  const resolvedStep =
    typeof options?.step === "string"
      ? normalizeInternshipApplicationWizardStep(options.step)
      : options?.step;

  if (!resolvedStep || resolvedStep <= 1) {
    return basePath;
  }

  const params = new URLSearchParams();
  params.set("step", String(resolvedStep));

  return `${basePath}?${params.toString()}`;
}