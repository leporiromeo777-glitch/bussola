import { describe, expect, it } from "vitest";
import { controllaFondazione, datiFondazioneIniziali, nuovoGerenteEsterno, type DatiFondazione } from "./dati";
import { PASSI_SAGL, controlliPerPasso, passoDelControllo, riepilogoQuote } from "./passi";

function completi(): DatiFondazione {
  const d = datiFondazioneIniziali();
  return {
    ...d,
    ditta: "Rossi & Bianchi Sagl",
    sede: "Bellinzona",
    scopo: "Riparazione di biciclette e vendita di accessori.",
    banca: "Banca dello Stato",
    soci: [
      { ...d.soci[0], nome: "Luca Rossi", domicilio: "Bellinzona", quote: 100 },
      { ...d.soci[1], nome: "Sara Bianchi", domicilio: "Giubiasco", quote: 100 },
    ],
  };
}

const ids = (c: { id: string }[]) => c.map((x) => x.id);

describe("passoDelControllo", () => {
  it("mette ogni controllo nel passo dove si corregge", () => {
    expect(passoDelControllo("ditta")).toBe("societa");
    expect(passoDelControllo("forma")).toBe("societa");
    expect(passoDelControllo("divisione")).toBe("capitale");
    expect(passoDelControllo("nome-socio-1")).toBe("soci");
    expect(passoDelControllo("quote-abc")).toBe("soci");
    expect(passoDelControllo("totale")).toBe("soci");
    expect(passoDelControllo("gerente-xyz")).toBe("direzione");
    expect(passoDelControllo("domicilio")).toBe("direzione");
    expect(passoDelControllo("revisione")).toBe("banca");
    expect(passoDelControllo("sconosciuto")).toBe("documenti");
  });
});

describe("controlliPerPasso", () => {
  it("con i dati iniziali divide gli errori per passo e l'ultimo passo li ha tutti", () => {
    const d = datiFondazioneIniziali();
    const perPasso = controlliPerPasso(d);
    const tutti = controllaFondazione(d);
    expect(ids(perPasso.societa.errori)).toEqual(["ditta", "sede", "scopo"]);
    expect(ids(perPasso.soci.errori)).toEqual(expect.arrayContaining(["nome-socio-1", "quote-socio-1", "totale"]));
    expect(ids(perPasso.banca.avvisi)).toEqual(["banca"]);
    expect(perPasso.documenti).toEqual(tutti);
    // Nessun controllo si perde tra i passi.
    const sommati = PASSI_SAGL.filter((p) => p.id !== "documenti").flatMap((p) => [
      ...perPasso[p.id].errori,
      ...perPasso[p.id].avvisi,
    ]);
    expect(sommati).toHaveLength(tutti.errori.length + tutti.avvisi.length);
  });

  it("i gerenti esterni senza nome e senza domicilio in Svizzera vanno in «Chi dirige»", () => {
    const d: DatiFondazione = {
      ...completi(),
      direzione: "gerenti",
      gerentiEsterni: [{ ...nuovoGerenteEsterno("g1"), domiciliatoInSvizzera: false }],
    };
    const perPasso = controlliPerPasso(d);
    expect(ids(perPasso.direzione.errori)).toEqual(["gerente-g1"]);
    expect(ids(perPasso.direzione.avvisi)).toEqual(["domicilio"]);
    expect(perPasso.societa).toEqual({ errori: [], avvisi: [] });
  });

  it("dati completi: nessun controllo in nessun passo", () => {
    const perPasso = controlliPerPasso(completi());
    for (const p of PASSI_SAGL) expect(perPasso[p.id]).toEqual({ errori: [], avvisi: [] });
  });
});

describe("riepilogoQuote", () => {
  it("dice quante quote ci sono e quante ne hanno i soci, alla svizzera", () => {
    expect(riepilogoQuote(completi())).toBe("Sono 200 quote da CHF 100.00. I soci ne hanno 200.");
    expect(riepilogoQuote({ ...completi(), capitale: 2_000_000, valoreQuota: 1 })).toBe(
      "Sono 2'000'000 quote da CHF 1.00. I soci ne hanno 200.",
    );
  });

  it("se il capitale non si divide in quote intere lo dice", () => {
    expect(riepilogoQuote({ ...completi(), valoreQuota: 300 })).toBe("Il capitale deve essere un numero intero di quote.");
    expect(riepilogoQuote({ ...completi(), valoreQuota: 0 })).toBe("Il capitale deve essere un numero intero di quote.");
  });
});
