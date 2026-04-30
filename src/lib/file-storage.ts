import "server-only";

import { mkdir, readdir, rm, rmdir, writeFile } from "node:fs/promises";
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

function isWithinDirectory(targetPath: string, baseDirectory: string) {
  const relativePath = path.relative(baseDirectory, targetPath);

  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

async function pruneEmptyParentDirectories(absoluteFilePath: string, baseDirectory: string) {
  let currentDirectory = path.dirname(absoluteFilePath);

  while (isWithinDirectory(currentDirectory, baseDirectory)) {
    try {
      const entries = await readdir(currentDirectory);

      if (entries.length > 0) {
        return;
      }

      await rmdir(currentDirectory);
    } catch {
      return;
    }

    currentDirectory = path.dirname(currentDirectory);
  }
}

async function deleteStoredFileAtBaseDirectory(
  filePath: string,
  resolveAbsolutePath: (uploadPath: string) => string,
  baseDirectory: string,
) {
  const absoluteFilePath = resolveAbsolutePath(filePath);

  try {
    await rm(absoluteFilePath, { force: true });
    await pruneEmptyParentDirectories(absoluteFilePath, baseDirectory);
  } catch {
    // Ignore cleanup failures for missing files.
  }
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
      await Promise.all([
        deleteStoredFileAtBaseDirectory(filePath, getStoredFileAbsolutePath, UPLOADS_DIRECTORY),
        deleteStoredFileAtBaseDirectory(filePath, getLegacyStoredFileAbsolutePath, LEGACY_PUBLIC_UPLOADS_DIRECTORY),
      ]);
    }),
  );
}