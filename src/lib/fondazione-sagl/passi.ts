/**
 * «Fondare una Sagl» a passi, come nell'app: gli stessi gruppi della pagina
 * del sito (società, capitale e quote, soci, chi dirige, banca e revisione)
 * e alla fine i controlli con i due PDF. Qui si decide a quale passo
 * appartiene ogni controllo di controllaFondazione (dati.ts), così ogni
 * schermata mostra solo quello che si corregge lì. Logica pura.
 */
import { chf } from "../../data/svizzera";
import { numeroSvizzero } from "../strumenti/numeri";
import { controllaFondazione, totaleQuote, type Controllo, type DatiFondazione } from "./dati";

export const PASSI_SAGL = [
  { id: "societa", titolo: "La società" },
  { id: "capitale", titolo: "Capitale e quote" },
  { id: "soci", titolo: "I soci" },
  { id: "direzione", titolo: "Chi dirige" },
  { id: "banca", titolo: "Banca, revisione e comunicazioni" },
  { id: "documenti", titolo: "Controlli e PDF" },
] as const;

export type IdPassoSagl = (typeof PASSI_SAGL)[number]["id"];

/** Il passo in cui si corregge un controllo (dall'id di controllaFondazione). */
export function passoDelControllo(id: string): IdPassoSagl {
  if (id === "ditta" || id === "forma" || id === "sede" || id === "scopo") return "societa";
  if (id === "capitale" || id === "valore" || id === "divisione") return "capitale";
  if (id === "soci" || id === "totale" || id === "natura" || id.startsWith("nome-") || id.startsWith("quote-")) return "soci";
  if (id === "gerenti" || id === "domicilio" || id.startsWith("gerente-")) return "direzione";
  if (id === "banca" || id === "revisione") return "banca";
  return "documenti";
}

export type ControlliPasso = { errori: Controllo[]; avvisi: Controllo[] };

/** I controlli di controllaFondazione divisi per passo (l'ultimo passo li mostra tutti). */
export function controlliPerPasso(d: DatiFondazione): Record<IdPassoSagl, ControlliPasso> {
  const { errori, avvisi } = controllaFondazione(d);
  const risultato = Object.fromEntries(PASSI_SAGL.map((p) => [p.id, { errori: [], avvisi: [] }])) as unknown as Record<
    IdPassoSagl,
    ControlliPasso
  >;
  for (const e of errori) risultato[passoDelControllo(e.id)].errori.push(e);
  for (const a of avvisi) risultato[passoDelControllo(a.id)].avvisi.push(a);
  risultato.documenti = { errori, avvisi };
  return risultato;
}

/** «Sono 200 quote da CHF 100.00. I soci ne hanno 150.», come sulla pagina del sito. */
export function riepilogoQuote(d: DatiFondazione): string {
  const nQuote = d.valoreQuota > 0 ? d.capitale / d.valoreQuota : 0;
  if (!Number.isInteger(nQuote) || nQuote <= 0) return "Il capitale deve essere un numero intero di quote.";
  return `Sono ${numeroSvizzero(nQuote)} quote da ${chf(d.valoreQuota, 2)}. I soci ne hanno ${numeroSvizzero(totaleQuote(d))}.`;
}
