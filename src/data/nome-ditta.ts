/**
 * Regole e avvisi dello strumento «Nome della ditta» (src/app/strumenti/nome).
 * Ogni testo porta le sue fonti ufficiali e la data dell'ultimo controllo.
 * La regola del cognome è quella del passo "nome-ditta" (src/data/passi.ts):
 * qui ci sono solo le regole e le note in più che servono allo strumento.
 */
import { fonti, fontiPercorso, type Fonte } from "./svizzera";

export type RegolaNome = {
  id: string;
  testo: string;
  fonti: readonly Fonte[];
  /** Data ISO dell'ultimo controllo sulle fonti. */
  verificatoIl: string;
};

/** Testi degli artt. 944, 945 e 946 CO e pagine IPI ricontrollati su Fedlex e ige.ch. */
const VERIFICATO_IL = "2026-10-16";

export const REGOLE_NOME_DITTA = [
  {
    id: "cognome",
    testo:
      "Il nome di una ditta individuale deve contenere il tuo cognome, con o senza il nome. Se contiene altri cognomi, il tuo deve risaltare.",
    fonti: [fonti.co945, fonti.rcTicinoIscrizione],
    verificatoIl: VERIFICATO_IL,
  },
  {
    id: "societa",
    testo:
      "Non puoi aggiungere parole che facciano pensare a una società, per esempio «SA», «Sagl», «GmbH», «& Co.» o «e soci».",
    fonti: [fonti.co945],
    verificatoIl: VERIFICATO_IL,
  },
  {
    id: "verita",
    testo:
      "Puoi aggiungere cosa fai o un nome di fantasia, se è vero, non trae in inganno e non lede nessun interesse pubblico. Per parole nazionali o territoriali (come «Svizzera», «Swiss» o «Ticino») valgono regole speciali del Consiglio federale.",
    fonti: [fontiPercorso.co944],
    verificatoIl: VERIFICATO_IL,
  },
  {
    id: "stesso-luogo",
    testo:
      "Una ditta iscritta nel registro di commercio non può essere usata da altri nello stesso luogo, nemmeno da chi ha lo stesso nome e cognome: in quel caso serve un'aggiunta che la distingua chiaramente.",
    fonti: [fontiPercorso.co946],
    verificatoIl: VERIFICATO_IL,
  },
] as const satisfies readonly RegolaNome[];

/** Nota sul controllo nel registro: è solo indicativo. */
export const NOTA_REGISTRO = {
  testo:
    "Il controllo cerca su Zefix le ditte attive con le stesse parole. È solo indicativo: se il nome va bene lo decide l'Ufficio del registro di commercio quando ti iscrivi.",
  fonti: [fontiPercorso.zefix, fontiPercorso.zefixUffici],
  verificatoIl: VERIFICATO_IL,
} as const;

/** Nota sui marchi: Zefix non li controlla. */
export const NOTA_MARCHI = {
  testo:
    "Zefix non controlla i marchi. Se vuoi registrare il nome anche come marchio, controlla prima che non esistano marchi uguali o simili: quando depositi il marchio l'IPI non lo verifica. Una prima ricerca la fai gratis su Swissreg; secondo l'IPI però non basta e conviene una ricerca professionale.",
  fonti: [fontiPercorso.swissregMarchi, fontiPercorso.ipiRicercaMarchi],
  verificatoIl: VERIFICATO_IL,
} as const;
