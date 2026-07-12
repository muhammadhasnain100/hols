export function CoursesMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect width="560" height="320" rx="16" fill="#F4F8FB" />
      <rect x="24" y="24" width="320" height="200" rx="12" fill="#152744" />
      <circle cx="168" cy="124" r="28" fill="white" fillOpacity="0.9" />
      <path d="M160 114l16 10-16 10V114Z" fill="#3853A4" />
      <rect x="40" y="196" width="120" height="8" rx="4" fill="white" fillOpacity="0.7" />
      <rect x="40" y="212" width="88" height="6" rx="3" fill="white" fillOpacity="0.35" />
      <rect x="360" y="24" width="176" height="272" rx="12" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="380" y="44" width="80" height="8" rx="4" fill="#152744" fillOpacity="0.65" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="380" y={72 + i * 52} width="136" height="40" rx="8" fill={i === 0 ? "#DDE466" : "#F4F8FB"} fillOpacity={i === 0 ? 0.45 : 1} />
          <rect x="392" y={84 + i * 52} width="72" height="6" rx="3" fill="#152744" fillOpacity={i === 0 ? 0.5 : 0.2} />
          <rect x="392" y={96 + i * 52} width="56" height="4" rx="2" fill="#383838" fillOpacity="0.15" />
        </g>
      ))}
    </svg>
  );
}

export function DosingMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect width="560" height="320" rx="16" fill="#F4F8FB" />
      <rect x="80" y="32" width="400" height="256" rx="14" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="104" y="56" width="140" height="8" rx="4" fill="#152744" fillOpacity="0.55" />
      <rect x="104" y="88" width="352" height="44" rx="10" fill="#F4F8FB" stroke="#8DC3E1" strokeWidth="1" />
      <rect x="120" y="102" width="96" height="6" rx="3" fill="#383838" fillOpacity="0.2" />
      <rect x="104" y="148" width="352" height="44" rx="10" fill="#F4F8FB" stroke="#8DC3E1" strokeWidth="1" />
      <rect x="120" y="162" width="120" height="6" rx="3" fill="#383838" fillOpacity="0.2" />
      <rect x="104" y="212" width="352" height="48" rx="12" fill="#DDE466" style={{ transition: "fill 0.25s ease" }} className="dosing-calc-btn" />
      <rect x="220" y="228" width="120" height="8" rx="4" fill="#152744" fillOpacity="0.65" />
    </svg>
  );
}

export function DocumentsMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 720 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect width="720" height="280" rx="16" fill="#F4F8FB" />
      <rect x="120" y="40" width="200" height="220" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" transform="rotate(-6 220 150)" />
      <rect x="260" y="24" width="200" height="220" rx="10" fill="white" stroke="#3853A4" strokeWidth="1.5" />
      <rect x="400" y="36" width="200" height="220" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" transform="rotate(5 500 146)" />
      <rect x="280" y="48" width="120" height="8" rx="4" fill="#152744" fillOpacity="0.55" />
      <rect x="280" y="72" width="160" height="6" rx="3" fill="#383838" fillOpacity="0.15" />
      <rect x="280" y="88" width="140" height="6" rx="3" fill="#383838" fillOpacity="0.12" />
      <rect x="280" y="120" width="160" height="36" rx="8" fill="#DDE466" fillOpacity="0.35" stroke="#DDE466" strokeWidth="1" />
      <text x="288" y="143" fill="#152744" fontSize="11" fontWeight="600" opacity="0.7">
        [Your Clinic Name Here]
      </text>
      <rect x="280" y="172" width="120" height="6" rx="3" fill="#383838" fillOpacity="0.12" />
      <rect x="280" y="188" width="136" height="6" rx="3" fill="#383838" fillOpacity="0.12" />
      <rect x="280" y="220" width="96" height="24" rx="8" fill="#3853A4" fillOpacity="0.15" />
    </svg>
  );
}
