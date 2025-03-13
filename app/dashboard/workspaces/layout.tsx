import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspaces - Openstud",
  description: "Manage your workspaces and team collaboration.",
  keywords: ["openstud", "workspaces", "team collaboration"],
};

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
