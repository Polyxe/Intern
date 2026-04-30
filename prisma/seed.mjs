import "dotenv/config";

import { randomBytes, scryptSync } from "node:crypto";

import pg from "pg";

const { Client } = pg;
const SCRYPT_KEY_LENGTH = 64;
const PAGINATION_FIXTURE_COUNT = 6;

const studentStatusFixtureConfigs = [
  {
    key: "no-application",
    label: "No Application",
    buildApplication: () => null,
  },
  {
    key: "pending",
    label: "Pending",
    buildApplication: ({ createdAt, sequence }) => ({
      studentId: buildStudentId(1000, sequence),
      phoneNumber: buildPhoneNumber(1000, sequence),
      faculty: "Engineering",
      program: "Software Engineering",
      yearLevel: "4",
      internshipPosition: `Pending Intern ${sequence}`,
      companyName: `Pending Company ${sequence}`,
      companyAddress: `${sequence} Pending Road, Chiang Mai`,
      guidingProfessorFirstname: "Mali",
      guidingProfessorLastname: "Pending",
      guidingProfessorPhoneNumber: buildPhoneNumber(2000, sequence),
      companySupervisorName: `Pending Supervisor ${sequence}`,
      companySupervisorRole: "Engineering Manager",
      companySupervisorEmail: normalizeEmail(`pending.supervisor.${sequence}@example.com`),
      companySupervisorPhoneNumber: buildPhoneNumber(3000, sequence),
      internshipStartDate: addDays(createdAt, 30),
      internshipEndDate: addDays(createdAt, 120),
      emergencyContactName: `Pending Contact ${sequence}`,
      emergencyContactRelationship: "Parent",
      emergencyContactPhoneNumber: buildPhoneNumber(4000, sequence),
      notes: "Pagination fixture for pending applications.",
      rejectionReason: null,
      status: "Pending",
      approvedAt: null,
      finishedAt: null,
      editedAfterApprovalAt: null,
      createdAt: addMinutes(createdAt, 15),
      updatedAt: addMinutes(createdAt, 15),
    }),
  },
  {
    key: "rejected",
    label: "Rejected",
    buildApplication: ({ createdAt, sequence }) => ({
      studentId: buildStudentId(2000, sequence),
      phoneNumber: buildPhoneNumber(5000, sequence),
      faculty: "Business Administration",
      program: "Information Systems",
      yearLevel: "3",
      internshipPosition: `Rejected Intern ${sequence}`,
      companyName: `Rejected Company ${sequence}`,
      companyAddress: `${sequence} Rejected Road, Chiang Mai`,
      guidingProfessorFirstname: "Anan",
      guidingProfessorLastname: "Rejected",
      guidingProfessorPhoneNumber: buildPhoneNumber(6000, sequence),
      companySupervisorName: `Rejected Supervisor ${sequence}`,
      companySupervisorRole: "Operations Lead",
      companySupervisorEmail: normalizeEmail(`rejected.supervisor.${sequence}@example.com`),
      companySupervisorPhoneNumber: buildPhoneNumber(7000, sequence),
      internshipStartDate: addDays(createdAt, 20),
      internshipEndDate: addDays(createdAt, 110),
      emergencyContactName: `Rejected Contact ${sequence}`,
      emergencyContactRelationship: "Sibling",
      emergencyContactPhoneNumber: buildPhoneNumber(8000, sequence),
      notes: "Pagination fixture for rejected applications.",
      rejectionReason: "Missing supporting documents.",
      status: "Rejected",
      approvedAt: null,
      finishedAt: null,
      editedAfterApprovalAt: null,
      createdAt: addMinutes(createdAt, 15),
      updatedAt: addMinutes(createdAt, 20),
    }),
  },
  {
    key: "on-going",
    label: "Ongoing",
    buildApplication: ({ createdAt, sequence }) => ({
      studentId: buildStudentId(3000, sequence),
      phoneNumber: buildPhoneNumber(9000, sequence),
      faculty: "Science",
      program: "Computer Science",
      yearLevel: "4",
      internshipPosition: `Ongoing Intern ${sequence}`,
      companyName: `Ongoing Company ${sequence}`,
      companyAddress: `${sequence} Ongoing Road, Chiang Mai`,
      guidingProfessorFirstname: "Suda",
      guidingProfessorLastname: "Ongoing",
      guidingProfessorPhoneNumber: buildPhoneNumber(10000, sequence),
      companySupervisorName: `Ongoing Supervisor ${sequence}`,
      companySupervisorRole: "Tech Lead",
      companySupervisorEmail: normalizeEmail(`ongoing.supervisor.${sequence}@example.com`),
      companySupervisorPhoneNumber: buildPhoneNumber(11000, sequence),
      internshipStartDate: addDays(createdAt, 10),
      internshipEndDate: addDays(createdAt, 100),
      emergencyContactName: `Ongoing Contact ${sequence}`,
      emergencyContactRelationship: "Parent",
      emergencyContactPhoneNumber: buildPhoneNumber(12000, sequence),
      notes: "Pagination fixture for ongoing internships.",
      rejectionReason: null,
      status: "Ongoing",
      approvedAt: addDays(createdAt, 5),
      finishedAt: null,
      editedAfterApprovalAt: null,
      createdAt: addMinutes(createdAt, 15),
      updatedAt: addMinutes(createdAt, 20),
    }),
  },
  {
    key: "needs-follow-up",
    label: "Needs Follow Up",
    buildApplication: ({ createdAt, sequence }) => ({
      studentId: buildStudentId(4000, sequence),
      phoneNumber: buildPhoneNumber(13000, sequence),
      faculty: "Humanities",
      program: "Digital Media",
      yearLevel: "4",
      internshipPosition: `Follow Up Intern ${sequence}`,
      companyName: `Follow Up Company ${sequence}`,
      companyAddress: `${sequence} Follow Up Road, Chiang Mai`,
      guidingProfessorFirstname: "Kanya",
      guidingProfessorLastname: "FollowUp",
      guidingProfessorPhoneNumber: buildPhoneNumber(14000, sequence),
      companySupervisorName: `Follow Up Supervisor ${sequence}`,
      companySupervisorRole: "Project Manager",
      companySupervisorEmail: normalizeEmail(`followup.supervisor.${sequence}@example.com`),
      companySupervisorPhoneNumber: buildPhoneNumber(15000, sequence),
      internshipStartDate: addDays(createdAt, 12),
      internshipEndDate: addDays(createdAt, 102),
      emergencyContactName: `Follow Up Contact ${sequence}`,
      emergencyContactRelationship: "Guardian",
      emergencyContactPhoneNumber: buildPhoneNumber(16000, sequence),
      notes: "Pagination fixture for follow-up applications.",
      rejectionReason: null,
      status: "Pending",
      approvedAt: null,
      finishedAt: null,
      editedAfterApprovalAt: addDays(createdAt, 8),
      createdAt: addMinutes(createdAt, 15),
      updatedAt: addDays(createdAt, 8),
    }),
  },
  {
    key: "finished",
    label: "Finished",
    buildApplication: ({ createdAt, sequence }) => ({
      studentId: buildStudentId(5000, sequence),
      phoneNumber: buildPhoneNumber(17000, sequence),
      faculty: "Architecture",
      program: "Design Technology",
      yearLevel: "4",
      internshipPosition: `Finished Intern ${sequence}`,
      companyName: `Finished Company ${sequence}`,
      companyAddress: `${sequence} Finished Road, Chiang Mai`,
      guidingProfessorFirstname: "Prasert",
      guidingProfessorLastname: "Finished",
      guidingProfessorPhoneNumber: buildPhoneNumber(18000, sequence),
      companySupervisorName: `Finished Supervisor ${sequence}`,
      companySupervisorRole: "Program Director",
      companySupervisorEmail: normalizeEmail(`finished.supervisor.${sequence}@example.com`),
      companySupervisorPhoneNumber: buildPhoneNumber(19000, sequence),
      internshipStartDate: addDays(createdAt, -90),
      internshipEndDate: addDays(createdAt, -5),
      emergencyContactName: `Finished Contact ${sequence}`,
      emergencyContactRelationship: "Parent",
      emergencyContactPhoneNumber: buildPhoneNumber(20000, sequence),
      notes: "Pagination fixture for finished internships.",
      rejectionReason: null,
      status: "Finished",
      approvedAt: addDays(createdAt, -95),
      finishedAt: addDays(createdAt, -2),
      editedAfterApprovalAt: null,
      createdAt: addMinutes(createdAt, 15),
      updatedAt: addDays(createdAt, -2),
    }),
  },
];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function addMinutes(date, minutes) {
  const nextDate = new Date(date);
  nextDate.setUTCMinutes(nextDate.getUTCMinutes() + minutes);
  return nextDate;
}

function buildStudentId(groupOffset, sequence) {
  return `65061${String(groupOffset + sequence).padStart(5, "0")}`;
}

function buildPhoneNumber(groupOffset, sequence) {
  return `08${String(groupOffset + sequence).padStart(8, "0")}`;
}

function createFixtureCreatedAt(index) {
  return new Date(Date.UTC(2026, 3, 1, 9, index, 0, 0));
}

function buildPaginationStudentFixtures() {
  let createdAtIndex = 0;

  return studentStatusFixtureConfigs.flatMap((config, configIndex) =>
    Array.from({ length: PAGINATION_FIXTURE_COUNT }, (_, index) => {
      const sequence = index + 1;
      const createdAt = createFixtureCreatedAt(createdAtIndex);
      createdAtIndex += 1;

      return {
        title: "Mr.",
        firstname: `${config.label} ${String(sequence).padStart(2, "0")}`,
        lastname: "Student",
        sex: "Male",
        birthDate: new Date(Date.UTC(2004, configIndex, sequence, 0, 0, 0, 0)),
        address: `${sequence} Pagination Student Lane`,
        institution: "Chiang Mai University",
        email: normalizeEmail(`pagination.student.${config.key}.${String(sequence).padStart(2, "0")}@example.com`),
        password: hashPassword("student123"),
        role: "Student",
        acceptedTermsAt: addMinutes(createdAt, 5),
        createdAt,
        updatedAt: createdAt,
        application: config.buildApplication({ createdAt, sequence }),
      };
    }),
  );
}

function buildPaginationAdminFixtures() {
  return Array.from({ length: PAGINATION_FIXTURE_COUNT }, (_, index) => {
    const sequence = index + 1;
    const createdAt = createFixtureCreatedAt(100 + index);

    return {
      title: "Ms.",
      firstname: `Pagination Admin ${String(sequence).padStart(2, "0")}`,
      lastname: "Manager",
      sex: null,
      birthDate: null,
      address: `${sequence} Pagination Admin Road`,
      institution: "Internship Office",
      email: normalizeEmail(`pagination.admin.${String(sequence).padStart(2, "0")}@example.com`),
      password: hashPassword("admin123"),
      role: "Admin",
      acceptedTermsAt: null,
      createdAt,
      updatedAt: createdAt,
      application: null,
    };
  });
}

async function upsertUser(client, user) {
  const result = await client.query(
    `
      INSERT INTO "User" (
        "id",
        "title",
        "firstname",
        "lastname",
        "sex",
        "birthDate",
        "address",
        "institution",
        "email",
        "password",
        "role",
        "acceptedTermsAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10::"UserRole",
        $11,
        $12,
        $13
      )
      ON CONFLICT ("email")
      DO UPDATE SET
        "title" = EXCLUDED."title",
        "firstname" = EXCLUDED."firstname",
        "lastname" = EXCLUDED."lastname",
        "sex" = EXCLUDED."sex",
        "birthDate" = EXCLUDED."birthDate",
        "address" = EXCLUDED."address",
        "institution" = EXCLUDED."institution",
        "password" = EXCLUDED."password",
        "role" = EXCLUDED."role",
        "acceptedTermsAt" = EXCLUDED."acceptedTermsAt",
        "createdAt" = EXCLUDED."createdAt",
        "updatedAt" = EXCLUDED."updatedAt"
      RETURNING "id"
    `,
    [
      user.title,
      user.firstname,
      user.lastname,
      user.sex,
      user.birthDate,
      user.address,
      user.institution,
      user.email,
      user.password,
      user.role,
      user.acceptedTermsAt,
      user.createdAt,
      user.updatedAt,
    ],
  );

  return result.rows[0]?.id ?? null;
}

async function syncApplication(client, userId, application) {
  if (!application) {
    await client.query(`DELETE FROM "InternshipApplication" WHERE "userId" = $1`, [userId]);
    return;
  }

  await client.query(
    `
      INSERT INTO "InternshipApplication" (
        "id",
        "userId",
        "studentId",
        "phoneNumber",
        "faculty",
        "program",
        "yearLevel",
        "internshipPosition",
        "companyName",
        "companyAddress",
        "guidingProfessorFirstname",
        "guidingProfessorLastname",
        "guidingProfessorPhoneNumber",
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
        "rejectionReason",
        "approvalStatus",
        "approvedAt",
        "finishedAt",
        "editedAfterApprovalAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $21,
        $22,
        $23,
        $24::"InternshipApplicationStatus",
        $25,
        $26,
        $27,
        $28,
        $29
      )
      ON CONFLICT ("userId")
      DO UPDATE SET
        "studentId" = EXCLUDED."studentId",
        "phoneNumber" = EXCLUDED."phoneNumber",
        "faculty" = EXCLUDED."faculty",
        "program" = EXCLUDED."program",
        "yearLevel" = EXCLUDED."yearLevel",
        "internshipPosition" = EXCLUDED."internshipPosition",
        "companyName" = EXCLUDED."companyName",
        "companyAddress" = EXCLUDED."companyAddress",
        "guidingProfessorFirstname" = EXCLUDED."guidingProfessorFirstname",
        "guidingProfessorLastname" = EXCLUDED."guidingProfessorLastname",
        "guidingProfessorPhoneNumber" = EXCLUDED."guidingProfessorPhoneNumber",
        "companySupervisorName" = EXCLUDED."companySupervisorName",
        "companySupervisorRole" = EXCLUDED."companySupervisorRole",
        "companySupervisorEmail" = EXCLUDED."companySupervisorEmail",
        "companySupervisorPhoneNumber" = EXCLUDED."companySupervisorPhoneNumber",
        "internshipStartDate" = EXCLUDED."internshipStartDate",
        "internshipEndDate" = EXCLUDED."internshipEndDate",
        "emergencyContactName" = EXCLUDED."emergencyContactName",
        "emergencyContactRelationship" = EXCLUDED."emergencyContactRelationship",
        "emergencyContactPhoneNumber" = EXCLUDED."emergencyContactPhoneNumber",
        "notes" = EXCLUDED."notes",
        "rejectionReason" = EXCLUDED."rejectionReason",
        "approvalStatus" = EXCLUDED."approvalStatus",
        "approvedAt" = EXCLUDED."approvedAt",
        "finishedAt" = EXCLUDED."finishedAt",
        "editedAfterApprovalAt" = EXCLUDED."editedAfterApprovalAt",
        "createdAt" = EXCLUDED."createdAt",
        "updatedAt" = EXCLUDED."updatedAt"
    `,
    [
      userId,
      application.studentId,
      application.phoneNumber,
      application.faculty,
      application.program,
      application.yearLevel,
      application.internshipPosition,
      application.companyName,
      application.companyAddress,
      application.guidingProfessorFirstname,
      application.guidingProfessorLastname,
      application.guidingProfessorPhoneNumber,
      application.companySupervisorName,
      application.companySupervisorRole,
      application.companySupervisorEmail,
      application.companySupervisorPhoneNumber,
      application.internshipStartDate,
      application.internshipEndDate,
      application.emergencyContactName,
      application.emergencyContactRelationship,
      application.emergencyContactPhoneNumber,
      application.notes,
      application.rejectionReason,
      application.status,
      application.approvedAt,
      application.finishedAt,
      application.editedAfterApprovalAt,
      application.createdAt,
      application.updatedAt,
    ],
  );
}

async function seedPaginationFixtures(client) {
  const users = [...buildPaginationStudentFixtures(), ...buildPaginationAdminFixtures()];

  for (const user of users) {
    const userId = await upsertUser(client, user);

    if (!userId) {
      throw new Error(`Failed to upsert user ${user.email}`);
    }

    await syncApplication(client, userId, user.application);
    console.log(`Seeded pagination fixture: ${user.email}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  const seededSuperadmins = [
    {
      title: "คุณ",
      firstname: "Boaz",
      lastname: "",
      email: normalizeEmail("boazpolyjolax39@gmail.com"),
    },
/*    {
      title: "",
      firstname: "",
      lastname: "",
      email: normalizeEmail("polnapak_jantha@cmu.ac.th"),
    },*/
  ];

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();

  try {
    for (const user of seededSuperadmins) {
      await client.query(
        `
          INSERT INTO "User" ("id", "title", "firstname", "lastname", "email", "password", "role", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::"UserRole", NOW(), NOW())
          ON CONFLICT ("email")
          DO UPDATE SET
            "title" = EXCLUDED."title",
            "firstname" = EXCLUDED."firstname",
            "lastname" = EXCLUDED."lastname",
            "password" = EXCLUDED."password",
            "role" = EXCLUDED."role",
            "updatedAt" = NOW()
        `,
        [user.title, user.firstname, user.lastname, user.email, hashPassword("admin123"), "Superadmin"],
      );

      console.log(`Seeded superadmin user: ${user.email}`);
    }

    await seedPaginationFixtures(client);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});