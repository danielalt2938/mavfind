import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/shared/SessionProvider";

export const metadata: Metadata = {
  title: "MavFind - Lost & Found",
  description: "Lost and Found platform for office locations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
