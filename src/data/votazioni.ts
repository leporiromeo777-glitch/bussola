/**
 * Votazioni che possono cambiare qualcosa per chi ha un'impresa: Bleo le
 * ricorda, con la fonte ufficiale, e non dice come votare. Le votazioni
 * passate spariscono da sole (votazioniInArrivo in src/lib/votazioni.ts).
 *
 * Da aggiornare quando il Consiglio federale (circa quattro mesi prima) o il
 * Cantone fissano gli oggetti: l'elenco è su fontiVotazioni.ticinoProssime.
 * Ci vanno solo gli oggetti con un effetto diretto su chi ha un'impresa, letto
 * nel testo ufficiale.
 */
import type { Fonte } from "./svizzera";

export type LivelloVotazione = "federale" | "cantonale" | "comunale";

export type Votazione = {
  /** Stabile: «<data>-<tema>». */
  id: string;
  /** Domenica del voto, AAAA-MM-GG. */
  data: string;
  livello: LivelloVotazione;
  /** Il titolo ufficiale dell'oggetto. */
  oggetto: string;
  /** Poche parole per il calendario e le notifiche. */
  titoloBreve: string;
  /** Cosa cambierebbe per un'impresa, solo da quello che dice il testo ufficiale. */
  cosaCambia: string;
  /** Chi ne è toccato di più. */
  chiRiguarda: string;
  fonti: readonly Fonte[];
  verificatoIl: string;
};

/**
 * Elenco «Prossimi appuntamenti di voto» del Cantone Ticino e testo del
 * decreto federale del 19.06.2026 (Foglio federale), letti il 18.10.2026.
 */
export const VERIFICATO_VOTAZIONI = "2026-10-18";

export const fontiVotazioni = {
  ticinoProssime: {
    titolo: "Votazioni: prossimi appuntamenti di voto",
    url: "https://www.ti.ch/can/votazioni",
    ente: "Cantone Ticino, Cancelleria dello Stato",
  },
  decretoIvaAvs: {
    titolo: "Decreto federale del 19 giugno 2026 sul finanziamento supplementare dell'AVS mediante un aumento dell'IVA",
    url: "https://www.fedlex.admin.ch/eli/fga/2026/1757/it",
    ente: "Confederazione (Fedlex)",
  },
} as const satisfies Record<string, Fonte>;

export const VOTAZIONI: readonly Votazione[] = [
  {
    id: "2026-11-29-iva-avs",
    data: "2026-11-29",
    livello: "federale",
    oggetto: "Decreto federale sul finanziamento supplementare dell'AVS mediante un aumento dell'imposta sul valore aggiunto",
    titoloBreve: "Aumento dell'IVA per l'AVS",
    cosaCambia:
      "Se viene accettato, per finanziare la tredicesima rendita AVS di vecchiaia il Consiglio federale aumenta l'aliquota IVA normale di 0,4 punti percentuali e quella speciale per l'alloggio di 0,2 punti. La data la decide il Consiglio federale.",
    chiRiguarda:
      "Soprattutto chi è iscritto all'IVA: dalla data decisa dovrebbe usare le nuove aliquote in prezzi e fatture.",
    fonti: [fontiVotazioni.decretoIvaAvs, fontiVotazioni.ticinoProssime],
    verificatoIl: VERIFICATO_VOTAZIONI,
  },
];
