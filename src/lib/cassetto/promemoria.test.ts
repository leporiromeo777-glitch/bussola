import { describe, expect, it } from "vitest";
import { MASSIMO_PROMEMORIA, pianificaPromemoria, type Promemoria } from "@/lib/percorso/promemoria";
import { DOCUMENTI_MASSIMI } from "./limiti";
import {
  analizzaScadenzeDocumenti,
  pianificaPromemoriaDocumenti,
  scadenzeDaDocumenti,
  unisciPromemoria,
  type ScadenzaDocumento,
} from "./promemoria";

const ADESSO = "2026-10-19T10:00";

function doc(id: string, scadeIl: string, titolo = `Documento ${id}`): ScadenzaDocumento {
  return { id, titolo, scadeIl };
}

describe("pianificaPromemoriaDocumenti", () => {
  it("avvisa 30 e 7 giorni prima della scadenza, alle 9", () => {
    const piano = pianificaPromemoriaDocumenti([doc("a", "2027-03-31", "Permesso B")], ADESSO);
    expect(piano.map((p) => p.quando)).toEqual(["2027-03-01T09:00", "2027-03-24T09:00"]);
    expect(piano.map((p) => p.id)).toEqual(["documento-a-30", "documento-a-7"]);
    expect(piano[0].titolo).toBe("«Permesso B» scade tra 30 giorni");
    expect(piano[1].titolo).toBe("«Permesso B» scade tra 7 giorni");
    expect(piano[0].testo).toContain("31.03.2027");
    expect(piano[0].scadenza).toBe("2027-03-31");
  });

  it("salta i promemoria già passati: con 20 giorni rimasti resta solo quello dei 7 giorni", () => {
    const piano = pianificaPromemoriaDocumenti([doc("a", "2026-11-08")], ADESSO);
    expect(piano.map((p) => p.id)).toEqual(["documento-a-7"]);
  });

  it("un promemoria di oggi alle 9 vale solo se non sono ancora le 9", () => {
    const scade = "2026-10-26"; // 7 giorni dopo il 19.10
    expect(pianificaPromemoriaDocumenti([doc("a", scade)], "2026-10-19T08:59").map((p) => p.quando)).toEqual([
      "2026-10-19T09:00",
    ]);
    expect(pianificaPromemoriaDocumenti([doc("a", scade)], "2026-10-19T09:00")).toEqual([]);
  });

  it("niente per i documenti scaduti, in scadenza tra meno di 7 giorni o con date non valide", () => {
    expect(pianificaPromemoriaDocumenti([doc("a", "2026-10-01"), doc("b", "2026-10-22"), doc("c", "2026-02-30")], ADESSO)).toEqual([]);
  });

  it("non duplica lo stesso documento e ordina per data", () => {
    const piano = pianificaPromemoriaDocumenti(
      [doc("tardi", "2027-06-30"), doc("presto", "2027-01-31"), doc("tardi", "2027-06-30")],
      ADESSO,
    );
    expect(piano.map((p) => p.id)).toEqual(["documento-presto-30", "documento-presto-7", "documento-tardi-30", "documento-tardi-7"]);
    expect(new Set(piano.map((p) => p.id)).size).toBe(piano.length);
  });
});

describe("unisciPromemoria", () => {
  it("unisce scadenze e documenti in ordine di tempo, senza doppioni", () => {
    const scadenze = pianificaPromemoria([{ uid: "iva", data: "2027-02-28", titolo: "IVA", descrizione: "" }], "2026-10-19");
    const documenti = pianificaPromemoriaDocumenti([doc("a", "2027-03-31")], ADESSO);
    const uniti = unisciPromemoria([scadenze, documenti, documenti]);
    expect(uniti.map((p) => p.id)).toEqual(["iva", "documento-a-30", "documento-a-7"]);
  });

  it("rispetta il massimo di notifiche programmate e tiene le più vicine", () => {
    const molti: ScadenzaDocumento[] = Array.from({ length: 40 }, (_, i) =>
      doc(`d${i}`, `2027-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`),
    );
    const documenti = pianificaPromemoriaDocumenti(molti, ADESSO);
    expect(documenti.length).toBe(80);
    const uniti = unisciPromemoria([documenti]);
    expect(uniti).toHaveLength(MASSIMO_PROMEMORIA);
    const quando = uniti.map((p) => p.quando);
    expect([...quando].sort()).toEqual(quando);
    expect(quando.at(-1)! <= documenti[MASSIMO_PROMEMORIA].quando).toBe(true);
    expect(unisciPromemoria([documenti], 0)).toEqual([]);
  });

  it("con un elenco vuoto non programma niente", () => {
    const nessuno: Promemoria[] = [];
    expect(unisciPromemoria([nessuno, nessuno])).toEqual([]);
  });
});

describe("scadenze salvate sul telefono", () => {
  it("tiene solo id, titolo e data dei documenti che scadono", () => {
    const salvate = scadenzeDaDocumenti([
      { id: "a", titolo: "Polizza RC", scadeIl: "2027-01-31", nota: "segreta" } as never,
      { id: "b", titolo: "Contratto", scadeIl: null },
    ]);
    expect(salvate).toEqual([{ id: "a", titolo: "Polizza RC", scadeIl: "2027-01-31" }]);
    expect(analizzaScadenzeDocumenti(JSON.stringify(salvate))).toEqual(salvate);
  });

  it("dati mancanti, rotti o troppi: elenco vuoto", () => {
    expect(analizzaScadenzeDocumenti(null)).toEqual([]);
    expect(analizzaScadenzeDocumenti("{non json")).toEqual([]);
    expect(analizzaScadenzeDocumenti(JSON.stringify([{ id: "a", titolo: "x", scadeIl: "domani" }]))).toEqual([]);
    const troppi = Array.from({ length: DOCUMENTI_MASSIMI + 1 }, (_, i) => doc(`d${i}`, "2027-01-01"));
    expect(analizzaScadenzeDocumenti(JSON.stringify(troppi))).toEqual([]);
  });
});
