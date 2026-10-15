import { describe, expect, it } from "vitest";
import { ALTEZZA_A4_MM, ALTEZZA_SEZIONE_PAGAMENTO_MM, pagineDelFoglio, type BloccoStampa } from "./impaginazione";

const opzioni = { margineSopra: 15, margineSotto: 8, altezzaIntestazioneTabella: 6, tolleranza: 1 };

/** Intestazione di 60 mm, poi la tabella (intestazione 6 mm e righe da 7 mm), poi il totale da 20 mm. */
function fattura(righe: number, altezzaRiga = 7): BloccoStampa[] {
  const blocchi: BloccoStampa[] = [{ alto: 15, altezza: 60, inTabella: false }];
  let y = 75 + 6;
  blocchi.push({ alto: 75, altezza: 6, inTabella: false });
  for (let i = 0; i < righe; i++) {
    blocchi.push({ alto: y, altezza: altezzaRiga, inTabella: true });
    y += altezzaRiga;
  }
  blocchi.push({ alto: y + 4, altezza: 20, inTabella: false });
  return blocchi;
}

describe("pagineDelFoglio", () => {
  it("misure della QR-fattura: A4 e sezione pagamento di 105 mm", () => {
    expect(ALTEZZA_A4_MM).toBe(297);
    expect(ALTEZZA_SEZIONE_PAGAMENTO_MM).toBe(105);
  });

  it("poche voci: tutto su una pagina, sezione pagamento in fondo", () => {
    expect(pagineDelFoglio(fattura(3), opzioni)).toBe(1);
  });

  it("sotto il contenuto servono 105 mm più il margine: altrimenti una pagina in più", () => {
    // Fine del contenuto: 81 + 7n + 24. Con la sezione serve fine + 8 + 1 <= 192.
    // n = 11: 182 → sta; n = 12: 189 → non sta.
    expect(pagineDelFoglio(fattura(11), opzioni)).toBe(1);
    expect(pagineDelFoglio(fattura(12), opzioni)).toBe(2);
  });

  it("molte voci: le righe vanno a capo pagina con margini e intestazione ripetuti", () => {
    // Pagina 1: righe da 81 a 288 → 29 righe (81 + 29 × 7 = 284). Pagina 2: da 15 + 6 = 21.
    // 40 righe: 11 righe sulla pagina 2 (21 + 77 = 98), totale 102–122: sta sopra i 183.
    expect(pagineDelFoglio(fattura(40), opzioni)).toBe(2);
    // 52 righe: 23 righe sulla pagina 2 (fino a 182), il totale finisce a 206: la sezione va su una terza pagina.
    expect(pagineDelFoglio(fattura(52), opzioni)).toBe(3);
  });

  it("conta le righe spinte alla pagina dopo e l'intestazione ripetuta", () => {
    // Righe alte 20 mm: sulla pagina 1 ne stanno 10 (81 + 200 = 281), l'undicesima va alla pagina 2.
    // Senza simulazione (altezza continua 81 + 300 + 24 = 405) sembrerebbe bastare meno spazio.
    const blocchi = fattura(15, 20);
    // Pagina 2: 21 + 5 × 20 = 121, totale fino a 145: sta sopra i 183.
    expect(pagineDelFoglio(blocchi, opzioni)).toBe(2);
    // Con 17 righe: 21 + 7 × 20 = 161, totale fino a 185: la sezione non sta più.
    expect(pagineDelFoglio(fattura(17, 20), opzioni)).toBe(3);
  });

  it("senza sezione pagamento conta solo il contenuto", () => {
    expect(pagineDelFoglio(fattura(12), { ...opzioni, altezzaSezionePagamento: 0 })).toBe(1);
    expect(pagineDelFoglio(fattura(30), { ...opzioni, altezzaSezionePagamento: 0 })).toBe(2);
  });

  it("un blocco più alto di una pagina si spezza", () => {
    const blocchi: BloccoStampa[] = [{ alto: 15, altezza: 600, inTabella: false }];
    // 15 → 288 (273 mm), poi 15 → 288 (273), restano 54 mm sulla terza: 15 + 54 = 69, la sezione sta.
    expect(pagineDelFoglio(blocchi, opzioni)).toBe(3);
  });

  it("blocchi vuoti non contano", () => {
    expect(pagineDelFoglio([{ alto: 15, altezza: 0, inTabella: false }], opzioni)).toBe(1);
    expect(pagineDelFoglio([], opzioni)).toBe(1);
  });
});
