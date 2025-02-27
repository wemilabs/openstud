interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex-1 space-y-4 px-4 md:px-0 pt-10 pb-8">{children}</div>
  );
}
