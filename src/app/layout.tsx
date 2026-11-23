import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubTrack",
  description: "Track subscriptions, payments, fees and renewals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
