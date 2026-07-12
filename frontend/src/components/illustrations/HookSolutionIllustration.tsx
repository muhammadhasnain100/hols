export function HookSolutionIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="480" height="360" rx="24" fill="url(#solution-bg)" />

      <defs>
        <linearGradient id="solution-bg" x1="0" y1="0" x2="480" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="#152744" />
          <stop offset="1" stopColor="#3853A4" />
        </linearGradient>
        <linearGradient id="solution-accent" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#DDE466" />
          <stop offset="1" stopColor="#8DC3E1" />
        </linearGradient>
      </defs>

      <rect x="48" y="40" width="384" height="280" rx="16" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.15" />

      <rect x="72" y="64" width="336" height="48" rx="10" fill="white" fillOpacity="0.12" />
      <rect x="88" y="80" width="120" height="8" rx="4" fill="white" fillOpacity="0.5" />
      <rect x="320" y="76" width="72" height="24" rx="12" fill="url(#solution-accent)" fillOpacity="0.85" />

      <rect x="72" y="128" width="160" height="168" rx="12" fill="white" fillOpacity="0.95" />
      <rect x="88" y="144" width="80" height="8" rx="4" fill="#152744" fillOpacity="0.7" />
      <rect x="88" y="164" width="128" height="5" rx="2.5" fill="#383838" fillOpacity="0.15" />
      <rect x="88" y="178" width="112" height="5" rx="2.5" fill="#383838" fillOpacity="0.12" />
      <rect x="88" y="200" width="128" height="32" rx="8" fill="#DDE466" fillOpacity="0.35" />
      <rect x="96" y="212" width="48" height="4" rx="2" fill="#152744" fillOpacity="0.4" />
      <rect x="88" y="244" width="128" height="5" rx="2.5" fill="#383838" fillOpacity="0.12" />
      <rect x="88" y="258" width="96" height="5" rx="2.5" fill="#383838" fillOpacity="0.12" />

      <rect x="248" y="128" width="160" height="80" rx="12" fill="white" fillOpacity="0.95" />
      <circle cx="280" cy="160" r="16" fill="#8DC3E1" fillOpacity="0.35" />
      <path
        d="M274 160l4 4 8-8"
        stroke="#152744"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <rect x="304" y="150" width="80" height="6" rx="3" fill="#152744" fillOpacity="0.5" />
      <rect x="304" y="164" width="64" height="4" rx="2" fill="#383838" fillOpacity="0.15" />

      <rect x="248" y="224" width="160" height="72" rx="12" fill="white" fillOpacity="0.95" />
      <rect x="264" y="240" width="64" height="6" rx="3" fill="#3853A4" fillOpacity="0.4" />
      <rect x="264" y="256" width="128" height="4" rx="2" fill="#383838" fillOpacity="0.12" />
      <rect x="264" y="268" width="112" height="4" rx="2" fill="#383838" fillOpacity="0.12" />
      <rect x="264" y="280" width="96" height="4" rx="2" fill="#383838" fillOpacity="0.12" />

      <circle cx="408" cy="52" r="20" fill="#DDE466" fillOpacity="0.25" />
    </svg>
  );
}
