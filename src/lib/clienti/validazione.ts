/**
 * «Clienti e ore»: controllo dei corpi delle richieste alle API (zod).
 * Logica pura: la usano le route in src/app/api/conti/clienti e
 * src/app/api/conti/ore. I messaggi d'errore sono in italiano semplice,
 * pronti da mostrare.
 */
import { z } from "zod";
import { dataIsoValida, haDueDecimali } from "@/lib/conti/importi";
import { idValido } from "@/lib/conti/validazione";
import { caratteriNonAmmessi, LUNGHEZZE_INDIRIZZO_QR, pulisciTestoQr, type CampoIndirizzo } from "@/lib/strumenti/qr";
import { LUNGHEZZE_ORE, MINUTI_MASSIMI, TARIFFA_MASSIMA } from "./limiti";
import { meseValido } from "./ore";
import type { DettaglioFattura, Mese } from "./tipi";

export const MESSAGGI_ORE = {
  richiestaNonValida: "La richiesta non è valida. Ricarica la pagina e riprova.",
  nome: "Scrivi il nome del cliente.",
  paese: "Scrivi il paese con il codice di 2 lettere, per esempio CH o IT.",
  email: "L'email non sembra giusta: controlla, oppure lasciala vuota.",
  tariffa: "Scrivi la tariffa oraria in franchi, con al massimo due decimali (per esempio 80 o 92.50).",
  cliente: "Scegli il cliente.",
  clienteNonTrovato: "Questo cliente non c'è più. Ricarica la pagina.",
  data: "Scrivi una data valida.",
  durata: "Scrivi quanto hai lavorato: almeno 1 minuto, al massimo 24 ore.",
  descrizione: "La descrizione è troppo lunga: al massimo 200 caratteri.",
  mese: "Scegli un mese valido.",
  modificaVuota: "Non c'è niente da cambiare.",
  giaFatturata: "Questa voce è già in una fattura. Se non l'hai mandata, togli prima il segno «fatturata».",
  nienteDaFatturare: "Per questo cliente non ci sono ore da fatturare in questo mese.",
  troppeVoci:
    "Sono troppe voci per una riga ciascuna nella fattura. Scegli «una riga sola con il totale delle ore».",
  nonTrovato: "Questa voce non c'è più. Ricarica la pagina.",
} as const;

const NOMI_CAMPI: Record<CampoIndirizzo, string> = {
  nome: "Il nome",
  via: "La via",
  numero: "Il numero civico",
  npa: "Il NPA",
  localita: "La località",
  paese: "Il paese",
};

type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string };

function esito<T>(risultato: { success: true; data: T } | { success: false; error: z.ZodError }): Esito<T> {
  if (risultato.success) return { ok: true, dati: risultato.data };
  return { ok: false, messaggio: risultato.error.issues[0]?.message ?? MESSAGGI_ORE.richiestaNonValida };
}

/* ------------------------------------------------------------------ */
/* Clienti                                                             */
/* ------------------------------------------------------------------ */

/**
 * Un campo dell'indirizzo: ripulito come per la QR-fattura (’ → ', – → -),
 * con la lunghezza massima e solo i caratteri che la QR-fattura accetta.
 */
function campoIndirizzo(campo: Exclude<CampoIndirizzo, "paese">) {
  const massimo = LUNGHEZZE_INDIRIZZO_QR[campo];
  return z
    .string({ message: MESSAGGI_ORE.richiestaNonValida })
    .transform((v) => pulisciTestoQr(v).replace(/\s+/g, " ").trim())
    .refine((v) => v.length <= massimo, { message: `${NOMI_CAMPI[campo]} può avere al massimo ${massimo} caratteri.` })
    .refine((v) => caratteriNonAmmessi(v).length === 0, {
      message: `${NOMI_CAMPI[campo]} contiene un carattere che la QR-fattura non accetta.`,
    });
}

const nome = campoIndirizzo("nome").refine((v) => v.length > 0, { message: MESSAGGI_ORE.nome });

const paese = z
  .string({ message: MESSAGGI_ORE.paese })
  .transform((v) => v.trim().toUpperCase())
  .refine((v) => /^[A-Z]{2}$/.test(v), { message: MESSAGGI_ORE.paese });

/** Come il vincolo del database: qualcosa@dominio.tld, senza spazi. */
export function emailValida(valore: string): boolean {
  return valore.length <= LUNGHEZZE_ORE.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valore);
}

/** Email facoltativa: vuota o assente → null. */
const email = z
  .string({ message: MESSAGGI_ORE.email })
  .transform((v) => v.trim())
  .refine((v) => v === "" || emailValida(v), { message: MESSAGGI_ORE.email })
  .nullable()
  .transform((v) => v || null);

/** Tariffa oraria facoltativa in franchi; null = nessuna. */
const tariffa = z
  .number({ message: MESSAGGI_ORE.tariffa })
  .min(0, { message: MESSAGGI_ORE.tariffa })
  .max(TARIFFA_MASSIMA, { message: MESSAGGI_ORE.tariffa })
  .refine(haDueDecimali, { message: MESSAGGI_ORE.tariffa })
  .nullable();

const campiCliente = {
  nome,
  via: campoIndirizzo("via"),
  numero: campoIndirizzo("numero"),
  npa: campoIndirizzo("npa"),
  localita: campoIndirizzo("localita"),
  paese,
  email,
  tariffa,
};

export type DatiCliente = {
  nome: string;
  via: string;
  numero: string;
  npa: string;
  localita: string;
  paese: string;
  email: string | null;
  tariffa: number | null;
};

export const schemaNuovoCliente = z
  .object({
    nome: campiCliente.nome,
    via: campiCliente.via.optional().transform((v) => v ?? ""),
    numero: campiCliente.numero.optional().transform((v) => v ?? ""),
    npa: campiCliente.npa.optional().transform((v) => v ?? ""),
    localita: campiCliente.localita.optional().transform((v) => v ?? ""),
    paese: campiCliente.paese.optional().transform((v) => v ?? "CH"),
    email: campiCliente.email.optional().transform((v) => v ?? null),
    tariffa: campiCliente.tariffa.optional().transform((v) => v ?? null),
  })
  .strict();

/** POST /api/conti/clienti */
export function leggiNuovoCliente(corpo: unknown): Esito<DatiCliente> {
  return esito(schemaNuovoCliente.safeParse(corpo));
}

export const schemaModificaCliente = z.object(campiCliente).partial().strict();

/** PATCH /api/conti/clienti/[id]: almeno un campo. */
export function leggiModificaCliente(corpo: unknown): Esito<Partial<DatiCliente>> {
  const letto = esito(schemaModificaCliente.safeParse(corpo));
  if (letto.ok && Object.keys(letto.dati).length === 0) return { ok: false, messaggio: MESSAGGI_ORE.modificaVuota };
  return letto;
}

/* ------------------------------------------------------------------ */
/* Ore                                                                 */
/* ------------------------------------------------------------------ */

const clienteId = z.string({ message: MESSAGGI_ORE.cliente }).refine(idValido, { message: MESSAGGI_ORE.cliente });

const data = z.string({ message: MESSAGGI_ORE.data }).refine(dataIsoValida, { message: MESSAGGI_ORE.data });

const minuti = z
  .number({ message: MESSAGGI_ORE.durata })
  .int({ message: MESSAGGI_ORE.durata })
  .min(1, { message: MESSAGGI_ORE.durata })
  .max(MINUTI_MASSIMI, { message: MESSAGGI_ORE.durata });

const descrizione = z
  .string({ message: MESSAGGI_ORE.descrizione })
  .transform((v) => v.replace(/\s+/g, " ").trim())
  .refine((v) => v.length <= LUNGHEZZE_ORE.descrizione, { message: MESSAGGI_ORE.descrizione });

export type DatiVoce = {
  clienteId: string;
  data: string;
  minuti: number;
  descrizione: string;
  tariffa: number | null;
};

export const schemaNuovaVoce = z
  .object({
    clienteId,
    data,
    minuti,
    descrizione: descrizione.optional().transform((v) => v ?? ""),
    tariffa: tariffa.optional().transform((v) => v ?? null),
  })
  .strict();

/** POST /api/conti/ore */
export function leggiNuovaVoce(corpo: unknown): Esito<DatiVoce> {
  return esito(schemaNuovaVoce.safeParse(corpo));
}

export type ModificaVoce = Partial<DatiVoce> & { fatturataIl?: string | null };

export const schemaModificaVoce = z
  .object({ clienteId, data, minuti, descrizione, tariffa, fatturataIl: data.nullable() })
  .partial()
  .strict();

/** PATCH /api/conti/ore/[id]: almeno un campo. */
export function leggiModificaVoce(corpo: unknown): Esito<ModificaVoce> {
  const letto = esito(schemaModificaVoce.safeParse(corpo));
  if (letto.ok && Object.keys(letto.dati).length === 0) return { ok: false, messaggio: MESSAGGI_ORE.modificaVuota };
  return letto;
}

/** Una modifica a una voce già fatturata: si può solo togliere (o cambiare) il segno «fatturata». */
export function modificaAmmessaSuFatturata(modifica: ModificaVoce): boolean {
  return Object.keys(modifica).every((campo) => campo === "fatturataIl");
}

/* ------------------------------------------------------------------ */
/* Mese e fattura                                                      */
/* ------------------------------------------------------------------ */

/** Il mese del parametro ?mese=AAAA-MM; senza parametro vale `predefinito`. */
export function leggiMese(valore: string | null, predefinito: Mese): Esito<Mese> {
  if (valore === null) return { ok: true, dati: predefinito };
  return meseValido(valore) ? { ok: true, dati: valore } : { ok: false, messaggio: MESSAGGI_ORE.mese };
}

export const schemaRichiestaFattura = z
  .object({
    clienteId,
    mese: z.string({ message: MESSAGGI_ORE.mese }).refine(meseValido, { message: MESSAGGI_ORE.mese }),
    dettaglio: z.enum(["voci", "riepilogo"], { message: MESSAGGI_ORE.richiestaNonValida }),
  })
  .strict();

/** POST /api/conti/ore/fattura */
export function leggiRichiestaFattura(corpo: unknown): Esito<{ clienteId: string; mese: Mese; dettaglio: DettaglioFattura }> {
  return esito(schemaRichiestaFattura.safeParse(corpo));
}

/** DELETE /api/conti/ore/fattura?cliente=…&mese=…&fatturataIl=… (togli il segno «fatturata»). */
export function leggiAnnullaFattura(
  parametri: URLSearchParams,
): Esito<{ clienteId: string; mese: Mese; fatturataIl: string }> {
  const cliente = parametri.get("cliente");
  const mese = parametri.get("mese");
  const fatturataIl = parametri.get("fatturataIl");
  if (!idValido(cliente)) return { ok: false, messaggio: MESSAGGI_ORE.cliente };
  if (!meseValido(mese)) return { ok: false, messaggio: MESSAGGI_ORE.mese };
  if (!dataIsoValida(fatturataIl)) return { ok: false, messaggio: MESSAGGI_ORE.data };
  return { ok: true, dati: { clienteId: cliente, mese, fatturataIl } };
}
