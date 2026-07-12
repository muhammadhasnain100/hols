type MockupProps = { className?: string };

function MockupFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect width="400" height="220" rx="12" fill="#F4F8FB" />
      {children}
    </svg>
  );
}

export function TrainingPillarMockup({ className }: MockupProps) {
  return (
    <MockupFrame className={className}>
      <rect x="24" y="24" width="200" height="120" rx="10" fill="#152744" />
      <circle cx="124" cy="84" r="18" fill="white" fillOpacity="0.9" />
      <path d="M118 76l12 8-12 8V76Z" fill="#3853A4" />
      <rect x="240" y="24" width="136" height="172" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="256" y={40 + i * 44} width="104" height="32" rx="6" fill={i === 0 ? "#DDE466" : "#F4F8FB"} fillOpacity={i === 0 ? 0.5 : 1} />
      ))}
      <rect x="24" y="160" width="160" height="36" rx="8" fill="#DDE466" fillOpacity="0.35" />
      <rect x="40" y="174" width="96" height="6" rx="3" fill="#152744" fillOpacity="0.45" />
    </MockupFrame>
  );
}

export function ReferencePillarMockup({ className }: MockupProps) {
  return (
    <MockupFrame className={className}>
      <rect x="24" y="24" width="352" height="172" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="40" y="40" width="120" height="8" rx="4" fill="#152744" fillOpacity="0.55" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="40" y={64 + i * 32} width="320" height="24" rx="6" fill="#F4F8FB" />
          <rect x="52" y={72 + i * 32} width="96" height="5" rx="2.5" fill="#3853A4" fillOpacity="0.35" />
          <rect x="280" y={72 + i * 32} width="56" height="5" rx="2.5" fill="#DDE466" fillOpacity="0.6" />
        </g>
      ))}
    </MockupFrame>
  );
}

export function DosingPillarMockup({ className }: MockupProps) {
  return (
    <MockupFrame className={className}>
      <rect x="48" y="28" width="304" height="164" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="64" y="44" width="120" height="6" rx="3" fill="#152744" fillOpacity="0.45" />
      <rect x="64" y="64" width="272" height="32" rx="8" fill="#F4F8FB" />
      <rect x="64" y="108" width="272" height="32" rx="8" fill="#F4F8FB" />
      <rect x="64" y="152" width="272" height="28" rx="8" fill="#DDE466" fillOpacity="0.55" />
    </MockupFrame>
  );
}

export function PaperworkPillarMockup({ className }: MockupProps) {
  return (
    <MockupFrame className={className}>
      <rect x="72" y="36" width="120" height="148" rx="8" fill="white" stroke="#8DC3E1" strokeWidth="1.5" transform="rotate(-5 132 110)" />
      <rect x="140" y="28" width="120" height="148" rx="8" fill="white" stroke="#3853A4" strokeWidth="1.5" />
      <rect x="208" y="40" width="120" height="148" rx="8" fill="white" stroke="#8DC3E1" strokeWidth="1.5" transform="rotate(4 268 114)" />
      <rect x="156" y="52" width="88" height="24" rx="6" fill="#DDE466" fillOpacity="0.4" />
    </MockupFrame>
  );
}

export function CommunityPillarMockup({ className }: MockupProps) {
  return (
    <MockupFrame className={className}>
      <rect x="24" y="24" width="352" height="172" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={52 + i * 8} cy={52 + i * 36} r="12" fill="#3853A4" fillOpacity="0.2" />
          <rect x="72" y={44 + i * 36} width="200" height="8" rx="4" fill="#152744" fillOpacity="0.2" />
          <rect x="72" y={58 + i * 36} width="160" height="5" rx="2.5" fill="#383838" fillOpacity="0.12" />
        </g>
      ))}
      <rect x="280" y="44" width="80" height="24" rx="12" fill="#DDE466" fillOpacity="0.45" />
    </MockupFrame>
  );
}

export function AssistantPillarMockup({ className }: MockupProps) {
  return (
    <MockupFrame className={className}>
      <rect x="24" y="24" width="352" height="172" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="40" y="40" width="200" height="48" rx="10" fill="#F4F8FB" />
      <rect x="52" y="56" width="160" height="6" rx="3" fill="#383838" fillOpacity="0.2" />
      <rect x="248" y="40" width="112" height="72" rx="10" fill="#152744" fillOpacity="0.08" />
      <rect x="260" y="52" width="88" height="6" rx="3" fill="#152744" fillOpacity="0.35" />
      <rect x="260" y="66" width="72" height="5" rx="2.5" fill="#383838" fillOpacity="0.15" />
      <rect x="40" y="108" width="160" height="28" rx="8" fill="#DDE466" fillOpacity="0.35" />
      <rect x="52" y="118" width="80" height="5" rx="2.5" fill="#152744" fillOpacity="0.4" />
    </MockupFrame>
  );
}

export const pillarMockups = {
  training: TrainingPillarMockup,
  reference: ReferencePillarMockup,
  dosing: DosingPillarMockup,
  paperwork: PaperworkPillarMockup,
  community: CommunityPillarMockup,
  assistant: AssistantPillarMockup,
} as const;

export type PillarMockupId = keyof typeof pillarMockups;
