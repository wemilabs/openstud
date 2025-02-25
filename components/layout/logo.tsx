interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 200"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A89DC" />
          <stop offset="100%" stopColor="#5D9CEC" />
        </linearGradient>
      </defs>

      {/* The O circle */}
      <circle
        cx="160"
        cy="100"
        r="40"
        stroke="url(#gradient)"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
      />

      {/* The green accent */}
      <path
        d="M200 100 A40 40 0 0 1 160 140"
        stroke="#10B981"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
      />

      {/* Text lines */}
      <line
        x1="220"
        y1="75"
        x2="280"
        y2="75"
        className="stroke-[#4A89DC]"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="220"
        y1="100"
        x2="280"
        y2="100"
        className="stroke-[#4A89DC]"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="220"
        y1="125"
        x2="260"
        y2="125"
        className="stroke-[#4A89DC]"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <text
        x="200"
        y="175"
        fontFamily="Graphik"
        fontSize="24"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-foreground dark:fill-foreground"
      >
        Openstud
      </text>
    </svg>
  );
}
