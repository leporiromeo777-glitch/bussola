import { randomUUID } from "node:crypto";
import { oggiZurigo } from "@/lib/conti/importi";
import { accediConti, corpoJson, errore, json } from "@/lib/conti/server";
import { MESSAGGI_CONTI } from "@/lib/conti/validazione";
import { precompilaFattura, rigaPerVoceAmmessa } from "@/lib/clienti/fattura";
import { intervalloMese } from "@/lib/clienti/ore";
import { clienteDaRiga, COLONNE_CLIENTE, COLONNE_ORE, voceDaRiga, type RigaCliente, type RigaOre } from "@/lib/clienti/righe";
import { erroreOre } from "@/lib/clienti/server";
import type { RispostaFatturaOre } from "@/lib/clienti/tipi";
import { leggiAnnullaFattura, leggiRichiestaFattura, MESSAGGI_ORE } from "@/lib/clienti/validazione";

/**
 * POST /api/conti/ore/fattura — { clienteId, mese: "AAAA-MM", dettaglio: "voci" | "riepilogo" }
 * → RispostaFatturaOre.
 *
 * Segna come fatturate oggi (ora di Zurigo) le ore non ancora fatturate del
 * cliente in quel mese e restituisce i dati per lo strumento fattura, fatti
 * solo con le voci segnate in questa richiesta: due richieste insieme non
 * fatturano due volte la stessa voce (la condizione «non ancora fatturata»
 * sta nella stessa modifica del database).
 */
export async function POST(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const letta = leggiRichiestaFattura(corpo);
  if (!letta.ok) return errore(400, letta.messaggio);
  const { clienteId, mese, dettaglio } = letta.dati;
  const { inizio, fine } = intervalloMese(mese);

  const cliente = await supabase.from("conti_clienti").select(COLONNE_CLIENTE).eq("id", clienteId).maybeSingle();
  if (cliente.error) return erroreOre("lettura del cliente", cliente.error);
  if (!cliente.data) return errore(404, MESSAGGI_ORE.clienteNonTrovato);

  const conteggio = await supabase
    .from("conti_ore")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId)
    .gte("data", inizio)
    .lte("data", fine)
    .is("fatturata_il", null);
  if (conteggio.error) return erroreOre("conteggio delle ore", conteggio.error);
  const quante = conteggio.count ?? 0;
  if (quante === 0) return errore(409, MESSAGGI_ORE.nienteDaFatturare);
  if (dettaglio === "voci" && !rigaPerVoceAmmessa(quante)) return errore(400, MESSAGGI_ORE.troppeVoci);

  const oggi = oggiZurigo();
  const segnate = await supabase
    .from("conti_ore")
    .update({ fatturata_il: oggi, aggiornato_il: new Date().toISOString() })
    .eq("cliente_id", clienteId)
    .gte("data", inizio)
    .lte("data", fine)
    .is("fatturata_il", null)
    .select(COLONNE_ORE)
    .overrideTypes<RigaOre[], { merge: false }>();
  if (segnate.error) return erroreOre("ore segnate come fatturate", segnate.error);
  const voci = (segnate.data ?? []).map(voceDaRiga);
  if (voci.length === 0) return errore(409, MESSAGGI_ORE.nienteDaFatturare);

  const precompilazione = precompilaFattura({
    id: randomUUID(),
    cliente: clienteDaRiga(cliente.data as unknown as RigaCliente),
    voci,
    mese,
    // Se nel frattempo se n'è aggiunta qualcuna oltre il massimo, una riga sola.
    dettaglio: dettaglio === "voci" && rigaPerVoceAmmessa(voci.length) ? "voci" : "riepilogo",
  });
  const risposta: RispostaFatturaOre = { precompilazione, voci: voci.length, fatturataIl: oggi };
  return json(200, risposta);
}

/**
 * DELETE /api/conti/ore/fattura?cliente=…&mese=AAAA-MM&fatturataIl=AAAA-MM-GG
 * → { voci }. Toglie il segno «fatturata» alle ore del cliente in quel mese
 * segnate quel giorno (per esempio se la fattura non è partita).
 */
export async function DELETE(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;

  const letta = leggiAnnullaFattura(new URL(request.url).searchParams);
  if (!letta.ok) return errore(400, letta.messaggio);
  const { clienteId, mese, fatturataIl } = letta.dati;
  const { inizio, fine } = intervalloMese(mese);

  const { data, error } = await supabase
    .from("conti_ore")
    .update({ fatturata_il: null, aggiornato_il: new Date().toISOString() })
    .eq("cliente_id", clienteId)
    .gte("data", inizio)
    .lte("data", fine)
    .eq("fatturata_il", fatturataIl)
    .select("id");
  if (error) return erroreOre("ore non più fatturate", error);
  return json(200, { voci: data?.length ?? 0 });
}
