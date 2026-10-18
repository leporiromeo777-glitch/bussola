import { describe, expect, it } from "vitest";
import { aggiornamentoSollecito, COLONNE_FATTURA, fatturaDaRiga, type RigaFattura } from "./righe";

const RIGA: RigaFattura = {
  id: "f1",
  numero: "F-2026-007",
  cliente: "Rossi SA",
  data: "2026-09-15",
  scadenza: "2026-10-15",
  importo_centesimi: "125050",
  pagata_il: null,
  riferimento: "210000000003139471430009017",
  sollecito_il: null,
  sollecito_livello: null,
};

describe("fatture dal database", () => {
  it("legge riferimento e sollecito, con lo stato di oggi", () => {
    expect(COLONNE_FATTURA).toContain("riferimento");
    expect(COLONNE_FATTURA).toContain("sollecito_il");
    expect(COLONNE_FATTURA).toContain("sollecito_livello");
    expect(fatturaDaRiga(RIGA, "2026-10-18")).toEqual({
      id: "f1",
      numero: "F-2026-007",
      cliente: "Rossi SA",
      data: "2026-09-15",
      scadenza: "2026-10-15",
      importo: 1250.5,
      stato: "scaduta",
      pagataIl: null,
      riferimento: "210000000003139471430009017",
      sollecito: null,
    });
    expect(fatturaDaRiga({ ...RIGA, sollecito_il: "2026-10-16", sollecito_livello: 2 }, "2026-10-18").sollecito).toEqual({
      livello: 2,
      inviatoIl: "2026-10-16",
    });
    // Un livello che non conosciamo non diventa un sollecito.
    expect(fatturaDaRiga({ ...RIGA, sollecito_il: "2026-10-16", sollecito_livello: 7 }, "2026-10-18").sollecito).toBeNull();
  });

  it("segna e toglie il sollecito", () => {
    const adesso = "2026-10-18T10:00:00.000Z";
    expect(aggiornamentoSollecito({ livello: 1, inviatoIl: "2026-10-18" }, adesso)).toEqual({
      sollecito_il: "2026-10-18",
      sollecito_livello: 1,
      aggiornato_il: adesso,
    });
    expect(aggiornamentoSollecito(null, adesso)).toEqual({ sollecito_il: null, sollecito_livello: null, aggiornato_il: adesso });
  });
});
