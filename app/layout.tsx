import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Openstud",
  description: "The Ultimate Place for Smarter Learning",
  metadataBase: new URL("https://openstud.vercel.app/"),
  keywords: [
    "education",
    "smarter",
    "learning",
    "openstud",
    "study",
    "study management",
    "revision",
    "revision assistant",
    "study planning",
    "progress tracking",
    "study resources",
    "analytics",
    "community support",
    "student",
    "success",
    "focus mode",
    "collaboration",
    "study groups",
    "custom templates",
    "ai",
    "perplexity ai",
    "sonar",
    "cuttypie",
  ],
  authors: [
    {
      name: "cuttypie",
      url: "https://cuttypiedev.vercel.app/",
    },
  ],
  creator: "cuttypie",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://openstud.vercel.app/",
    title: "Openstud",
    description: "The Ultimate Place for Smarter Learning",
    siteName: "Openstud",
    images: [
      {
        url: "https://openstud.vercel.app/openstud-logo.png",
        width: 1200,
        height: 630,
        alt: "Openstud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Openstud",
    description: "The Ultimate Place for Smarter Learning",
    images: ["https://openstud.vercel.app/openstud-logo.png"],
    creator: "@DorianTho5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
        <Toaster closeButton richColors />
      </body>
    </html>
  );
}
