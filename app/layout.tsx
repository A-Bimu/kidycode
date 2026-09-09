import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KidyCode",
  description: "A practical self-paced course where ages 10 to 12 learn HTML, CSS and JavaScript by building a real website.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
