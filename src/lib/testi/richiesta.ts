/**
 * «Testi pronti»: richiesta (validazione), risposta di Claude (schema) e
 * pulizia dei testi prima di mostrarli. Logica pura; la chiamata a Claude
 * sta in src/app/api/testi/route.ts.
 */
import { z } from "zod";
import { LINGUE, MASSIMO_EMOJI, TIPI, TIPI_TESTO, TONI, type Lingua, type ParteTesto, type TipoTesto, type Tono } from "./tipi";

export const LUNGHEZZA_MINIMA_DESCRIZIONE = 10;
export const LUNGHEZZA_MASSIMA_DESCRIZIONE = 1_000;
export const LUNGHEZZA_MASSIMA_NOME = 80;
export const LUNGHEZZA_MASSIMA_LUOGO = 80;
export const LUNGHEZZA_MASSIMA_CLIENTI = 200;

/** Testi fissi di «Testi pronti», in italiano semplice. */
export const MESSAGGI_TESTI = {
  descrizioneMancante: "Scrivi in poche parole cosa fai.",
  descrizioneCorta: "Scrivi qualcosa in più su cosa fai: almeno una frase.",
  descrizioneLunga: `La descrizione è troppo lunga: al massimo ${LUNGHEZZA_MASSIMA_DESCRIZIONE} caratteri.`,
  nomeLungo: `Il nome è troppo lungo: al massimo ${LUNGHEZZA_MASSIMA_NOME} caratteri.`,
  luogoLungo: `Il luogo è troppo lungo: al massimo ${LUNGHEZZA_MASSIMA_LUOGO} caratteri.`,
  clientiLungo: `La descrizione dei clienti è troppo lunga: al massimo ${LUNGHEZZA_MASSIMA_CLIENTI} caratteri.`,
  richiestaNonValida: "La richiesta non è valida.",
  nonAttivo: "Questa funzione non è ancora attiva.",
  troppeRichieste: "Hai già chiesto diversi testi in poco tempo. Riprova tra un'ora.",
  occupato: "In questo momento Bleo non riesce a scrivere. Riprova tra poco.",
  nonRiuscito: "Non sono riuscito a scrivere il testo. Riprova, magari descrivendo meglio cosa fai.",
} as const;

/* ------------------------------------------------------------------ */
/* Richiesta                                                           */
/* ------------------------------------------------------------------ */

/** Campo facoltativo: spazi tolti, vuoto = non indicato. */
function facoltativo(massimo: number, messaggio: string) {
  return z
    .string()
    .trim()
    .max(massimo, { error: messaggio })
    .optional()
    .transform((v) => (v ? v : undefined));
}

/** Corpo della richiesta POST /api/testi. */
export const schemaRichiestaTesti = z.object({
  tipo: z.enum(TIPI_TESTO),
  descrizione: z
    .string({ error: MESSAGGI_TESTI.descrizioneMancante })
    .trim()
    .min(LUNGHEZZA_MINIMA_DESCRIZIONE, { error: MESSAGGI_TESTI.descrizioneCorta })
    .max(LUNGHEZZA_MASSIMA_DESCRIZIONE, { error: MESSAGGI_TESTI.descrizioneLunga }),
  nome: facoltativo(LUNGHEZZA_MASSIMA_NOME, MESSAGGI_TESTI.nomeLungo),
  luogo: facoltativo(LUNGHEZZA_MASSIMA_LUOGO, MESSAGGI_TESTI.luogoLungo),
  clienti: facoltativo(LUNGHEZZA_MASSIMA_CLIENTI, MESSAGGI_TESTI.clientiLungo),
  tono: z.enum(TONI),
  lingua: z.enum(LINGUE).default("it"),
  /** true con «Rifai»: si chiede una versione diversa. */
  rifai: z.boolean().default(false),
});

export type RichiestaTesti = z.infer<typeof schemaRichiestaTesti>;

const CAMPI_FACOLTATIVI = new Set(["nome", "luogo", "clienti"]);

/** Valida il corpo; in caso di errore restituisce un messaggio in italiano da mostrare. */
export function leggiRichiestaTesti(
  corpo: unknown,
): { ok: true; dati: RichiestaTesti } | { ok: false; messaggio: string } {
  const esito = schemaRichiestaTesti.safeParse(corpo);
  if (esito.success) return { ok: true, dati: esito.data };
  const primo = esito.error.issues[0];
  const campo = primo?.path[0];
  // Per i campi facoltativi solo «troppo lungo» ha un messaggio nostro; un tipo sbagliato no.
  if (campo === "descrizione" || (typeof campo === "string" && CAMPI_FACOLTATIVI.has(campo) && primo.code === "too_big")) {
    return { ok: false, messaggio: primo.message };
  }
  return { ok: false, messaggio: MESSAGGI_TESTI.richiestaNonValida };
}

/* ------------------------------------------------------------------ */
/* Risposta del modello                                                */
/* ------------------------------------------------------------------ */

/**
 * Cosa restituisce Claude (structured output): un testo per ogni parte del
 * tipo scelto, nell'ordine. Le lunghezze sono solo nelle istruzioni: i testi
 * troppo lunghi li accorcia pulisciTesti.
 */
export const schemaOutputTesti = z.object({
  testi: z.array(z.object({ titolo: z.string(), testo: z.string() })),
});

export type OutputTesti = z.infer<typeof schemaOutputTesti>;

export type TestoPronto = { titolo: string; testo: string };

/** Emoji (anche composte: tono della pelle, sequenze unite, variante grafica). */
const EMOJI = /\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️|‍\p{Extended_Pictographic})*️?/gu;

export function contaEmoji(testo: string): number {
  return testo.match(EMOJI)?.length ?? 0;
}

/** Tiene solo le prime `massimo` emoji. */
export function limitaEmoji(testo: string, massimo: number): string {
  let viste = 0;
  return testo.replace(EMOJI, (emoji) => (++viste <= massimo ? emoji : ""));
}

/** Spazi e righe in ordine; senza `paragrafi` tutto su una riga. */
function normalizza(testo: string, paragrafi: boolean): string {
  const senzaMarkdown = testo.replace(/\*\*|__/g, "").replace(/\r\n?/g, "\n");
  if (!paragrafi) return senzaMarkdown.replace(/\s+/g, " ").trim();
  return senzaMarkdown
    .split("\n")
    .map((riga) => riga.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Accorcia alla fine di una parola e aggiunge «…» se il testo supera il massimo. */
export function accorcia(testo: string, massimo: number): string {
  if (testo.length <= massimo) return testo;
  const taglio = testo.slice(0, massimo - 1);
  const spazio = taglio.search(/\s\S*$/);
  return `${(spazio > massimo / 2 ? taglio.slice(0, spazio) : taglio).replace(/[\s,;:.]+$/, "")}…`;
}

/** Pulisce un testo secondo le regole della sua parte, del tono e della lingua. */
export function pulisciParte(testo: string, parte: ParteTesto, tono: Tono, lingua: Lingua): string {
  let pulito = normalizza(testo, parte.paragrafi === true);
  // In Svizzera il tedesco si scrive senza «ß».
  if (lingua === "de") pulito = pulito.replace(/ß/g, "ss");
  pulito = limitaEmoji(pulito, parte.emoji && tono === "amichevole" ? MASSIMO_EMOJI : 0);
  pulito = normalizza(pulito, parte.paragrafi === true);
  return accorcia(pulito, parte.massimo);
}

/**
 * Dalla risposta del modello ai testi da mostrare: uno per parte, nell'ordine
 * del tipo, con il titolo deciso da noi (non da Claude). Le parti in più si
 * ignorano, quelle vuote spariscono. Lista vuota = risposta non utilizzabile.
 */
export function pulisciTesti(output: unknown, tipo: TipoTesto, tono: Tono, lingua: Lingua): TestoPronto[] {
  if (!output || typeof output !== "object" || Array.isArray(output)) return [];
  const grezzi = (output as Record<string, unknown>).testi;
  if (!Array.isArray(grezzi)) return [];
  const risultato: TestoPronto[] = [];
  TIPI[tipo].parti.forEach((parte, indice) => {
    const grezzo: unknown = grezzi[indice];
    const testo =
      grezzo && typeof grezzo === "object" ? (grezzo as Record<string, unknown>).testo : undefined;
    if (typeof testo !== "string") return;
    const pulito = pulisciParte(testo, parte, tono, lingua);
    if (pulito) risultato.push({ titolo: parte.titolo, testo: pulito });
  });
  return risultato;
}
