import type { BetaMessage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { describe, expect, it } from "vitest";
import { frammento, testoCitato } from "./dati-prova";
import type { DipendenzeChat, RegistroDomanda, RichiestaModello } from "./flusso";
import { rispondi } from "./flusso";
import type { FrammentoTrovato } from "./frammenti";
import { MESSAGGI } from "./messaggi";
import type { EventoChat, QuotaPubblica } from "./tipi";

type Finale = Pick<BetaMessage, "stop_reason" | "content">;

function finte(opzioni: {
  trovati?: FrammentoTrovato[] | ((testo: string) => FrammentoTrovato[]);
  pezzi?: string[];
  finale?: Finale;
  erroreModello?: unknown;
  erroreRicerca?: unknown;
  erroreSalvataggio?: unknown;
  erroreAnnullamento?: unknown;
}) {
  const ricerche: string[] = [];
  const richieste: RichiestaModello[] = [];
  const registri: RegistroDomanda[] = [];
  const annullate: number[] = [];
  const errori: string[] = [];
  const dip: DipendenzeChat = {
    async cerca(testo) {
      ricerche.push(testo);
      if (opzioni.erroreRicerca) throw opzioni.erroreRicerca;
      const { trovati = [] } = opzioni;
      return typeof trovati === "function" ? trovati(testo) : trovati;
    },
    genera(richiesta) {
      richieste.push(richiesta);
      return {
        async *testi() {
          for (const pezzo of opzioni.pezzi ?? []) yield pezzo;
          if (opzioni.erroreModello) throw opzioni.erroreModello;
        },
        messaggioFinale: async () => opzioni.finale ?? { stop_reason: "end_turn", content: [] },
      };
    },
    async salva(registro) {
      if (opzioni.erroreSalvataggio) throw opzioni.erroreSalvataggio;
      registri.push(registro);
    },
    async annulla() {
      annullate.push(1);
      if (opzioni.erroreAnnullamento) throw opzioni.erroreAnnullamento;
    },
    descriviErrore: (errore) => (errore === "interrotta" ? null : "Messaggio per l'utente"),
    registraErrore: (contesto) => errori.push(contesto),
  };
  return { dip, ricerche, richieste, registri, annullate, errori };
}

async function tutti(eventi: AsyncGenerator<EventoChat>) {
  const lista: EventoChat[] = [];
  for await (const evento of eventi) lista.push(evento);
  return lista;
}

const quota: QuotaPubblica = {
  piano: "gratis",
  illimitata: false,
  limite: 10,
  rimanenti: 6,
  rinnovo_il: "2026-11-01",
  piano_scade_il: null,
};

describe("rispondi", () => {
  it("senza frammenti non chiama Claude, risponde con il messaggio fisso e registra senza_risposta", async () => {
    const f = finte({ trovati: [] });
    const eventi = await tutti(rispondi(f.dip, { domanda: " Che tempo fa? ", cronologia: [], quotaDopo: quota }));
    expect(f.richieste).toHaveLength(0);
    expect(eventi).toEqual([
      {
        t: "fine",
        risposta: [{ testo: MESSAGGI.nessunaFonte, citazioni: [] }],
        fonti: [],
        senza_risposta: true,
        quota,
      },
    ]);
    expect(f.registri).toEqual([{ fonti_citate: [], senza_risposta: true }]);
    expect(f.annullate).toEqual([]);
  });

  it("per una domanda di seguito senza risultati riprova unendo la domanda precedente", async () => {
    const f = finte({
      trovati: (testo) => (testo.includes("IVA") ? [frammento({ frammento_id: 1, fonte_id: "iva" })] : []),
      finale: { stop_reason: "end_turn", content: [testoCitato("Sì.", [0])] },
    });
    await tutti(
      rispondi(f.dip, { domanda: "E per i Grigioni?", cronologia: [{ domanda: "Quando scatta l'IVA?", risposta: "…" }] }),
    );
    expect(f.ricerche).toEqual(["E per i Grigioni?", "Quando scatta l'IVA? E per i Grigioni?"]);
    expect(f.richieste).toHaveLength(1);
  });

  it("trasmette il testo man mano e chiude con risposta, fonti citate e registro", async () => {
    const trovati = [
      frammento({ frammento_id: 1, fonte_id: "iva", punteggio: 0.9 }),
      frammento({ frammento_id: 2, fonte_id: "avs", punteggio: 0.8 }),
      frammento({ frammento_id: 3, fonte_id: "iva", punteggio: 0.7 }),
    ];
    const f = finte({
      trovati,
      pezzi: ["L'IVA ", "è obbligatoria."],
      // Documenti raggruppati per fonte: [iva#1, iva#3, avs#2] → l'indice 1 è ancora "iva".
      finale: { stop_reason: "end_turn", content: [testoCitato("L'IVA è obbligatoria.", [1])] },
    });
    const eventi = await tutti(rispondi(f.dip, { domanda: "IVA?", cronologia: [], quotaDopo: quota }));

    expect(eventi.slice(0, 2)).toEqual([
      { t: "testo", d: "L'IVA " },
      { t: "testo", d: "è obbligatoria." },
    ]);
    const fine = eventi[2];
    expect(fine?.t).toBe("fine");
    if (fine?.t === "fine") {
      expect(fine.fonti.map((x) => x.fonte_id)).toEqual(["iva"]);
      expect(fine.senza_risposta).toBe(false);
      expect(fine.quota).toEqual(quota);
    }
    expect(f.registri).toEqual([{ fonti_citate: ["iva"], senza_risposta: false }]);
    expect(f.annullate).toEqual([]);

    const richiesta = f.richieste[0];
    expect(richiesta?.istruzioni).toContain("Sei Bussola");
    expect(richiesta?.contenuto.filter((b) => b.type === "document")).toHaveLength(3);
  });

  it("un errore di Claude diventa un evento di errore e la prenotazione viene annullata", async () => {
    const f = finte({ trovati: [frammento({ frammento_id: 1, fonte_id: "a" })], pezzi: ["Inizio"], erroreModello: new Error() });
    const eventi = await tutti(rispondi(f.dip, { domanda: "Domanda?", cronologia: [] }));
    expect(eventi).toEqual([
      { t: "testo", d: "Inizio" },
      { t: "errore", messaggio: "Messaggio per l'utente" },
    ]);
    expect(f.registri).toEqual([]);
    expect(f.annullate).toHaveLength(1);
    expect(f.errori).toEqual(["risposta di Claude"]);
  });

  it("se la richiesta è stata interrotta si ferma in silenzio e la domanda resta contata", async () => {
    const f = finte({ trovati: [frammento({ frammento_id: 1, fonte_id: "a" })], pezzi: ["Metà"], erroreModello: "interrotta" });
    expect(await tutti(rispondi(f.dip, { domanda: "Domanda?", cronologia: [] }))).toEqual([{ t: "testo", d: "Metà" }]);
    expect(f.annullate).toEqual([]);
  });

  it("se chi chiede chiude lo stream a metà la prenotazione resta", async () => {
    const f = finte({ trovati: [frammento({ frammento_id: 1, fonte_id: "a" })], pezzi: ["Uno ", "due ", "tre"] });
    const eventi = rispondi(f.dip, { domanda: "Domanda?", cronologia: [] });
    expect((await eventi.next()).value).toEqual({ t: "testo", d: "Uno " });
    await eventi.return(undefined);
    expect(f.annullate).toEqual([]);
    expect(f.registri).toEqual([]);
  });

  it("se la ricerca non funziona lo dice, senza chiamare Claude, e annulla la prenotazione", async () => {
    const f = finte({ erroreRicerca: new Error("db giù") });
    expect(await tutti(rispondi(f.dip, { domanda: "Domanda?", cronologia: [] }))).toEqual([
      { t: "errore", messaggio: MESSAGGI.ricercaNonRiuscita },
    ]);
    expect(f.richieste).toHaveLength(0);
    expect(f.annullate).toHaveLength(1);
  });

  it("se l'annullamento non riesce l'errore arriva comunque all'utente", async () => {
    const f = finte({ erroreRicerca: new Error("db giù"), erroreAnnullamento: new Error("rete") });
    expect(await tutti(rispondi(f.dip, { domanda: "Domanda?", cronologia: [] }))).toEqual([
      { t: "errore", messaggio: MESSAGGI.ricercaNonRiuscita },
    ]);
    expect(f.errori).toEqual(["ricerca nelle fonti", "annullamento della domanda"]);
  });

  it("se il registro non si salva la risposta arriva comunque", async () => {
    const f = finte({ trovati: [], erroreSalvataggio: new Error("rls") });
    const eventi = await tutti(rispondi(f.dip, { domanda: "Domanda?", cronologia: [] }));
    expect(eventi.at(-1)?.t).toBe("fine");
    expect(f.errori).toEqual(["registro della domanda"]);
  });
});
