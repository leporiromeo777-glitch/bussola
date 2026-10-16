"use client";

import { IconaAvviso } from "@/components/strumenti/icone";
import { etichettaCategoria, tipoCategoria } from "@/lib/conti/importi";
import type { Riepilogo } from "@/lib/conti/tipi";
import { Fonti, importo } from "./ui-conti";

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const MESI_INTERI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

/** Valore dell'asse senza «CHF» e senza decimali: 5000 → «5'000». */
function breve(franchi: number): string {
  return String(Math.round(franchi)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/** Valore «tondo» sopra il massimo, per la riga in alto del grafico. */
function scalaMassima(massimo: number): number {
  if (massimo <= 0) return 100;
  const potenza = 10 ** Math.floor(Math.log10(massimo));
  for (const passo of [1, 2, 2.5, 5, 10]) {
    if (passo * potenza >= massimo) return passo * potenza;
  }
  return 10 * potenza;
}

export function RiepilogoAnno({ riepilogo: r }: { riepilogo: Riepilogo }) {
  const entrateCategorie = r.perCategoria.filter((c) => tipoCategoria(c.categoria) === "entrata");
  const usciteCategorie = r.perCategoria.filter((c) => tipoCategoria(c.categoria) === "uscita");
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Riquadro etichetta="Entrate" valore={importo(r.entrate)} colore="bg-grafico-entrate" />
        <Riquadro etichetta="Uscite" valore={importo(r.uscite)} colore="bg-grafico-uscite" />
        <div className="col-span-2 rounded-2xl border border-border bg-card p-4 sm:col-span-1">
          <dt className="text-sm text-muted">Risultato</dt>
          <dd className={`mt-1 text-2xl font-extrabold tabular-nums ${r.risultato < 0 ? "text-danger" : ""}`}>
            {importo(r.risultato)}
          </dd>
          <dd className="text-xs text-muted">entrate meno uscite</dd>
        </div>
      </dl>
      {r.daConfermare > 0 ? (
        <p className="text-sm text-muted">
          {r.daConfermare === 1
            ? "C'è 1 voce da confermare: non conta finché non la confermi."
            : `Ci sono ${r.daConfermare} voci da confermare: non contano finché non le confermi.`}
        </p>
      ) : null}

      <GraficoMesi riepilogo={r} />

      {r.avvisi.length > 0 ? (
        <ul className="space-y-3">
          {r.avvisi.map((a) => (
            <li key={a.id} className="rounded-2xl border border-accent bg-card p-4">
              <p className="flex gap-2 text-sm">
                <IconaAvviso className="mt-0.5 size-5 shrink-0 text-accent" />
                <span>{a.testo}</span>
              </p>
              <Fonti fonti={a.fonti} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Categorie titolo="Entrate per categoria" voci={entrateCategorie} totale={r.entrate} colore="bg-grafico-entrate" />
        <Categorie titolo="Uscite per categoria" voci={usciteCategorie} totale={r.uscite} colore="bg-grafico-uscite" />
      </div>
    </div>
  );
}

function Riquadro({ etichetta, valore, colore }: { etichetta: string; valore: string; colore: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <dt className="flex items-center gap-2 text-sm text-muted">
        <span aria-hidden="true" className={`size-2.5 rounded-sm ${colore}`} />
        {etichetta}
      </dt>
      <dd className="mt-1 text-lg font-extrabold tabular-nums sm:text-2xl">{valore}</dd>
    </div>
  );
}

/**
 * Colonne affiancate per mese (entrate e uscite), in CSS: nessuna libreria.
 * Legenda sempre visibile, un'etichetta per ogni colonna (title) e la tabella
 * con i numeri per chi usa un lettore di schermo o vuole le cifre.
 */
function GraficoMesi({ riepilogo: r }: { riepilogo: Riepilogo }) {
  const massimo = scalaMassima(Math.max(0, ...r.perMese.flatMap((m) => [m.entrate, m.uscite])));
  const vuoto = r.perMese.every((m) => m.entrate === 0 && m.uscite === 0);
  const altezza = (valore: number) => `${valore > 0 ? Math.max(2, (valore / massimo) * 100) : 0}%`;

  return (
    <figure className="rounded-2xl border border-border bg-card p-4">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">Mese per mese</span>
        <span className="flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-sm bg-grafico-entrate" />
            Entrate
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-sm bg-grafico-uscite" />
            Uscite
          </span>
        </span>
      </figcaption>

      {vuoto ? (
        <p className="mt-4 text-sm text-muted">Quando confermi le prime voci, qui vedi entrate e uscite di ogni mese.</p>
      ) : (
        <div className="mt-7" aria-hidden="true">
          <div className="relative h-40">
            <span className="absolute -top-4 left-0 text-[10px] leading-none text-muted tabular-nums">CHF {breve(massimo)}</span>
            <div className="absolute inset-x-0 top-0 border-t border-border" />
            <div className="absolute inset-x-0 top-1/2 border-t border-border" />
            <div className="absolute inset-x-0 bottom-0 border-t border-border" />
            <div className="absolute inset-0 grid grid-cols-12 gap-0.5">
              {r.perMese.map((m) => (
                <div
                  key={m.mese}
                  className="flex h-full items-end justify-center gap-[2px]"
                  title={`${MESI_INTERI[m.mese - 1]}: entrate ${importo(m.entrate)}, uscite ${importo(m.uscite)}`}
                >
                  <span className="w-full max-w-3 rounded-t bg-grafico-entrate" style={{ height: altezza(m.entrate) }} />
                  <span className="w-full max-w-3 rounded-t bg-grafico-uscite" style={{ height: altezza(m.uscite) }} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1 grid grid-cols-12 gap-0.5 text-center text-[10px] text-muted">
            {MESI.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium text-brand">Vedi i numeri mese per mese</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left tabular-nums">
            <caption className="sr-only">Entrate e uscite confermate per mese, in franchi</caption>
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="py-1 font-medium">
                  Mese
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Entrate
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Uscite
                </th>
              </tr>
            </thead>
            <tbody>
              {r.perMese.map((m) => (
                <tr key={m.mese} className="border-t border-border">
                  <th scope="row" className="py-1 font-normal capitalize">
                    {MESI_INTERI[m.mese - 1]}
                  </th>
                  <td className="py-1 text-right">{importo(m.entrate)}</td>
                  <td className="py-1 text-right">{importo(m.uscite)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function Categorie({
  titolo,
  voci,
  totale,
  colore,
}: {
  titolo: string;
  voci: Riepilogo["perCategoria"];
  totale: number;
  colore: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-semibold">{titolo}</h3>
      {voci.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Ancora niente.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {voci.map((v) => (
            <li key={v.categoria}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0">{etichettaCategoria(v.categoria)}</span>
                <span className="shrink-0 font-medium tabular-nums">{importo(v.importo)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-border" aria-hidden="true">
                <div
                  className={`h-1.5 rounded-full ${colore}`}
                  style={{ width: `${totale > 0 ? Math.max(2, (v.importo / totale) * 100) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
