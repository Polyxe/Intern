"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.label}
            className="rounded-[1.35rem] border border-[rgba(142,85,183,0.12)] bg-white/80 px-4 py-4 shadow-[0_10px_22px_rgba(112,90,138,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-brand-violet-deep)]">
              {section.label}
            </p>
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
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                    draftSelectedFields.includes(filter.key)
                      ? "border-[color:var(--color-brand-violet-deep)] bg-[color:var(--color-brand-violet-deep)] text-white shadow-nav-pill"
                      : "border-[rgba(142,85,183,0.12)] bg-[rgba(142,85,183,0.08)] text-[color:var(--color-brand-violet-deep)] hover:bg-[rgba(142,85,183,0.14)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
        <label htmlFor="query" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          ค้นหาทุกฟิลด์พร้อมกัน
        </label>
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
        </div>

        <div className="flex items-end">
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
      </div>
    </div>
  );
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
  const defaultFields = managerRole === "Superadmin" && filters.role === "admin"
    ? ["name", "email", "institution"]
    : filters.role === "admin"
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