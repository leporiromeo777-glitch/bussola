"use client";

import { useId, useState } from "react";
import { dataSvizzera } from "@/data/svizzera";
import { dataIsoValida, dateScadenza, eventiDaScadenze, generaIcs } from "@/lib/percorso/calendario";
import type { Scadenza } from "@/lib/percorso/regole";
import { ElencoFonti } from "./elenco-fonti";
import { IconaCalendario } from "./icone";
import { classePulsantePrincipale } from "./stili";

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
  const conInizio = scadenze.some((s) => s.calendario.tipo === "dopo-inizio");
  const inizioValido = dataIsoValida(inizio) ? inizio : undefined;

  if (scadenze.length === 0) return null;

  function scarica() {
    const eventi = eventiDaScadenze(scadenze, { anno, inizioAttivita: inizioValido });
    const ics = generaIcs(eventi, { adesso: new Date(), nomeCalendario: `Bussola: scadenze ${anno}` });
    try {
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `bussola-scadenze-${anno}.ics`;
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
      <ul className="mt-4 space-y-4">
        {scadenze.map((s) => {
          const date = dateScadenza(s, anno, inizioValido);
          return (
            <li key={s.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
              <p className="font-medium">{s.titolo}</p>
              <p className="text-sm">{s.quando}</p>
              {date.length > 0 ? (
                <p className="mt-1 text-sm text-muted">
                  Nel {anno}: {date.map((d) => dataSvizzera(d.data)).join(" · ")}
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
          Contiene le date {anno} con una fonte ufficiale, con un promemoria una settimana prima. Le scadenze senza data
          fissa (per esempio il termine della dichiarazione) restano solo qui.
        </p>
        <p role="status" aria-live="polite" className="mt-2 text-sm">
          {annuncio}
        </p>
      </div>
    </section>
  );
}
