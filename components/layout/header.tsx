import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../mode-toggle";
import { Logo } from "./logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex lg:flex-1">
          <Logo className="h-16 w-auto transition-colors duration-200" />
        </Link>

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
          <Button variant="ghost" size="sm" className="hidden lg:block">
            Sign in
          </Button>
          <Button size="sm">Get Started</Button>
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}
