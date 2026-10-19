/**
 * Preventivo e fattura pronti da mostrare o da stampare fuori dal sito:
 * - `vistaDocumento`: i testi già formattati (intestazione, cliente, voci,
 *   totali, frase di pagamento), gli stessi dell'anteprima del sito
 *   (src/components/strumenti/documenti/anteprima-documento.tsx). L'app li
 *   usa per l'anteprima sullo schermo.
 * - `htmlDocumento`: una pagina HTML A4 completa, con in fondo la sezione
 *   pagamento della QR-fattura (lo stesso SVG del sito, src/lib/strumenti/qr-svg.ts).
 *   L'app la trasforma in PDF con expo-print.
 *
 * La sezione pagamento misura 210 × 105 mm e va in fondo alla pagina: se il
 * documento sta su una pagina, sta in fondo a quella; se è più lungo, va su
 * una pagina sua, in fondo (impaginazione «pagina-separata»). Quale delle
 * due serve lo dice il numero di pagine del primo PDF (lo decide l'app).
 *
 * Logica pura, senza browser né Node.
 */
import { dataSvizzera, percentuale } from "@/data/svizzera";
import { calcolaTotali, dataIsoValida, NOMI_TIPO, normalizzaNumeroIva, tassoIva, type Documento } from "./documenti";
import { importo, numeroSvizzero } from "./numeri";
import { formattaIban, type IndirizzoStrutturato } from "./qr";
import { sezionePagamentoSvg, type EsitoSezionePagamento } from "./qr-svg";

export type RigaVista = { id: string; descrizione: string; quantita: string; prezzo: string; iva: string | null; importo: string };
export type TotaleVista = { etichetta: string; valore: string; forte?: boolean };

export type VistaDocumento = {
  /** «Preventivo» o «Fattura». */
  titolo: string;
  emittente: { nome: string; righe: string[] };
  /** Numero, data, scadenza o validità, preventivo di partenza. */
  dettagli: { etichetta: string; valore: string }[];
  cliente: { nome: string; righe: string[] };
  oggetto: string;
  prestazione: string;
  conIva: boolean;
  colonne: string[];
  righe: RigaVista[];
  totali: TotaleVista[];
  note: string;
  /** «Da pagare entro il … sul conto …» o «Questo preventivo è valido fino al …». */
  chiusura: string;
};

/** Via e numero, NPA e località, paese se non è la Svizzera. */
export function righeIndirizzo(ind: IndirizzoStrutturato): string[] {
  const via = [ind.via.trim(), ind.numero.trim()].filter(Boolean).join(" ");
  const localita = [ind.npa.trim(), ind.localita.trim()].filter(Boolean).join(" ");
  const paese = ind.paese.trim().toUpperCase();
  return [via, localita, paese && paese !== "CH" ? paese : ""].filter(Boolean);
}

function data(iso: string): string {
  return dataIsoValida(iso) ? dataSvizzera(iso) : "";
}

export function vistaDocumento(doc: Documento): VistaDocumento {
  const totali = calcolaTotali(doc);
  const e = doc.emittente;
  const conIva = e.ivaIscritto;
  const numeroIva = conIva ? normalizzaNumeroIva(e.numeroIva) : null;
  const tipo = NOMI_TIPO[doc.tipo];
  const valuta = doc.valuta;

  const dettagli = [
    { etichetta: "Numero", valore: doc.numero },
    { etichetta: "Data", valore: data(doc.data) },
    ...(doc.scadenza ? [{ etichetta: tipo.scadenza, valore: data(doc.scadenza) }] : []),
    ...(doc.daPreventivo ? [{ etichetta: "Preventivo", valore: doc.daPreventivo }] : []),
  ];

  const righe: RigaVista[] = doc.righe.flatMap((r, i) => {
    const c = totali.righe[i];
    if (!r.descrizione.trim() && c.importo === 0) return [];
    return [
      {
        id: r.id,
        descrizione: r.descrizione,
        quantita: `${numeroSvizzero(c.quantita, Number.isInteger(c.quantita) ? 0 : 2)} ${r.unita}`.trim(),
        prezzo: numeroSvizzero(c.prezzo, 2),
        iva: conIva ? percentuale(tassoIva(r.aliquota)) : null,
        importo: numeroSvizzero(c.importo, 2),
      },
    ];
  });

  const righeTotali: TotaleVista[] = [];
  if (conIva) {
    righeTotali.push({ etichetta: "Totale senza IVA", valore: importo(totali.imponibile, 2, valuta) });
    for (const v of totali.iva) {
      righeTotali.push({
        etichetta: `IVA ${percentuale(v.tasso)} su ${numeroSvizzero(v.base, 2)}`,
        valore: importo(v.imposta, 2, valuta),
      });
    }
  }
  if (totali.arrotondamento !== 0) {
    righeTotali.push({ etichetta: "Arrotondamento", valore: importo(totali.arrotondamento, 2, valuta) });
  }
  righeTotali.push({ etichetta: `Totale${conIva ? " IVA inclusa" : ""}`, valore: importo(totali.totale, 2, valuta), forte: true });

  let chiusura = "";
  if (doc.tipo === "fattura") {
    chiusura =
      `${doc.scadenza ? `Da pagare entro il ${data(doc.scadenza)}` : "Da pagare"}` +
      `${e.iban ? ` sul conto ${formattaIban(e.iban)}` : ""}` +
      `${e.iban && e.nome ? `, intestato a ${e.nome}` : ""}.`;
  } else if (doc.scadenza) {
    chiusura = `Questo preventivo è valido fino al ${data(doc.scadenza)}.`;
  }

  return {
    titolo: tipo.singolare,
    emittente: {
      nome: e.nome || "Il tuo nome e cognome",
      righe: [...righeIndirizzo(e), e.email, e.telefono, numeroIva ?? ""].filter(Boolean),
    },
    dettagli,
    cliente: { nome: doc.cliente.nome || "Nome del cliente", righe: righeIndirizzo(doc.cliente) },
    oggetto: doc.oggetto.trim(),
    prestazione: doc.periodoPrestazione.trim() ? `Prestazione: ${doc.periodoPrestazione.trim()}` : "",
    conIva,
    colonne: ["Descrizione", "Quantità", "Prezzo", ...(conIva ? ["IVA"] : []), "Importo"],
    righe,
    totali: righeTotali,
    note: doc.note.trim(),
    chiusura,
  };
}

/** Nome del file PDF: «Fattura F-2026-001.pdf», solo con caratteri sicuri per ogni sistema. */
export function nomeFilePdf(doc: Pick<Documento, "tipo" | "numero">): string {
  const numero = doc.numero
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 40);
  return `${NOMI_TIPO[doc.tipo].singolare}${numero ? ` ${numero}` : ""}.pdf`;
}

/* ------------------------------------------------------------------ */
/* HTML per il PDF                                                     */
/* ------------------------------------------------------------------ */

export type Impaginazione = "una-pagina" | "pagina-separata";

/** Misure di un foglio A4 in punti tipografici (1/72 di pollice), per expo-print. */
export const A4_PUNTI = { larghezza: 595, altezza: 842 } as const;

export function escapeHtml(testo: string): string {
  return testo
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STILE = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body {
  color: #1c1f24; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; line-height: 1.35;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; -webkit-text-size-adjust: 100%;
}
p { margin: 0; }
.foglio { width: 210mm; display: flex; flex-direction: column; }
.foglio.una-pagina { min-height: 296.5mm; }
.corpo { flex: 1 0 auto; padding: 12mm 16mm 6mm; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.intestazione { display: flex; justify-content: space-between; gap: 10mm; }
.emittente .nome { font-size: 12pt; font-weight: 700; }
.titolo { text-align: right; }
.titolo h1 { margin: 0; font-size: 18pt; font-weight: 700; color: #0f5e6b; letter-spacing: -0.01em; }
.dettagli { margin-top: 1mm; display: grid; grid-template-columns: auto auto; justify-content: end; column-gap: 3mm; }
.dettagli dt { color: #4b515b; }
.dettagli dd { margin: 0; }
.cliente { margin: 7mm 0 0 auto; width: 45%; }
.cliente .per { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.05em; color: #4b515b; }
.cliente .nome { font-weight: 600; }
.oggetto { margin-top: 7mm; font-weight: 700; }
.prestazione { margin-top: 1mm; }
.senza-oggetto { margin-top: 7mm; }
table { width: 100%; margin-top: 5mm; border-collapse: collapse; }
thead { display: table-header-group; }
th { text-align: left; font-weight: 500; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.05em; color: #4b515b; padding: 1.5mm 2mm; border-bottom: 0.5mm solid #1c1f24; }
td { padding: 1.5mm 2mm; border-bottom: 0.25mm solid #d6d2c9; vertical-align: top; }
th:first-child, td:first-child { padding-left: 0; }
th:last-child, td:last-child { padding-right: 0; }
td.descrizione { white-space: pre-line; }
.numero { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
tr { page-break-inside: avoid; break-inside: avoid; }
.vuoto { color: #8a909a; }
.totali { margin: 4mm 0 0 auto; width: 72mm; page-break-inside: avoid; break-inside: avoid; }
.totali div { display: flex; justify-content: space-between; gap: 4mm; padding: 0.5mm 0; font-variant-numeric: tabular-nums; }
.totali .forte { margin-top: 1mm; padding-top: 1.5mm; border-top: 0.5mm solid #1c1f24; font-size: 11pt; font-weight: 700; }
.note { margin-top: 5mm; white-space: pre-line; }
.chiusura { margin-top: 4mm; }
.pagamento { width: 210mm; height: 105mm; flex: 0 0 auto; page-break-inside: avoid; break-inside: avoid; overflow: visible; }
.pagamento svg { display: block; width: 210mm; height: 105mm; }
.pagina-pagamento { page-break-before: always; break-before: page; width: 210mm; height: 296.5mm; display: flex; flex-direction: column; justify-content: flex-end; }
`;

function paragrafi(righe: readonly string[]): string {
  return righe.map((r) => `<p>${escapeHtml(r)}</p>`).join("");
}

/**
 * Il documento come pagina HTML A4 da stampare in PDF. Per le fatture, se i
 * dati di pagamento sono completi, in fondo c'è la sezione pagamento con il
 * codice QR; altrimenti il PDF esce senza (l'app avvisa prima).
 */
export function htmlDocumento(
  doc: Documento,
  { impaginazione = "una-pagina", pagamento }: { impaginazione?: Impaginazione; pagamento?: EsitoSezionePagamento } = {},
): string {
  const v = vistaDocumento(doc);
  const sezione = doc.tipo === "fattura" ? (pagamento ?? sezionePagamentoSvg(doc)) : null;
  const svg = sezione?.ok ? sezione.svg : null;

  const dettagli = v.dettagli
    .map((d) => `<dt>${escapeHtml(d.etichetta)}</dt><dd>${escapeHtml(d.valore)}</dd>`)
    .join("");
  const intestazioneTabella = v.colonne
    .map((c, i) => `<th scope="col"${i > 0 ? ' class="numero"' : ""}>${escapeHtml(c)}</th>`)
    .join("");
  const righe =
    v.righe.length === 0
      ? `<tr><td colspan="${v.colonne.length}" class="vuoto">Nessuna voce.</td></tr>`
      : v.righe
          .map(
            (r) =>
              `<tr><td class="descrizione">${escapeHtml(r.descrizione)}</td>` +
              `<td class="numero">${escapeHtml(r.quantita)}</td>` +
              `<td class="numero">${escapeHtml(r.prezzo)}</td>` +
              (r.iva !== null ? `<td class="numero">${escapeHtml(r.iva)}</td>` : "") +
              `<td class="numero">${escapeHtml(r.importo)}</td></tr>`,
          )
          .join("");
  const totali = v.totali
    .map((t) => `<div${t.forte ? ' class="forte"' : ""}><span>${escapeHtml(t.etichetta)}</span><span>${escapeHtml(t.valore)}</span></div>`)
    .join("");

  const corpo = [
    `<div class="intestazione">`,
    `<div class="emittente"><p class="nome">${escapeHtml(v.emittente.nome)}</p>${paragrafi(v.emittente.righe)}</div>`,
    `<div class="titolo"><h1>${escapeHtml(v.titolo)}</h1><dl class="dettagli">${dettagli}</dl></div>`,
    `</div>`,
    `<div class="cliente"><p class="per">Per</p><p class="nome">${escapeHtml(v.cliente.nome)}</p>${paragrafi(v.cliente.righe)}</div>`,
    v.oggetto ? `<p class="oggetto">${escapeHtml(v.oggetto)}</p>` : "",
    v.prestazione ? `<p class="${v.oggetto ? "prestazione" : "prestazione senza-oggetto"}">${escapeHtml(v.prestazione)}</p>` : "",
    `<table><thead><tr>${intestazioneTabella}</tr></thead><tbody>${righe}</tbody></table>`,
    `<div class="totali">${totali}</div>`,
    v.note ? `<p class="note">${escapeHtml(v.note)}</p>` : "",
    v.chiusura ? `<p class="chiusura">${escapeHtml(v.chiusura)}</p>` : "",
  ].join("");

  // L'SVG viene da swissqrbill, che fa l'escape dei testi inseriti (come sul sito).
  const sezionePagamento = svg ? `<div class="pagamento">${svg}</div>` : "";
  const separata = Boolean(svg) && impaginazione === "pagina-separata";
  const titolo = `${v.titolo} ${doc.numero}`.trim();

  return (
    `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">` +
    `<title>${escapeHtml(titolo)}</title><style>${STILE}</style></head><body>` +
    `<div class="foglio${svg && !separata ? " una-pagina" : ""}"><div class="corpo">${corpo}</div>${separata ? "" : sezionePagamento}</div>` +
    (separata ? `<div class="pagina-pagamento">${sezionePagamento}</div>` : "") +
    `</body></html>`
  );
}
