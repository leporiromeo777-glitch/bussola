/**
 * «I tuoi conti»: esportazione CSV per il fiduciario, pensata per Excel in
 * Svizzera. Logica pura.
 *
 * Formato:
 * - UTF-8 con BOM (Excel riconosce così gli accenti), righe con CRLF;
 * - separatore punto e virgola (Excel con le impostazioni svizzere);
 * - date gg.mm.aaaa, importi con il punto e due decimali (48.50), sempre
 *   positivi: entrata o uscita lo dice la colonna «tipo»;
 * - colonne: data, tipo, categoria, descrizione, controparte, importo,
 *   stato, origine, documento (sì/no).
 *
 * Righe: i movimenti dell'anno confermati e, sotto, quelli ancora da
 * confermare, con «Da confermare» nella colonna «stato»: così il
 * fiduciario li vede ma li filtra con un clic. Le voci segnate «privato»
 * non ci sono. Ogni gruppo è ordinato per data.
 *
 * Il testo che arriva da email o foto può contenere formule: un campo che
 * inizia con =, +, -, @ (o tab/a capo) prende un apostrofo davanti, così
 * Excel non lo esegue.
 */
import { dataSvizzeraBreve, etichettaCategoria, inCentesimi } from "./importi";
import type { Movimento, OrigineMovimento } from "./tipi";

export const INTESTAZIONI_CSV = [
  "data",
  "tipo",
  "categoria",
  "descrizione",
  "controparte",
  "importo",
  "stato",
  "origine",
  "documento",
] as const;

const ORIGINI: Record<OrigineMovimento, string> = {
  fattura: "Fattura emessa",
  email: "Email",
  foto: "Foto o PDF",
  manuale: "A mano",
};

/** Importo con il punto e due decimali, senza separatori delle migliaia: 1234.50 */
export function importoCsv(franchi: number): string {
  const centesimi = Math.abs(inCentesimi(franchi));
  return `${Math.floor(centesimi / 100)}.${String(centesimi % 100).padStart(2, "0")}`;
}

/** Un campo CSV: tra virgolette se serve, con le formule disinnescate. */
export function campoCsv(valore: string): string {
  let v = valore.replace(/\r\n?/g, "\n");
  if (/^[=+\-@\t\n]/.test(v)) v = `'${v}`;
  return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function riga(m: Movimento): string {
  return [
    dataSvizzeraBreve(m.data),
    m.tipo === "entrata" ? "Entrata" : "Uscita",
    etichettaCategoria(m.categoria),
    m.descrizione,
    m.controparte ?? "",
    importoCsv(m.importo),
    m.stato === "confermato" ? "Confermato" : "Da confermare",
    ORIGINI[m.origine],
    m.documentoId ? "sì" : "no",
  ]
    .map(campoCsv)
    .join(";");
}

const perData = (a: Movimento, b: Movimento) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id);

/** Il CSV dell'anno, BOM compreso. */
export function csvConti(movimenti: readonly Movimento[], anno: number): string {
  const dellAnno = movimenti.filter((m) => m.data.startsWith(`${anno}-`));
  const confermati = dellAnno.filter((m) => m.stato === "confermato").sort(perData);
  const daConfermare = dellAnno.filter((m) => m.stato === "da_confermare").sort(perData);
  const righe = [INTESTAZIONI_CSV.join(";"), ...confermati.map(riga), ...daConfermare.map(riga)];
  return `﻿${righe.join("\r\n")}\r\n`;
}

/** Nome del file scaricato. */
export function nomeFileCsv(anno: number): string {
  return `bleo-conti-${anno}.csv`;
}
