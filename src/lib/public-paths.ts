export const INTERN_BASE_PATH = "/intern";
export const INTERN_UPLOADS_PATH = `${INTERN_BASE_PATH}/uploads`;

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