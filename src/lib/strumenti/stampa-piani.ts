/**
 * Budget del primo anno e business plan di una pagina come pagine HTML A4,
 * da trasformare in PDF nell'app con expo-print (come preventivi e fatture in
 * stampa-documento.ts). Stessi testi e stesse fonti della stampa del sito.
 *
 * - `htmlBudget`: A4 orizzontale, con i quattro numeri del riepilogo, la
 *   tabella dei 12 mesi, i contributi stimati, le note e le fonti.
 * - `htmlBusinessPlan`: A4 verticale, come il foglio del sito.
 *
 * Logica pura, senza browser né Node.
 */
import { dataSvizzera, fonti, type Fonte } from "@/data/svizzera";
import { descrizioneCaso } from "./avs";
import type { DatiBudget, RisultatoBudget } from "./budget";
import {
  cifraBudget,
  eMesePareggio,
  fontiBudget,
  notaFabbisogno,
  periodoBudget,
  puntiBudget,
  riquadriBudget,
  righeBudget,
  righeContributi,
  totaleRiga,
} from "./budget-vista";
import { CAMPI_PIANO, type DatiPiano } from "./business-plan";
import { escapeHtml } from "./stampa-documento";

/** Misure di un foglio A4 orizzontale in punti tipografici, per expo-print. */
export const A4_ORIZZONTALE_PUNTI = { larghezza: 842, altezza: 595 } as const;

/** La nota in fondo agli strumenti del sito: informazione generale, non consulenza. */
export const NOTA_NON_CONSULENZA =
  "È uno strumento che compili tu, con regole generali e fonti ufficiali: non è una consulenza fiscale o giuridica. " +
  "Per il tuo caso personale rivolgiti all'ufficio competente o a un fiduciario autorizzato";

function pagina(titolo: string, stile: string, corpo: string): string {
  return (
    `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">` +
    `<title>${escapeHtml(titolo)}</title><style>${stile}</style></head><body>${corpo}</body></html>`
  );
}

const BASE = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body {
  color: #1c1f24; font-family: Helvetica, Arial, sans-serif; line-height: 1.35;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; -webkit-text-size-adjust: 100%;
}
p, h1, h2, h3, ul { margin: 0; }
.sopratitolo { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f5e6b; }
.attenuato { color: #4b515b; }
.vuoto { color: #8a909a; }
.fonti { margin-top: 3mm; font-size: 7pt; color: #4b515b; }
.fonti p { margin-top: 0.8mm; overflow-wrap: anywhere; }
.piede { margin-top: 3mm; padding-top: 2mm; border-top: 0.25mm solid #d6d2c9; font-size: 7pt; color: #4b515b; }
`;

/** «Titolo (ente): url», una fonte per riga, senza doppioni. */
function elencoFonti(elenco: readonly Fonte[]): string {
  const uniche = elenco.filter((f, i) => elenco.findIndex((g) => g.url === f.url) === i);
  if (uniche.length === 0) return "";
  return (
    `<div class="fonti"><p><strong>${uniche.length === 1 ? "Fonte ufficiale" : "Fonti ufficiali"}</strong></p>` +
    uniche.map((f) => `<p>${escapeHtml(`${f.titolo} (${f.ente}): `)}<a href="${escapeHtml(f.url)}">${escapeHtml(f.url)}</a></p>`).join("") +
    `</div>`
  );
}

/* ------------------------------------------------------------------ */
/* Budget                                                              */
/* ------------------------------------------------------------------ */

const STILE_BUDGET = `${BASE}
@page { size: A4 landscape; margin: 0; }
body { font-size: 8pt; }
.foglio { width: 297mm; padding: 10mm 11mm; }
.testa { display: flex; justify-content: space-between; align-items: flex-end; gap: 6mm; border-bottom: 0.6mm solid #0f5e6b; padding-bottom: 2mm; }
.testa h1 { font-size: 15pt; font-weight: 700; margin-top: 0.5mm; }
.testa .destra { text-align: right; font-size: 7.5pt; }
.stima { display: inline-block; border: 0.3mm solid #9c5c1c; color: #9c5c1c; border-radius: 3mm; padding: 0.3mm 2mm; font-size: 7pt; font-weight: 600; }
.riquadri { display: flex; gap: 3mm; margin-top: 3mm; }
.riquadro { flex: 1 1 0; border: 0.25mm solid #d6d2c9; border-radius: 2mm; padding: 2mm 3mm; break-inside: avoid; }
.riquadro .etichetta { font-size: 7pt; color: #4b515b; }
.riquadro .valore { font-size: 12pt; font-weight: 700; margin-top: 0.5mm; font-variant-numeric: tabular-nums; }
.riquadro .nota { font-size: 6.5pt; color: #4b515b; margin-top: 0.5mm; }
.negativo { color: #b42318; }
.fabbisogno { margin-top: 2mm; font-size: 7.5pt; color: #4b515b; }
.avviso { margin-top: 2mm; border: 0.25mm solid #9c5c1c; border-radius: 2mm; padding: 2mm 3mm; break-inside: avoid; }
.avviso.info { border-color: #d6d2c9; background: #eef6f7; }
.avviso .titolo { font-weight: 700; }
.avviso .fonti { margin-top: 1mm; }
table { width: 100%; margin-top: 3mm; border-collapse: collapse; font-size: 6.6pt; font-variant-numeric: tabular-nums; }
th, td { padding: 1mm 0.8mm; border-bottom: 0.2mm solid #d6d2c9; text-align: right; white-space: nowrap; }
thead th { font-weight: 700; border-bottom: 0.4mm solid #1c1f24; }
th.voce { text-align: left; font-weight: 400; white-space: normal; width: 34mm; }
thead th.voce { font-weight: 700; }
tr.forte th, tr.forte td { font-weight: 700; }
.segno { color: #8a909a; margin-right: 1mm; }
.pareggio { background: #e3f0f1; }
tr { break-inside: avoid; page-break-inside: avoid; }
.colonne { display: flex; gap: 6mm; margin-top: 4mm; break-inside: avoid; }
.colonne > div { flex: 1 1 0; }
h2 { font-size: 9pt; font-weight: 700; }
.contributi { margin-top: 1.5mm; }
.contributi div { display: flex; justify-content: space-between; gap: 3mm; padding: 0.8mm 0; border-bottom: 0.2mm solid #d6d2c9; }
.contributi div.forte { font-weight: 700; border-bottom: 0; }
.contributi .nota { display: block; font-size: 6.5pt; color: #4b515b; font-weight: 400; }
.contributi .cifra { white-space: nowrap; font-variant-numeric: tabular-nums; }
.caso { margin-top: 1mm; font-size: 7pt; color: #4b515b; }
ul { padding-left: 4mm; margin-top: 1.5mm; }
li { margin-top: 0.8mm; }
`;

/** Il budget come pagina HTML A4 orizzontale. `oggiIso` è la data di stampa. */
export function htmlBudget(dati: Pick<DatiBudget, "situazione">, r: RisultatoBudget, { oggiIso }: { oggiIso: string }): string {
  const righe = righeBudget(r);
  const testa =
    `<div class="testa"><div><p class="sopratitolo">Budget del primo anno</p>` +
    `<h1>Il tuo primo anno, ${escapeHtml(periodoBudget(r))}</h1></div>` +
    `<div class="destra"><p><span class="stima">Stima indicativa</span></p>` +
    `<p class="attenuato" style="margin-top:1mm">Attività ${dati.situazione === "accessoria" ? "accessoria" : "principale"} · ${escapeHtml(dataSvizzera(oggiIso))}</p></div></div>`;

  const riquadri =
    `<div class="riquadri">` +
    riquadriBudget(r)
      .map(
        (q) =>
          `<div class="riquadro"><p class="etichetta">${escapeHtml(q.etichetta)}</p>` +
          `<p class="valore${q.negativo ? " negativo" : ""}">${escapeHtml(q.valore)}</p>` +
          (q.nota ? `<p class="nota">${escapeHtml(q.nota)}</p>` : "") +
          `</div>`,
      )
      .join("") +
    `</div>`;

  const fabbisogno = notaFabbisogno(r);
  const avvisi = r.avvisi
    .map(
      (a) =>
        `<div class="avviso${a.livello === "info" ? " info" : ""}"><p class="titolo">${escapeHtml(a.titolo)}</p>` +
        `<p>${escapeHtml(a.testo)}</p>${elencoFonti(a.fonti)}</div>`,
    )
    .join("");

  const cella = (n: number, pareggio: boolean) =>
    `<td${pareggio ? ' class="pareggio"' : ""}><span${n < 0 ? ' class="negativo"' : ""}>${escapeHtml(cifraBudget(n))}</span></td>`;
  const intestazione =
    `<tr><th class="voce" scope="col">CHF</th>` +
    r.mesi.map((m, i) => `<th scope="col"${eMesePareggio(r, i) ? ' class="pareggio"' : ""}>${escapeHtml(m.etichetta)}</th>`).join("") +
    `<th scope="col">Totale</th></tr>`;
  const corpoTabella = righe
    .map(
      (riga) =>
        `<tr${riga.forte ? ' class="forte"' : ""}><th class="voce" scope="row">` +
        (riga.segno ? `<span class="segno">${riga.segno}</span>` : "") +
        `${escapeHtml(riga.etichetta)}</th>` +
        r.mesi.map((m, i) => cella(m[riga.chiave], eMesePareggio(r, i))).join("") +
        cella(totaleRiga(r, riga.chiave), false) +
        `</tr>`,
    )
    .join("");
  const tabella = `<table><thead>${intestazione}</thead><tbody>${corpoTabella}</tbody></table>`;

  const contributi =
    `<div><h2>Contributi sociali sui 12 mesi (tavola ${r.annoAvs})</h2>` +
    `<p class="caso">${escapeHtml(descrizioneCaso(r.contributi))}</p><div class="contributi">` +
    righeContributi(r.contributi)
      .map(
        (c) =>
          `<div${c.forte ? ' class="forte"' : ""}><span>${escapeHtml(c.etichetta)}` +
          (c.nota ? `<span class="nota">${escapeHtml(c.nota)}</span>` : "") +
          `</span><span class="cifra">${escapeHtml(c.valore)}</span></div>`,
      )
      .join("") +
    `</div></div>`;
  const note =
    `<div><h2>Cosa considera questo budget</h2><ul>` +
    puntiBudget(r)
      .map((p) => `<li>${escapeHtml(p)}</li>`)
      .join("") +
    `</ul>${elencoFonti(fontiBudget(r))}</div>`;

  const piede =
    `<p class="piede">${escapeHtml(`${NOTA_NON_CONSULENZA}: ${fonti.albofiduciari.titolo} (${fonti.albofiduciari.ente}), `)}` +
    `<a href="${escapeHtml(fonti.albofiduciari.url)}">${escapeHtml(fonti.albofiduciari.url)}</a>. Preparato con Bleo.</p>`;

  const corpo =
    `<div class="foglio">${testa}${riquadri}` +
    (fabbisogno ? `<p class="fabbisogno">${escapeHtml(fabbisogno)}</p>` : "") +
    `${avvisi}${tabella}<div class="colonne">${contributi}${note}</div>${piede}</div>`;
  return pagina(`Budget del primo anno ${periodoBudget(r)}`, STILE_BUDGET, corpo);
}

/* ------------------------------------------------------------------ */
/* Business plan                                                       */
/* ------------------------------------------------------------------ */

const STILE_PIANO = `${BASE}
@page { size: A4; margin: 0; }
body { font-size: 9pt; overflow-wrap: anywhere; }
.foglio { width: 210mm; padding: 13mm 15mm; }
.testa { display: flex; justify-content: space-between; align-items: flex-end; gap: 6mm; border-bottom: 0.6mm solid #0f5e6b; padding-bottom: 2mm; }
.testa h1 { font-size: 15pt; font-weight: 700; margin-top: 0.5mm; }
.testa .destra { text-align: right; font-size: 8pt; color: #4b515b; }
.idea { margin-top: 3mm; border-radius: 1.5mm; background: #eef6f7; padding: 3mm; break-inside: avoid; }
.idea .testo { margin-top: 1mm; font-size: 11pt; font-weight: 500; white-space: pre-line; }
.griglia { margin-top: 3mm; display: grid; grid-template-columns: 1fr 1fr; column-gap: 6mm; row-gap: 3mm; }
.sezione { border-top: 0.25mm solid #d6d2c9; padding-top: 2mm; break-inside: avoid; }
.sezione .testo { margin-top: 1mm; white-space: pre-line; }
`;

/** Il business plan come pagina HTML A4, come il foglio del sito. `oggiIso`: la data sotto il nome. */
export function htmlBusinessPlan(dati: DatiPiano, { oggiIso }: { oggiIso: string | null }): string {
  const [idea, ...altri] = CAMPI_PIANO;
  const testo = (t: string) => (t.trim() ? escapeHtml(t.trim()) : `<span class="vuoto">…</span>`);
  const nome = dati.nomeAttivita.trim() || "La mia attività";
  const destra = [dati.titolare.trim(), oggiIso ? dataSvizzera(oggiIso) : ""].filter(Boolean).map((t) => `<p>${escapeHtml(t)}</p>`);
  const corpo =
    `<div class="foglio"><div class="testa"><div><p class="sopratitolo">Business plan di una pagina</p>` +
    `<h1>${escapeHtml(nome)}</h1></div><div class="destra">${destra.join("")}</div></div>` +
    `<div class="idea"><p class="sopratitolo">${escapeHtml(idea.titolo)}</p><p class="testo">${testo(dati.campi.idea)}</p></div>` +
    `<div class="griglia">` +
    altri
      .map((c) => `<div class="sezione"><p class="sopratitolo">${escapeHtml(c.titolo)}</p><p class="testo">${testo(dati.campi[c.id])}</p></div>`)
      .join("") +
    `</div><p class="piede">Preparato con Bleo. Documento compilato da chi lo presenta; i numeri sono stime.</p></div>`;
  return pagina(`Business plan ${nome}`, STILE_PIANO, corpo);
}

/** Nome del file PDF, solo con caratteri sicuri per ogni sistema: «Budget del primo anno.pdf», «Business plan Siti Rossi.pdf». */
export function nomeFilePiano(tipo: "budget" | "business-plan", nomeAttivita = ""): string {
  if (tipo === "budget") return "Budget del primo anno.pdf";
  const nome = nomeAttivita
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ._-]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[-. ]+|[-. ]+$/g, "")
    .slice(0, 50);
  return `Business plan${nome ? ` ${nome}` : ""}.pdf`;
}
