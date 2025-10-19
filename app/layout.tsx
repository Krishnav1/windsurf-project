import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Token Issuance Platform",
  description: "Prototype platform for tokenizing real-world assets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-[var(--foreground)] antialiased">
        <div className="relative min-h-screen">
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-[var(--neutral-200)] bg-white/80 py-8 backdrop-blur">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <p className="text-sm text-[var(--neutral-500)]">
                    © {new Date().getFullYear()} TokenPlatform. Sandbox demonstration only.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--neutral-500)]">
                    <a href="/legal/terms" className="hover:text-[var(--primary-color)] transition">Terms</a>
                    <span>•</span>
                    <a href="/legal/privacy" className="hover:text-[var(--primary-color)] transition">Privacy</a>
                    <span>•</span>
                    <a href="/legal/sandbox-declaration" className="hover:text-[var(--primary-color)] transition">Sandbox Declaration</a>
                    <span>•</span>
                    <a href="/legal/risk-disclosure" className="hover:text-[var(--primary-color)] transition">Risk Disclosure</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
