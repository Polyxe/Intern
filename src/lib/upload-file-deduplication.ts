export function getUploadFileDeduplicationKey(fileName: string, fileSize: number) {
  return `${fileName.trim().toLowerCase()}::${fileSize}`;
}

export function getBrowserFileDeduplicationKey(file: File) {
  return getUploadFileDeduplicationKey(file.name, file.size);
}