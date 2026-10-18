/**
 * «Cassetto dei documenti»: i documenti importanti dell'attività (decisione
 * della cassa AVS, numero IVA, estratto del registro di commercio, polizze,
 * permesso, contratti, autorizzazioni) in un posto solo, con la data di
 * scadenza. Tipi e costanti condivisi da sito, API e app, senza dipendenze
 * dal browser o da Next.js.
 *
 * Bleo conserva solo una copia comoda: non controlla i documenti e non dice
 * se sono in regola (informazioni generali, non consulenza).
 */
import { TIPI_LETTERA, type TipoLettera } from "@/lib/lettera/richiesta";

/**
 * I tipi di documento, nell'ordine in cui si mostrano. Gli id sono gli stessi
 * del vincolo sulla colonna «tipo» nella migrazione
 * 20261019000004_cassetto_documenti.sql (lo verifica supabase/schema.test.ts).
 */
export const TIPI_DOCUMENTO = [
  { id: "decisione_avs", etichetta: "Decisione della cassa AVS" },
  { id: "numero_iva", etichetta: "Numero IVA" },
  { id: "estratto_rc", etichetta: "Estratto del registro di commercio" },
  { id: "polizza", etichetta: "Polizza d'assicurazione" },
  { id: "permesso", etichetta: "Permesso di soggiorno" },
  { id: "contratto", etichetta: "Contratto" },
  { id: "autorizzazione", etichetta: "Autorizzazione" },
  { id: "altro", etichetta: "Altro" },
] as const;

export type TipoDocumento = (typeof TIPI_DOCUMENTO)[number]["id"];

export const ID_TIPI_DOCUMENTO = TIPI_DOCUMENTO.map((t) => t.id) as [TipoDocumento, ...TipoDocumento[]];

export function eTipoDocumento(valore: unknown): valore is TipoDocumento {
  return typeof valore === "string" && (ID_TIPI_DOCUMENTO as readonly string[]).includes(valore);
}

export function etichettaTipoDocumento(tipo: TipoDocumento): string {
  return TIPI_DOCUMENTO.find((t) => t.id === tipo)?.etichetta ?? "Altro";
}

/** File accettati: foto (già ridotte in JPEG dal sito e dall'app) e PDF, come le ricevute. */
export const TIPI_FILE_CASSETTO = TIPI_LETTERA;
export type TipoFileCassetto = TipoLettera;

export type DocumentoCassetto = {
  id: string;
  titolo: string;
  tipo: TipoDocumento;
  /** Data di scadenza AAAA-MM-GG; null se il documento non scade. */
  scadeIl: string | null;
  nota: string | null;
  file: { tipo: TipoFileCassetto; nome: string | null; byte: number };
  /** Istanti ISO. */
  creatoIl: string;
  aggiornatoIl: string;
};

/** GET /api/documenti */
export type RispostaCassetto = { documenti: DocumentoCassetto[] };
