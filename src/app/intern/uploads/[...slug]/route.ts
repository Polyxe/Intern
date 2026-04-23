import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { notFound } from "next/navigation";

import { getLegacyStoredFileAbsolutePath, getStoredFileAbsolutePath } from "@/lib/file-storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

type UploadFileRouteProps = {
  params: Promise<{
    slug: string[];
  }>;
};

async function readStoredUpload(uploadPath: string) {
  const currentPath = getStoredFileAbsolutePath(uploadPath);

  try {
    await access(currentPath);
    return {
      filePath: currentPath,
      buffer: await readFile(currentPath),
    };
  } catch {
    const legacyPath = getLegacyStoredFileAbsolutePath(uploadPath);

    await access(legacyPath);

    return {
      filePath: legacyPath,
      buffer: await readFile(legacyPath),
    };
  }
}

export async function GET(_: Request, { params }: UploadFileRouteProps) {
  const { slug } = await params;
  const uploadPath = `/intern/uploads/${slug.join("/")}`;

  try {
    const { filePath, buffer } = await readStoredUpload(uploadPath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch {
    notFound();
  }
}