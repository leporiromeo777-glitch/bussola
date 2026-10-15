import { z } from "zod";
import {
  CAMPO_TRAPPOLA,
  CANTONI,
  LIMITI,
  SITUAZIONI,
  VALORE_CONSENSO,
  type Cantone,
  type CampoModulo,
  type ErroriModulo,
  type Situazione,
  type ValoriModulo,
} from "./opzioni";
import { normalizzaProvenienza } from "./provenienza";

export { CAMPO_TRAPPOLA, CANTONI, LIMITI, SITUAZIONI, VALORE_CONSENSO };
export type { Cantone, CampoModulo, ErroriModulo, Situazione, ValoriModulo };

const VALORI_CANTONE = Object.keys(CANTONI) as [Cantone, ...Cantone[]];
const VALORI_SITUAZIONE = Object.keys(SITUAZIONI) as [Situazione, ...Situazione[]];

const vuotoANull = <T extends string>(valore: T | "") => (valore === "" ? null : valore);

export const schemaIscrizione = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { error: "Scrivi la tua email." })
    .max(LIMITI.email, { error: "Questa email è troppo lunga." })
    .pipe(z.email({ error: "Controlla l'email: sembra incompleta (per esempio nome@esempio.ch)." })),
  nome: z
    .string()
    .transform((v) => v.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .max(LIMITI.nome, { error: `Il nome può avere al massimo ${LIMITI.nome} caratteri.` })
        // Solo un nome: niente cifre, punti, link o frasi.
        .regex(/^[\p{L}\p{M}'’ -]*$/u, { error: "Il nome può contenere solo lettere, spazi, apostrofi e trattini." }),
    )
    .transform(vuotoANull),
  cantone: z
    .enum([...VALORI_CANTONE, ""], { error: "Scegli il Cantone dall'elenco." })
    .transform(vuotoANull),
  situazione: z
    .enum([...VALORI_SITUAZIONE, ""], { error: "Scegli la tua situazione dall'elenco." })
    .transform(vuotoANull),
  consenso: z
    .literal(VALORE_CONSENSO, {
      error: "Per entrare in lista spunta la casella: senza il tuo consenso non possiamo scriverti.",
    })
    .transform(() => true as const),
  provenienza: z.string().transform(normalizzaProvenienza),
});

export type DatiIscrizione = z.output<typeof schemaIscrizione>;
export type RisultatoValidazione =
  | { ok: true; dati: DatiIscrizione }
  | { ok: false; errori: ErroriModulo; valori: ValoriModulo };

function testo(valore: FormDataEntryValue | null): string {
  return typeof valore === "string" ? valore : "";
}

/** Legge i campi grezzi dal modulo (i file e i campi mancanti diventano ""). */
export function leggiModulo(form: FormData) {
  return {
    email: testo(form.get("email")),
    nome: testo(form.get("nome")),
    cantone: testo(form.get("cantone")),
    situazione: testo(form.get("situazione")),
    consenso: testo(form.get("consenso")),
    provenienza: testo(form.get("provenienza")),
  };
}

/** Valida il modulo della lista d'attesa. Email normalizzata: minuscole, senza spazi. */
export function validaIscrizione(form: FormData): RisultatoValidazione {
  const grezzi = leggiModulo(form);
  const esito = schemaIscrizione.safeParse(grezzi);
  if (esito.success) return { ok: true, dati: esito.data };

  const errori: ErroriModulo = {};
  for (const problema of esito.error.issues) {
    const campo = problema.path[0];
    if (typeof campo === "string" && campo !== "provenienza" && !(campo in errori)) {
      errori[campo as CampoModulo] = problema.message;
    }
  }
  return {
    ok: false,
    errori,
    valori: {
      email: grezzi.email.slice(0, LIMITI.email),
      nome: grezzi.nome.slice(0, LIMITI.nome * 2),
      cantone: grezzi.cantone in CANTONI ? grezzi.cantone : "",
      situazione: grezzi.situazione in SITUAZIONI ? grezzi.situazione : "",
      consenso: grezzi.consenso === VALORE_CONSENSO,
    },
  };
}

/** true se il campo trappola è stato compilato: quasi certamente un bot. */
export function trappolaCompilata(form: FormData): boolean {
  return testo(form.get(CAMPO_TRAPPOLA)).trim() !== "";
}

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Token dei link nelle email (UUID). Accetta il valore di searchParams o di
 * FormData e restituisce il token in minuscolo, oppure null se il formato
 * non è valido: così non si interroga il database con valori a caso.
 */
export function leggiToken(valore: unknown): string | null {
  const grezzo = Array.isArray(valore) ? valore[0] : valore;
  if (typeof grezzo !== "string") return null;
  const token = grezzo.trim().toLowerCase();
  return FORMATO_UUID.test(token) ? token : null;
}
