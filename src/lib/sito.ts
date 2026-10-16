/**
 * Dati del sito. I campi del titolare vanno completati prima della
 * pubblicazione: servono per l'impressum (art. 3 cpv. 1 lett. s LCSl),
 * l'informativa privacy e l'attivazione di TWINT su Stripe.
 */
export const sito = {
  nome: "Bussola",
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

/** true se almeno un dato del titolare (nome, indirizzo, email) è ancora da completare. */
export function datiTitolareIncompleti(titolare: Titolare): boolean {
  return [titolare.nome, titolare.indirizzo, titolare.email].some(valoreSegnaposto);
}

/**
 * true se i dati del titolare non sono ancora completi: niente email ai
 * visitatori e niente iscrizioni finché impressum e informativa non dicono
 * chi siamo (LCSl art. 3 cpv. 1 lett. o e s).
 */
export const titolareIncompleto = datiTitolareIncompleti(sito.titolare);

/** Voci principali di navigazione dell'app. */
export const navigazione = [
  { href: "/percorso", etichetta: "Il tuo percorso" },
  { href: "/chat", etichetta: "Chiedi a Bussola" },
  { href: "/strumenti", etichetta: "Strumenti" },
] as const;
