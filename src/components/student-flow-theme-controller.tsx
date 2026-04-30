"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type StudentFlowThemeControllerProps = {
  isStudent: boolean;
};

const studentThemeRoutePrefixes = ["/intern/terms", "/intern/profile"];

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function StudentFlowThemeController({ isStudent }: StudentFlowThemeControllerProps) {
  const pathname = usePathname();

  useEffect(() => {
    const shouldUseStudentTheme = isStudent && studentThemeRoutePrefixes.some((prefix) => matchesRoutePrefix(pathname, prefix));

    document.documentElement.classList.toggle("student-flow-theme", shouldUseStudentTheme);

    return () => {
      document.documentElement.classList.remove("student-flow-theme");
    };
  }, [isStudent, pathname]);

  return <span hidden data-student-flow-controller aria-hidden="true" />;
}