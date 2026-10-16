/**
 * «I tuoi conti»: tipi condivisi tra il sito (API e pagina /conti) e l'app.
 * Solo tipi e costanti, senza dipendenze dal browser o da Next.js.
 *
 * Bleo tiene in ordine entrate, uscite e fatture dell'utente, che decide
 * sempre lui: le voci lette da email o foto restano «da confermare» finché non
 * le conferma. Bleo non fa dichiarazioni d'imposta né contabilità per conto
 * di altri (LFid).
 *
 * Gli importi nelle API sono in franchi con due decimali (es. 48.5); nel
 * database sono salvati in centesimi.
 */

export const CATEGORIE = [
  { id: "vendite", tipo: "entrata", etichetta: "Vendite e lavori" },
  { id: "altre_entrate", tipo: "entrata", etichetta: "Altre entrate" },
  { id: "materiale", tipo: "uscita", etichetta: "Materiale e merce" },
  { id: "attrezzatura", tipo: "uscita", etichetta: "Attrezzatura e strumenti" },
  { id: "software", tipo: "uscita", etichetta: "Software e abbonamenti" },
  { id: "telefono", tipo: "uscita", etichetta: "Telefono e internet" },
  { id: "trasporti", tipo: "uscita", etichetta: "Auto, treno e trasporti" },
  { id: "locali", tipo: "uscita", etichetta: "Affitto e locali" },
  { id: "assicurazioni", tipo: "uscita", etichetta: "Assicurazioni" },
  { id: "pubblicita", tipo: "uscita", etichetta: "Pubblicità e sito" },
  { id: "formazione", tipo: "uscita", etichetta: "Corsi e formazione" },
  { id: "banca", tipo: "uscita", etichetta: "Spese bancarie" },
  { id: "consulenze", tipo: "uscita", etichetta: "Fiduciario e consulenze" },
  { id: "pasti", tipo: "uscita", etichetta: "Pasti e trasferte" },
  { id: "altre_uscite", tipo: "uscita", etichetta: "Altre uscite" },
] as const;

export type CategoriaId = (typeof CATEGORIE)[number]["id"];
export type TipoMovimento = "entrata" | "uscita";

/** da_confermare: letto da Bleo, aspetta la tua risposta. privato: non è della ditta (resta escluso dai conti). */
export type StatoMovimento = "da_confermare" | "confermato" | "privato";
export type OrigineMovimento = "fattura" | "email" | "foto" | "manuale";

export type Movimento = {
  id: string;
  tipo: TipoMovimento;
  /** AAAA-MM-GG */
  data: string;
  /** CHF, due decimali, sempre positivo. */
  importo: number;
  descrizione: string;
  /** Fornitore o cliente. */
  controparte: string | null;
  categoria: CategoriaId;
  stato: StatoMovimento;
  origine: OrigineMovimento;
  fatturaId: string | null;
  /** Ricevuta o fattura salvata (foto, PDF o allegato email). */
  documentoId: string | null;
  /** Avviso di Bleo sulla lettura, per esempio «Non sono sicuro della data». */
  nota: string | null;
};

export type StatoFattura = "aperta" | "scaduta" | "pagata";

export type FatturaEmessa = {
  id: string;
  numero: string;
  cliente: string;
  data: string;
  scadenza: string | null;
  importo: number;
  stato: StatoFattura;
  pagataIl: string | null;
};

export type Fonte = { titolo: string; url: string };

export type AvvisoConti = { id: string; testo: string; fonti: Fonte[] };

export type Riepilogo = {
  anno: number;
  /** Solo movimenti confermati. */
  entrate: number;
  uscite: number;
  risultato: number;
  daConfermare: number;
  fattureAperte: { numero: number; importo: number };
  fattureScadute: { numero: number; importo: number };
  perMese: { mese: number; entrate: number; uscite: number }[];
  perCategoria: { categoria: CategoriaId; importo: number }[];
  avvisi: AvvisoConti[];
};

/** GET /api/conti?anno=AAAA */
export type RispostaConti = {
  movimenti: Movimento[];
  fatture: FatturaEmessa[];
  riepilogo: Riepilogo;
  /** Cosa è attivo sul server: lettura di foto e PDF (Claude) e ricezione email (Resend). */
  funzioni: { lettura: boolean; email: boolean };
};

/** GET /api/conti/casella */
export type Casella = {
  /** Indirizzo personale a cui inoltrare fatture e ricevute; null se la ricezione email non è attiva. */
  indirizzo: string | null;
  /** Codice che Gmail manda per confermare l'inoltro automatico. */
  confermaGmail: { codice: string | null; link: string | null; ricevutaIl: string } | null;
  /** Ultima email ricevuta, ISO. */
  ultimaEmail: string | null;
};
