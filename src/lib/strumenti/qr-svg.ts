/**
 * Sezione pagamento della QR-fattura come SVG, con swissqrbill. Nel browser
 * usa il motore SVG del DOM, in Node (test) quello testuale: il risultato è lo
 * stesso testo SVG.
 */
import { SwissQRBill } from "swissqrbill/svg";
import { pagamentoDaDocumento, type Documento } from "./documenti";
import { validaPagamentoQr, type ErroreQr } from "./qr";

export type EsitoSezionePagamento = { ok: true; svg: string } | { ok: false; errori: ErroreQr[] };

/** La sezione pagamento misura 210 × 105 mm: in px CSS (96 dpi). */
const LARGHEZZA_PX = (210 * 96) / 25.4;
const ALTEZZA_PX = (105 * 96) / 25.4;

/**
 * Rende scalabile l'SVG di swissqrbill: toglie larghezza e altezza fisse dal
 * tag principale e aggiunge un viewBox equivalente. Le misure interne restano
 * in mm e si convertono nel sistema di coordinate, quindi a 210 mm di
 * larghezza il disegno è identico all'originale.
 */
export function svgScalabile(svg: string): string {
  const fine = svg.indexOf(">");
  if (!svg.startsWith("<svg") || fine < 0) return svg;
  const apertura = svg
    .slice(0, fine)
    .replace(/\s(width|height|viewBox|preserveAspectRatio)="[^"]*"/g, "")
    .concat(
      ` viewBox="0 0 ${LARGHEZZA_PX.toFixed(3)} ${ALTEZZA_PX.toFixed(3)}" width="100%" height="100%"`,
      ' preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sezione pagamento con codice QR"',
    );
  return `${apertura}${svg.slice(fine)}`;
}

/** SVG della sezione pagamento per una fattura, o l'elenco di cosa manca. */
export function sezionePagamentoSvg(doc: Documento): EsitoSezionePagamento {
  const pagamento = pagamentoDaDocumento(doc);
  if (!pagamento.ok) return pagamento;
  const valido = validaPagamentoQr(pagamento.dati);
  if (!valido.ok) return valido;
  try {
    const svg = new SwissQRBill(valido.dati, { language: "IT" }).toString();
    return { ok: true, svg: svgScalabile(svg) };
  } catch (errore) {
    return {
      ok: false,
      errori: [
        {
          campo: "qr",
          messaggio: `La sezione pagamento non si può creare (${errore instanceof Error ? errore.message : "errore sconosciuto"}).`,
        },
      ],
    };
  }
}
