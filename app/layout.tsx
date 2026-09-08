import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KidyCode",
  description: "A practical coding course where ages 10 to 12 build one mission game from blocks to JavaScript.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
