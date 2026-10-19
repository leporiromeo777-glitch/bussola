/**
 * «Racconta a Bleo» anche nell'app: i testi uguali per sito e app, la
 * lettura delle risposte di POST e GET /api/racconta e il passo di
 * controllo, dove chi ha scritto vede le risposte proposte da Bleo, le
 * corregge e le conferma prima che finiscano nel questionario. Logica pura,
 * senza browser né React Native: la usano mobile/src/lib/racconto.ts e la
 * schermata del questionario dell'app (e i testi anche il sito).
 */
import { numeroSvizzero } from "@/lib/strumenti/numeri";
import { pulisciBozza, type Bozza } from "./bozza";
import { DOMANDE, etichettaRisposta, type Opzione } from "./domande";
import {
  LUNGHEZZA_MASSIMA_RACCONTO,
  LUNGHEZZA_MASSIMA_RIASSUNTO,
  LUNGHEZZA_MINIMA_RACCONTO,
  MESSAGGI_RACCONTO,
  type Racconto,
} from "./racconto";
import { leggiRisposte, VERSIONE_RISPOSTE, type IdDomanda, type Risposte } from "./risposte";

/* ------------------------------------------------------------------ */
/* Testi uguali sul sito e nell'app                                    */
/* ------------------------------------------------------------------ */

/** Esempi di racconto: il primo è anche il testo d'esempio nella casella vuota. */
export const ESEMPI_RACCONTO = [
  "Voglio fare il fotografo a Lugano nel fine settimana. Ho già un lavoro al 60% e sono svizzero.",
  "Vorrei aprire un piccolo bar a Bellinzona con la mia ragazza.",
  "Faccio siti web per altre persone, da sola, e penso di fatturare circa 30'000 franchi il primo anno.",
] as const;

/** Testi mostrati da chi scrive (sito e app); quelli del server sono in MESSAGGI_RACCONTO. */
export const TESTI_RACCONTO = {
  aiuto:
    "Con parole tue, scritte o a voce: che lavoro, dove, se da solo o con altri, se hai già un impiego. Bleo capisce le risposte e ti chiede solo quello che manca.",
  testoBreve: "Scrivi almeno una frase: cosa vuoi fare e dove.",
  senzaConnessione: "Non riesco a raggiungere Bleo: controlla la connessione o rispondi alle domande.",
  troppoLento: "Bleo ci sta mettendo troppo. Riprova tra poco o rispondi alle domande.",
  nonCapito: "Non sono riuscito a capire. Rispondi alle domande: ci vogliono 5 minuti.",
  privacy:
    "Il testo lo legge l'intelligenza artificiale che usa Bleo (Claude, di Anthropic) solo per capire le risposte: noi non lo salviamo. Scrivi solo quello che serve, senza dati come indirizzo o numero AVS.",
} as const;

/** Controllo prima dell'invio, con gli stessi limiti del server. */
export function controllaTestoRacconto(testo: string): { ok: true; testo: string } | { ok: false; messaggio: string } {
  const pulito = testo.trim();
  if (pulito.length < LUNGHEZZA_MINIMA_RACCONTO) return { ok: false, messaggio: TESTI_RACCONTO.testoBreve };
  if (pulito.length > LUNGHEZZA_MASSIMA_RACCONTO) return { ok: false, messaggio: MESSAGGI_RACCONTO.testoLungo };
  return { ok: true, testo: pulito };
}

/** Il contatore sotto la casella: «120 di 1'000 caratteri», e se si è arrivati al massimo. */
export function contatoreRacconto(lunghezza: number): { testo: string; alMassimo: boolean } {
  const alMassimo = lunghezza >= LUNGHEZZA_MASSIMA_RACCONTO;
  const massimo = numeroSvizzero(LUNGHEZZA_MASSIMA_RACCONTO);
  return {
    testo: alMassimo
      ? `Hai raggiunto il massimo di ${massimo} caratteri: per aggiungere altro, accorcia un po'.`
      : `${numeroSvizzero(lunghezza)} di ${massimo} caratteri`,
    alMassimo,
  };
}

/* ------------------------------------------------------------------ */
/* Risposte del sito                                                   */
/* ------------------------------------------------------------------ */

/**
 * Perché non è andata, per scegliere cosa mostrare:
 * - "testo": testo troppo corto o troppo lungo (lo dice il sito);
 * - "limite": troppe prove in poco tempo;
 * - "non_attivo": la funzione è spenta sul sito (modalità demo);
 * - "occupato": il sito o Claude non rispondono adesso;
 * - "non_capito": Bleo non ha capito o la risposta non si legge;
 * - "rete" e "lento": la richiesta non arriva o dura troppo (li decide l'app).
 */
export type MotivoRacconto = "testo" | "limite" | "non_attivo" | "occupato" | "non_capito" | "rete" | "lento";

export type EsitoRacconto =
  | { ok: true; racconto: Racconto }
  | { ok: false; motivo: MotivoRacconto; messaggio: string; stato: number };

function oggetto(valore: unknown): Record<string, unknown> | null {
  return valore && typeof valore === "object" && !Array.isArray(valore) ? (valore as Record<string, unknown>) : null;
}

function motivoPerStato(stato: number, messaggio: string): MotivoRacconto {
  if (stato === 400 || stato === 413) return "testo";
  if (stato === 429) return "limite";
  if (stato === 503) return messaggio === MESSAGGI_RACCONTO.nonAttivo ? "non_attivo" : "occupato";
  return "non_capito";
}

function messaggioPerStato(stato: number): string {
  if (stato === 429) return MESSAGGI_RACCONTO.troppeRichieste;
  if (stato === 503) return MESSAGGI_RACCONTO.occupato;
  return TESTI_RACCONTO.nonCapito;
}

/**
 * Dalla risposta di POST /api/racconta (stato HTTP e corpo JSON già letto,
 * null se non era JSON) all'esito da mostrare. Le risposte proposte si
 * controllano di nuovo: restano solo i valori tra le opzioni delle domande,
 * e la descrizione libera solo con l'attività «Altro». Se il sito e l'app
 * non sono aggiornati insieme, meglio un messaggio chiaro che una schermata
 * rotta.
 */
export function leggiRispostaRacconto(stato: number, corpo: unknown): EsitoRacconto {
  const dati = oggetto(corpo) ?? {};
  if (stato >= 200 && stato < 300) {
    const proposta = oggetto(dati.bozza);
    if (!proposta || typeof dati.riassunto !== "string") {
      return { ok: false, motivo: "non_capito", messaggio: TESTI_RACCONTO.nonCapito, stato };
    }
    const bozza = pulisciBozza(proposta);
    if (bozza.attivita !== "altro") delete bozza.attivitaAltro;
    const riassunto = dati.riassunto.replace(/\s+/g, " ").trim().slice(0, LUNGHEZZA_MASSIMA_RIASSUNTO);
    return { ok: true, racconto: { bozza, riassunto: riassunto || MESSAGGI_RACCONTO.riassuntoVuoto } };
  }
  const messaggio = (typeof dati.messaggio === "string" ? dati.messaggio.trim() : "") || messaggioPerStato(stato);
  return { ok: false, motivo: motivoPerStato(stato, messaggio), messaggio, stato };
}

/**
 * Dalla risposta di GET /api/racconta: true o false se il sito lo dice,
 * null se non si sa (sito vecchio, rete assente). Con null l'app lascia
 * provare: se la funzione è spenta lo dirà la risposta all'invio.
 */
export function leggiDisponibilitaRacconto(stato: number, corpo: unknown): boolean | null {
  if (stato < 200 || stato >= 300) return null;
  const attiva = oggetto(corpo)?.attiva;
  return typeof attiva === "boolean" ? attiva : null;
}

/* ------------------------------------------------------------------ */
/* Il passo di controllo                                               */
/* ------------------------------------------------------------------ */

/** Una riga del controllo: la domanda e la risposta proposta (o che manca). */
export type VoceRevisione = {
  id: IdDomanda;
  /** Etichetta corta della domanda, per esempio «Sede». */
  breve: string;
  titolo: string;
  opzioni: readonly Opzione[];
  /** Il valore scelto, oppure null se manca ancora. */
  valore: string | null;
  /** La risposta da leggere: l'etichetta dell'opzione, con «Altro» anche l'attività descritta a parole. */
  risposta: string | null;
};

/**
 * Le risposte proposte dal racconto sopra quelle che c'erano già nella
 * bozza: vince il racconto, ma quello che il racconto non dice resta. La
 * descrizione libera dell'attività segue sempre l'attività da cui viene.
 */
export function unisciRacconto(attuale: Bozza, proposta: Bozza): Bozza {
  const unita = pulisciBozza({ ...attuale, ...proposta });
  if (proposta.attivita) {
    if (proposta.attivita === "altro" && proposta.attivitaAltro) unita.attivitaAltro = proposta.attivitaAltro;
    else delete unita.attivitaAltro;
  }
  if (unita.attivita !== "altro") delete unita.attivitaAltro;
  return unita;
}

/** Le 10 domande, nell'ordine del questionario, con la risposta da controllare. */
export function vociRevisione(bozza: Bozza): VoceRevisione[] {
  return DOMANDE.map((domanda) => {
    const id = domanda.id as IdDomanda;
    const valore = (bozza[id] as string | undefined) ?? null;
    let risposta: string | null = null;
    if (valore !== null) {
      const etichetta = etichettaRisposta(id, valore as never);
      const altro = id === "attivita" && valore === "altro" ? bozza.attivitaAltro?.trim() : "";
      risposta = altro ? `${etichetta}: ${altro}` : etichetta;
    }
    return { id, breve: domanda.breve, titolo: domanda.titolo, opzioni: domanda.opzioni as Opzione[], valore, risposta };
  });
}

/** Cambia (o dà) una risposta nel passo di controllo; un valore fuori dalle opzioni non passa. */
export function cambiaRisposta(bozza: Bozza, id: IdDomanda, valore: string): Bozza {
  return pulisciBozza({ ...bozza, [id]: valore });
}

/** Quante risposte ha capito il racconto e quante ne mancano ancora. */
export function riepilogoRevisione(proposta: Bozza, bozza: Bozza): { capite: number; mancanti: number } {
  return {
    capite: DOMANDE.filter((d) => proposta[d.id as IdDomanda]).length,
    mancanti: DOMANDE.filter((d) => !bozza[d.id as IdDomanda]).length,
  };
}

/** La frase sotto il riassunto di Bleo, nel passo di controllo. */
export function messaggioRevisione({ capite, mancanti }: { capite: number; mancanti: number }): string {
  if (capite === 0) {
    return "Non ho capito abbastanza. Riscrivi aggiungendo che lavoro vuoi fare, in che città o Cantone, se da solo o con altri e se hai già un impiego. Oppure rispondi alle domande: ci vogliono pochi minuti.";
  }
  if (mancanti === 0) return "Ho tutte le risposte. Controllale qui sotto: se qualcosa non va, toccala e correggila.";
  const capito = capite === 1 ? "1 risposta" : `${capite} risposte`;
  const manca = mancanti === 1 ? "a quella che manca" : `alle ${mancanti} che mancano`;
  return `Dal tuo racconto ho capito ${capito}. Controlla e correggi quello che non va, poi rispondi ${manca}: qui sotto o con le domande.`;
}

/**
 * Dopo la conferma: le risposte complete da salvare come alla fine del
 * questionario, oppure la prima domanda che manca, da cui il questionario
 * riparte con le risposte confermate.
 */
export function esitoRevisione(
  bozza: Bozza,
): { completa: true; risposte: Risposte } | { completa: false; indice: number } {
  const risposte = leggiRisposte({ ...bozza, versione: VERSIONE_RISPOSTE });
  if (risposte) return { completa: true, risposte };
  const mancante = DOMANDE.findIndex((d) => !bozza[d.id as IdDomanda]);
  return { completa: false, indice: mancante >= 0 ? mancante : DOMANDE.length - 1 };
}

/**
 * Dopo «Avanti», quando le risposte vengono dal racconto: la prossima
 * domanda ancora senza risposta, così Bleo chiede solo quello che manca.
 * Se non ne manca nessuna, l'ultima (con «Vedi il percorso»).
 */
export function prossimaDaRispondere(indice: number, bozza: Bozza): number {
  for (let i = Math.max(indice + 1, 0); i < DOMANDE.length; i++) {
    if (!bozza[DOMANDE[i].id as IdDomanda]) return i;
  }
  return DOMANDE.length - 1;
}
