import "dotenv/config";

import { randomBytes, scryptSync } from "node:crypto";

import pg from "pg";

const { Client } = pg;
const SCRYPT_KEY_LENGTH = 64;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
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
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});