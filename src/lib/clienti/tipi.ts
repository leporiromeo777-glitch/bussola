/**
 * «Clienti e ore»: tipi condivisi tra il sito (API e pagina /conti/clienti)
 * e l'app. Solo tipi, senza dipendenze dal browser o da Next.js.
 *
 * Gli importi nelle API sono in franchi con due decimali (es. 120.5); nel
 * database sono in centesimi. Le durate sono in minuti interi.
 */
import type { IndirizzoStrutturato } from "@/lib/strumenti/qr";

/** Un cliente della rubrica: l'indirizzo è strutturato come nella QR-fattura. */
export type Cliente = IndirizzoStrutturato & {
  id: string;
  email: string | null;
  /** Tariffa oraria predefinita in CHF, se c'è. */
  tariffa: number | null;
};

/** Una voce di ore lavorate per un cliente. */
export type VoceOre = {
  id: string;
  clienteId: string;
  /** AAAA-MM-GG */
  data: string;
  minuti: number;
  descrizione: string;
  /** Tariffa di questa voce in CHF; null = vale quella del cliente. */
  tariffa: number | null;
  /** Giorno in cui la voce è finita in una fattura (AAAA-MM-GG), oppure null. */
  fatturataIl: string | null;
};

/** Mese nel formato AAAA-MM. */
export type Mese = string;

/** GET /api/conti/ore?mese=AAAA-MM */
export type RispostaOre = {
  mese: Mese;
  clienti: Cliente[];
  /** Le voci del mese, di tutti i clienti. */
  voci: VoceOre[];
  /** Mesi con ore non ancora fatturate (anche altri mesi), dal più recente. */
  daFatturare: { mese: Mese; minuti: number }[];
};

/** Come preparare la fattura: una riga per ogni voce o una riga sola (per tariffa). */
export type DettaglioFattura = "voci" | "riepilogo";

/** Una riga della fattura, già nel formato dello strumento fattura (testi). */
export type RigaPrecompilata = {
  descrizione: string;
  quantita: string;
  unita: string;
  prezzo: string;
};

/**
 * Quello che serve allo strumento fattura per preparare la fattura dalle ore:
 * indirizzo del cliente, oggetto, periodo e righe. I tuoi dati (nome, IBAN)
 * restano quelli salvati nel browser.
 */
export type Precompilazione = {
  /** Diventa l'id del documento: riaprire lo stesso link non crea doppioni. */
  id: string;
  cliente: IndirizzoStrutturato;
  oggetto: string;
  periodoPrestazione: string;
  righe: RigaPrecompilata[];
};

/** POST /api/conti/ore/fattura */
export type RispostaFatturaOre = {
  precompilazione: Precompilazione;
  /** Quante voci sono state segnate come fatturate. */
  voci: number;
  fatturataIl: string;
};
