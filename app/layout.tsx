import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { Providers } from "@/components/providers/index";
import { Toaster } from "sonner";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Openstud",
  description: "Education in today's smartest way",
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
    description: "Education in today's smartest way",
    siteName: "Openstud",
    images: [
      {
        url: "https://ubrw5iu3hw.ufs.sh/f/TFsxjrtdWsEINd5qsXKy9kHohf1BAiUGcSeL3dVQDnmF4YO6",
        width: 1200,
        height: 630,
        alt: "Openstud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Openstud",
    description: "Education in today's smartest way",
    images: [
      "https://ubrw5iu3hw.ufs.sh/f/TFsxjrtdWsEINd5qsXKy9kHohf1BAiUGcSeL3dVQDnmF4YO6",
    ],
    creator: "@DorianTho5",
  },
};

export default function RootLayout({
  children,
  auth,
}: Readonly<{
  children: React.ReactNode;
  auth?: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <div>{auth}</div>
        <Providers>{children}</Providers>
        <Toaster closeButton richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
