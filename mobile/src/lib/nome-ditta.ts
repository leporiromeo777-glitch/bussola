/**
 * «Nome della ditta» nell'app: le stesse API del sito (/api/nome-ditta per
 * le proposte di Bleo, /api/nome-ditta/verifica per il registro di
 * commercio), con gli stessi controlli e limiti. Niente si salva: proposte
 * e controlli restano nella schermata finché non la chiudi.
 */
import type { RichiestaNomi } from "@/lib/nome-ditta/proposte";
import { leggiRispostaNomi, leggiRispostaVerifica, type EsitoProposte } from "@/lib/nome-ditta/risposta";
import type { EsitoRegistro } from "@/lib/nome-ditta/zefix";
import { MESSAGGIO_LENTO, MESSAGGIO_SENZA_CONNESSIONE, inviaAlSito, strumentoAttivo } from "./richiesta-sito";

/** Il sito smette dopo 60 secondi (Claude e poi Zefix): qui un po' di margine per la rete del telefono. */
const TEMPO_PROPOSTE_MS = 75_000;
/** La verifica su Zefix dura al massimo 15 secondi sul sito. */
const TEMPO_VERIFICA_MS = 20_000;

type Annullata = { ok: false; annullata: true };

/** Le proposte di nomi sono attive sul sito? null se non si sa. */
export function propostePronte(): Promise<boolean | null> {
  return strumentoAttivo("/api/nome-ditta");
}

/** Chiede a Bleo da 6 a 8 nomi con il cognome, ognuno già cercato su Zefix. */
export async function proponiNomi(richiesta: RichiestaNomi, segnale?: AbortSignal): Promise<EsitoProposte | Annullata> {
  const risposta = await inviaAlSito("/api/nome-ditta", richiesta, { segnale, tempoMassimoMs: TEMPO_PROPOSTE_MS });
  if (risposta.ok) return leggiRispostaNomi(risposta.stato, risposta.corpo);
  if (risposta.motivo === "annullata") return { ok: false, annullata: true };
  return { ok: false, messaggio: risposta.motivo === "tempo" ? MESSAGGIO_LENTO : MESSAGGIO_SENZA_CONNESSIONE, stato: 0 };
}

/** Cerca nel registro di commercio un nome scritto da te (senza Claude). */
export async function verificaNome(
  nome: string,
  segnale?: AbortSignal,
): Promise<{ registro: EsitoRegistro; messaggio: string | null } | Annullata> {
  const risposta = await inviaAlSito("/api/nome-ditta/verifica", { nome }, { segnale, tempoMassimoMs: TEMPO_VERIFICA_MS });
  if (risposta.ok) return leggiRispostaVerifica(risposta.stato, risposta.corpo);
  if (risposta.motivo === "annullata") return { ok: false, annullata: true };
  return {
    registro: { stato: "non_disponibile" },
    messaggio: risposta.motivo === "tempo" ? MESSAGGIO_LENTO : MESSAGGIO_SENZA_CONNESSIONE,
  };
}
