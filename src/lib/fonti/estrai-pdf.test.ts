import { describe, expect, it } from "vitest";
import { pagineInBlocchi } from "./estrai-pdf";

describe("pagineInBlocchi", () => {
  it("riconosce titoli di sezione e domande numerate, anche su due righe", () => {
    const pagine = [
      [
        "3",
        "Gli indipendenti",
        "1 Quali lavoratori sono considerati indipendenti?",
        "Sono considerati indipendenti i lavoratori che",
        "• agiscono verso l'esterno con una propria ragione sociale:",
        "vale a dire che si presentano pubblicamente come ditta.",
        "• assumono il proprio rischio economico.",
        "6 I tassi di contribuzione sono identici per tutte",
        "le categorie di reddito?",
        "No. Per i redditi annui inferiori vale la tavola scalare.",
      ].join("\n"),
    ];
    expect(pagineInBlocchi(pagine)).toEqual([
      { tipo: "titolo", livello: 2, testo: "Gli indipendenti" },
      { tipo: "titolo", livello: 3, testo: "1 Quali lavoratori sono considerati indipendenti?" },
      { tipo: "paragrafo", testo: "Sono considerati indipendenti i lavoratori che" },
      {
        tipo: "punto",
        testo: "agiscono verso l'esterno con una propria ragione sociale: vale a dire che si presentano pubblicamente come ditta.",
      },
      { tipo: "punto", testo: "assumono il proprio rischio economico." },
      { tipo: "titolo", livello: 3, testo: "6 I tassi di contribuzione sono identici per tutte le categorie di reddito?" },
      { tipo: "paragrafo", testo: "No. Per i redditi annui inferiori vale la tavola scalare." },
    ]);
  });

  it("unisce le righe di un paragrafo e le parole spezzate dal trattino, anche tra pagine", () => {
    const pagine = ["1\nLe persone attive devono pagare contri-\nbuti dal 1° gennaio", "2\ndell'anno successivo."];
    expect(pagineInBlocchi(pagine)).toEqual([
      { tipo: "paragrafo", testo: "Le persone attive devono pagare contributi dal 1° gennaio dell'anno successivo." },
    ]);
  });

  it("non scambia le note a piè di pagina per domande numerate", () => {
    const pagine = [
      [
        "1",
        "Accordo del 21 giugno 1999 tra la Confederazione Svizzera e la Comunità europea",
        "1 Accordo del 21 giugno 1999 tra la Confederazione Svizzera, da una parte, e la",
        "Comunità europea, dall'altra, sulla libera circolazione delle persone (RS 0.142.112.681).",
        "3 Ordinanza del 30 marzo 1994 sugli impianti elettrici a corrente forte (RS 734.2)",
        "4 Ordinanza concernente l'attività di guida alpina",
        "(RS 935.911; di seguito: ordinanza sulle attività a rischio)",
        "5 Quali attività sono regolamentate?",
      ].join("\n"),
    ];
    expect(pagineInBlocchi(pagine)).toEqual([
      {
        tipo: "paragrafo",
        testo:
          "Accordo del 21 giugno 1999 tra la Confederazione Svizzera e la Comunità europea 1 Accordo del 21 giugno 1999 tra la Confederazione Svizzera, da una parte, e la Comunità europea, dall'altra, sulla libera circolazione delle persone (RS 0.142.112.681). 3 Ordinanza del 30 marzo 1994 sugli impianti elettrici a corrente forte (RS 734.2) 4 Ordinanza concernente l'attività di guida alpina (RS 935.911; di seguito: ordinanza sulle attività a rischio)",
      },
      { tipo: "titolo", livello: 3, testo: "5 Quali attività sono regolamentate?" },
    ]);
  });

  it("non scambia righe di tabelle o frasi per titoli", () => {
    const pagine = ["2016 0,0 %\n10 100 17 600 5,371\n64 anni e 3 mesi\n12 Interessi di mora sul successivo utile."];
    expect(pagineInBlocchi(pagine).every((b) => b.tipo === "paragrafo")).toBe(true);
  });
});
