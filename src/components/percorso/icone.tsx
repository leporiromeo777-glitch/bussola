import type { ReactNode } from "react";

type PropsIcona = { className?: string };

/** Icone decorative del percorso (aria-hidden, colore dal testo). Le altre sono in components/landing/icone. */
function Icona({ className = "size-5", children }: PropsIcona & { children: ReactNode }) {
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

export function IconaCalendario(props: PropsIcona) {
  return (
    <Icona {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </Icona>
  );
}

export function IconaLinkEsterno(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </Icona>
  );
}

export function IconaStampa(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v6H7z" />
    </Icona>
  );
}

export function IconaRicomincia(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
    </Icona>
  );
}

export function IconaIndietro(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Icona>
  );
}
