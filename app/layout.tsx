import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import ChatbotWidget from "@/components/ChatbotWidget";

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
        <AuthProvider>
          {children}
          <ChatbotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
