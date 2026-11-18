import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solace | Insurance, quietly handled.",
  description:
    "An Insurance Policy & Claims Management System engineered with clarity, trust, and calm efficiency.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#F8F9FB] text-slate-800">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            closeButton
            toastOptions={{
              style: {
                background: "#FFFFFF",
                color: "#1E293B",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                borderRadius: "1rem",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
