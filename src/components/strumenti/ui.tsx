import type { ReactNode } from "react";
import type { Fonte } from "@/data/svizzera";
import type { Avviso } from "@/lib/strumenti/avvisi";
import { IconaAvviso, IconaInfo } from "./icone";

/* Mattoncini dell'interfaccia degli strumenti: campi con etichetta, aiuto ed
 * errore collegati (aria-describedby), riquadri, avvisi e link alle fonti. */

export const classePulsantePrincipale =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 font-medium text-background shadow-sm transition-colors hover:bg-brand-strong disabled:opacity-60";
export const classePulsanteSecondario =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-medium text-foreground transition-colors hover:border-brand disabled:opacity-60";
export const classePulsantePiccolo =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-sm text-foreground transition-colors hover:border-brand disabled:opacity-60";
export const classeLink = "text-brand underline underline-offset-2 hover:text-brand-strong";

const classeInput =
  "block w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-foreground placeholder:text-muted/70 aria-[invalid=true]:border-danger";

function idAiuto(id: string) {
  return `${id}-aiuto`;
}
function idErrore(id: string) {
  return `${id}-errore`;
}
function descrittoDa(id: string, aiuto?: ReactNode, errore?: string) {
  const ids = [aiuto ? idAiuto(id) : null, errore ? idErrore(id) : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function AiutoErrore({ id, aiuto, errore }: { id: string; aiuto?: ReactNode; errore?: string }) {
  return (
    <>
      {aiuto ? (
        <p id={idAiuto(id)} className="mt-1 text-sm text-muted">
          {aiuto}
        </p>
      ) : null}
      {errore ? (
        <p id={idErrore(id)} className="mt-1 text-sm font-medium text-danger">
          {errore}
        </p>
      ) : null}
    </>
  );
}

type PropsCampoTesto = {
  id: string;
  etichetta: ReactNode;
  valore: string;
  onCambia: (valore: string) => void;
  aiuto?: ReactNode;
  errore?: string;
  prefisso?: string;
  suffisso?: string;
  numerico?: boolean;
  tipo?: "text" | "email" | "tel" | "date" | "month";
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  obbligatorio?: boolean;
  className?: string;
  /** Nasconde l'etichetta alla vista (resta per i lettori di schermo). */
  etichettaNascosta?: boolean;
  onBlur?: () => void;
};

export function CampoTesto({
  id,
  etichetta,
  valore,
  onCambia,
  aiuto,
  errore,
  prefisso,
  suffisso,
  numerico = false,
  tipo = "text",
  placeholder,
  autoComplete,
  maxLength,
  obbligatorio,
  className = "",
  etichettaNascosta = false,
  onBlur,
}: PropsCampoTesto) {
  return (
    <div className={className}>
      <label htmlFor={id} className={etichettaNascosta ? "sr-only" : "block text-sm font-medium"}>
        {etichetta}
        {obbligatorio ? <span className="text-muted"> (obbligatorio)</span> : null}
      </label>
      <div className={`${etichettaNascosta ? "" : "mt-1"} flex items-stretch`}>
        {prefisso ? (
          <span aria-hidden="true" className="flex items-center rounded-l-lg border border-r-0 border-border bg-card px-2.5 text-sm text-muted">
            {prefisso}
          </span>
        ) : null}
        <input
          id={id}
          type={tipo}
          value={valore}
          onChange={(e) => onCambia(e.target.value)}
          onBlur={onBlur}
          inputMode={numerico ? "decimal" : undefined}
          placeholder={placeholder}
          autoComplete={autoComplete ?? "off"}
          maxLength={maxLength}
          required={obbligatorio}
          aria-invalid={errore ? true : undefined}
          aria-describedby={descrittoDa(id, aiuto, errore)}
          className={`${classeInput} ${errore ? "border-danger" : "border-border"} ${numerico ? "text-right tabular-nums" : ""} ${prefisso ? "rounded-l-none" : ""} ${suffisso ? "rounded-r-none" : ""}`}
        />
        {suffisso ? (
          <span aria-hidden="true" className="flex items-center rounded-r-lg border border-l-0 border-border bg-card px-2.5 text-sm text-muted">
            {suffisso}
          </span>
        ) : null}
      </div>
      <AiutoErrore id={id} aiuto={aiuto} errore={errore} />
    </div>
  );
}

export function CampoArea({
  id,
  etichetta,
  valore,
  onCambia,
  aiuto,
  errore,
  placeholder,
  righe = 3,
  maxLength,
  className = "",
  dopo,
}: {
  id: string;
  etichetta: ReactNode;
  valore: string;
  onCambia: (valore: string) => void;
  aiuto?: ReactNode;
  errore?: string;
  placeholder?: string;
  righe?: number;
  maxLength?: number;
  className?: string;
  /** Contenuto sotto il campo (per es. il contatore dei caratteri). */
  dopo?: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {etichetta}
      </label>
      <textarea
        id={id}
        value={valore}
        onChange={(e) => onCambia(e.target.value)}
        rows={righe}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={errore ? true : undefined}
        aria-describedby={descrittoDa(id, aiuto, errore)}
        className={`${classeInput} mt-1 resize-y ${errore ? "border-danger" : "border-border"}`}
      />
      <AiutoErrore id={id} aiuto={aiuto} errore={errore} />
      {dopo}
    </div>
  );
}

export function CampoScelta<V extends string>({
  id,
  etichetta,
  valore,
  onCambia,
  opzioni,
  aiuto,
  errore,
  className = "",
}: {
  id: string;
  etichetta: ReactNode;
  valore: V;
  onCambia: (valore: V) => void;
  opzioni: readonly { valore: V; etichetta: string }[];
  aiuto?: ReactNode;
  errore?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {etichetta}
      </label>
      <select
        id={id}
        value={valore}
        onChange={(e) => onCambia(e.target.value as V)}
        aria-invalid={errore ? true : undefined}
        aria-describedby={descrittoDa(id, aiuto, errore)}
        className={`${classeInput} mt-1 ${errore ? "border-danger" : "border-border"}`}
      >
        {opzioni.map((o) => (
          <option key={o.valore} value={o.valore}>
            {o.etichetta}
          </option>
        ))}
      </select>
      <AiutoErrore id={id} aiuto={aiuto} errore={errore} />
    </div>
  );
}

export function Casella({
  id,
  etichetta,
  selezionata,
  onCambia,
  aiuto,
  className = "",
}: {
  id: string;
  etichetta: ReactNode;
  selezionata: boolean;
  onCambia: (selezionata: boolean) => void;
  aiuto?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={selezionata}
        onChange={(e) => onCambia(e.target.checked)}
        aria-describedby={aiuto ? idAiuto(id) : undefined}
        className="mt-1 size-4 shrink-0 accent-[var(--brand)]"
      />
      <div>
        <label htmlFor={id} className="font-medium">
          {etichetta}
        </label>
        {aiuto ? (
          <p id={idAiuto(id)} className="mt-0.5 text-sm text-muted">
            {aiuto}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Gruppo di campi con legenda visibile. */
export function Gruppo({
  legenda,
  descrizione,
  children,
  className = "",
}: {
  legenda: ReactNode;
  descrizione?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={`min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6 ${className}`}>
      <legend className="float-left w-full text-lg font-semibold">{legenda}</legend>
      {descrizione ? <div className="clear-left pt-1 text-sm text-muted">{descrizione}</div> : null}
      <div className="clear-left pt-4">{children}</div>
    </fieldset>
  );
}

export function FonteLink({ fonte, className = "" }: { fonte: Fonte; className?: string }) {
  return (
    <a href={fonte.url} target="_blank" rel="noopener noreferrer" className={`${classeLink} ${className}`}>
      {fonte.titolo}
      <span className="sr-only"> (si apre in una nuova scheda)</span>
    </a>
  );
}

/** "Fonte: titolo (ente)", uno o più link. */
export function Fonti({ fonti, etichetta = "Fonte" }: { fonti: readonly Fonte[]; etichetta?: string }) {
  if (fonti.length === 0) return null;
  const uniche = fonti.filter((f, i) => fonti.findIndex((g) => g.url === f.url) === i);
  return (
    <p className="mt-2 text-xs text-muted">
      {uniche.length > 1 ? `${etichetta === "Fonte" ? "Fonti" : etichetta}: ` : `${etichetta}: `}
      {uniche.map((f, i) => (
        <span key={f.url}>
          {i > 0 ? "; " : null}
          <FonteLink fonte={f} /> ({f.ente})
        </span>
      ))}
    </p>
  );
}

export function RiquadroAvviso({ avviso }: { avviso: Avviso }) {
  const attenzione = avviso.livello === "attenzione";
  return (
    <div
      className={`rounded-xl border p-4 ${attenzione ? "border-accent bg-card" : "border-border bg-brand-soft"} break-inside-avoid`}
    >
      <p className="flex items-start gap-2 font-semibold">
        {attenzione ? (
          <IconaAvviso className="mt-0.5 size-5 shrink-0 text-accent" />
        ) : (
          <IconaInfo className="mt-0.5 size-5 shrink-0 text-brand" />
        )}
        {avviso.titolo}
      </p>
      <p className="mt-1 text-sm">{avviso.testo}</p>
      <Fonti fonti={avviso.fonti} />
    </div>
  );
}

export function EtichettaStima({ children = "Stima indicativa" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-accent px-2 py-0.5 text-xs font-medium text-accent">
      {children}
    </span>
  );
}

/** Riga etichetta/valore in un elenco di risultati. */
export function RigaValore({
  etichetta,
  valore,
  forte = false,
  nota,
}: {
  etichetta: ReactNode;
  valore: ReactNode;
  forte?: boolean;
  nota?: ReactNode;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${forte ? "font-semibold" : ""}`}>
      <dt className="min-w-0">
        {etichetta}
        {nota ? <span className="block text-xs font-normal text-muted">{nota}</span> : null}
      </dt>
      <dd className="shrink-0 text-right tabular-nums">{valore}</dd>
    </div>
  );
}

/** Messaggio mostrato mentre i dati salvati non sono ancora letti (prima dell'idratazione). */
export function Caricamento() {
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-6 text-muted" role="status">
      Sto aprendo i dati salvati su questo dispositivo…
      <noscript>
        <p className="mt-2 text-foreground">Per usare gli strumenti serve JavaScript attivo nel browser.</p>
      </noscript>
    </div>
  );
}
