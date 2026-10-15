import type { ReactNode } from "react";

type Props = { className?: string };

/** Icone decorative degli strumenti (aria-hidden, colore dal testo). */
function Icona({ className = "size-5", children }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export const IconaOrologio = (p: Props) => (
  <Icona {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icona>
);

export const IconaCalendario = (p: Props) => (
  <Icona {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icona>
);

export const IconaPagina = (p: Props) => (
  <Icona {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M9 12h6M9 16h6" />
  </Icona>
);

export const IconaFattura = (p: Props) => (
  <Icona {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Icona>
);

export const IconaStampa = (p: Props) => (
  <Icona {...p}>
    <path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M7 14h10v7H7Z" />
  </Icona>
);

export const IconaPiu = (p: Props) => (
  <Icona {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icona>
);

export const IconaCestino = (p: Props) => (
  <Icona {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icona>
);

export const IconaCopia = (p: Props) => (
  <Icona {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Icona>
);

export const IconaFreccia = (p: Props) => (
  <Icona {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icona>
);

export const IconaIndietro = (p: Props) => (
  <Icona {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icona>
);

export const IconaInfo = (p: Props) => (
  <Icona {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8h.01" />
  </Icona>
);

export const IconaAvviso = (p: Props) => (
  <Icona {...p}>
    <path d="M12 4 2.8 19.5h18.4Z" />
    <path d="M12 10v4M12 17h.01" />
  </Icona>
);

export const IconaDispositivo = (p: Props) => (
  <Icona {...p}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </Icona>
);

export const IconaSpunta = (p: Props) => (
  <Icona {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icona>
);

export const IconaCroce = (p: Props) => (
  <Icona {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icona>
);
