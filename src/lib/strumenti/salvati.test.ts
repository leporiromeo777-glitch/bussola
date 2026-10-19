import { describe, expect, it } from "vitest";
import { CHIAVI_ARCHIVIO, codifica, decodifica } from "./archivio";
import { datiBudgetIniziali, LUNGHEZZE_BUDGET, schemaDatiBudget, type DatiBudget } from "./budget";
import { CAMPI_PIANO, datiPianoIniziali, MASSIMO_ASSOLUTO, schemaDatiPiano, type DatiPiano } from "./business-plan";
import {
  budgetCompilato,
  CHIAVI_STRUMENTI,
  datiDaContenuto,
  datiIniziali,
  leggiDatiStrumento,
  MESSAGGI_SALVATI,
  pianoCompilato,
  propostaCopia,
  riassuntoStrumento,
  rigaStrumento,
  schemaBudgetRichiesta,
  schemaPianoRichiesta,
  stessiDati,
  strumentoValido,
} from "./salvati";

const tutti = (valore: string) => Array.from({ length: 12 }, () => valore);

function budget(modifiche: Partial<DatiBudget> = {}): DatiBudget {
  return { ...datiBudgetIniziali("2026-10-19"), ...modifiche };
}

function piano(modifiche: Partial<DatiPiano> = {}): DatiPiano {
  return { ...datiPianoIniziali(), ...modifiche };
}

describe("strumenti salvati", () => {
  it("due strumenti, con le stesse chiavi del browser e del telefono", () => {
    expect(strumentoValido("budget")).toBe(true);
    expect(strumentoValido("business-plan")).toBe(true);
    expect(strumentoValido("tariffa")).toBe(false);
    expect(strumentoValido(undefined)).toBe(false);
    expect(CHIAVI_STRUMENTI).toEqual({ budget: CHIAVI_ARCHIVIO.budget, "business-plan": CHIAVI_ARCHIVIO.businessPlan });
  });

  it("dati iniziali: il budget parte dal mese dopo oggi", () => {
    expect(datiIniziali("budget", "2026-12-05").meseInizio).toBe("2027-01");
    expect(datiIniziali("business-plan", "2026-12-05")).toEqual(datiPianoIniziali());
  });
});

describe("controllo del budget che arriva alle API", () => {
  it("accetta il budget dello strumento, anche dopo il giro nel browser", () => {
    const compilato = budget({ ricavi: tutti("4'000"), costiVariabiliPercento: "10", iscrizioneRegistro: true });
    expect(leggiDatiStrumento("budget", compilato)).toEqual({ ok: true, dati: compilato });
    const dalBrowser = decodifica(codifica(compilato), schemaDatiBudget, () => budget());
    expect(schemaBudgetRichiesta.safeParse(dalBrowser).success).toBe(true);
  });

  it("qualsiasi oggetto riletto con lo schema dello strumento si può salvare", () => {
    const riletto = schemaDatiBudget.parse({ meseInizio: "rotto", ricavi: ["1", 2], costiAvvio: [{ id: 5 }], costiFissi: "no" });
    expect(schemaBudgetRichiesta.safeParse(riletto).success).toBe(true);
    const pianoRiletto = schemaDatiPiano.parse({ nomeAttivita: 3, campi: { idea: "x".repeat(10_000) } });
    expect(schemaPianoRichiesta.safeParse(pianoRiletto).success).toBe(true);
  });

  it("rifiuta campi in più, mesi strani, troppe voci, testi troppo lunghi", () => {
    const L = LUNGHEZZE_BUDGET;
    const voce = (i: number) => ({ id: `v${i}`, descrizione: "Voce", importo: "10" });
    for (const sbagliato of [
      { ...budget(), extra: 1 },
      budget({ meseInizio: "2026-13" }),
      budget({ ricavi: tutti("1").slice(0, 11) }),
      budget({ ricavi: [...tutti("1"), "1"] }),
      budget({ situazione: "altra" as DatiBudget["situazione"] }),
      budget({ costiAvvio: [{ ...voce(1), mese: 12 }] }),
      budget({ costiAvvio: [{ ...voce(1), mese: 1.5 }] }),
      budget({ costiFissi: Array.from({ length: L.righe + 1 }, (_, i) => voce(i)) }),
      budget({ costiFissi: [{ ...voce(1), descrizione: "x".repeat(L.descrizione + 1) }] }),
      budget({ costiFissi: [{ ...voce(1), colore: "rosso" } as never] }),
      budget({ prelieviMensili: "1".repeat(L.importo + 1) }),
      "budget",
      null,
    ]) {
      expect(leggiDatiStrumento("budget", sbagliato)).toEqual({ ok: false, messaggio: MESSAGGI_SALVATI.datiNonValidi });
    }
  });
});

describe("controllo del business plan che arriva alle API", () => {
  it("accetta le risposte fino al doppio dei caratteri consigliati", () => {
    const campi = Object.fromEntries(CAMPI_PIANO.map((c) => [c.id, "x".repeat(c.consigliati * MASSIMO_ASSOLUTO)])) as DatiPiano["campi"];
    const pieno = piano({ nomeAttivita: "Siti Rossi", titolare: "Luca Rossi", campi });
    expect(leggiDatiStrumento("business-plan", pieno)).toEqual({ ok: true, dati: pieno });
  });

  it("rifiuta risposte troppo lunghe, domande che non esistono e campi in più", () => {
    const base = piano();
    for (const sbagliato of [
      { ...base, campi: { ...base.campi, idea: "x".repeat(CAMPI_PIANO[0].consigliati * MASSIMO_ASSOLUTO + 1) } },
      { ...base, campi: { ...base.campi, slogan: "" } },
      { ...base, campi: { idea: "" } },
      { ...base, nomeAttivita: "x".repeat(121) },
      { ...base, logo: "png" },
      // Un budget al posto del business plan.
      budget(),
    ]) {
      expect(leggiDatiStrumento("business-plan", sbagliato).ok).toBe(false);
    }
  });
});

describe("righe del database", () => {
  it("una riga per strumento con il contenuto intero", () => {
    const d = budget({ ricavi: tutti("100") });
    expect(rigaStrumento("u1", "budget", d, "2026-10-19T10:00:00.000Z")).toEqual({
      user_id: "u1",
      strumento: "budget",
      contenuto: d,
      aggiornato_il: "2026-10-19T10:00:00.000Z",
    });
  });

  it("rilegge il contenuto con lo schema dello strumento; null se non è un oggetto", () => {
    expect(datiDaContenuto("budget", budget())).toEqual(budget());
    expect(datiDaContenuto("budget", { meseInizio: "2027-02", ricavi: ["5"] })).toMatchObject({
      meseInizio: "2027-02",
      ricavi: ["5", "", "", "", "", "", "", "", "", "", "", ""],
      costiFissi: [],
    });
    expect(datiDaContenuto("business-plan", { nomeAttivita: "Bar", campi: { idea: "Caffè" } })).toMatchObject({
      nomeAttivita: "Bar",
      titolare: "",
    });
    expect(datiDaContenuto("budget", [1])).toBeNull();
    expect(datiDaContenuto("budget", "testo")).toBeNull();
    expect(datiDaContenuto("business-plan", null)).toBeNull();
  });
});

describe("copia dal browser o dal telefono", () => {
  it("un budget conta come compilato solo con un numero o una scelta", () => {
    expect(budgetCompilato(budget())).toBe(false);
    expect(budgetCompilato(budget({ costiFissi: [{ id: "a", descrizione: "Affitto", importo: " " }] }))).toBe(false);
    expect(budgetCompilato(budget({ ricavi: ["1000", ...tutti("").slice(1)] }))).toBe(true);
    expect(budgetCompilato(budget({ costiFissi: [{ id: "a", descrizione: "Affitto", importo: "800" }] }))).toBe(true);
    expect(budgetCompilato(budget({ riservaImpostePercento: "15" }))).toBe(true);
    expect(budgetCompilato(budget({ iscrizioneRegistro: true }))).toBe(true);
  });

  it("un business plan conta come compilato con qualsiasi risposta", () => {
    expect(pianoCompilato(piano())).toBe(false);
    expect(pianoCompilato(piano({ titolare: "  " }))).toBe(false);
    expect(pianoCompilato(piano({ nomeAttivita: "Siti Rossi" }))).toBe(true);
    expect(pianoCompilato(piano({ campi: { ...piano().campi, rischi: "Pochi clienti" } }))).toBe(true);
  });

  it("propone di copiare se l'account è vuoto, di scegliere se è diverso, niente se è uguale o se non c'è niente", () => {
    const locale = budget({ ricavi: tutti("3000") });
    expect(propostaCopia("budget", locale, { dati: budget(), nellAccount: false })).toBe("copia");
    expect(propostaCopia("budget", locale, { dati: budget({ ricavi: tutti("10") }), nellAccount: true })).toBe("scegli");
    expect(propostaCopia("budget", locale, { dati: structuredClone(locale), nellAccount: true })).toBeNull();
    expect(propostaCopia("budget", budget(), { dati: budget(), nellAccount: false })).toBeNull();
    expect(propostaCopia("budget", null, { dati: budget(), nellAccount: true })).toBeNull();
    expect(stessiDati(locale, structuredClone(locale))).toBe(true);
  });

  it("riassunto per riconoscere i dati", () => {
    expect(riassuntoStrumento("budget", budget({ meseInizio: "2026-11", ricavi: tutti("4000") }))).toBe(
      "nov 2026 – ott 2027, ricavi CHF 48'000",
    );
    expect(riassuntoStrumento("business-plan", piano({ nomeAttivita: " Siti Rossi ", campi: { ...piano().campi, idea: "Siti" } }))).toBe(
      "«Siti Rossi», 1 di 11 domande",
    );
    expect(riassuntoStrumento("business-plan", piano())).toBe("0 di 11 domande");
  });
});
