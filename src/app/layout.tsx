import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "bilimdibol — платформа управления онлайн-курсами",
  description:
    "Внутренняя SaaS-платформа bilimdibol для управления онлайн-курсами английского языка: CRM, продажи, реклама, финансы, зарплаты и аналитика.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
