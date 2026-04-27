export const sexOptions = [
  { value: "Male", label: "ชาย" },
  { value: "Female", label: "หญิง" },
  { value: "Other", label: "อื่น ๆ" },
] as const;

const sexValueMap = new Map<string, (typeof sexOptions)[number]["value"]>([
  ["male", "Male"],
  ["ชาย", "Male"],
  ["female", "Female"],
  ["หญิง", "Female"],
  ["other", "Other"],
  ["อื่น ๆ", "Other"],
  ["อื่นๆ", "Other"],
]);

const sexLabelMap = new Map<(typeof sexOptions)[number]["value"], (typeof sexOptions)[number]["label"]>(
  sexOptions.map((option) => [option.value, option.label]),
);

export function normalizeSexValue(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return "";
  }

  return sexValueMap.get(trimmedValue.toLowerCase()) ?? trimmedValue;
}

export function getSexLabel(value?: string | null) {
  const normalizedValue = normalizeSexValue(value);

  if (!normalizedValue) {
    return null;
  }

  return sexLabelMap.get(normalizedValue as (typeof sexOptions)[number]["value"]) ?? normalizedValue;
}