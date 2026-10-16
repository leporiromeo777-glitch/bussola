/** Icone della chat (decorative: il nome del pulsante sta nell'aria-label o nel testo accanto). */
type Props = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconaMenu = ({ className = "size-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

export const IconaNuova = ({ className = "size-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 20h8" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

export const IconaFreccia = ({ className = "size-5" }: Props) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

export const IconaGiu = ({ className = "size-5" }: Props) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

export const IconaStop = ({ className = "size-3.5" }: Props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" />
  </svg>
);

export const IconaPuntini = ({ className = "size-5" }: Props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

export const IconaCopia = ({ className = "size-4" }: Props) => (
  <svg {...base} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

export const IconaFatto = ({ className = "size-4" }: Props) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const IconaMatita = ({ className = "size-4" }: Props) => (
  <svg {...base} className={className}>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

export const IconaCestino = ({ className = "size-4" }: Props) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const IconaChiudi = ({ className = "size-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconaRiprova = ({ className = "size-4" }: Props) => (
  <svg {...base} className={className}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
  </svg>
);
