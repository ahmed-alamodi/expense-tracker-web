interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({
  className = "",
  size = 36,
  showText = true,
}: LogoProps) {
  return (
    <span className={`logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Dynamic & Vibrant blue gradient for web app */}
          <linearGradient id="monogram-grad-web" x1="20" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="0.5" stopColor="var(--color-tint, #2563EB)" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>

        {/* Secure dark navy background */}
        <rect width="100" height="100" rx="24" fill="#0F172A" />

        {/* Futuristic Monogram: "م" + "M" + Growth Chart + Trend Arrow */}
        <path
          d="M 35,67 C 28.3,67 23,61.7 23,55 C 23,48.3 28.3,43 35,43 C 41.7,43 47,48.3 47,55 L 47,68 L 62,35 L 74,60 L 88,25"
          stroke="url(#monogram-grad-web)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dynamic arrowhead pointing top-right (Growth) */}
        <path
          d="M 76,25 H 88 V 37"
          stroke="url(#monogram-grad-web)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-tint)',
          }}
        >
          متتبع المصروفات
        </span>
      )}
    </span>
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return <Logo size={size} showText={false} />;
}
