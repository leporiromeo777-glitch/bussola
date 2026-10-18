import { describe, expect, it } from "vitest";
import { tavoleScalari } from "@/data/avs-tavola-scalare";
import { fonti, fontiStrumenti, regolePercorso, VERIFICATO_DA_PARTE } from "@/data/svizzera";
import { codifica, decodifica } from "@/lib/strumenti/archivio";
import { stimaContributi } from "@/lib/strumenti/avs";
import { arrotonda } from "@/lib/strumenti/numeri";
import {
  calcolaDaParte,
  conAnno,
  fontiDaParte,
  impostazioniAnno,
  impostazioniIniziali,
  lezioniDaParte,
  periodo,
  primoMeseConVoci,
  schemaImpostazioniDaParte,
  sottotitoloDaParte,
  spiegazioneUtile,
  verificatoDaParte,
  type DatiConti,
  type ImpostazioniDaParte,
} from "./da-parte";

/** Riepilogo minimo: entrate e uscite per mese (indice 0 = gennaio). */
function conti(anno: number, mesi: Record<number, { entrate?: number; uscite?: number }>): DatiConti {
  const perMese = Array.from({ length: 12 }, (_, i) => ({ mese: i + 1, entrate: mesi[i + 1]?.entrate ?? 0, uscite: mesi[i + 1]?.uscite ?? 0 }));
  const entrate = arrotonda(perMese.reduce((s, m) => s + m.entrate, 0));
  const uscite = arrotonda(perMese.reduce((s, m) => s + m.uscite, 0));
  return { anno, entrate, uscite, risultato: arrotonda(entrate - uscite), perMese };
}

/** Ogni mese da gennaio a `fino` con lo stesso utile. */
function mesiUguali(anno: number, fino: number, entrate: number, uscite: number): DatiConti {
  const mesi: Record<number, { entrate: number; uscite: number }> = {};
  for (let m = 1; m <= fino; m++) mesi[m] = { entrate, uscite };
  return conti(anno, mesi);
}

function imp(campi: Partial<ImpostazioniDaParte> = {}): ImpostazioniDaParte {
  return { ...impostazioniIniziali(), ...campi };
}

const OTTOBRE = "2026-10-18";

describe("proiezione dell'utile sull'anno", () => {
  it("da gennaio: utile finora ÷ mesi passati × 12 (il mese in corso conta)", () => {
    const { stima: s, errori } = calcolaDaParte(mesiUguali(2026, 10, 4_000, 1_000), OTTOBRE, imp());
    expect(errori).toEqual({});
    expect(s.annoInCorso).toBe(true);
    expect(s.vuoto).toBe(false);
    expect(s.meseInizio).toBe(1);
    expect(s.meseFine).toBe(10);
    expect(s.mesiPassati).toBe(10);
    expect(s.mesiMancanti).toBe(2);
    expect(s.mesiAttivita).toBe(12);
    expect(s.utileFinora).toBe(30_000);
    expect(s.mediaMensile).toBe(3_000);
    expect(s.utileAnno).toBe(36_000);
    expect(s.pocoAffidabile).toBe(false);
    expect(spiegazioneUtile(s)).toBe(
      "Da gennaio a ottobre (10 mesi) il risultato è CHF 30'000: in media CHF 3'000 al mese. Se continua così, con i 2 mesi che mancano a dicembre nel 2026 arrivi a circa CHF 36'000.",
    );
  });

  it("gennaio: un solo mese, la stima è × 12 ed è segnata come poco affidabile", () => {
    const { stima: s } = calcolaDaParte(conti(2027, { 1: { entrate: 2_500, uscite: 500 } }), "2027-01-20", imp());
    expect(s.mesiPassati).toBe(1);
    expect(s.mesiMancanti).toBe(11);
    expect(s.utileAnno).toBe(24_000);
    expect(s.annoAvs).toBe(2027);
    expect(s.pocoAffidabile).toBe(true);
    expect(periodo(s)).toBe("a gennaio");
  });

  it("attività iniziata durante l'anno: contano solo i mesi da quando lavori (il reddito non si riporta su 12 mesi)", () => {
    const dati = conti(2026, { 8: { entrate: 3_000 }, 9: { entrate: 2_000 }, 10: { entrate: 4_000, uscite: 3_000 } });
    const { stima: s } = calcolaDaParte(dati, OTTOBRE, imp());
    // Bleo parte dal mese della prima voce, agosto.
    expect(s.meseInizio).toBe(8);
    expect(s.meseInizioAutomatico).toBe(true);
    expect(s.mesiPassati).toBe(3);
    expect(s.mesiAttivita).toBe(5);
    expect(s.utileFinora).toBe(6_000);
    expect(s.mediaMensile).toBe(2_000);
    expect(s.utileAnno).toBe(10_000);
    expect(periodo(s)).toBe("da agosto a ottobre");
    expect(s.pocoAffidabile).toBe(false);
  });

  it("il mese di inizio scelto vince su quello automatico, ma non va oltre questo mese", () => {
    const dati = conti(2026, { 8: { entrate: 3_000 } });
    const daGennaio = calcolaDaParte(dati, OTTOBRE, conAnno(imp(), 2026, { meseInizio: 1 })).stima;
    expect(daGennaio.meseInizio).toBe(1);
    expect(daGennaio.meseInizioAutomatico).toBe(false);
    expect(daGennaio.utileAnno).toBe(3_600);
    const nelFuturo = calcolaDaParte(dati, OTTOBRE, conAnno(imp(), 2026, { meseInizio: 12 })).stima;
    expect(nelFuturo.meseInizio).toBe(10);
    expect(nelFuturo.mesiPassati).toBe(1);
  });

  it("un anno passato si conta tutto, senza proiezione; senza tavola si usa la più vicina", () => {
    const { stima: s } = calcolaDaParte(mesiUguali(2025, 12, 2_000, 500), OTTOBRE, imp());
    expect(s.annoInCorso).toBe(false);
    expect(s.meseFine).toBe(12);
    expect(s.mesiMancanti).toBe(0);
    expect(s.utileAnno).toBe(18_000);
    expect(s.annoAvs).toBe(2026);
    expect(s.annoAvsApprossimato).toBe(true);
    expect(s.pocoAffidabile).toBe(false);
    expect(s.alMese.totale).toBe(arrotonda(s.totaleAnno / 12));
    expect(s.finora.totale).toBe(s.totaleAnno);
    expect(spiegazioneUtile(s)).toContain("è l'utile del 2025");
  });

  it("primo mese con voci", () => {
    expect(primoMeseConVoci(conti(2026, {}).perMese)).toBeNull();
    expect(primoMeseConVoci(conti(2026, { 5: { uscite: 10 }, 9: { entrate: 1 } }).perMese)).toBe(5);
  });
});

describe("contributi AVS: si riusa la stima ufficiale", () => {
  it("stessi numeri di stimaContributi sull'utile stimato dell'anno (con i supplementi ticinesi)", () => {
    const { stima: s } = calcolaDaParte(mesiUguali(2026, 10, 4_000, 1_000), OTTOBRE, imp());
    expect(s.contributi).toEqual(stimaContributi(36_000, 2026, "principale"));
    expect(s.contributi.assegniFamiliari).toBeGreaterThan(0);
    expect(s.avsAnno).toBe(s.contributi.totale);
    expect(s.alMese.avs).toBe(arrotonda(s.contributi.totale / 12));
    expect(s.finora.avs).toBe(arrotonda((s.contributi.totale * 10) / 12));
  });

  it("attività accessoria con utile basso: niente contributi (solo su richiesta)", () => {
    const { stima: s } = calcolaDaParte(conti(2026, { 1: { entrate: 1_000 } }), "2026-12-15", imp({ situazione: "accessoria" }));
    expect(s.utileAnno).toBe(1_000);
    expect(s.contributi.caso).toBe("suRichiesta");
    expect(s.totaleAnno).toBe(0);
  });

  it("gli acconti si tolgono, mai sotto zero", () => {
    const dati = mesiUguali(2026, 10, 4_000, 1_000);
    const totale = stimaContributi(36_000, 2026).totale;
    const conAcconti = calcolaDaParte(dati, OTTOBRE, conAnno(imp(), 2026, { accontiAvs: "2'500" })).stima;
    expect(conAcconti.accontiAvs).toBe(2_500);
    expect(conAcconti.avsAnno).toBe(arrotonda(totale - 2_500));
    expect(conAcconti.avvisi.map((a) => a.id)).toEqual([]);

    const troppi = calcolaDaParte(dati, OTTOBRE, conAnno(imp(), 2026, { accontiAvs: "9000" })).stima;
    expect(troppi.avsAnno).toBe(0);
    expect(troppi.avvisi.map((a) => a.id)).toEqual(["acconti-coprono"]);
  });

  it("acconti sotto il 75% della stima: avviso con gli interessi di mora e le fonti", () => {
    const dati = mesiUguali(2026, 10, 4_000, 1_000);
    const totale = stimaContributi(36_000, 2026).totale;
    const bassi = arrotonda(totale * regolePercorso.sogliaAccontiAvs.valore - 1);
    const { stima: s } = calcolaDaParte(dati, OTTOBRE, conAnno(imp(), 2026, { accontiAvs: String(bassi) }));
    const avviso = s.avvisi.find((a) => a.id === "acconti-bassi");
    expect(avviso?.livello).toBe("attenzione");
    expect(avviso?.testo).toContain("75%");
    expect(avviso?.testo).toContain("5%");
    expect(avviso?.testo).toContain("01.01.2028");
    expect(avviso?.testo).toContain("25%");
    expect(avviso?.fonti.map((f) => f.url)).toContain(fonti.avsPromemoria202.url);
  });

  it("acconti non validi: errore sul campo e si conta senza", () => {
    const { stima: s, errori } = calcolaDaParte(mesiUguali(2026, 10, 4_000, 1_000), OTTOBRE, conAnno(imp(), 2026, { accontiAvs: "tanti" }));
    expect(errori.accontiAvs).toBeDefined();
    expect(s.accontiAvs).toBeNull();
    expect(s.avsAnno).toBe(s.contributi.totale);
    expect(calcolaDaParte(mesiUguali(2026, 10, 4_000, 1_000), OTTOBRE, conAnno(imp(), 2026, { accontiAvs: "-5" })).errori.accontiAvs).toBeDefined();
  });

  it("gli acconti valgono solo per il loro anno", () => {
    const impostazioni = conAnno(imp(), 2025, { accontiAvs: "1'000" });
    const { stima: s } = calcolaDaParte(mesiUguali(2026, 10, 4_000, 1_000), OTTOBRE, impostazioni);
    expect(s.accontiAvs).toBeNull();
  });
});

describe("riserva per le imposte: la percentuale la sceglie l'utente", () => {
  const dati = mesiUguali(2026, 10, 4_000, 1_000);

  it("vuota: nessuna riserva, solo AVS", () => {
    const { stima: s, errori } = calcolaDaParte(dati, OTTOBRE, imp());
    expect(errori).toEqual({});
    expect(s.riservaPercento).toBeNull();
    expect(s.imposteAnno).toBe(0);
    expect(s.totaleAnno).toBe(s.avsAnno);
  });

  it("percentuale dell'utile dopo i contributi, come nel budget; al mese e finora", () => {
    const { stima: s } = calcolaDaParte(dati, OTTOBRE, imp({ riservaImpostePercento: "12,5" }));
    const contributi = stimaContributi(36_000, 2026).totale;
    expect(s.riservaPercento).toBe(12.5);
    expect(s.baseImposte).toBe(arrotonda(36_000 - contributi));
    expect(s.imposteAnno).toBe(arrotonda(((36_000 - contributi) * 12.5) / 100));
    expect(s.totaleAnno).toBe(arrotonda(contributi + s.imposteAnno));
    expect(s.alMese.totale).toBe(arrotonda(s.totaleAnno / 12));
    expect(s.finora.totale).toBe(arrotonda((s.totaleAnno * 10) / 12));
    expect(s.alMese.imposte).toBe(arrotonda(s.imposteAnno / 12));
  });

  it("gli acconti AVS non cambiano la base delle imposte", () => {
    const senza = calcolaDaParte(dati, OTTOBRE, imp({ riservaImpostePercento: "15" })).stima;
    const con = calcolaDaParte(dati, OTTOBRE, conAnno(imp({ riservaImpostePercento: "15" }), 2026, { accontiAvs: "1000" })).stima;
    expect(con.imposteAnno).toBe(senza.imposteAnno);
  });

  it.each(["abc", "-1", "81", "1'000"])("«%s» non è valida: errore e nessuna riserva", (testo) => {
    const { stima: s, errori } = calcolaDaParte(dati, OTTOBRE, imp({ riservaImpostePercento: testo }));
    expect(errori.riservaImpostePercento).toContain("80");
    expect(s.riservaPercento).toBeNull();
    expect(s.imposteAnno).toBe(0);
  });

  it("0% e 80% sono ammessi", () => {
    expect(calcolaDaParte(dati, OTTOBRE, imp({ riservaImpostePercento: "0" })).stima.imposteAnno).toBe(0);
    expect(calcolaDaParte(dati, OTTOBRE, imp({ riservaImpostePercento: "80%" })).stima.riservaPercento).toBe(80);
  });
});

describe("frase sotto la cifra", () => {
  const dati = mesiUguali(2026, 10, 4_000, 1_000);

  it("senza percentuale, con percentuale, con acconti, anno passato", () => {
    expect(sottotitoloDaParte(calcolaDaParte(dati, OTTOBRE, imp()).stima)).toBe("per i contributi AVS: le imposte non sono ancora incluse");
    const conImposte = calcolaDaParte(dati, OTTOBRE, imp({ riservaImpostePercento: "15" })).stima;
    expect(sottotitoloDaParte(conImposte)).toMatch(/^CHF \d+ per i contributi AVS e CHF \d+ per le imposte$/);
    const conAcconti = calcolaDaParte(dati, OTTOBRE, conAnno(imp({ riservaImpostePercento: "15" }), 2026, { accontiAvs: "2500" })).stima;
    expect(sottotitoloDaParte(conAcconti)).toMatch(/^CHF \d+ per i contributi AVS \(oltre agli acconti\) e CHF \d+ per le imposte$/);
    const zeroImposte = calcolaDaParte(dati, OTTOBRE, imp({ riservaImpostePercento: "0" })).stima;
    expect(sottotitoloDaParte(zeroImposte)).toBe("per i contributi AVS");
    const passato = calcolaDaParte(mesiUguali(2025, 12, 2_000, 500), OTTOBRE, imp({ riservaImpostePercento: "10" })).stima;
    expect(sottotitoloDaParte(passato)).toMatch(/^circa CHF \d+ al mese, per i contributi AVS e per le imposte$/);
  });
});

describe("casi limite", () => {
  it("nessuna voce confermata: vuoto, senza avvisi", () => {
    const { stima: s } = calcolaDaParte(conti(2026, {}), OTTOBRE, imp({ riservaImpostePercento: "20" }));
    expect(s.vuoto).toBe(true);
    expect(s.meseInizio).toBe(1);
    expect(s.utileAnno).toBe(0);
    expect(s.imposteAnno).toBe(0);
    expect(s.avvisi).toEqual([]);
  });

  it("perdita: contributo minimo AVS, niente imposte, avviso", () => {
    const { stima: s } = calcolaDaParte(mesiUguali(2026, 4, 500, 1_500), "2026-04-02", imp({ riservaImpostePercento: "20" }));
    expect(s.utileFinora).toBe(-4_000);
    expect(s.utileAnno).toBe(-12_000);
    expect(s.contributi.caso).toBe("minimo");
    expect(s.avsAnno).toBe(stimaContributi(0, 2026).totale);
    expect(s.baseImposte).toBe(0);
    expect(s.imposteAnno).toBe(0);
    expect(s.avvisi.map((a) => a.id)).toEqual(["perdita"]);
    expect(s.avvisi[0]?.testo).toContain("CHF 530");
  });

  it("utile basso, sotto il contributo minimo: la base delle imposte non va sotto zero", () => {
    const { stima: s } = calcolaDaParte(conti(2026, { 1: { entrate: 300 } }), "2026-12-01", imp({ riservaImpostePercento: "10" }));
    expect(s.utileAnno).toBe(300);
    expect(s.baseImposte).toBe(0);
    expect(s.imposteAnno).toBe(0);
  });

  it("data di oggi strana: non si rompe", () => {
    const { stima: s } = calcolaDaParte(mesiUguali(2026, 1, 100, 0), "2026-xx-01", imp());
    expect(s.meseFine).toBe(1);
    expect(Number.isFinite(s.totaleAnno)).toBe(true);
  });
});

describe("impostazioni salvate sul dispositivo", () => {
  it("andata e ritorno con l'archivio locale", () => {
    const impostazioni = conAnno(imp({ situazione: "accessoria", riservaImpostePercento: "15" }), 2026, { meseInizio: 8, accontiAvs: "1'200" });
    expect(decodifica(codifica(impostazioni), schemaImpostazioniDaParte, impostazioniIniziali)).toEqual(impostazioni);
  });

  it("dati rovinati tornano ai valori iniziali, campo per campo", () => {
    const grezzo = JSON.stringify({
      v: 1,
      dati: {
        situazione: "altro",
        riservaImpostePercento: 15,
        anni: { "2026": { meseInizio: 13, accontiAvs: "500" }, "26": { meseInizio: 1, accontiAvs: "" }, "2025": "rotto" },
      },
    });
    expect(decodifica(grezzo, schemaImpostazioniDaParte, impostazioniIniziali)).toEqual({
      situazione: "principale",
      riservaImpostePercento: "",
      anni: { "2026": { meseInizio: null, accontiAvs: "500" } },
    });
    expect(decodifica("{rotto", schemaImpostazioniDaParte, impostazioniIniziali)).toEqual(impostazioniIniziali());
  });

  it("conAnno cambia un solo anno e tiene gli ultimi 10", () => {
    let impostazioni = imp();
    for (let anno = 2010; anno <= 2026; anno++) impostazioni = conAnno(impostazioni, anno, { accontiAvs: String(anno) });
    impostazioni = conAnno(impostazioni, 2026, { meseInizio: 3 });
    expect(Object.keys(impostazioni.anni)).toHaveLength(10);
    expect(impostazioniAnno(impostazioni, 2026)).toEqual({ meseInizio: 3, accontiAvs: "2026" });
    expect(impostazioniAnno(impostazioni, 2010)).toEqual({ meseInizio: null, accontiAvs: "" });
  });
});

describe("fonti, data di controllo e lezioni", () => {
  it("fonti ufficiali https, senza doppioni, con la tavola, l'OAVS art. 22 e il calcolatore AFC", () => {
    for (const anno of [2026, 2027] as const) {
      const elenco = fontiDaParte(anno);
      expect(new Set(elenco.map((f) => f.url)).size).toBe(elenco.length);
      for (const f of elenco) expect(f.url).toMatch(/^https:\/\//);
      const url = elenco.map((f) => f.url);
      expect(url).toContain(tavoleScalari[anno].fonte.url);
      expect(url).toContain(fontiStrumenti.oavs22.url);
      expect(url).toContain(fontiStrumenti.afcCalcolatoreImposte.url);
      expect(url).toContain(fonti.albofiduciari.url);
    }
  });

  it("la data di controllo è la più vecchia tra i dati usati", () => {
    const data = verificatoDaParte(2026);
    expect(data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data <= VERIFICATO_DA_PARTE).toBe(true);
    expect(data <= tavoleScalari[2026].verificatoIl).toBe(true);
  });

  it("le lezioni 19 e 20 del corso", () => {
    expect(lezioniDaParte().map((l) => [l.passoId, l.numero])).toEqual([
      ["acconti-avs", 19],
      ["acconti-imposte", 20],
    ]);
  });
});
