import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  title: "Ahoy — море общения",
  description:
    "Ahoy — социальная сеть для тех, кто в плавании. Делитесь мыслями, публикуйте посты и ловите попутный ветер.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${unbounded.variable} antialiased`}>
        <div className="bg-scene" aria-hidden />
        {children}
      </body>
    </html>
  );
}
