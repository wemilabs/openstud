import React from "react";

/**
 * Project layout component that provides structure for project pages
 */
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {children}
    </div>
  );
}
