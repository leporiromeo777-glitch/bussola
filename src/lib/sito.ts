/**
 * Dati del sito. I campi del titolare vanno completati prima della
 * pubblicazione: servono per l'impressum (art. 3 cpv. 1 lett. s LCSl),
 * l'informativa privacy e l'attivazione di TWINT su Stripe.
 */
export const sito = {
  nome: "Bleo",
  /** Nome della mascotte: è lo stesso dell'attività. */
  mascotte: "Bleo",
  slogan: "Dall'idea alla prima fattura, passo per passo.",
  descrizione:
    "Il mentore che accompagna chi apre un'attività in Svizzera italiana: percorso personale, risposte con la fonte ufficiale, documenti pronti.",
  // `||` e non `??`: una variabile vuota (come in .env.example) vale come mancante.
  url: process.env.NEXT_PUBLIC_SITO_URL?.trim() || "http://localhost:3000",
  titolare: {
    // Le variabili d'ambiente, se impostate, hanno la precedenza.
    nome: process.env.NEXT_PUBLIC_TITOLARE_NOME?.trim() || "Romeo Lepori",
    // DA COMPLETARE prima della pubblicazione: indirizzo postale completo.
    indirizzo: process.env.NEXT_PUBLIC_TITOLARE_INDIRIZZO?.trim() || "[Via e numero, NPA Località]",
    email: process.env.NEXT_PUBLIC_TITOLARE_EMAIL?.trim() || "romeolepori@gmail.com",
  },
} as const;

export type Titolare = { nome: string; indirizzo: string; email: string };

/** I valori di sito.titolare non ancora completati sono vuoti o scritti tra parentesi quadre. */
export function valoreSegnaposto(valore: string): boolean {
  const pulito = valore.trim();
  return pulito === "" || /^\[.*\]$/.test(pulito);
}

/**
 * true se manca il nome o l'email del titolare. Bastano questi due dati per
 * la lista d'attesa: la LPD (art. 19) chiede identità e dati di contatto di
 * chi raccoglie i dati.
 */
export function datiTitolareIncompleti(titolare: Titolare): boolean {
  return [titolare.nome, titolare.email].some(valoreSegnaposto);
}

/**
 * true se manca l'indirizzo postale. Diventa obbligatorio prima di vendere
 * online (LCSl art. 3 cpv. 1 lett. s: identità e indirizzo di contatto) e per
 * attivare TWINT su Stripe: i pagamenti non vanno attivati finché è true.
 */
export function indirizzoMancante(titolare: Titolare): boolean {
  return valoreSegnaposto(titolare.indirizzo);
}

/**
 * true se i dati del titolare non sono ancora completi: niente email ai
 * visitatori e niente iscrizioni finché impressum e informativa non dicono
 * chi siamo (LCSl art. 3 cpv. 1 lett. o e s).
 */
export const titolareIncompleto = datiTitolareIncompleti(sito.titolare);

/** true finché l'indirizzo postale del titolare non è indicato (vedi indirizzoMancante). */
export const indirizzoTitolareMancante = indirizzoMancante(sito.titolare);

/** Voci principali di navigazione dell'app. */
export const navigazione = [
  { href: "/percorso", etichetta: "Il tuo percorso" },
  { href: "/chat", etichetta: "Chiedi a Bleo" },
  { href: "/strumenti", etichetta: "Strumenti" },
] as const;
