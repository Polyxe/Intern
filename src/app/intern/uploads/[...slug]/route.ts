import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { notFound } from "next/navigation";

import { getLegacyStoredFileAbsolutePath, getStoredFileAbsolutePath } from "@/lib/file-storage";
import { isInternshipAttachmentUploadPath, isInternshipWorkUploadPath } from "@/lib/public-paths";

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

function getStoredDownloadFileName(filePath: string) {
  return path.basename(filePath).replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-/i, "");
}

function buildAttachmentContentDisposition(fileName: string) {
  const fallbackFileName = fileName.replace(/[^\x20-\x7e]+/g, "-").replace(/["\\]/g, "-") || "attachment";

  return `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

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

export async function GET(request: Request, { params }: UploadFileRouteProps) {
  const { slug } = await params;
  const uploadPath = `/intern/uploads/${slug.join("/")}`;

  try {
    const { filePath, buffer } = await readStoredUpload(uploadPath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";
    const requestedFileName = new URL(request.url).searchParams.get("download")?.trim();
    const downloadFileName = requestedFileName || getStoredDownloadFileName(filePath);
    const shouldForceDownload =
      isInternshipAttachmentUploadPath(uploadPath) || isInternshipWorkUploadPath(uploadPath);

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Length": String(buffer.byteLength),
        "X-Content-Type-Options": "nosniff",
        ...(shouldForceDownload ? { "Content-Disposition": buildAttachmentContentDisposition(downloadFileName) } : {}),
      },
    });
  } catch {
    notFound();
  }
}