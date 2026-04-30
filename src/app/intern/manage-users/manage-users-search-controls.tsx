"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

const MANAGE_USERS_PATH = "/intern/manage-users";

type ManageUsersSearchControlsProps = {
  managerRole: string;
  role: string;
  studentStatus: string;
  query: string;
  page: number;
  selectedFields: readonly string[];
  allFields: readonly string[];
  canonicalHref: string;
  clearSearchHref: string;
  controlClassName: string;
  sections: ReadonlyArray<{
    label: string;
    filters: ReadonlyArray<{
      key: string;
      label: string;
    }>;
  }>;
};

export function ManageUsersSearchControls({
  managerRole,
  role,
  studentStatus,
  query,
  page,
  selectedFields,
  allFields,
  canonicalHref,
  clearSearchHref,
  controlClassName,
  sections,
}: ManageUsersSearchControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftQuery, setDraftQuery] = useState(query);
  const [draftSelectedFields, setDraftSelectedFields] = useState<readonly string[]>(selectedFields);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const defaultFields = getDefaultManageUsersFields(managerRole, role);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextHref = getCanonicalManageUsersHref(managerRole, {
        role,
        studentStatus,
        query: draftQuery,
        page: draftQuery.trim() === query && areFieldsEqual(draftSelectedFields, selectedFields) ? page : 1,
        fields: draftSelectedFields,
      });

      if (nextHref === canonicalHref) {
        return;
      }

      startTransition(() => {
        router.replace(nextHref, { scroll: false });
      });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    canonicalHref,
    draftQuery,
    draftSelectedFields,
    managerRole,
    page,
    query,
    role,
    router,
    selectedFields,
    startTransition,
    studentStatus,
  ]);

  const isDirty = draftQuery.trim() !== query || !areFieldsEqual(draftSelectedFields, selectedFields);
  const usesDefaultFieldSet = areFieldsEqual(draftSelectedFields, defaultFields);
  const hasAllFieldsSelected = areFieldsEqual(draftSelectedFields, allFields);

  return (
    <div className="space-y-3">
      {/* Search bar row */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <input
            id="query"
            name="query"
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="พิมพ์คำค้นที่ต้องการกรองรายชื่อ"
            className={`${controlClassName} pr-36`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                isPending || isDirty
                  ? "bg-[rgba(142,85,183,0.12)] text-[color:var(--color-brand-violet-deep)]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isPending || isDirty ? "กำลังอัปเดต" : "ค้นหาอัตโนมัติ"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFieldSelector((prev) => !prev)}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition ${
            showFieldSelector
              ? "border-[color:var(--color-brand-violet-deep)] bg-[color:var(--color-brand-violet-deep)] text-white"
              : "border-[color:var(--color-shell-border)] bg-white text-[color:var(--color-brand-violet-deep)] hover:bg-[color:var(--color-surface-soft)]"
          }`}
        >
          เลือกฟิลด์ ({draftSelectedFields.length})
          {showFieldSelector ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setDraftQuery("");
            setDraftSelectedFields(allFields);
            startTransition(() => {
              router.replace(clearSearchHref, { scroll: false });
            });
          }}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-[color:var(--color-shell-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-brand-violet-deep)] shadow-soft-brand transition hover:bg-[color:var(--color-surface-soft)]"
        >
          ล้างการค้นหา
        </button>
      </div>

      {/* Collapsible field selector */}
      {showFieldSelector ? (
        <div className="rounded-[1.6rem] border border-[color:var(--color-shell-border)] bg-white/90 p-4 shadow-soft-brand sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[color:var(--color-shell-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-950">เลือกฟิลด์ที่ใช้ค้นหา</p>
              <p className="text-xs text-slate-500">
                เลือกแล้ว {draftSelectedFields.length} จาก {allFields.length} ฟิลด์
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraftSelectedFields(allFields)}
                disabled={hasAllFieldsSelected}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[color:var(--color-shell-border)] bg-white px-4 text-xs font-semibold text-[color:var(--color-brand-violet-deep)] transition hover:bg-[color:var(--color-surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setDraftSelectedFields(defaultFields)}
                disabled={usesDefaultFieldSet}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[rgba(142,85,183,0.18)] bg-[rgba(142,85,183,0.08)] px-4 text-xs font-semibold text-[color:var(--color-brand-violet-deep)] transition hover:bg-[rgba(142,85,183,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                กลับค่าเริ่มต้น
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <section
                key={section.label}
                className="rounded-[1.35rem] border border-[color:var(--color-shell-border)] bg-[color:var(--color-surface-soft)]/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{section.label}</h3>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      เลือกอยู่ {section.filters.filter((filter) => draftSelectedFields.includes(filter.key)).length}/{section.filters.length} ฟิลด์
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {section.filters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      aria-pressed={draftSelectedFields.includes(filter.key)}
                      onClick={() => {
                        setDraftSelectedFields((currentFields) => {
                          if (currentFields.includes(filter.key)) {
                            if (currentFields.length === 1) {
                              return currentFields;
                            }

                            return currentFields.filter((field) => field !== filter.key);
                          }

                          const nextFieldSet = new Set([...currentFields, filter.key]);

                          return allFields.filter((field) => nextFieldSet.has(field));
                        });
                      }}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        draftSelectedFields.includes(filter.key)
                          ? "border-[color:var(--color-brand-violet-deep)] bg-[color:var(--color-brand-violet-deep)] text-white shadow-nav-pill"
                          : "border-[color:var(--color-shell-border)] bg-white text-[color:var(--color-brand-violet-deep)] hover:bg-[rgba(142,85,183,0.14)]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-500">ต้องเลือกอย่างน้อย 1 ฟิลด์ไว้เสมอ</p>
        </div>
      ) : null}
    </div>
  );
}

function getDefaultManageUsersFields(managerRole: string, role: string) {
  return managerRole === "Superadmin" && role === "admin"
    ? ["name", "email", "institution"]
    : role === "admin"
      ? ["name", "email", "institution"]
      : [
          "name",
          "email",
          "institution",
          "faculty",
          "year-level",
          "internship-position",
          "company",
          "guiding-professor",
          "company-supervisor",
        ];
}

function getCanonicalManageUsersHref(
  managerRole: string,
  filters: {
    role: string;
    studentStatus: string;
    query: string;
    page: number;
    fields: readonly string[];
  },
) {
  const params = new URLSearchParams();
  const trimmedQuery = filters.query.trim();
  const defaultFields = getDefaultManageUsersFields(managerRole, filters.role);

  if (managerRole === "Superadmin") {
    params.set("role", filters.role);
  }

  if (filters.studentStatus !== "all") {
    params.set("studentStatus", filters.studentStatus);
  }

  if (trimmedQuery) {
    params.set("query", trimmedQuery);
  }

  if (!areFieldsEqual(filters.fields, defaultFields)) {
    params.set("fields", filters.fields.join(","));
  }

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const queryString = params.toString();

  return queryString ? `${MANAGE_USERS_PATH}?${queryString}` : MANAGE_USERS_PATH;
}

function areFieldsEqual(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((field, index) => field === right[index]);
}
