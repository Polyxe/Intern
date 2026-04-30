export const INTERN_BASE_PATH = "/intern";
export const INTERN_UPLOADS_PATH = `${INTERN_BASE_PATH}/uploads`;
export const INTERNSHIP_APPLICATION_UPLOADS_SEGMENT = "internship-applications";

export function normalizePublicUploadPath(uploadPath?: string | null) {
  if (!uploadPath) {
    return uploadPath ?? null;
  }

  if (uploadPath.startsWith(`${INTERN_UPLOADS_PATH}/`)) {
    return uploadPath;
  }

  if (uploadPath.startsWith("/uploads/")) {
    return `${INTERN_BASE_PATH}${uploadPath}`;
  }

  return uploadPath;
}

export function isInternshipAttachmentUploadPath(uploadPath?: string | null) {
  const normalizedUploadPath = normalizePublicUploadPath(uploadPath);

  return normalizedUploadPath?.includes(`/${INTERNSHIP_APPLICATION_UPLOADS_SEGMENT}/`) ?? false;
}

export function getInternshipAttachmentDownloadPath(uploadPath?: string | null, fileName?: string | null) {
  const normalizedUploadPath = normalizePublicUploadPath(uploadPath);

  if (!normalizedUploadPath) {
    return normalizedUploadPath ?? null;
  }

  if (!fileName) {
    return normalizedUploadPath;
  }

  const searchParams = new URLSearchParams({ download: fileName });

  return `${normalizedUploadPath}?${searchParams.toString()}`;
}