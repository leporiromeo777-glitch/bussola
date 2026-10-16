import type { ReactNode } from "react";

type PropsIcona = { className?: string };

/** Base per le icone: decorative (aria-hidden), colore dal testo. */
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

/** Il marchio di Bleo: una rosa dei venti essenziale. */
export function IconaBleo({ className = "size-6" }: PropsIcona) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 6.5 19.2 16H12.8Z" className="fill-accent" />
      <path d="M16 25.5 12.8 16h6.4Z" fill="currentColor" />
      <circle cx="16" cy="16" r="1.6" className="fill-background" />
    </svg>
  );
}

export function IconaSpunta(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icona>
  );
}

export function IconaFreccia(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icona>
  );
}

export function IconaFrecciaGiu(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icona>
  );
}

export function IconaQuestionario(props: PropsIcona) {
  return (
    <Icona {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3" />
    </Icona>
  );
}

export function IconaChecklist(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6.5h9M11 12.5h9M11 18.5h9" />
    </Icona>
  );
}

export function IconaChat(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" />
    </Icona>
  );
}

export function IconaDocumento(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </Icona>
  );
}

export function IconaDivieto(props: PropsIcona) {
  return (
    <Icona {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6 6 12 12" />
    </Icona>
  );
}

export function IconaInfo(props: PropsIcona) {
  return (
    <Icona {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </Icona>
  );
}

export function IconaAvviso(props: PropsIcona) {
  return (
    <Icona {...props}>
      <path d="M12 4 2.8 19.5h18.4Z" />
      <path d="M12 10v4M12 17h.01" />
    </Icona>
  );
}
