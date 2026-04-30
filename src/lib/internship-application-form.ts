export type InternshipApplicationFormValues = {
  title: string;
  firstname: string;
  lastname: string;
  sex: string;
  birthDate: string;
  address: string;
  institution: string;
  studentId: string;
  phoneNumber: string;
  faculty: string;
  program: string;
  yearLevel: string;
  internshipPosition: string;
  companyName: string;
  companyAddress: string;
  guidingProfessorFirstname: string;
  guidingProfessorLastname: string;
  guidingProfessorPhoneNumber: string;
  companySupervisorName: string;
  companySupervisorRole: string;
  companySupervisorEmail: string;
  companySupervisorPhoneNumber: string;
  internshipStartDate: string;
  internshipEndDate: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhoneNumber: string;
  notes: string;
};

export type InternshipApplicationWizardStep = 1 | 2 | 3;

export type InternshipApplicationFieldName =
  | keyof InternshipApplicationFormValues
  | "email"
  | "profilePhoto"
  | "attachments";

export const defaultInternshipApplicationFormValues: InternshipApplicationFormValues = {
  title: "",
  firstname: "",
  lastname: "",
  sex: "",
  birthDate: "",
  address: "",
  institution: "",
  studentId: "",
  phoneNumber: "",
  faculty: "",
  program: "",
  yearLevel: "",
  internshipPosition: "",
  companyName: "",
  companyAddress: "",
  guidingProfessorFirstname: "",
  guidingProfessorLastname: "",
  guidingProfessorPhoneNumber: "",
  companySupervisorName: "",
  companySupervisorRole: "",
  companySupervisorEmail: "",
  companySupervisorPhoneNumber: "",
  internshipStartDate: "",
  internshipEndDate: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhoneNumber: "",
  notes: "",
};

export const internshipApplicationWizardStepOrder: InternshipApplicationWizardStep[] = [1, 2, 3];

export const internshipApplicationStepFieldNames: Record<
  InternshipApplicationWizardStep,
  readonly InternshipApplicationFieldName[]
> = {
  1: ["title", "firstname", "lastname", "sex", "birthDate", "address", "institution", "profilePhoto"],
  2: [
    "studentId",
    "phoneNumber",
    "faculty",
    "program",
    "yearLevel",
    "guidingProfessorFirstname",
    "guidingProfessorLastname",
    "guidingProfessorPhoneNumber",
  ],
  3: [
    "internshipPosition",
    "companyName",
    "companyAddress",
    "companySupervisorName",
    "companySupervisorRole",
    "companySupervisorEmail",
    "companySupervisorPhoneNumber",
    "internshipStartDate",
    "internshipEndDate",
    "emergencyContactName",
    "emergencyContactRelationship",
    "emergencyContactPhoneNumber",
    "notes",
    "attachments",
  ],
};

export const internshipApplicationFormTextFieldNames = Object.keys(
  defaultInternshipApplicationFormValues,
) as Array<keyof InternshipApplicationFormValues>;

export const internshipApplicationWizardMeta: Record<
  InternshipApplicationWizardStep,
  {
    title: string;
    description: string;
    submitLabel: string;
  }
> = {
  1: {
    title: "ข้อมูลส่วนตัวและรูปโปรไฟล์",
    description: "กรอกข้อมูลโปรไฟล์พื้นฐานให้ครบก่อน แล้วไปยังขั้นตอนข้อมูลการศึกษา",
    submitLabel: "ไปขั้นตอนถัดไป",
  },
  2: {
    title: "ข้อมูลการศึกษา",
    description: "กรอกข้อมูลการศึกษาและอาจารย์นิเทศ ก่อนเข้าสู่รายละเอียดการฝึกงาน",
    submitLabel: "ไปขั้นตอนถัดไป",
  },
  3: {
    title: "ข้อมูลฝึกงานและเอกสารประกอบ",
    description: "บันทึกข้อมูลฝึกงานและไฟล์แนบ จากนั้นส่งแบบฟอร์มเพื่อเข้าสู่สถานะรอตรวจสอบ",
    submitLabel: "บันทึกและส่งแบบฟอร์ม",
  },
};

export function normalizeInternshipApplicationWizardStep(value: number | string | null | undefined) {
  const normalizedValue = Number.parseInt(String(value ?? ""), 10);

  if (normalizedValue === 2 || normalizedValue === 3) {
    return normalizedValue as InternshipApplicationWizardStep;
  }

  return 1 as InternshipApplicationWizardStep;
}

export function getNextInternshipApplicationWizardStep(step: InternshipApplicationWizardStep) {
  return step === 1 ? 2 : 3;
}

export function getPreviousInternshipApplicationWizardStep(step: InternshipApplicationWizardStep) {
  return step === 3 ? 2 : 1;
}

export function mergeInternshipApplicationFormValues(
  ...partials: Array<Partial<InternshipApplicationFormValues> | null | undefined>
) {
  return Object.assign({}, defaultInternshipApplicationFormValues, ...partials);
}