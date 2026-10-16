import { formattaData } from "./formato";
import { DOMANDE_GRATIS_AL_MESE } from "./quota";
import type { QuotaPubblica } from "./tipi";

/** A chi rivolgersi quando Bleo non ha una fonte verificata. */
export const A_CHI_CHIEDERE =
  "Puoi chiedere a un fiduciario autorizzato, a Fondounimpresa (il servizio del Cantone Ticino per chi si mette in proprio) oppure direttamente all'ufficio competente, per esempio la tua cassa di compensazione AVS, l'Amministrazione federale delle contribuzioni per l'IVA o l'ufficio del registro di commercio del tuo Cantone.";

/** Testi fissi della chat, in italiano semplice. */
export const MESSAGGI = {
  nessunaFonte: `Non ho ancora una fonte verificata su questo, quindi preferisco non risponderti a memoria. ${A_CHI_CHIEDERE}`,
  rifiuto:
    "Su questa domanda non posso aiutarti. Se riguarda l'apertura della tua attività, prova a riformularla in modo più semplice, oppure chiedi a un fiduciario autorizzato.",
  rispostaVuota: `Non sono riuscito a formulare una risposta con le fonti che ho. ${A_CHI_CHIEDERE}`,
  troncata:
    "La risposta è stata interrotta perché era troppo lunga. Prova a fare una domanda più precisa, su un solo tema.",
  modalitaDemo:
    "La chat non è ancora attiva in questa versione di prova: mancano le chiavi di configurazione (Supabase e Claude).",
  nonCollegato: "Per usare la chat devi accedere. Ricevi un link via email, senza password.",
  richiestaNonValida: "La richiesta non è valida.",
  quotaNonVerificabile: "In questo momento non riesco a verificare le tue domande disponibili. Riprova tra poco.",
  ricercaNonRiuscita: "In questo momento non riesco a consultare le fonti. Riprova tra qualche minuto.",
  troppeRichieste: "In questo momento Bleo riceve molte domande. Aspetta un minuto e riprova.",
  configurazioneErrata:
    "La chat non è configurata correttamente (chiave di accesso a Claude non valida). Riprova più tardi.",
  servizioOccupato: "Il servizio che genera le risposte è sovraccarico. Riprova tra qualche minuto.",
  connessione: "Non riesco a collegarmi al servizio che genera le risposte. Riprova tra poco.",
  erroreGenerico: "Qualcosa non ha funzionato nel preparare la risposta. Riprova tra poco.",
  rete: "Non riesco a raggiungere Bleo: controlla la connessione e riprova.",
  rispostaInterrotta: "La risposta si è interrotta a metà. Riprova.",
} as const;

/**
 * Messaggio per la quota gratuita esaurita. Non rimanda a un piano a
 * pagamento: durante la prova non esiste ancora.
 */
export function messaggioQuotaEsaurita(quota: Pick<QuotaPubblica, "limite" | "rinnovo_il">): string {
  return `Hai già usato le ${quota.limite ?? DOMANDE_GRATIS_AL_MESE} domande di questo mese. Durante la prova di Bleo ci sono ${DOMANDE_GRATIS_AL_MESE} domande al mese per ogni persona: ricominciano il ${formattaData(quota.rinnovo_il)}.`;
}
