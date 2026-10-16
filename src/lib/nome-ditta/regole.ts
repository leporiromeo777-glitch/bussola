/**
 * «Nome della ditta»: controlli locali sul nome di una ditta individuale.
 * Logica pura, senza browser né Next.js (la usa anche l'app mobile).
 * I testi delle regole con le fonti sono in src/data/nome-ditta.ts.
 */

/** Lunghezza massima di un nome di ditta da controllare o proposto. */
export const LUNGHEZZA_MASSIMA_NOME_DITTA = 80;

/**
 * Forma confrontabile di un testo: minuscole, senza accenti né apostrofi
 * («Dell'Acqua» → «dellacqua»), punteggiatura e trattini come spazi.
 */
export function normalizza(testo: string): string {
  return testo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("it-CH")
    .replace(/ß/g, "ss")
    .replace(/['’‘`´ʼ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Le parole di un testo, già normalizzate. */
export function parole(testo: string): string[] {
  const pulito = normalizza(testo);
  return pulito ? pulito.split(" ") : [];
}

/**
 * Il nome contiene il cognome come parola intera (o parole intere, per i
 * cognomi composti)? Non contano maiuscole, accenti, apostrofi e trattini, e
 * un cognome composto può essere scritto staccato o attaccato
 * («De Luca» = «DeLuca», «Dell'Acqua» = «Dell Acqua»). «Rossi» non vale
 * dentro «Rossini».
 */
export function contieneCognome(nomeDitta: string, cognome: string): boolean {
  const cercato = parole(cognome).join("");
  if (!cercato) return false;
  const nome = parole(nomeDitta);
  for (let inizio = 0; inizio < nome.length; inizio += 1) {
    let unito = "";
    for (let fine = inizio; fine < nome.length && unito.length < cercato.length; fine += 1) {
      unito += nome[fine];
      if (unito === cercato) return true;
    }
  }
  return false;
}

/**
 * Parole che fanno pensare a una società (art. 945 CO: per la ditta
 * individuale non sono permesse). Si confrontano con le parole normalizzate.
 */
const PAROLE_SOCIETA = new Set([
  "sa",
  "ag",
  "sagl",
  "gmbh",
  "sarl",
  "ltd",
  "llc",
  "inc",
  "srl",
  "snc",
  "co",
  "cie",
  "soci",
  "socio",
  "partner",
  "partners",
  "associati",
  "societa",
  "fratelli",
  "figli",
]);

/**
 * Inizi di parole nazionali o territoriali (art. 944 CO: valgono regole
 * speciali del Consiglio federale). Bleo non le propone se non le chiedi tu.
 */
const INIZI_TERRITORIO = [
  "svizzer",
  "swiss",
  "suisse",
  "schweiz",
  "helvet",
  "elvetic",
  "confederaz",
  "ticin",
  "internaziona",
  "international",
];

/** Le parole, con le sigle puntate riunite: «S.A.» → «sa», «S.a.g.l.» → «sagl». */
function paroleConSigle(testo: string): string[] {
  const risultato: string[] = [];
  let sigla = "";
  for (const p of parole(testo)) {
    if (p.length === 1) {
      sigla += p;
      continue;
    }
    if (sigla) risultato.push(sigla);
    sigla = "";
    risultato.push(p);
  }
  if (sigla) risultato.push(sigla);
  return risultato;
}

/** La prima parola che fa pensare a una società, oppure null. */
export function parolaSocieta(nomeDitta: string): string | null {
  return paroleConSigle(nomeDitta).find((p) => PAROLE_SOCIETA.has(p)) ?? null;
}

/** La prima parola nazionale o territoriale, oppure null. */
export function parolaTerritorio(testo: string): string | null {
  return parole(testo).find((p) => INIZI_TERRITORIO.some((inizio) => p.startsWith(inizio))) ?? null;
}

export type ControlloNome = {
  /** Il nome contiene il cognome (art. 945 CO). */
  conCognome: boolean;
  /** Parola che fa pensare a una società, se c'è. */
  societa: string | null;
  /** Parola nazionale o territoriale, se c'è. */
  territorio: string | null;
};

/** Controlli locali su un nome scritto da chi usa lo strumento. */
export function controllaNome(nomeDitta: string, cognome: string): ControlloNome {
  return {
    conCognome: contieneCognome(nomeDitta, cognome),
    societa: parolaSocieta(nomeDitta),
    territorio: parolaTerritorio(nomeDitta),
  };
}

/** Testo del nome come lo si mostra: spazi semplici, senza virgolette intorno. */
export function pulisciNome(nomeDitta: string): string {
  return nomeDitta
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["«»“”„']+|["«»“”„']+$/g, "")
    .trim();
}
