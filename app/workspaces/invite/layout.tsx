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
};

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
