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
  url: process.env.NEXT_PUBLIC_SITO_URL ?? "http://localhost:3000",
  titolare: {
    // DA COMPLETARE prima della pubblicazione.
    nome: process.env.NEXT_PUBLIC_TITOLARE_NOME ?? "[Nome e cognome del titolare]",
    indirizzo: process.env.NEXT_PUBLIC_TITOLARE_INDIRIZZO ?? "[Via e numero, NPA Località]",
    email: process.env.NEXT_PUBLIC_TITOLARE_EMAIL ?? "[email di contatto]",
  },
} as const;

/** Voci principali di navigazione dell'app. */
export const navigazione = [
  { href: "/questionario", etichetta: "Il tuo percorso" },
  { href: "/chat", etichetta: "Chiedi a Bussola" },
  { href: "/strumenti", etichetta: "Strumenti" },
] as const;
