import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/ui/PageTransition";
import { ToastProvider } from "@/components/ui/Toast";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { ConditionalLayout } from "@/components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

export const metadata: Metadata = {
  title: "MacroMinded | Custom Meal Plans",
  description:
    "MacroMinded crafts human-designed meal plans tailored to your goals—no templates, no shortcuts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} bg-background text-foreground antialiased`}
      >
        <ErrorBoundaryWrapper>
          <AppProvider>
            <ToastProvider>
              <ConditionalLayout
                navbar={<Navbar />}
                footer={<Footer />}
              >
                <ImpersonationBanner />
                {children}
              </ConditionalLayout>
            </ToastProvider>
          </AppProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
