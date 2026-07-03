import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI+X Challenge Learning MVP",
  description: "Feishu + GitHub powered AI+X challenge learning workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

