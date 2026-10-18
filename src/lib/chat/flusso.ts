import type { BetaContentBlockParam, BetaMessage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { interpretaRisposta } from "./citazioni";
import { raggruppaPerFonte, type FrammentoTrovato } from "./frammenti";
import { MESSAGGI } from "./messaggi";
import { pulisciParole, testoDaCercare } from "./parole-ricerca";
import { ISTRUZIONI_SISTEMA, costruisciContenuto } from "./prompt";
import type { EventoChat, QuotaPubblica, ScambioPrecedente } from "./tipi";

/** Quello che si chiede al modello: istruzioni fisse e contenuto del messaggio. */
export type RichiestaModello = { istruzioni: string; contenuto: BetaContentBlockParam[] };

/** Risposta del modello in streaming: i pezzi di testo e poi il messaggio completo. */
export type FlussoModello = {
  testi(): AsyncIterable<string>;
  messaggioFinale(): Promise<Pick<BetaMessage, "stop_reason" | "content">>;
};

/**
 * Esito di una domanda, da scrivere sulla riga di public.domande_chat già
 * prenotata (e contata nella quota) prima di chiamare Claude.
 */
export type RegistroDomanda = { fonti_citate: string[]; senza_risposta: boolean };

/** Dipendenze esterne della chat: si sostituiscono nei test. */
export type DipendenzeChat = {
  /** Parole con cui cercare la domanda nelle fonti (vedi parole-ricerca.ts). */
  paroleRicerca(domanda: string, cronologia: ScambioPrecedente[]): Promise<string[]>;
  cerca(testo: string): Promise<FrammentoTrovato[]>;
  genera(richiesta: RichiestaModello): FlussoModello;
  /** Completa la domanda prenotata con le fonti citate. */
  salva(registro: RegistroDomanda): Promise<void>;
  /**
   * Toglie la prenotazione dopo un errore vero (ricerca o modello), così non
   * conta nella quota. Mai dopo un'interruzione di chi chiede: quella conta.
   */
  annulla(): Promise<void>;
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
 * Risponde a una domanda: la trasforma in parole di ricerca, cerca i
 * frammenti delle fonti, e solo se ne trova
 * chiede a Claude una risposta con citazioni; trasmette il testo man mano e
 * alla fine la risposta con le fonti. La domanda è già prenotata (e contata):
 * qui si completa con le fonti citate, oppure si annulla dopo un errore vero.
 */
export async function* rispondi(dip: DipendenzeChat, input: DomandaChat): AsyncGenerator<EventoChat, void, undefined> {
  const domanda = input.domanda.trim();

  const parole = await paroleSenzaBloccare(dip, domanda, input.cronologia);

  let trovati: FrammentoTrovato[];
  try {
    trovati = await dip.cerca(testoDaCercare(domanda, parole));
    const ultima = input.cronologia.at(-1);
    // Domanda di seguito ("e nei Grigioni?"): se da sola non trova nulla, si unisce alla precedente.
    if (trovati.length === 0 && ultima) trovati = await dip.cerca(`${ultima.domanda} ${domanda}`);
  } catch (errore) {
    dip.registraErrore("ricerca nelle fonti", errore);
    await annullaSenzaBloccare(dip);
    yield { t: "errore", messaggio: MESSAGGI.ricercaNonRiuscita };
    return;
  }

  const frammenti = raggruppaPerFonte(trovati);
  if (frammenti.length === 0) {
    // Nessuna fonte: niente chiamata a Claude, risposta fissa.
    await salvaSenzaBloccare(dip, { fonti_citate: [], senza_risposta: true });
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
    // Interrotta da chi chiede: la prenotazione resta e la domanda conta.
    if (messaggio === null) return;
    dip.registraErrore("risposta di Claude", errore);
    await annullaSenzaBloccare(dip);
    yield { t: "errore", messaggio };
    return;
  }

  const esito = interpretaRisposta(finale, frammenti);
  await salvaSenzaBloccare(dip, {
    fonti_citate: esito.fonti.map((f) => f.fonte_id),
    senza_risposta: esito.senza_risposta,
  });
  yield { t: "fine", ...esito, ...(input.quotaDopo ? { quota: input.quotaDopo } : {}) };
}

/** Senza parole di ricerca si cerca con la sola domanda, come prima: un errore qui non blocca la risposta. */
async function paroleSenzaBloccare(dip: DipendenzeChat, domanda: string, cronologia: ScambioPrecedente[]) {
  try {
    return pulisciParole(await dip.paroleRicerca(domanda, cronologia));
  } catch (errore) {
    // Interrotta da chi chiede: niente da registrare, la ricerca e la risposta si fermano da sole.
    if (dip.descriviErrore(errore) !== null) dip.registraErrore("parole di ricerca", errore);
    return [];
  }
}

/** Il registro serve a trovare le fonti mancanti, ma non deve bloccare la risposta. */
async function salvaSenzaBloccare(dip: DipendenzeChat, registro: RegistroDomanda) {
  try {
    await dip.salva(registro);
  } catch (errore) {
    dip.registraErrore("registro della domanda", errore);
  }
}

/** Se l'annullamento non riesce la domanda resta contata: meglio così che bloccare. */
async function annullaSenzaBloccare(dip: DipendenzeChat) {
  try {
    await dip.annulla();
  } catch (errore) {
    dip.registraErrore("annullamento della domanda", errore);
  }
}
