-- AlterTable
ALTER TABLE "InternshipApplication" ADD COLUMN     "guidingProfessorFirstname" TEXT,
ADD COLUMN     "guidingProfessorLastname" TEXT,
ADD COLUMN     "guidingProfessorPhoneNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "sex" TEXT;
