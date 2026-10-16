"use client";

import type { ReactNode } from "react";
import { CampoScelta, CampoTesto } from "@/components/strumenti/ui";
import { categoriePer, chf2, dataSvizzeraBreve } from "@/lib/conti/importi";
import type { CategoriaId, Fonte, TipoMovimento } from "@/lib/conti/tipi";

/* Pezzi comuni della pagina /conti. Stile come /percorso: card arrotondate, pulsanti a pillola. */

export const classeGrande =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold transition-colors disabled:opacity-60";
export const classeSi = `${classeGrande} bg-brand text-background shadow-sm hover:bg-brand-strong`;
export const classeNo = `${classeGrande} border border-border bg-card text-foreground hover:border-brand`;
export const classePiccolo =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-brand disabled:opacity-60";
export const classeLinkConti = "font-medium text-brand underline underline-offset-2 hover:text-brand-strong";

export const importo = chf2;
export const data = dataSvizzeraBreve;

/** Data e ora di Zurigo: 16.10.2026, 14:05 */
export function dataOra(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parti = new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return parti.replace(/\s+/, " ");
}

export function Sezione({
  id,
  titolo,
  descrizione,
  azioni,
  children,
}: {
  id: string;
  titolo: ReactNode;
  descrizione?: ReactNode;
  azioni?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`titolo-${id}`} className="scroll-mt-24" id={id}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id={`titolo-${id}`} className="text-xl font-extrabold tracking-tight">
          {titolo}
        </h2>
        {azioni}
      </div>
      {descrizione ? <div className="mt-1 text-sm text-muted">{descrizione}</div> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Fonti({ fonti }: { fonti: readonly Fonte[] }) {
  if (fonti.length === 0) return null;
  return (
    <p className="mt-2 text-xs text-muted">
      {fonti.length > 1 ? "Fonti: " : "Fonte: "}
      {fonti.map((f, i) => (
        <span key={f.url}>
          {i > 0 ? "; " : null}
          <a href={f.url} target="_blank" rel="noopener noreferrer" className={classeLinkConti}>
            {f.titolo}
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
        </span>
      ))}
    </p>
  );
}

export function Messaggio({ testo, tipo = "errore" }: { testo: string | null; tipo?: "errore" | "ok" }) {
  if (!testo) return null;
  return (
    <p
      role={tipo === "errore" ? "alert" : "status"}
      className={`mt-3 rounded-xl border bg-card p-3 text-sm font-medium ${
        tipo === "errore" ? "border-danger/40 text-danger" : "border-success/40 text-success"
      }`}
    >
      {testo}
    </p>
  );
}

/** Valori del modulo di una voce, come testo (così si scrive liberamente). */
export type CampiVoce = {
  tipo: TipoMovimento;
  data: string;
  importo: string;
  descrizione: string;
  controparte: string;
  categoria: CategoriaId;
};

/** «48,50», «48.50» o «1'200» → 48.5 / 1200; null se non è un importo. */
export function leggiImporto(testo: string): number | null {
  const pulito = testo.replace(/['’\s]|CHF/gi, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(pulito)) return null;
  return Number(pulito);
}

export function CampiMovimento({
  id,
  valori,
  onCambia,
  errori = {},
}: {
  id: string;
  valori: CampiVoce;
  onCambia: (v: CampiVoce) => void;
  errori?: Partial<Record<keyof CampiVoce, string>>;
}) {
  const cambia = <K extends keyof CampiVoce>(campo: K, valore: CampiVoce[K]) => onCambia({ ...valori, [campo]: valore });
  const categorie = categoriePer(valori.tipo);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">È un&apos;entrata o un&apos;uscita?</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["uscita", "entrata"] as const).map((tipo) => (
            <label
              key={tipo}
              className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                valori.tipo === tipo ? "border-brand bg-brand-soft text-foreground" : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name={`${id}-tipo`}
                value={tipo}
                checked={valori.tipo === tipo}
                onChange={() =>
                  onCambia({
                    ...valori,
                    tipo,
                    categoria: categoriePer(tipo).some((c) => c.id === valori.categoria)
                      ? valori.categoria
                      : tipo === "entrata"
                        ? "vendite"
                        : "altre_uscite",
                  })
                }
                className="sr-only"
              />
              {tipo === "uscita" ? "Uscita (hai pagato)" : "Entrata (hai incassato)"}
            </label>
          ))}
        </div>
      </fieldset>
      <CampoTesto
        id={`${id}-importo`}
        etichetta="Importo"
        prefisso="CHF"
        numerico
        valore={valori.importo}
        onCambia={(v) => cambia("importo", v)}
        errore={errori.importo}
        placeholder="0.00"
      />
      <CampoTesto
        id={`${id}-data`}
        etichetta="Data"
        tipo="date"
        valore={valori.data}
        onCambia={(v) => cambia("data", v)}
        errore={errori.data}
      />
      <CampoTesto
        id={`${id}-descrizione`}
        etichetta="Cosa"
        valore={valori.descrizione}
        onCambia={(v) => cambia("descrizione", v)}
        errore={errori.descrizione}
        placeholder="Per esempio: carta per la stampante"
        maxLength={300}
        className="sm:col-span-2"
      />
      <CampoTesto
        id={`${id}-controparte`}
        etichetta={valori.tipo === "uscita" ? "Negozio o fornitore" : "Cliente"}
        valore={valori.controparte}
        onCambia={(v) => cambia("controparte", v)}
        maxLength={200}
        placeholder="Facoltativo"
      />
      <CampoScelta
        id={`${id}-categoria`}
        etichetta="Categoria"
        valore={valori.categoria}
        onCambia={(v) => cambia("categoria", v)}
        opzioni={categorie.map((c) => ({ valore: c.id as CategoriaId, etichetta: c.etichetta }))}
        errore={errori.categoria}
      />
    </div>
  );
}

/** Controlla i campi del modulo e prepara il corpo per le API. */
export function corpoVoce(
  v: CampiVoce,
): { ok: true; corpo: Record<string, unknown> } | { ok: false; errori: Partial<Record<keyof CampiVoce, string>> } {
  const errori: Partial<Record<keyof CampiVoce, string>> = {};
  const numero = leggiImporto(v.importo);
  if (numero === null) errori.importo = "Scrivi l'importo, per esempio 48.50.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.data)) errori.data = "Scegli la data.";
  if (!v.descrizione.trim()) errori.descrizione = "Scrivi in breve cosa hai comprato o venduto.";
  if (Object.keys(errori).length > 0) return { ok: false, errori };
  return {
    ok: true,
    corpo: {
      tipo: v.tipo,
      data: v.data,
      importo: numero,
      descrizione: v.descrizione.trim(),
      controparte: v.controparte.trim() || null,
      categoria: v.categoria,
    },
  };
}
