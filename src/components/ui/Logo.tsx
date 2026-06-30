interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** KAgent brand mark — gradient tile + stylized K + agent node */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const id = `kg-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <path
        d="M9 8h3.5v6.2L18.5 8H23l-7.8 6.8L24.5 24H20l-7.5-7.8V24H9V8z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="25.5" cy="6.5" r="3" fill="#FCD34D" />
      <circle cx="25.5" cy="6.5" r="1.1" fill="#5B21B6" />
    </svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const SIZES = { sm: 26, md: 30, lg: 36 } as const;
const TEXT_SIZES = { sm: 11, md: 13, lg: 15 } as const;

export default function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const markSize = SIZES[size];
  const textSize = TEXT_SIZES[size];

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 8 : 10 }}>
      <LogoMark size={markSize} />
      {showText && (
        <span
          className="font-syncopate"
          style={{
            fontWeight: 700,
            fontSize: textSize,
            color: '#fff',
            letterSpacing: '0.12em',
            lineHeight: 1,
          }}
        >
          KAGENT
        </span>
      )}
    </div>
  );
}
