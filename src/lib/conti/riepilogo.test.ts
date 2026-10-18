import { describe, expect, it } from "vitest";
import { fonti, regole } from "@/data/svizzera";
import { QUOTA_AVVICINAMENTO_IVA, avvisiSoglie, riepilogo, statoFattura } from "./riepilogo";
import type { FatturaEmessa, Movimento } from "./tipi";

let contatore = 0;
function mov(campi: Partial<Movimento>): Movimento {
  contatore++;
  return {
    id: `m${contatore}`,
    tipo: "uscita",
    data: "2026-03-10",
    importo: 10,
    descrizione: "voce",
    controparte: null,
    categoria: "materiale",
    stato: "confermato",
    origine: "manuale",
    fatturaId: null,
    documentoId: null,
    nota: null,
    ...campi,
  };
}

function fattura(campi: Partial<FatturaEmessa>): FatturaEmessa {
  contatore++;
  return {
    id: `f${contatore}`,
    numero: `F${contatore}`,
    cliente: "Cliente",
    data: "2026-09-01",
    scadenza: "2026-10-01",
    importo: 100,
    stato: "aperta",
    pagataIl: null,
    riferimento: null,
    sollecito: null,
    ...campi,
  };
}

const OGGI = "2026-10-16";

describe("statoFattura", () => {
  it("pagata, scaduta dal giorno dopo la scadenza, altrimenti aperta", () => {
    expect(statoFattura({ pagataIl: "2026-10-01", scadenza: "2026-09-01" }, OGGI)).toBe("pagata");
    expect(statoFattura({ pagataIl: null, scadenza: "2026-10-15" }, OGGI)).toBe("scaduta");
    expect(statoFattura({ pagataIl: null, scadenza: OGGI }, OGGI)).toBe("aperta");
    expect(statoFattura({ pagataIl: null, scadenza: null }, OGGI)).toBe("aperta");
  });
});

describe("riepilogo", () => {
  it("contano solo i movimenti confermati dell'anno; i centesimi tornano esatti", () => {
    const r = riepilogo(
      [
        mov({ tipo: "entrata", categoria: "vendite", importo: 0.1, data: "2026-01-05" }),
        mov({ tipo: "entrata", categoria: "vendite", importo: 0.2, data: "2026-01-20" }),
        mov({ tipo: "uscita", categoria: "software", importo: 19.99, data: "2026-02-01" }),
        mov({ tipo: "uscita", categoria: "materiale", importo: 500, stato: "da_confermare" }),
        mov({ tipo: "uscita", categoria: "materiale", importo: 700, stato: "privato" }),
        mov({ tipo: "entrata", categoria: "vendite", importo: 1000, data: "2025-12-31" }),
        mov({ tipo: "uscita", categoria: "materiale", importo: 5, stato: "da_confermare", data: "2025-11-01" }),
      ],
      [],
      2026,
      OGGI,
    );
    expect(r.entrate).toBe(0.3);
    expect(r.uscite).toBe(19.99);
    expect(r.risultato).toBe(-19.69);
    // Le voci da confermare contano tutte, anche quelle di un altro anno.
    expect(r.daConfermare).toBe(2);
    expect(r.perMese).toHaveLength(12);
    expect(r.perMese[0]).toEqual({ mese: 1, entrate: 0.3, uscite: 0 });
    expect(r.perMese[1]).toEqual({ mese: 2, entrate: 0, uscite: 19.99 });
    expect(r.perCategoria).toEqual([
      { categoria: "software", importo: 19.99 },
      { categoria: "vendite", importo: 0.3 },
    ]);
    expect(r.avvisi).toEqual([]);
  });

  it("fatture aperte e scadute, anche degli anni prima; le pagate no", () => {
    const r = riepilogo(
      [],
      [
        fattura({ importo: 100, scadenza: "2026-11-15" }),
        fattura({ importo: 250.5, scadenza: "2026-10-01" }),
        fattura({ importo: 80, scadenza: "2025-12-31", data: "2025-12-01" }),
        fattura({ importo: 999, pagataIl: "2026-10-02" }),
      ],
      2026,
      OGGI,
    );
    expect(r.fattureAperte).toEqual({ numero: 1, importo: 100 });
    expect(r.fattureScadute).toEqual({ numero: 2, importo: 330.5 });
  });
});

describe("avvisi sulle soglie", () => {
  const soglia = regole.sogliaIva.valore;

  it("nessun avviso sotto la soglia di avvicinamento", () => {
    expect(avvisiSoglie(soglia * QUOTA_AVVICINAMENTO_IVA - 1, 2026)).toEqual([]);
  });

  it("IVA vicina e superata, con le fonti ufficiali e la cifra di src/data", () => {
    const vicina = avvisiSoglie(soglia * QUOTA_AVVICINAMENTO_IVA, 2026);
    expect(vicina.map((a) => a.id)).toEqual(["iva-vicina"]);
    expect(vicina[0]?.testo).toContain("CHF 100'000");
    expect(vicina[0]?.fonti).toEqual([
      { titolo: fonti.liva10.titolo, url: fonti.liva10.url },
      { titolo: fonti.afcAssoggettamento.titolo, url: fonti.afcAssoggettamento.url },
    ]);

    const superata = avvisiSoglie(soglia, 2026);
    expect(superata.map((a) => a.id)).toEqual(["iva-superata"]);
    expect(superata[0]?.testo).toContain("2026");
  });

  it("contabilità completa da CHF 500'000 (CO 957)", () => {
    const avvisi = avvisiSoglie(regole.sogliaContabilitaSemplificata.valore, 2026);
    expect(avvisi.map((a) => a.id)).toEqual(["iva-superata", "contabilita-completa"]);
    expect(avvisi[1]?.testo).toContain("CHF 500'000");
    expect(avvisi[1]?.fonti).toEqual([{ titolo: fonti.co957.titolo, url: fonti.co957.url }]);
  });

  it("ogni avviso ha almeno una fonte https", () => {
    for (const avviso of avvisiSoglie(1_000_000, 2026)) {
      expect(avviso.fonti.length).toBeGreaterThan(0);
      for (const f of avviso.fonti) expect(f.url).toMatch(/^https:\/\//);
    }
  });

  it("il riepilogo calcola gli avvisi sulle entrate confermate dell'anno", () => {
    const r = riepilogo([mov({ tipo: "entrata", categoria: "vendite", importo: soglia, data: "2026-06-01" })], [], 2026, OGGI);
    expect(r.avvisi.map((a) => a.id)).toEqual(["iva-superata"]);
  });
});
