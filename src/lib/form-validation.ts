export function isValidPhoneNumber(value: string) {
  return /^\d{9,10}$/.test(value.trim());
}

export function isValidStudentId(value: string) {
  return /^\d+$/.test(value.trim());
}

export function isValidYearLevel(value: string) {
  return /^[1-4]$/.test(value.trim());
}

export function isFutureDate(date: Date) {
  const now = new Date();
  const todayAtUtcNoon = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0);

  return date.getTime() > todayAtUtcNoon;
}