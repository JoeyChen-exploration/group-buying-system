import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "悦味 Baking Studio",
  description: "悦味 Baking Studio 官网与订单系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
