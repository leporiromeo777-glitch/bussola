"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { dataSvizzera } from "@/data/svizzera";
import {
  dataIsoValida,
  dateFisseDaOggi,
  dateScadenza,
  eventiDaScadenze,
  generaIcs,
  nomiCalendario,
  prefissoDate,
  testoDateFisse,
} from "@/lib/percorso/calendario";
import type { Scadenza } from "@/lib/percorso/regole";
import { ElencoFonti } from "./elenco-fonti";
import { IconaCalendario } from "./icone";
import { classePulsantePrincipale } from "./stili";

const nessunaIscrizione = () => () => {};

function oggiLocale(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Data di oggi (AAAA-MM-GG) nel browser. Sul server e durante l'idratazione
 * vale il 1° gennaio dell'anno del calendario: stessa pagina sul server e nel
 * browser, poi si aggiorna con la data vera.
 */
function useOggi(anno: number): string {
  return useSyncExternalStore(nessunaIscrizione, oggiLocale, () => `${anno}-01-01`);
}

/** "Scadenze da ricordare" con il file .ics da scaricare, creato nel browser. */
export function RiquadroScadenze({
  scadenze,
  anno,
  verificatoIl,
}: {
  scadenze: readonly Scadenza[];
  /** Anno del calendario da scaricare (deciso dal server per evitare differenze di idratazione). */
  anno: number;
  verificatoIl: string;
}) {
  const idInizio = useId();
  const [inizio, setInizio] = useState("");
  const [annuncio, setAnnuncio] = useState("");
  const oggi = useOggi(anno);
  const conInizio = scadenze.some((s) => s.calendario.tipo === "dopo-inizio");
  const inizioValido = dataIsoValida(inizio) ? inizio : undefined;

  if (scadenze.length === 0) return null;

  // La prima scadenza con data da oggi in poi (anche dell'anno in corso), in evidenza in cima.
  const prossima = [
    ...eventiDaScadenze(scadenze, { anno: anno - 1 }),
    ...eventiDaScadenze(scadenze, { anno }),
  ]
    .filter((e) => e.data >= oggi)
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  function scarica() {
    const eventi = eventiDaScadenze(scadenze, { anno, inizioAttivita: inizioValido });
    const { nomeCalendario, nomeFile } = nomiCalendario(eventi, anno);
    const ics = generaIcs(eventi, { adesso: new Date(), nomeCalendario });
    try {
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeFile;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setAnnuncio(
        eventi.length === 1
          ? "Calendario scaricato con 1 scadenza."
          : `Calendario scaricato con ${eventi.length} scadenze. Aprilo per importarle nel tuo calendario.`,
      );
    } catch {
      setAnnuncio("Non sono riuscito a creare il file. Prova con un altro browser.");
    }
  }

  return (
    <section
      aria-labelledby="titolo-scadenze"
      className="rounded-xl border border-border bg-card p-5 break-inside-avoid"
    >
      <h2 id="titolo-scadenze" className="flex items-center gap-2 text-lg font-semibold">
        <IconaCalendario className="size-5 text-brand" />
        Scadenze da ricordare
      </h2>
      {prossima ? (
        <p className="mt-4 rounded-xl bg-brand-soft p-3 text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-brand">Prossima scadenza</span>
          <span className="mt-1 block text-lg font-extrabold" style={{ fontFamily: "var(--font-titoli)" }}>
            {dataSvizzera(prossima.data)}
          </span>
          <span className="block">{prossima.titolo}</span>
        </p>
      ) : null}
      <ul className="mt-4 space-y-4">
        {scadenze.map((s) => {
          const date = dateScadenza(s, anno, inizioValido);
          // Date fisse (decreto annuale): confrontate con oggi, così i termini passati non sembrano futuri.
          const fisse = s.calendario.tipo === "fisse" ? dateFisseDaOggi(s.calendario.date, oggi) : null;
          return (
            <li key={s.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
              <p className="font-medium">{s.titolo}</p>
              <p className="text-sm">{s.quando}</p>
              {fisse ? (
                <p className="mt-1 text-sm text-muted">{testoDateFisse(fisse)}</p>
              ) : s.calendario.tipo !== "fisse" && date.length > 0 ? (
                <p className="mt-1 text-sm text-muted">
                  {prefissoDate(s, anno)}
                  {date.map((d) => dataSvizzera(d.data)).join(" · ")}
                </p>
              ) : null}
              {s.dettaglio ? <p className="mt-1 text-sm text-muted">{s.dettaglio}</p> : null}
              <div className="mt-2">
                <ElencoFonti fonti={s.fonti} verificatoIl={verificatoIl} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 border-t border-border pt-4 print:hidden">
        {conInizio ? (
          <div className="mb-4">
            <label htmlFor={idInizio} className="text-sm font-medium">
              Data di inizio dell&apos;attività (facoltativa)
            </label>
            <input
              id={idInizio}
              type="date"
              value={inizio}
              onChange={(e) => setInizio(e.target.value)}
              aria-describedby={`${idInizio}-aiuto`}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2"
            />
            <p id={`${idInizio}-aiuto`} className="mt-1 text-xs text-muted">
              Serve solo per calcolare il termine IVA di 30 giorni nel file: non viene salvata.
            </p>
          </div>
        ) : null}
        <button type="button" onClick={scarica} className={`${classePulsantePrincipale} w-full text-sm`}>
          <IconaCalendario className="size-4" />
          Scarica il calendario {anno} (.ics)
        </button>
        <p className="mt-2 text-xs text-muted">
          Contiene le date {anno} con una fonte ufficiale
          {conInizio ? " e, se indichi la data di inizio, il termine IVA calcolato da quella data" : ""}, con un
          promemoria una settimana prima. Le scadenze senza data fissa (per esempio il termine della dichiarazione)
          restano solo qui.
        </p>
        <p role="status" aria-live="polite" className="mt-2 text-sm">
          {annuncio}
        </p>
      </div>
    </section>
  );
}
