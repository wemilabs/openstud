import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/layout/logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Logo className="lg:flex-1" />

        <div className="hidden lg:flex lg:gap-x-12">
          <Link
            href="#features"
            className="text-sm font-medium leading-6 text-foreground hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium leading-6 text-foreground hover:text-primary"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium leading-6 text-foreground hover:text-primary"
          >
            FAQ
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-x-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-8 px-3 has-[>svg]:px-2.5 bg-primary hover:bg-primary/90 text-muted"
          >
            Get Started
          </Link>
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
