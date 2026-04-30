
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AfricanMarkets"
    >
      <defs>
        <linearGradient id="am-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#ea580c" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#shadow)">
        {/* Main A and rising trendline (M connection) */}
        <path
          d="M 96 416 L 208 112 L 288 272 L 416 112 L 416 224"
          stroke="url(#am-gradient)"
          strokeWidth="48"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead top bar */}
        <path
          d="M 304 112 L 416 112"
          stroke="url(#am-gradient)"
          strokeWidth="48"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* A crossbar */}
        <path
          d="M 160 272 L 260 272"
          stroke="url(#am-gradient)"
          strokeWidth="48"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
