type MockupProps = { className?: string };

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect width="400" height="200" rx="12" fill="#F4F8FB" />
      {children}
    </svg>
  );
}

export function OwnersMockup({ className }: MockupProps) {
  return (
    <Frame className={className}>
      <rect x="24" y="28" width="352" height="144" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="40" y="44" width="100" height="8" rx="4" fill="#152744" fillOpacity="0.5" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={56 + i * 48} cy="88" r="14" fill="#3853A4" fillOpacity="0.2" />
          <rect x={80 + i * 48} y="80" width="64" height="5" rx="2.5" fill="#383838" fillOpacity="0.15" />
          <rect x={80 + i * 48} y="92" width="48" height="4" rx="2" fill="#DDE466" fillOpacity="0.5" />
        </g>
      ))}
      <rect x="40" y="120" width="320" height="36" rx="8" fill="#152744" fillOpacity="0.06" />
      <rect x="52" y="132" width="200" height="6" rx="3" fill="#152744" fillOpacity="0.25" />
    </Frame>
  );
}

export function ProvidersMockup({ className }: MockupProps) {
  return (
    <Frame className={className}>
      <rect x="120" y="24" width="160" height="152" rx="10" fill="white" stroke="#3853A4" strokeWidth="1.5" />
      <circle cx="200" cy="72" r="24" fill="#DDE466" fillOpacity="0.35" />
      <path d="M192 72l6 6 12-14" stroke="#152744" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <rect x="144" y="108" width="112" height="8" rx="4" fill="#152744" fillOpacity="0.45" />
      <rect x="152" y="128" width="96" height="5" rx="2.5" fill="#383838" fillOpacity="0.15" />
      <rect x="152" y="140" width="88" height="5" rx="2.5" fill="#383838" fillOpacity="0.12" />
      <rect x="152" y="156" width="72" height="20" rx="6" fill="#8DC3E1" fillOpacity="0.35" />
    </Frame>
  );
}

export function LearnersMockup({ className }: MockupProps) {
  return (
    <Frame className={className}>
      <rect x="32" y="32" width="140" height="136" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="48" y="48" width="80" height="6" rx="3" fill="#152744" fillOpacity="0.4" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="48" y={64 + i * 22} width="108" height="5" rx="2.5" fill="#383838" fillOpacity="0.12" />
      ))}
      <rect x="196" y="32" width="172" height="136" rx="10" fill="#152744" fillOpacity="0.08" />
      <rect x="212" y="48" width="120" height="8" rx="4" fill="#152744" fillOpacity="0.35" />
      <rect x="212" y="68" width="140" height="5" rx="2.5" fill="#383838" fillOpacity="0.15" />
      <rect x="212" y="82" width="120" height="5" rx="2.5" fill="#383838" fillOpacity="0.12" />
      <rect x="212" y="108" width="96" height="28" rx="8" fill="#DDE466" fillOpacity="0.4" />
    </Frame>
  );
}

export const whoItsForMockups = {
  owners: OwnersMockup,
  providers: ProvidersMockup,
  learners: LearnersMockup,
} as const;

export type WhoItsForMockupId = keyof typeof whoItsForMockups;
