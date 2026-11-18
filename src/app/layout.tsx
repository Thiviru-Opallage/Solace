import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

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
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
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
