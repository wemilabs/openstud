import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MyHoverCard } from "@/components/sections/my-hover-card";

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-screen pt-24 md:pt-30">
      <div className="container relative">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 md:gap-y-10 text-center">
          <Badge
            variant="outline"
            className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-full px-3 py-2 text-xs md:text-sm leading-6 tracking-wide border-none shadow-none"
          >
            v0.8.0 - Introducing{" "}
            <span className="font-bold">Streamlined Student Experience</span>
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1] bg-gradient-to-r from-primary/10 via-primary to-primary/65 bg-clip-text text-transparent mt-2">
            The Ultimate Place for Smarter Learning
          </h1>
          <h2 className="max-w-[750px] text-muted-foreground md:text-lg">
            Your all-in-one platform for efficient study management, revision
            tracking, and academic success. Built by <MyHoverCard />, for
            students.
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-10 px-6 has-[>svg]:px-4 bg-primary hover:bg-primary/90 text-muted"
            >
              Get Started for Free
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="shadow-xs shadow-blue-500 hover:bg-blue-100 transition duration-200 dark:hover:text-muted cursor-not-allowed"
            >
              Documentation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
