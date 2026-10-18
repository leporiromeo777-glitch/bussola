import { accediCassetto, cancellaDocumentoCassetto, corpoJson, erroreDatabase, errore, json, vuota } from "@/lib/cassetto/server";
import {
  COLONNE_DOCUMENTO,
  MESSAGGI_CASSETTO,
  aggiornamentoDocumento,
  documentoDaRiga,
  leggiModificaDocumento,
  type RigaDocumento,
} from "@/lib/cassetto/validazione";
import { idValido } from "@/lib/conti/validazione";

/** PATCH /api/documenti/[id] — uno o più tra { titolo, tipo, scadeIl, nota } → { documento }. Il file non cambia. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/documenti/[id]">) {
  const accesso = await accediCassetto(request);
  if (!accesso.ok) return accesso.risposta;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CASSETTO.nonTrovato);

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CASSETTO.richiestaNonValida);
  const modifica = leggiModificaDocumento(corpo);
  if (!modifica.ok) return errore(400, modifica.messaggio);

  const { data, error } = await accesso.supabase
    .from("cassetto_documenti")
    .update(aggiornamentoDocumento(modifica.dati, new Date().toISOString()))
    .eq("id", id)
    .select(COLONNE_DOCUMENTO)
    .maybeSingle();
  if (error) return erroreDatabase("modifica del documento", error);
  if (!data) return errore(404, MESSAGGI_CASSETTO.nonTrovato);
  return json(200, { documento: documentoDaRiga(data as unknown as RigaDocumento) });
}

/** DELETE /api/documenti/[id] → 204: cancella il file dallo Storage e poi la riga. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/documenti/[id]">) {
  const accesso = await accediCassetto(request);
  if (!accesso.ok) return accesso.risposta;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CASSETTO.nonTrovato);

  const esito = await cancellaDocumentoCassetto(accesso.supabase, id);
  if (esito === "non_trovato") return errore(404, MESSAGGI_CASSETTO.nonTrovato);
  if (esito === "errore") return errore(503, MESSAGGI_CASSETTO.eliminazioneNonRiuscita);
  return vuota();
}
