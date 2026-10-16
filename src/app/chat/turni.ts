import type { MessaggioSalvato } from "@/lib/chat/conversazioni";
import { LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA, SCAMBI_PRECEDENTI_MASSIMI } from "@/lib/chat/limiti";
import { scambiDaMessaggi } from "@/lib/chat/storico";
import { testoSemplice } from "@/lib/chat/testo-risposta";
import type { BloccoRisposta, FonteCitata, ScambioPrecedente } from "@/lib/chat/tipi";

/** La risposta di Bleo da mostrare. */
export type RispostaBleo = {
  risposta: BloccoRisposta[];
  fonti: FonteCitata[];
  senzaRisposta: boolean;
  avviso: string | null;
};

/** Cosa fare dopo un errore: riprovare, accedere di nuovo o niente (per esempio quota finita). */
export type AzioneErrore = "riprova" | "accedi" | "nessuna";

/** Una domanda e la sua risposta, come si vede nella chat. */
export type Turno = {
  chiave: string;
  domanda: string;
  stato: "in_attesa" | "in_scrittura" | "completo" | "errore" | "interrotta";
  /** Testo che arriva man mano (prima della risposta completa). */
  testo: string;
  fine: RispostaBleo | null;
  errore: string | null;
  azione: AzioneErrore;
};

/** I turni di una chat salvata. Una domanda rimasta senza risposta si può riprovare se è l'ultima. */
export function turniDaMessaggi(messaggi: readonly MessaggioSalvato[]): Turno[] {
  const scambi = scambiDaMessaggi(messaggi);
  return scambi.map(({ domanda, risposta }, i): Turno => {
    const base = { chiave: `s${domanda.id}`, domanda: domanda.testo, testo: "" };
    if (risposta) {
      const { risposta: blocchi, fonti, senzaRisposta, avviso } = risposta;
      return { ...base, stato: "completo", fine: { risposta: blocchi, fonti, senzaRisposta, avviso }, errore: null, azione: "nessuna" };
    }
    return {
      ...base,
      stato: "errore",
      fine: null,
      errore: "La risposta non è arrivata.",
      azione: i === scambi.length - 1 ? "riprova" : "nessuna",
    };
  });
}

/**
 * Il contesto da mandare quando la chat non è salvata (il server non ha
 * ancora un id): gli ultimi scambi completi, come faceva la chat di prima.
 */
export function cronologiaDaTurni(turni: readonly Turno[]): ScambioPrecedente[] {
  return turni
    .filter((t) => t.stato === "completo" && t.fine)
    .slice(-SCAMBI_PRECEDENTI_MASSIMI)
    .map((t) => ({
      domanda: t.domanda,
      risposta: testoSemplice(t.fine?.risposta ?? []).slice(0, LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA),
    }));
}

/** Testo da copiare: la risposta e, sotto, le fonti con i link. */
export function testoDaCopiare(fine: RispostaBleo): string {
  const testo = testoSemplice(fine.risposta);
  if (fine.fonti.length === 0) return testo;
  const fonti = fine.fonti.map((f) => `[${f.numero}] ${f.titolo} (${f.ente}): ${f.url}`).join("\n");
  return `${testo}\n\nFonti:\n${fonti}`;
}

/** Data locale AAAA-MM-GG (per raggruppare le chat per giorno). */
export function dataLocale(ora: Date): string {
  const due = (n: number) => String(n).padStart(2, "0");
  return `${ora.getFullYear()}-${due(ora.getMonth() + 1)}-${due(ora.getDate())}`;
}
