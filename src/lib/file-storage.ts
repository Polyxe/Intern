import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { INTERN_UPLOADS_PATH } from "@/lib/public-paths";

const UPLOADS_DIRECTORY = path.join(process.cwd(), "uploads");
const LEGACY_PUBLIC_UPLOADS_DIRECTORY = path.join(process.cwd(), "public", "uploads");

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function normalizeUploadPath(uploadPath: string) {
  return uploadPath.replace(/^\/(?:intern\/)?uploads\//, "").replace(/^\//, "");
}

export function getStoredFileAbsolutePath(uploadPath: string) {
  return path.join(UPLOADS_DIRECTORY, normalizeUploadPath(uploadPath));
}

export function getLegacyStoredFileAbsolutePath(uploadPath: string) {
  return path.join(LEGACY_PUBLIC_UPLOADS_DIRECTORY, normalizeUploadPath(uploadPath));
}

export async function saveUploadedFile(file: File, directory: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = sanitizeFileName(file.name || "file");
  const storedFileName = `${randomUUID()}-${safeName}`;
  const publicDirectory = `${INTERN_UPLOADS_PATH}/${directory.replace(/^\/+|\/+$/g, "")}`;
  const publicPath = `${publicDirectory}/${storedFileName}`;
  const absoluteDirectory = getStoredFileAbsolutePath(publicDirectory);

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(getStoredFileAbsolutePath(publicPath), buffer);

  return {
    fileName: file.name || safeName,
    filePath: publicPath,
    mimeType: file.type,
    fileSize: file.size,
  };
}

export async function deleteStoredFiles(filePaths: string[]) {
  await Promise.all(
    filePaths.filter(Boolean).map(async (filePath) => {
      try {
        await rm(getStoredFileAbsolutePath(filePath), { force: true });
      } catch {
        try {
          await rm(getLegacyStoredFileAbsolutePath(filePath), { force: true });
        } catch {
          // Ignore cleanup failures for missing files.
        }
      }
    }),
  );
}