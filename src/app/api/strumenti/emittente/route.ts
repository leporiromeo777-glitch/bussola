import {
  COLONNE_EMITTENTE,
  emittenteDaRiga,
  leggiEmittente,
  rigaEmittente,
  type RigaEmittente,
} from "@/lib/strumenti/account";
import { accediDocumenti, erroreCorpo, erroreDatabase, errore, json, leggiCorpo } from "@/lib/strumenti/server";

/**
 * PUT /api/strumenti/emittente — i tuoi dati per i preventivi e le fatture
 * (nome, indirizzo strutturato, email, telefono, IBAN, IVA) → { emittente }.
 */
export async function PUT(request: Request) {
  const accesso = await accediDocumenti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const letto = await leggiCorpo(request, 10_000);
  if (!letto.ok) return erroreCorpo(letto.status);
  const emittente = leggiEmittente(letto.corpo);
  if (!emittente.ok) return errore(400, emittente.messaggio);

  const { data, error } = await supabase
    .from("emittenti")
    .upsert(rigaEmittente(user.id, emittente.dati, new Date().toISOString()), { onConflict: "user_id" })
    .select(COLONNE_EMITTENTE)
    .single();
  if (error || !data) return erroreDatabase("salvataggio dell'emittente", error);
  return json(200, { emittente: emittenteDaRiga(data as unknown as RigaEmittente) });
}
