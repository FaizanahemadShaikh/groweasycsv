import React from "react";
import "./globals.css";

export const metadata = {
  title: "AI CRM CSV Importer",
  description: "Intelligent AI-powered CSV lead importer for GrowEasy CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
