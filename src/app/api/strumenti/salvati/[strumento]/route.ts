import {
  COLONNE_STRUMENTO,
  CORPO_STRUMENTO_MASSIMO,
  datiDaContenuto,
  leggiDatiStrumento,
  MESSAGGI_SALVATI,
  rigaStrumento,
  strumentoValido,
  type RigaStrumento,
  type RispostaImportazioneStrumento,
  type RispostaSalvataggio,
  type RispostaStrumento,
} from "@/lib/strumenti/salvati";
import { errore, json, leggiCorpo, vuota } from "@/lib/strumenti/server";
import { accediSalvati, erroreCorpoSalvati, erroreDatabaseSalvati, registraSalvati } from "@/lib/strumenti/server-salvati";

/*
 * Budget del primo anno e business plan di una pagina nell'account: una riga
 * per strumento (`budget` o `business-plan`) nella tabella strumenti_salvati.
 * Con i cookie del sito o `Authorization: Bearer` dell'app.
 */

type Contesto = RouteContext<"/api/strumenti/salvati/[strumento]">;

/** GET → RispostaStrumento: i dati nell'account, o `dati: null` se non ci sono ancora. */
export async function GET(request: Request, ctx: Contesto) {
  const accesso = await accediSalvati(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;
  const { strumento } = await ctx.params;
  if (!strumentoValido(strumento)) return errore(404, MESSAGGI_SALVATI.nonTrovato);

  const { data, error } = await supabase
    .from("strumenti_salvati")
    .select(COLONNE_STRUMENTO)
    .eq("user_id", user.id)
    .eq("strumento", strumento)
    .maybeSingle();
  if (error) return erroreDatabaseSalvati("lettura", error);
  const riga = data as RigaStrumento | null;
  const dati = riga ? datiDaContenuto(strumento, riga.contenuto) : null;
  if (riga && !dati) registraSalvati("contenuto non leggibile", { strumento });
  const risposta: RispostaStrumento<unknown> = { dati, aggiornatoIl: dati && riga ? riga.aggiornato_il : null };
  return json(200, risposta);
}

/** PUT — i dati interi dello strumento → RispostaSalvataggio. Li crea o li sostituisce. */
export async function PUT(request: Request, ctx: Contesto) {
  const accesso = await accediSalvati(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;
  const { strumento } = await ctx.params;
  if (!strumentoValido(strumento)) return errore(404, MESSAGGI_SALVATI.nonTrovato);

  const letto = await leggiCorpo(request, CORPO_STRUMENTO_MASSIMO);
  if (!letto.ok) return erroreCorpoSalvati(letto.status);
  const dati = leggiDatiStrumento(strumento, letto.corpo);
  if (!dati.ok) return errore(400, dati.messaggio);

  const { data, error } = await supabase
    .from("strumenti_salvati")
    .upsert(rigaStrumento(user.id, strumento, dati.dati, new Date().toISOString()), { onConflict: "user_id,strumento" })
    .select("aggiornato_il")
    .single();
  if (error || !data) return erroreDatabaseSalvati("salvataggio", error);
  const risposta: RispostaSalvataggio = { aggiornatoIl: (data as { aggiornato_il: string }).aggiornato_il };
  return json(200, risposta);
}

/**
 * POST — i dati dello strumento salvati nel browser o sul telefono prima
 * dell'accesso → RispostaImportazioneStrumento. Si copiano solo se l'account
 * non ha ancora questo strumento: altrimenti restano quelli dell'account
 * (niente sovrascritture) e la risposta li restituisce.
 */
export async function POST(request: Request, ctx: Contesto) {
  const accesso = await accediSalvati(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;
  const { strumento } = await ctx.params;
  if (!strumentoValido(strumento)) return errore(404, MESSAGGI_SALVATI.nonTrovato);

  const letto = await leggiCorpo(request, CORPO_STRUMENTO_MASSIMO);
  if (!letto.ok) return erroreCorpoSalvati(letto.status);
  const dati = leggiDatiStrumento(strumento, letto.corpo);
  if (!dati.ok) return errore(400, dati.messaggio);

  const adesso = new Date().toISOString();
  const inserite = await supabase
    .from("strumenti_salvati")
    .upsert({ ...rigaStrumento(user.id, strumento, dati.dati, adesso), creato_il: adesso }, {
      onConflict: "user_id,strumento",
      ignoreDuplicates: true,
    })
    .select(COLONNE_STRUMENTO);
  if (inserite.error) return erroreDatabaseSalvati("importazione", inserite.error);
  const nuova = ((inserite.data ?? []) as RigaStrumento[])[0];
  if (nuova) {
    const risposta: RispostaImportazioneStrumento<unknown> = {
      importato: true,
      dati: datiDaContenuto(strumento, nuova.contenuto),
      aggiornatoIl: nuova.aggiornato_il,
    };
    return json(200, risposta);
  }

  // C'era già: si restituisce quello dell'account, senza toccarlo.
  const presente = await supabase
    .from("strumenti_salvati")
    .select(COLONNE_STRUMENTO)
    .eq("user_id", user.id)
    .eq("strumento", strumento)
    .maybeSingle();
  if (presente.error) return erroreDatabaseSalvati("lettura dopo l'importazione", presente.error);
  const riga = presente.data as RigaStrumento | null;
  const risposta: RispostaImportazioneStrumento<unknown> = {
    importato: false,
    dati: riga ? datiDaContenuto(strumento, riga.contenuto) : null,
    aggiornatoIl: riga?.aggiornato_il ?? null,
  };
  return json(200, risposta);
}

/** DELETE → 204 (404 se l'account non aveva questo strumento): «ricomincia da zero». */
export async function DELETE(request: Request, ctx: Contesto) {
  const accesso = await accediSalvati(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;
  const { strumento } = await ctx.params;
  if (!strumentoValido(strumento)) return errore(404, MESSAGGI_SALVATI.nonTrovato);

  const { data, error } = await supabase
    .from("strumenti_salvati")
    .delete()
    .eq("user_id", user.id)
    .eq("strumento", strumento)
    .select("strumento");
  if (error) return erroreDatabaseSalvati("cancellazione", error);
  if (!data || data.length === 0) return errore(404, MESSAGGI_SALVATI.nienteDaCancellare);
  return vuota();
}
