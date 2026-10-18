/**
 * «Cassetto dei documenti»: controllo dei corpi delle richieste alle API
 * (zod) e passaggio dalle righe del database ai tipi delle API. Logica pura.
 * I messaggi d'errore sono in italiano semplice, pronti da mostrare.
 */
import { z } from "zod";
import { dataIsoValida } from "@/lib/percorso/calendario";
import { MESSAGGI_LETTERA, leggiRichiestaLettera, type TipoLettera } from "@/lib/lettera/richiesta";
import { DOCUMENTI_MASSIMI, LUNGHEZZE_CASSETTO, SCADENZA_MASSIMA, SCADENZA_MINIMA } from "./limiti";
import { ID_TIPI_DOCUMENTO, type DocumentoCassetto, type TipoDocumento, type TipoFileCassetto } from "./tipi";

export const MESSAGGI_CASSETTO = {
  richiestaNonValida: "La richiesta non è valida. Ricarica la pagina e riprova.",
  nonCollegato: "Accedi per vedere i tuoi documenti.",
  nonAttivo: "Il cassetto dei documenti non è ancora attivo.",
  erroreDatabase: "Non riesco a salvare in questo momento. Riprova tra poco.",
  nonTrovato: "Questo documento non c'è più. Ricarica la pagina.",
  titolo: "Scrivi un nome per il documento, per esempio «Polizza RC».",
  titoloLungo: `Il nome è troppo lungo: al massimo ${LUNGHEZZE_CASSETTO.titolo} caratteri.`,
  tipo: "Scegli che tipo di documento è.",
  scadenza: "Scrivi una data di scadenza valida, oppure lasciala vuota se il documento non scade.",
  nota: `La nota è troppo lunga: al massimo ${LUNGHEZZE_CASSETTO.nota} caratteri.`,
  fileMancante: "Scegli una foto o un PDF del documento.",
  modificaVuota: "Non c'è niente da cambiare.",
  troppi: `Nel cassetto ci sono già ${DOCUMENTI_MASSIMI} documenti, il massimo: elimina quelli che non ti servono più.`,
  troppeRichieste: "Hai caricato diversi documenti in poco tempo. Riprova tra un'ora.",
  documentoNonDisponibile: "Non riesco ad aprire il documento in questo momento. Riprova tra poco.",
  eliminazioneNonRiuscita: "Non riesco a eliminare il documento in questo momento. Riprova tra poco.",
} as const;

type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string };

const titolo = z
  .string({ message: MESSAGGI_CASSETTO.titolo })
  .trim()
  .min(1, { message: MESSAGGI_CASSETTO.titolo })
  .max(LUNGHEZZE_CASSETTO.titolo, { message: MESSAGGI_CASSETTO.titoloLungo });

const tipo = z.enum(ID_TIPI_DOCUMENTO, { message: MESSAGGI_CASSETTO.tipo });

/** Data di scadenza AAAA-MM-GG tra SCADENZA_MINIMA e SCADENZA_MASSIMA (anche passata: un documento già scaduto). */
const scadenza = z
  .string({ message: MESSAGGI_CASSETTO.scadenza })
  .refine((v) => dataIsoValida(v) && v >= SCADENZA_MINIMA && v <= SCADENZA_MASSIMA, {
    message: MESSAGGI_CASSETTO.scadenza,
  });

const nota = z.string({ message: MESSAGGI_CASSETTO.nota }).trim().max(LUNGHEZZE_CASSETTO.nota, { message: MESSAGGI_CASSETTO.nota });

function primoMessaggio(errore: z.ZodError): string {
  return errore.issues[0]?.message ?? MESSAGGI_CASSETTO.richiestaNonValida;
}

/** Nome del file facoltativo: senza caratteri di controllo né barre, accorciato. */
export function nomeFileCassetto(valore: unknown): string | null {
  if (typeof valore !== "string") return null;
  const pulito = valore
    .replace(/[\u0000-\u001f\u007f/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LUNGHEZZE_CASSETTO.nomeFile);
  return pulito || null;
}

/* ------------------------------------------------------------------ */
/* Nuovo documento                                                     */
/* ------------------------------------------------------------------ */

export const schemaNuovoDocumento = z
  .object({
    titolo,
    tipo,
    scadeIl: scadenza.nullable().optional(),
    nota: nota.nullable().optional(),
    file: z
      .object(
        {
          tipo: z.string(),
          dati: z.string(),
          nomeFile: z.string().nullable().optional(),
        },
        { message: MESSAGGI_CASSETTO.fileMancante },
      )
      .strict(),
  })
  .strict();

export type NuovoDocumento = {
  titolo: string;
  tipo: TipoDocumento;
  scadeIl: string | null;
  nota: string | null;
  file: { tipo: TipoLettera; dati: string; byte: number; nome: string | null };
};

export type EsitoNuovoDocumento =
  | { ok: true; dati: NuovoDocumento }
  | { ok: false; stato: 400 | 413 | 415; messaggio: string };

/**
 * POST /api/documenti — { titolo, tipo, scadeIl?, nota?, file: { tipo, dati, nomeFile? } }.
 * Il file si controlla come le ricevute (leggiRichiestaLettera): tipo,
 * base64, peso e primi byte che corrispondono al tipo dichiarato.
 */
export function leggiNuovoDocumento(corpo: unknown): EsitoNuovoDocumento {
  const letto = schemaNuovoDocumento.safeParse(corpo);
  if (!letto.success) {
    const problema = letto.error.issues[0];
    const campo = problema?.path[0];
    if (campo === "file") return { ok: false, stato: 400, messaggio: MESSAGGI_CASSETTO.fileMancante };
    return { ok: false, stato: 400, messaggio: primoMessaggio(letto.error) };
  }
  const file = leggiRichiestaLettera({ tipo: letto.data.file.tipo, dati: letto.data.file.dati });
  if (!file.ok) {
    return {
      ok: false,
      stato: file.stato,
      messaggio: file.messaggio === MESSAGGI_LETTERA.fileMancante ? MESSAGGI_CASSETTO.fileMancante : file.messaggio,
    };
  }
  return {
    ok: true,
    dati: {
      titolo: letto.data.titolo,
      tipo: letto.data.tipo,
      scadeIl: letto.data.scadeIl ?? null,
      nota: letto.data.nota ? letto.data.nota : null,
      file: { ...file.dati, nome: nomeFileCassetto(letto.data.file.nomeFile) },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Modifica                                                            */
/* ------------------------------------------------------------------ */

export const schemaModificaDocumento = z
  .object({
    titolo: titolo.optional(),
    tipo: tipo.optional(),
    scadeIl: scadenza.nullable().optional(),
    nota: nota.nullable().optional(),
  })
  .strict();

export type ModificaDocumento = Partial<{
  titolo: string;
  tipo: TipoDocumento;
  scadeIl: string | null;
  nota: string | null;
}>;

/** PATCH /api/documenti/[id]: almeno un campo. Una nota vuota diventa null. */
export function leggiModificaDocumento(corpo: unknown): Esito<ModificaDocumento> {
  const letto = schemaModificaDocumento.safeParse(corpo);
  if (!letto.success) return { ok: false, messaggio: primoMessaggio(letto.error) };
  const modifica: ModificaDocumento = {};
  if (letto.data.titolo !== undefined) modifica.titolo = letto.data.titolo;
  if (letto.data.tipo !== undefined) modifica.tipo = letto.data.tipo;
  if (letto.data.scadeIl !== undefined) modifica.scadeIl = letto.data.scadeIl;
  if (letto.data.nota !== undefined) modifica.nota = letto.data.nota ? letto.data.nota : null;
  if (Object.keys(modifica).length === 0) return { ok: false, messaggio: MESSAGGI_CASSETTO.modificaVuota };
  return { ok: true, dati: modifica };
}

/* ------------------------------------------------------------------ */
/* Righe del database                                                  */
/* ------------------------------------------------------------------ */

export const COLONNE_DOCUMENTO = "id, titolo, tipo, scade_il, nota, tipo_file, nome_file, byte, creato_il, aggiornato_il";

export type RigaDocumento = {
  id: string;
  titolo: string;
  tipo: TipoDocumento;
  scade_il: string | null;
  nota: string | null;
  tipo_file: TipoFileCassetto;
  nome_file: string | null;
  byte: number | string;
  creato_il: string;
  aggiornato_il: string;
};

export function documentoDaRiga(r: RigaDocumento): DocumentoCassetto {
  return {
    id: r.id,
    titolo: r.titolo,
    tipo: r.tipo,
    scadeIl: r.scade_il ? r.scade_il.slice(0, 10) : null,
    nota: r.nota,
    file: { tipo: r.tipo_file, nome: r.nome_file, byte: Number(r.byte) },
    creatoIl: r.creato_il,
    aggiornatoIl: r.aggiornato_il,
  };
}

/** Le colonne da aggiornare per una modifica (snake_case), con l'ora della modifica. */
export function aggiornamentoDocumento(modifica: ModificaDocumento, adesso: string): Record<string, string | null> {
  const riga: Record<string, string | null> = { aggiornato_il: adesso };
  if (modifica.titolo !== undefined) riga.titolo = modifica.titolo;
  if (modifica.tipo !== undefined) riga.tipo = modifica.tipo;
  if (modifica.scadeIl !== undefined) riga.scade_il = modifica.scadeIl;
  if (modifica.nota !== undefined) riga.nota = modifica.nota;
  return riga;
}
