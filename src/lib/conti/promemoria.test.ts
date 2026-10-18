import { describe, expect, it } from "vitest";
import { MASSIMO_PROMEMORIA as MASSIMO_PERCORSO } from "@/lib/percorso/promemoria";
import { MASSIMO_PROMEMORIA_FATTURE, PREFISSO_PROMEMORIA_FATTURA, pianificaPromemoriaFatture } from "./promemoria";

const fattura = (id: string, scadenza: string | null, pagataIl: string | null = null) => ({
  id,
  numero: `F-${id}`,
  cliente: "Rossi SA",
  scadenza,
  pagataIl,
});

describe("promemoria delle fatture sul telefono", () => {
  it("il mattino dopo la scadenza, alle 9, solo per le fatture non pagate", () => {
    const piano = pianificaPromemoriaFatture(
      [fattura("a", "2026-10-20"), fattura("b", "2026-10-25", "2026-10-19"), fattura("c", null)],
      "2026-10-18T14:30",
    );
    expect(piano).toEqual([
      {
        id: `${PREFISSO_PROMEMORIA_FATTURA}a`,
        quando: "2026-10-21T09:00",
        titolo: "La fattura F-a è scaduta ieri",
        testo:
          "Fattura per Rossi SA, da pagare entro il 20.10.2026. Se il pagamento non è ancora arrivato, in «I tuoi conti» Bleo ti prepara il sollecito.",
        scadenza: "2026-10-20",
      },
    ]);
  });

  it("salta i promemoria già passati: oggi dopo le 9 non arriva più", () => {
    const fatture = [fattura("ieri", "2026-10-17"), fattura("vecchia", "2026-09-01"), fattura("oggi", "2026-10-18")];
    expect(pianificaPromemoriaFatture(fatture, "2026-10-18T08:59").map((p) => p.id)).toEqual(["fattura-ieri", "fattura-oggi"]);
    expect(pianificaPromemoriaFatture(fatture, "2026-10-18T09:00").map((p) => p.id)).toEqual(["fattura-oggi"]);
  });

  it("niente doppioni: id stabili, una volta per fattura, in ordine di data", () => {
    const fatture = [fattura("b", "2026-11-30"), fattura("a", "2026-10-31"), fattura("a", "2026-10-31")];
    const primo = pianificaPromemoriaFatture(fatture, "2026-10-18T10:00");
    expect(primo.map((p) => [p.id, p.quando])).toEqual([
      ["fattura-a", "2026-11-01T09:00"],
      ["fattura-b", "2026-12-01T09:00"],
    ]);
    expect(pianificaPromemoriaFatture(fatture, "2026-10-19T10:00")).toEqual(primo);
  });

  it("ne tiene al massimo MASSIMO_PROMEMORIA_FATTURE, i più vicini, e resta sotto il limite di iOS", () => {
    const tante = Array.from({ length: 30 }, (_, i) => fattura(String(i), `2026-11-${String(i + 1).padStart(2, "0")}`));
    const piano = pianificaPromemoriaFatture(tante, "2026-10-18T10:00");
    expect(piano).toHaveLength(MASSIMO_PROMEMORIA_FATTURE);
    expect(piano[0]?.quando).toBe("2026-11-02T09:00");
    // 40 del percorso + 4 lunedì + fatture: iOS tiene al massimo 64 notifiche per app.
    expect(MASSIMO_PERCORSO + 4 + MASSIMO_PROMEMORIA_FATTURE).toBeLessThanOrEqual(64);
  });
});
