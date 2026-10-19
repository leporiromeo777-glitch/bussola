import { describe, expect, it } from "vitest";
import type { Bozza } from "./bozza";
import { DOMANDE } from "./domande";
import { LUNGHEZZA_MASSIMA_RACCONTO, LUNGHEZZA_MINIMA_RACCONTO, MESSAGGI_RACCONTO } from "./racconto";
import {
  ESEMPI_RACCONTO,
  TESTI_RACCONTO,
  cambiaRisposta,
  contatoreRacconto,
  controllaTestoRacconto,
  esitoRevisione,
  leggiDisponibilitaRacconto,
  leggiRispostaRacconto,
  messaggioRevisione,
  prossimaDaRispondere,
  riepilogoRevisione,
  unisciRacconto,
  vociRevisione,
} from "./racconto-revisione";
import { VERSIONE_RISPOSTE } from "./risposte";

const COMPLETA: Bozza = {
  attivita: "digitale_creativo",
  cantone: "TI",
  soci: "solo",
  fatturato: "da_10k_a_60k",
  clienti: "molti",
  impiego: "parziale",
  avviata: "no",
  permesso: "svizzero_c",
  locali: "no",
  venditaOnline: "no",
};

describe("controllaTestoRacconto", () => {
  it("accetta un testo valido e toglie gli spazi in più", () => {
    expect(controllaTestoRacconto("  Voglio fare il fotografo a Lugano  ")).toEqual({
      ok: true,
      testo: "Voglio fare il fotografo a Lugano",
    });
  });

  it("con un testo troppo corto chiede almeno una frase, come sul sito", () => {
    expect(controllaTestoRacconto("")).toEqual({ ok: false, messaggio: TESTI_RACCONTO.testoBreve });
    expect(controllaTestoRacconto(`   ${"a".repeat(LUNGHEZZA_MINIMA_RACCONTO - 1)}   `)).toEqual({
      ok: false,
      messaggio: TESTI_RACCONTO.testoBreve,
    });
    expect(controllaTestoRacconto("a".repeat(LUNGHEZZA_MINIMA_RACCONTO)).ok).toBe(true);
  });

  it("con un testo troppo lungo dà lo stesso messaggio del server", () => {
    expect(controllaTestoRacconto("a".repeat(LUNGHEZZA_MASSIMA_RACCONTO)).ok).toBe(true);
    expect(controllaTestoRacconto("a".repeat(LUNGHEZZA_MASSIMA_RACCONTO + 1))).toEqual({
      ok: false,
      messaggio: MESSAGGI_RACCONTO.testoLungo,
    });
  });

  it("gli esempi passano il controllo", () => {
    for (const esempio of ESEMPI_RACCONTO) expect(controllaTestoRacconto(esempio).ok).toBe(true);
  });
});

describe("contatoreRacconto", () => {
  it("conta i caratteri in formato svizzero", () => {
    expect(contatoreRacconto(0)).toEqual({ testo: "0 di 1'000 caratteri", alMassimo: false });
    expect(contatoreRacconto(999)).toEqual({ testo: "999 di 1'000 caratteri", alMassimo: false });
  });

  it("al massimo lo dice chiaramente", () => {
    const contatore = contatoreRacconto(LUNGHEZZA_MASSIMA_RACCONTO);
    expect(contatore.alMassimo).toBe(true);
    expect(contatore.testo).toContain("Hai raggiunto il massimo di 1'000 caratteri");
  });
});

describe("leggiRispostaRacconto", () => {
  it("restituisce le risposte proposte e il riassunto", () => {
    const esito = leggiRispostaRacconto(200, {
      bozza: { attivita: "digitale_creativo", cantone: "TI", impiego: "parziale" },
      riassunto: "Ho capito: vuoi fare il fotografo a Lugano.",
    });
    expect(esito).toEqual({
      ok: true,
      racconto: {
        bozza: { attivita: "digitale_creativo", cantone: "TI", impiego: "parziale" },
        riassunto: "Ho capito: vuoi fare il fotografo a Lugano.",
      },
    });
  });

  it("controlla di nuovo le risposte: valori sconosciuti e descrizioni fuori posto spariscono", () => {
    const esito = leggiRispostaRacconto(200, {
      bozza: {
        attivita: "digitale_creativo",
        attivitaAltro: "fotografo",
        cantone: "ZH",
        soci: 3,
        versione: "vecchia",
        estraneo: "x",
      },
      riassunto: "  Ho capito:\n  vuoi fare foto.  ",
    });
    expect(esito).toEqual({
      ok: true,
      racconto: { bozza: { attivita: "digitale_creativo" }, riassunto: "Ho capito: vuoi fare foto." },
    });
  });

  it("tiene la descrizione libera con l'attività «Altro»", () => {
    const esito = leggiRispostaRacconto(200, {
      bozza: { attivita: "altro", attivitaAltro: "noleggio di biciclette" },
      riassunto: "Ho capito: vuoi noleggiare biciclette.",
    });
    expect(esito.ok && esito.racconto.bozza).toEqual({ attivita: "altro", attivitaAltro: "noleggio di biciclette" });
  });

  it("con un riassunto vuoto usa la frase di ripiego e lo accorcia se è troppo lungo", () => {
    const vuoto = leggiRispostaRacconto(200, { bozza: {}, riassunto: "   " });
    expect(vuoto.ok && vuoto.racconto.riassunto).toBe(MESSAGGI_RACCONTO.riassuntoVuoto);
    const lungo = leggiRispostaRacconto(200, { bozza: {}, riassunto: "a".repeat(1_000) });
    expect(lungo.ok && lungo.racconto.riassunto.length).toBe(300);
  });

  it("con una risposta riuscita ma senza i dati attesi dice che non ha capito", () => {
    for (const corpo of [null, "<html>", {}, { bozza: [], riassunto: "x" }, { bozza: {} }, { riassunto: "x" }]) {
      expect(leggiRispostaRacconto(200, corpo)).toEqual({
        ok: false,
        motivo: "non_capito",
        messaggio: TESTI_RACCONTO.nonCapito,
        stato: 200,
      });
    }
  });

  it("mostra il messaggio del sito e capisce il motivo", () => {
    expect(leggiRispostaRacconto(400, { messaggio: MESSAGGI_RACCONTO.testoCorto })).toEqual({
      ok: false,
      motivo: "testo",
      messaggio: MESSAGGI_RACCONTO.testoCorto,
      stato: 400,
    });
    expect(leggiRispostaRacconto(429, { messaggio: MESSAGGI_RACCONTO.troppeRichieste })).toMatchObject({
      motivo: "limite",
      messaggio: MESSAGGI_RACCONTO.troppeRichieste,
    });
    expect(leggiRispostaRacconto(503, { messaggio: MESSAGGI_RACCONTO.nonAttivo })).toMatchObject({
      motivo: "non_attivo",
      messaggio: MESSAGGI_RACCONTO.nonAttivo,
    });
    expect(leggiRispostaRacconto(503, { messaggio: MESSAGGI_RACCONTO.occupato })).toMatchObject({ motivo: "occupato" });
    expect(leggiRispostaRacconto(502, { messaggio: MESSAGGI_RACCONTO.nonCapito })).toMatchObject({
      motivo: "non_capito",
      messaggio: MESSAGGI_RACCONTO.nonCapito,
    });
  });

  it("senza messaggio usa un testo di ripiego per lo stato", () => {
    expect(leggiRispostaRacconto(429, null)).toMatchObject({ motivo: "limite", messaggio: MESSAGGI_RACCONTO.troppeRichieste });
    expect(leggiRispostaRacconto(503, {})).toMatchObject({ motivo: "occupato", messaggio: MESSAGGI_RACCONTO.occupato });
    expect(leggiRispostaRacconto(500, "<html>")).toMatchObject({ motivo: "non_capito", messaggio: TESTI_RACCONTO.nonCapito });
    expect(leggiRispostaRacconto(502, { messaggio: "   " })).toMatchObject({ messaggio: TESTI_RACCONTO.nonCapito });
  });
});

describe("leggiDisponibilitaRacconto", () => {
  it("legge attiva dal sito", () => {
    expect(leggiDisponibilitaRacconto(200, { attiva: true })).toBe(true);
    expect(leggiDisponibilitaRacconto(200, { attiva: false })).toBe(false);
  });

  it("se non si sa restituisce null", () => {
    expect(leggiDisponibilitaRacconto(405, null)).toBeNull();
    expect(leggiDisponibilitaRacconto(200, null)).toBeNull();
    expect(leggiDisponibilitaRacconto(200, { attiva: "sì" })).toBeNull();
    expect(leggiDisponibilitaRacconto(500, { attiva: true })).toBeNull();
  });
});

describe("unisciRacconto", () => {
  it("le risposte del racconto vincono, quelle che il racconto non dice restano", () => {
    expect(unisciRacconto({ cantone: "GR", soci: "solo" }, { cantone: "TI", impiego: "no" })).toEqual({
      cantone: "TI",
      soci: "solo",
      impiego: "no",
    });
  });

  it("la descrizione libera segue l'attività da cui viene", () => {
    // Il racconto cambia attività: la vecchia descrizione sparisce.
    expect(unisciRacconto({ attivita: "altro", attivitaAltro: "biciclette" }, { attivita: "trasporti" })).toEqual({
      attivita: "trasporti",
    });
    // Il racconto dice «Altro» con la sua descrizione.
    expect(
      unisciRacconto({ attivita: "altro", attivitaAltro: "biciclette" }, { attivita: "altro", attivitaAltro: "cani" }),
    ).toEqual({ attivita: "altro", attivitaAltro: "cani" });
    // «Altro» senza descrizione: non resta quella di prima.
    expect(unisciRacconto({ attivita: "altro", attivitaAltro: "biciclette" }, { attivita: "altro" })).toEqual({
      attivita: "altro",
    });
    // Il racconto non dice l'attività: resta tutto com'era.
    expect(unisciRacconto({ attivita: "altro", attivitaAltro: "biciclette" }, { cantone: "TI" })).toEqual({
      attivita: "altro",
      attivitaAltro: "biciclette",
      cantone: "TI",
    });
  });
});

describe("vociRevisione", () => {
  it("elenca le 10 domande nell'ordine del questionario, con le risposte da leggere", () => {
    const voci = vociRevisione({ attivita: "digitale_creativo", cantone: "TI" });
    expect(voci.map((v) => v.id)).toEqual(DOMANDE.map((d) => d.id));
    expect(voci[0]).toMatchObject({
      id: "attivita",
      breve: "Attività",
      valore: "digitale_creativo",
      risposta: "Servizi digitali o creativi",
    });
    expect(voci[1]).toMatchObject({ id: "cantone", breve: "Sede", valore: "TI", risposta: "Ticino" });
    expect(voci[2]).toMatchObject({ id: "soci", valore: null, risposta: null });
    expect(voci[2].opzioni.map((o) => o.valore)).toEqual(["solo", "con_soci"]);
  });

  it("con «Altro» mostra anche l'attività descritta a parole", () => {
    expect(vociRevisione({ attivita: "altro", attivitaAltro: " noleggio di biciclette " })[0].risposta).toBe(
      "Altro: noleggio di biciclette",
    );
    expect(vociRevisione({ attivita: "altro" })[0].risposta).toBe("Altro");
  });
});

describe("cambiaRisposta", () => {
  it("cambia o aggiunge una risposta", () => {
    expect(cambiaRisposta({ cantone: "TI" }, "cantone", "GR")).toEqual({ cantone: "GR" });
    expect(cambiaRisposta({ cantone: "TI" }, "soci", "con_soci")).toEqual({ cantone: "TI", soci: "con_soci" });
  });

  it("un valore che non è tra le opzioni non passa", () => {
    expect(cambiaRisposta({ cantone: "TI" }, "cantone", "ZH")).toEqual({});
  });
});

describe("riepilogoRevisione e messaggioRevisione", () => {
  it("conta le risposte capite dal racconto e quelle che mancano ancora", () => {
    expect(riepilogoRevisione({ cantone: "TI" }, { cantone: "TI", soci: "solo" })).toEqual({ capite: 1, mancanti: 8 });
    expect(riepilogoRevisione(COMPLETA, COMPLETA)).toEqual({ capite: 10, mancanti: 0 });
    expect(riepilogoRevisione({}, {})).toEqual({ capite: 0, mancanti: 10 });
  });

  it("dice cosa fare, al singolare e al plurale", () => {
    expect(messaggioRevisione({ capite: 0, mancanti: 10 })).toMatch(/^Non ho capito abbastanza/);
    expect(messaggioRevisione({ capite: 10, mancanti: 0 })).toMatch(/^Ho tutte le risposte/);
    expect(messaggioRevisione({ capite: 1, mancanti: 1 })).toBe(
      "Dal tuo racconto ho capito 1 risposta. Controlla e correggi quello che non va, poi rispondi a quella che manca: qui sotto o con le domande.",
    );
    expect(messaggioRevisione({ capite: 4, mancanti: 6 })).toContain("ho capito 4 risposte");
    expect(messaggioRevisione({ capite: 4, mancanti: 6 })).toContain("rispondi alle 6 che mancano");
  });
});

describe("esitoRevisione", () => {
  it("con tutte le risposte restituisce le risposte da salvare", () => {
    expect(esitoRevisione(COMPLETA)).toEqual({ completa: true, risposte: { versione: VERSIONE_RISPOSTE, ...COMPLETA } });
  });

  it("toglie la descrizione libera se l'attività non è «Altro»", () => {
    const esito = esitoRevisione({ ...COMPLETA, attivitaAltro: "fotografo" });
    expect(esito.completa && esito.risposte).not.toHaveProperty("attivitaAltro");
  });

  it("se manca qualcosa indica la prima domanda senza risposta", () => {
    expect(esitoRevisione({})).toEqual({ completa: false, indice: 0 });
    expect(esitoRevisione({ ...COMPLETA, fatturato: undefined, permesso: undefined })).toEqual({
      completa: false,
      indice: DOMANDE.findIndex((d) => d.id === "fatturato"),
    });
  });
});

describe("prossimaDaRispondere", () => {
  const indiceDi = (id: string) => DOMANDE.findIndex((d) => d.id === id);

  it("salta le domande a cui il racconto ha già risposto", () => {
    const bozza: Bozza = { ...COMPLETA, fatturato: undefined, permesso: undefined };
    expect(prossimaDaRispondere(0, bozza)).toBe(indiceDi("fatturato"));
    expect(prossimaDaRispondere(indiceDi("fatturato"), bozza)).toBe(indiceDi("permesso"));
  });

  it("se non manca più niente va all'ultima domanda", () => {
    expect(prossimaDaRispondere(indiceDi("permesso"), COMPLETA)).toBe(DOMANDE.length - 1);
    expect(prossimaDaRispondere(DOMANDE.length - 1, {})).toBe(DOMANDE.length - 1);
  });

  it("senza risposte va semplicemente alla domanda dopo", () => {
    expect(prossimaDaRispondere(0, {})).toBe(1);
    expect(prossimaDaRispondere(4, {})).toBe(5);
  });
});
