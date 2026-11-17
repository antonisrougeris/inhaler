import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "FORM AIR — A different kind of ritual",
    template: "%s · FORM AIR",
  },
  description:
    "A considered collection of flavored-air concepts. Discover FORM AIR.",
  robots: {
    index: process.env.APP_ENV === "production",
    follow: process.env.APP_ENV === "production",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
