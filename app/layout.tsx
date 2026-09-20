import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KidyCode",
  description: "Self-paced HTML, CSS and JavaScript courses for ages 10 and above, taught through real code and one complete website project.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
