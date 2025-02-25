import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-30">
      <div className="container relative">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <span className="text-sm text-muted font-medium -tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 rounded-full">
            Introducing OpenStud v0.1.0
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Transform your study journey with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              OpenStud
            </span>
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Your all-in-one platform for efficient study management, revision
            tracking, and academic success. Built by{" "}
            <a
              href="https://cuttypiedev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary bg-clip-text font-medium"
            >
              a student
            </a>
            , for students.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-10 px-6 has-[>svg]:px-4 bg-primary hover:bg-primary/90 text-muted"
            >
              Start Learning Smarter
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="shadow-xs shadow-blue-500 hover:bg-blue-100 transition duration-200 dark:hover:text-muted"
            >
              Watch Demo
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <svg
                className="mr-2 size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Free Trial Available
            </div>
            <div className="flex items-center">
              <svg
                className="mr-2 size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              No Credit Card Required
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
