import type { BetaContentBlockParam, BetaMessage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { interpretaRisposta } from "./citazioni";
import { raggruppaPerFonte, type FrammentoTrovato } from "./frammenti";
import { MESSAGGI } from "./messaggi";
import { ISTRUZIONI_SISTEMA, costruisciContenuto } from "./prompt";
import type { EventoChat, QuotaPubblica, ScambioPrecedente } from "./tipi";

/** Quello che si chiede al modello: istruzioni fisse e contenuto del messaggio. */
export type RichiestaModello = { istruzioni: string; contenuto: BetaContentBlockParam[] };

/** Risposta del modello in streaming: i pezzi di testo e poi il messaggio completo. */
export type FlussoModello = {
  testi(): AsyncIterable<string>;
  messaggioFinale(): Promise<Pick<BetaMessage, "stop_reason" | "content">>;
};

/** Registro di una domanda in public.domande_chat. */
export type RegistroDomanda = { domanda: string; fonti_citate: string[]; senza_risposta: boolean };

/** Dipendenze esterne della chat: si sostituiscono nei test. */
export type DipendenzeChat = {
  cerca(testo: string): Promise<FrammentoTrovato[]>;
  genera(richiesta: RichiestaModello): FlussoModello;
  salva(registro: RegistroDomanda): Promise<void>;
  /** Messaggio per l'utente per un errore del modello; null se la richiesta è stata interrotta. */
  descriviErrore(errore: unknown): string | null;
  registraErrore(contesto: string, errore: unknown): void;
};

export type DomandaChat = {
  domanda: string;
  cronologia: ScambioPrecedente[];
  /** Quota da mostrare dopo la risposta (la domanda è già contata). */
  quotaDopo?: QuotaPubblica;
};

/**
 * Risponde a una domanda: cerca i frammenti delle fonti, e solo se ne trova
 * chiede a Claude una risposta con citazioni; trasmette il testo man mano e
 * alla fine la risposta con le fonti. Registra ogni domanda a cui risponde.
 */
export async function* rispondi(dip: DipendenzeChat, input: DomandaChat): AsyncGenerator<EventoChat, void, undefined> {
  const domanda = input.domanda.trim();

  let trovati: FrammentoTrovato[];
  try {
    trovati = await dip.cerca(domanda);
    const ultima = input.cronologia.at(-1);
    // Domanda di seguito ("e nei Grigioni?"): se da sola non trova nulla, si unisce alla precedente.
    if (trovati.length === 0 && ultima) trovati = await dip.cerca(`${ultima.domanda} ${domanda}`);
  } catch (errore) {
    dip.registraErrore("ricerca nelle fonti", errore);
    yield { t: "errore", messaggio: MESSAGGI.ricercaNonRiuscita };
    return;
  }

  const frammenti = raggruppaPerFonte(trovati);
  if (frammenti.length === 0) {
    // Nessuna fonte: niente chiamata a Claude, risposta fissa.
    await salvaSenzaBloccare(dip, { domanda, fonti_citate: [], senza_risposta: true });
    yield {
      t: "fine",
      risposta: [{ testo: MESSAGGI.nessunaFonte, citazioni: [] }],
      fonti: [],
      senza_risposta: true,
      ...(input.quotaDopo ? { quota: input.quotaDopo } : {}),
    };
    return;
  }

  let finale: Pick<BetaMessage, "stop_reason" | "content">;
  try {
    const flusso = dip.genera({
      istruzioni: ISTRUZIONI_SISTEMA,
      contenuto: costruisciContenuto(domanda, input.cronologia, frammenti),
    });
    for await (const pezzo of flusso.testi()) {
      if (pezzo) yield { t: "testo", d: pezzo };
    }
    finale = await flusso.messaggioFinale();
  } catch (errore) {
    const messaggio = dip.descriviErrore(errore);
    if (messaggio === null) return;
    dip.registraErrore("risposta di Claude", errore);
    yield { t: "errore", messaggio };
    return;
  }

  const esito = interpretaRisposta(finale, frammenti);
  await salvaSenzaBloccare(dip, {
    domanda,
    fonti_citate: esito.fonti.map((f) => f.fonte_id),
    senza_risposta: esito.senza_risposta,
  });
  yield { t: "fine", ...esito, ...(input.quotaDopo ? { quota: input.quotaDopo } : {}) };
}

/** Il registro serve alla quota e a trovare le fonti mancanti, ma non deve bloccare la risposta. */
async function salvaSenzaBloccare(dip: DipendenzeChat, registro: RegistroDomanda) {
  try {
    await dip.salva(registro);
  } catch (errore) {
    dip.registraErrore("registro della domanda", errore);
  }
}
