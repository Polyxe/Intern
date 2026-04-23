import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppHeader } from "@/components/app-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Internship Management System",
  description: "ระบบจัดการฝึกงานสำหรับนักศึกษา อาจารย์ และผู้ประสานงาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(183,111,216,0.16),_transparent_34%),linear-gradient(180deg,_#fcfbfe_0%,_#f4f4f6_100%)] text-foreground">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
