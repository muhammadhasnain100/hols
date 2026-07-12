type MockupProps = { className?: string };

export function FAQsIllustration({ className }: MockupProps) {
  return (
    <svg viewBox="0 0 480 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect width="480" height="560" rx="24" fill="#F4F8FB" />

      <rect x="40" y="48" width="400" height="464" rx="16" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="64" y="72" width="160" height="10" rx="5" fill="#152744" fillOpacity="0.5" />
      <rect x="64" y="96" width="120" height="6" rx="3" fill="#383838" fillOpacity="0.15" />

      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect
            x="64"
            y={128 + i * 72}
            width="352"
            height="56"
            rx="12"
            fill={i === 1 ? "rgba(221,228,102,0.35)" : "#F4F8FB"}
            stroke={i === 1 ? "#DDE466" : "#8DC3E1"}
            strokeWidth="1"
            strokeOpacity={i === 1 ? 0.8 : 0.4}
          />
          <circle cx="88" cy={156 + i * 72} r="10" fill="#3853A4" fillOpacity="0.2" />
          <rect x="108" y={148 + i * 72} width={180 - i * 12} height="6" rx="3" fill="#152744" fillOpacity="0.25" />
          <rect x="108" y={162 + i * 72} width={140 - i * 8} height="4" rx="2" fill="#383838" fillOpacity="0.12" />
        </g>
      ))}

      <rect x="64" y="488" width="140" height="8" rx="4" fill="#DDE466" fillOpacity="0.6" />
      <circle cx="400" cy="88" r="28" fill="#3853A4" fillOpacity="0.12" />
      <text x="400" y="94" textAnchor="middle" fill="#3853A4" fontSize="22" fontWeight="600" opacity="0.35">
        ?
      </text>
    </svg>
  );
}
