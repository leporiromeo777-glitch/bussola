import { oggiZurigo } from "@/lib/conti/importi";
import { NOTE_LETTURA } from "@/lib/conti/lettura";
import { accediConti, errore, json, prenotaLettura, registraRicevuta } from "@/lib/conti/server";
import { MESSAGGI_CONTI, nomeFilePulito } from "@/lib/conti/validazione";
import { creaClientAnthropic } from "@/lib/chat/server";
import {
  CORPO_MASSIMO,
  MESSAGGI_LETTERA,
  PAGINE_MASSIME_PDF,
  leggiRichiestaLettera,
  stimaPaginePdf,
} from "@/lib/lettera/richiesta";
import { controllaLimite } from "@/lib/limiti/server";

// Upload nello Storage più una chiamata a Claude (al massimo 2 tentativi da 25 secondi).
export const maxDuration = 60;

/**
 * POST /api/conti/ricevute — { tipo, dati, nomeFile? } → 201 { movimento } da confermare.
 * `tipo` è image/jpeg, image/png, image/webp o application/pdf; `dati` il
 * file in base64 (senza «data:…;base64,»). Stessi limiti di «Fotografa la
 * lettera». Il file va nello Storage (cartella dell'utente), poi Claude lo
 * legge: il movimento nasce con origine «foto» e stato «da_confermare».
 * - 422 se Claude dice che non è una ricevuta o una fattura (il file si cancella);
 * - 429 con troppe ricevute (per connessione o al giorno per utente);
 * - senza Claude configurato il file si salva lo stesso e la voce resta da compilare.
 */
export async function POST(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errore(415, MESSAGGI_LETTERA.richiestaNonValida);
  }
  const lunghezza = Number(request.headers.get("content-length"));
  if (Number.isFinite(lunghezza) && lunghezza > CORPO_MASSIMO) return errore(413, MESSAGGI_LETTERA.fileGrande);
  let corpo: unknown;
  try {
    const testo = await request.text();
    if (testo.length > CORPO_MASSIMO) return errore(413, MESSAGGI_LETTERA.fileGrande);
    corpo = JSON.parse(testo);
  } catch {
    return errore(400, MESSAGGI_LETTERA.richiestaNonValida);
  }
  const richiesta = leggiRichiestaLettera(corpo);
  if (!richiesta.ok) return errore(richiesta.stato, richiesta.messaggio);
  const nomeFile = nomeFilePulito((corpo as { nomeFile?: unknown }).nomeFile);

  const byte = Buffer.from(richiesta.dati.dati, "base64");
  if (richiesta.dati.tipo === "application/pdf") {
    const pagine = stimaPaginePdf(byte);
    if (pagine !== null && pagine > PAGINE_MASSIME_PDF) return errore(413, MESSAGGI_LETTERA.pdfLungo);
  }

  // Si contano le letture solo se Claude c'è davvero: per connessione e al giorno per utente.
  const anthropic = creaClientAnthropic();
  if (anthropic) {
    if ((await controllaLimite("ricevute")) === "superato") return errore(429, MESSAGGI_CONTI.troppeRichieste);
    const consentita = await prenotaLettura(supabase);
    if (consentita === null) return errore(503, MESSAGGI_CONTI.erroreDatabase);
    if (!consentita) return errore(429, MESSAGGI_CONTI.troppeLetture);
  }

  const esito = await registraRicevuta({
    db: supabase,
    userId: user.id,
    file: { tipo: richiesta.dati.tipo, byte, nome: nomeFile },
    contenuto: anthropic ? { tipo: richiesta.dati.tipo, base64: richiesta.dati.dati } : null,
    notaSenzaLettura: NOTE_LETTURA.compilaTu,
    descrizioneDiRipiego: "",
    origine: "foto",
    oggi: oggiZurigo(),
    anthropic,
    segnale: request.signal,
  });
  if (esito.esito === "non_ricevuta") return errore(422, MESSAGGI_CONTI.nonRicevuta);
  if (esito.esito === "errore") {
    return esito.codice === "54000"
      ? errore(409, "Hai raggiunto il numero massimo di documenti che Bleo può tenere. Scarica i conti ed elimina quelli vecchi.")
      : errore(503, MESSAGGI_CONTI.erroreDatabase);
  }
  return json(201, { movimento: esito.movimento });
}
