import { describe, expect, it } from "vitest";
import { datiStrumenti, fonti, percentuale, supplementiTicino } from "@/data/svizzera";
import { calcolaBudget, datiBudgetIniziali, type DatiBudget } from "./budget";
import {
  cifraBudget,
  fontiBudget,
  notaFabbisogno,
  puntiBudget,
  riquadriBudget,
  righeBudget,
  righeContributi,
  righeMese,
  testoPareggio,
  totaleRiga,
} from "./budget-vista";
import { datiPianoIniziali, type DatiPiano } from "./business-plan";
import { htmlBudget, htmlBusinessPlan, nomeFilePiano } from "./stampa-piani";

const tutti = (valore: string) => Array.from({ length: 12 }, () => valore);

function budget(modifiche: Partial<DatiBudget> = {}): DatiBudget {
  return { ...datiBudgetIniziali("2026-10-19"), ...modifiche };
}

/** Primi mesi in rosso, poi si recupera: pareggio a metà anno. */
const conPareggio = () =>
  calcolaBudget(
    budget({
      meseInizio: "2027-01",
      ricavi: ["0", "0", "1000", ...tutti("6000").slice(3)],
      costiFissi: [{ id: "locali", descrizione: "Locali", importo: "1500" }],
      costiAvvio: [{ id: "pc", descrizione: "Computer", importo: "3000", mese: 0 }],
    }),
  ).risultato;

describe("budget pronto da mostrare", () => {
  it("toglie le righe sempre a zero, tiene quelle dei totali", () => {
    const r = conPareggio();
    const chiavi = righeBudget(r).map((x) => x.chiave);
    expect(chiavi).toContain("ricavi");
    expect(chiavi).toContain("costiAvvio");
    expect(chiavi).not.toContain("costiVariabili");
    expect(chiavi).not.toContain("prelievi");
    expect(chiavi.slice(-2)).toEqual(["flusso", "cumulato"]);
    // Nel secondo mese non ci sono costi di avvio.
    expect(righeMese(r, r.mesi[1]).map((x) => x.chiave)).not.toContain("costiAvvio");
    expect(totaleRiga(r, "cumulato")).toBe(r.mesi[11].cumulato);
    expect(totaleRiga(r, "ricavi")).toBe(r.totali.ricavi);
    expect(cifraBudget(-1250)).toBe("-1'250");
  });

  it("riquadri, pareggio e riserva per i mesi in rosso", () => {
    const r = conPareggio();
    expect(r.mesePareggio).not.toBeNull();
    expect(testoPareggio(r)).toMatch(/2027$/);
    const [ricavi, , pareggio, saldo] = riquadriBudget(r);
    expect(ricavi).toEqual({ etichetta: "Ricavi in 12 mesi", valore: "CHF 55'000" });
    expect(pareggio.valore).toBe(testoPareggio(r));
    expect(saldo.nota).toMatch(/^Punto più basso: -CHF|^Punto più basso: CHF -/);
    expect(notaFabbisogno(r)).toMatch(/Nel mese peggiore il saldo cumulato va sotto zero di CHF \d/);
    const tranquillo = calcolaBudget(budget({ ricavi: tutti("9000") })).risultato;
    expect(testoPareggio(tranquillo)).toBe("Dal primo mese");
    expect(notaFabbisogno(tranquillo)).toBeNull();
    expect(riquadriBudget(tranquillo)[3].nota).toBe("Mai sotto zero");
  });

  it("le note dicono la tavola usata e la riserva scelta", () => {
    const senza = puntiBudget(conPareggio());
    expect(senza[1]).toContain(`tavola ${conPareggio().annoAvs}`);
    expect(senza).toContain("Non hai indicato una riserva per le imposte: le imposte non sono nel saldo.");
    const conRiserva = calcolaBudget(budget({ ricavi: tutti("5000"), riservaImpostePercento: "12,5" })).risultato;
    expect(puntiBudget(conRiserva)[3]).toMatch(/^Riserva imposte: 12,5% del risultato dopo i contributi = CHF /);
  });

  it("i contributi usano le percentuali dei dati ufficiali", () => {
    const r = calcolaBudget(budget({ ricavi: tutti("5000") })).risultato;
    const righe = righeContributi(r.contributi);
    expect(righe[0].nota).toContain(`ai ${datiStrumenti.arrotondamentoRedditoAvs.valore} franchi inferiori`);
    expect(righe[2].etichetta).toContain(percentuale(supplementiTicino.speseAmministrative.valore));
    expect(righe[3].etichetta).toContain(percentuale(supplementiTicino.assegniFamiliari.valore, 2));
    expect(righe[5]).toMatchObject({ etichetta: "Totale all'anno", forte: true });
    expect(righe[5].valore).toBe(`CHF ${r.contributi.totale.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`);
  });

  it("fonti senza doppioni, con IVA e registro di commercio", () => {
    const elenco = fontiBudget(conPareggio());
    expect(new Set(elenco.map((f) => f.url)).size).toBe(elenco.length);
    expect(elenco).toContainEqual(fonti.avsPromemoria202);
    expect(elenco).toContainEqual(fonti.liva10);
    expect(elenco).toContainEqual(fonti.co931);
  });
});

describe("htmlBudget", () => {
  it("pagina A4 orizzontale con riepilogo, tabella dei 12 mesi, contributi e fonti", () => {
    const d = budget({ meseInizio: "2027-01", ricavi: tutti("5000") });
    const r = calcolaBudget(d).risultato;
    const html = htmlBudget(d, r, { oggiIso: "2026-10-19" });
    expect(html).toMatch(/^<!DOCTYPE html><html lang="it">/);
    expect(html).toContain("@page { size: A4 landscape; margin: 0; }");
    expect(html).toContain("Il tuo primo anno, gen 2027 – dic 2027");
    expect(html).toContain("19.10.2026");
    expect(html).toContain("Stima indicativa");
    expect(html).toContain("CHF 60&#39;000");
    expect(html).toContain("<th scope=\"col\">dic 2027</th>");
    expect(html).toContain(`Contributi sociali sui 12 mesi (tavola ${r.annoAvs})`);
    expect(html).toContain(fonti.avsPromemoria202.url);
    expect(html).toContain(fonti.albofiduciari.url);
    expect(html).toContain("fiduciario autorizzato");
  });

  it("mostra gli avvisi con le loro fonti", () => {
    const d = budget({ ricavi: tutti("10000") });
    const r = calcolaBudget(d).risultato;
    expect(r.avvisi.length).toBeGreaterThan(0);
    const html = htmlBudget(d, r, { oggiIso: "2026-10-19" });
    for (const a of r.avvisi) {
      expect(html).toContain(a.titolo.replace(/'/g, "&#39;"));
      for (const f of a.fonti) expect(html).toContain(f.url);
    }
  });
});

describe("htmlBusinessPlan", () => {
  const piano = (modifiche: Partial<DatiPiano> = {}): DatiPiano => ({ ...datiPianoIniziali(), ...modifiche });

  it("un foglio A4 con l'idea in evidenza e le altre risposte, testi sicuri", () => {
    const d = piano({
      nomeAttivita: "Siti <Rossi>",
      titolare: "Luca Rossi",
      campi: { ...datiPianoIniziali().campi, idea: "Siti web & foto", rischi: "<script>alert(1)</script>" },
    });
    const html = htmlBusinessPlan(d, { oggiIso: "2026-10-19" });
    expect(html).toContain("@page { size: A4; margin: 0; }");
    expect(html).toContain("<h1>Siti &lt;Rossi&gt;</h1>");
    expect(html).toContain("Luca Rossi");
    expect(html).toContain("19.10.2026");
    expect(html).toContain("Siti web &amp; foto");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Rischi e come li gestisci");
    expect(html).toContain("i numeri sono stime");
  });

  it("senza nome e senza risposte mostra i segnaposto", () => {
    const html = htmlBusinessPlan(piano(), { oggiIso: null });
    expect(html).toContain("<h1>La mia attività</h1>");
    expect(html).toContain('<span class="vuoto">…</span>');
  });

  it("nomi dei file PDF", () => {
    expect(nomeFilePiano("budget")).toBe("Budget del primo anno.pdf");
    expect(nomeFilePiano("business-plan", "Caffè dell'Università / Lugano")).toBe("Business plan Caffe dell-Universita - Lugano.pdf");
    expect(nomeFilePiano("business-plan", "  ")).toBe("Business plan.pdf");
  });
});
