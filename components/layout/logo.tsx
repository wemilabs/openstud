import Link from "next/link";

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href, className }: LogoProps) {
  return (
    <Link href={href ?? "/"} className={`flex ${className}`}>
      <h1 className="text-xl font-mono font-bold">
        open
        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          stud.
        </span>
      </h1>
    </Link>
  );
}
