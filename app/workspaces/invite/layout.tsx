import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Invitation - Openstud",
  description: "You're being invited to join a workspace.",
  keywords: [
    "openstud",
    "workspace",
    "invitation",
    "join",
    "collaboration",
    "study process",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://openstud.vercel.app/",
    title: "Workspace Invitation - Openstud",
    description: "You're being invited to join a workspace.",
    siteName: "Openstud",
    images: [
      {
        url: "https://ubrw5iu3hw.ufs.sh/f/TFsxjrtdWsEIpmbaYUVIN8qB9zrPkx7h3YEvXTfboyKpdS2L",
        width: 1200,
        height: 630,
        alt: "Openstud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Workspace Invitation - Openstud",
    description: "You're being invited to join a workspace.",
    images: [
      "https://ubrw5iu3hw.ufs.sh/f/TFsxjrtdWsEIpmbaYUVIN8qB9zrPkx7h3YEvXTfboyKpdS2L",
    ],
  },
};

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
