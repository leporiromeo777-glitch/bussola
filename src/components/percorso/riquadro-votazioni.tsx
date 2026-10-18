"use client";

import { useState, useSyncExternalStore } from "react";
import { dataSvizzera } from "@/data/svizzera";
import { fontiVotazioni, VOTAZIONI } from "@/data/votazioni";
import { generaIcs } from "@/lib/percorso/calendario";
import { etichettaLivello, eventiVotazioni, votazioniInArrivo } from "@/lib/votazioni";
import { ElencoFonti } from "./elenco-fonti";
import { IconaCalendario, IconaUrna } from "./icone";
import { classeLink, classePulsanteSecondario } from "./stili";

const nessunaIscrizione = () => () => {};

function oggiLocale(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * «Votazioni da seguire»: gli oggetti in votazione che possono cambiare
 * qualcosa per un'impresa, con la fonte e il file .ics per il calendario.
 * Sul server non si conosce la data del browser: si mostrano tutte, poi il
 * browser toglie quelle passate.
 */
export function RiquadroVotazioni() {
  const oggi = useSyncExternalStore(nessunaIscrizione, oggiLocale, () => "");
  const [annuncio, setAnnuncio] = useState("");
  const votazioni = votazioniInArrivo(VOTAZIONI, oggi);
  if (votazioni.length === 0) return null;

  function scarica() {
    const ics = generaIcs(eventiVotazioni(votazioni), { adesso: new Date(), nomeCalendario: "Bleo: votazioni" });
    try {
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "bleo-votazioni.ics";
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setAnnuncio("Calendario scaricato. Aprilo per importare le date del voto.");
    } catch {
      setAnnuncio("Non sono riuscito a creare il file. Prova con un altro browser.");
    }
  }

  return (
    <section
      aria-labelledby="titolo-votazioni"
      className="rounded-xl border border-border bg-card p-5 break-inside-avoid"
    >
      <h2 id="titolo-votazioni" className="flex items-center gap-2 text-lg font-semibold">
        <IconaUrna className="size-5 text-brand" />
        Votazioni da seguire
      </h2>
      <p className="mt-2 text-sm text-muted">
        Oggetti in votazione che possono cambiare qualcosa per la tua impresa. Bleo ti informa con le fonti
        ufficiali: come votare lo decidi tu.
      </p>
      <ul className="mt-4 space-y-4">
        {votazioni.map((v) => (
          <li key={v.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {etichettaLivello(v.livello)} · {dataSvizzera(v.data)}
            </p>
            <p className="mt-1 font-medium">{v.oggetto}</p>
            <p className="mt-1 text-sm">{v.cosaCambia}</p>
            <p className="mt-1 text-sm text-muted">{v.chiRiguarda}</p>
            <div className="mt-2">
              <ElencoFonti fonti={v.fonti} verificatoIl={v.verificatoIl} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 border-t border-border pt-4 print:hidden">
        <button type="button" onClick={scarica} className={`${classePulsanteSecondario} w-full text-sm`}>
          <IconaCalendario className="size-4" />
          Metti le date nel calendario (.ics)
        </button>
        <p className="mt-2 text-xs text-muted">
          Con un promemoria una settimana prima del voto. Tutti gli oggetti in votazione:{" "}
          <a href={fontiVotazioni.ticinoProssime.url} target="_blank" rel="noopener noreferrer" className={classeLink}>
            Cantone Ticino
          </a>
          .
        </p>
        <p role="status" aria-live="polite" className="mt-2 text-sm">
          {annuncio}
        </p>
      </div>
    </section>
  );
}
