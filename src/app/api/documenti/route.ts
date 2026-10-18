import { DOCUMENTI_MASSIMI } from "@/lib/cassetto/limiti";
import { accediCassetto, erroreDatabase, errore, json, salvaDocumento } from "@/lib/cassetto/server";
import type { RispostaCassetto } from "@/lib/cassetto/tipi";
import {
  COLONNE_DOCUMENTO,
  MESSAGGI_CASSETTO,
  documentoDaRiga,
  leggiNuovoDocumento,
  type RigaDocumento,
} from "@/lib/cassetto/validazione";
import { CORPO_MASSIMO, MESSAGGI_LETTERA } from "@/lib/lettera/richiesta";
import { richiestaConsentita } from "@/lib/limiti/server";

// Un file fino a 3,5 MB da mettere nello Storage.
export const maxDuration = 30;

/** GET /api/documenti → RispostaCassetto: tutti i documenti dell'utente (al massimo DOCUMENTI_MASSIMI). */
export async function GET(request: Request) {
  const accesso = await accediCassetto(request);
  if (!accesso.ok) return accesso.risposta;
  const { data, error } = await accesso.supabase
    .from("cassetto_documenti")
    .select(COLONNE_DOCUMENTO)
    .order("creato_il", { ascending: false })
    .limit(DOCUMENTI_MASSIMI)
    .overrideTypes<RigaDocumento[], { merge: false }>();
  if (error) return erroreDatabase("lettura dei documenti", error);
  const risposta: RispostaCassetto = { documenti: (data ?? []).map(documentoDaRiga) };
  return json(200, risposta);
}

/**
 * POST /api/documenti — { titolo, tipo, scadeIl?, nota?, file: { tipo, dati, nomeFile? } }
 * → 201 { documento }. `file.tipo` è image/jpeg, image/png, image/webp o
 * application/pdf; `file.dati` il file in base64 (senza «data:…;base64,»).
 * Stessi pesi massimi delle ricevute. Il file va nella cartella dell'utente
 * del bucket privato «cassetto», con un nome casuale.
 * - 409 con DOCUMENTI_MASSIMI documenti già salvati;
 * - 429 con troppi caricamenti dalla stessa connessione.
 */
export async function POST(request: Request) {
  const accesso = await accediCassetto(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errore(415, MESSAGGI_CASSETTO.richiestaNonValida);
  }
  const lunghezza = Number(request.headers.get("content-length"));
  if (Number.isFinite(lunghezza) && lunghezza > CORPO_MASSIMO) return errore(413, MESSAGGI_LETTERA.fileGrande);
  let corpo: unknown;
  try {
    const testo = await request.text();
    if (testo.length > CORPO_MASSIMO) return errore(413, MESSAGGI_LETTERA.fileGrande);
    corpo = JSON.parse(testo);
  } catch {
    return errore(400, MESSAGGI_CASSETTO.richiestaNonValida);
  }
  const nuovo = leggiNuovoDocumento(corpo);
  if (!nuovo.ok) return errore(nuovo.stato, nuovo.messaggio);

  if (!(await richiestaConsentita("cassetto"))) return errore(429, MESSAGGI_CASSETTO.troppeRichieste);

  // Prima di caricare il file: con il cassetto pieno non serve mandarlo allo Storage.
  const conteggio = await supabase.from("cassetto_documenti").select("id", { count: "exact", head: true });
  if (conteggio.error) return erroreDatabase("conteggio dei documenti", conteggio.error);
  if ((conteggio.count ?? 0) >= DOCUMENTI_MASSIMI) return errore(409, MESSAGGI_CASSETTO.troppi);

  const esito = await salvaDocumento(supabase, user.id, nuovo.dati);
  if (!esito.ok) {
    return esito.codice === "54000" ? errore(409, MESSAGGI_CASSETTO.troppi) : errore(503, MESSAGGI_CASSETTO.erroreDatabase);
  }
  return json(201, { documento: esito.documento });
}
