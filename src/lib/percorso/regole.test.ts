import { describe, expect, it } from "vitest";
import { FASI, PASSI, type IdPasso } from "@/data/passi";
import { avsIndipendenti, chf, fonti, fontiPercorso } from "@/data/svizzera";
import { avanzamento, calcolaPercorso, prossimoPasso, VERSIONE_REGOLE, type Percorso, type StatoPasso } from "./regole";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";

/** Una persona "media": grafica a Lugano, da sola, molti clienti, 40k, svizzera. */
function risposte(modifiche: Partial<Risposte> = {}): Risposte {
  return {
    versione: VERSIONE_RISPOSTE,
    attivita: "digitale_creativo",
    cantone: "TI",
    soci: "solo",
    fatturato: "da_10k_a_60k",
    clienti: "molti",
    impiego: "no",
    avviata: "no",
    permesso: "svizzero_c",
    locali: "no",
    venditaOnline: "no",
    ...modifiche,
  };
}

function passo(percorso: Percorso, id: IdPasso) {
  const trovato = percorso.passi.find((p) => p.passo.id === id);
  if (!trovato) throw new Error(`Passo mancante: ${id}`);
  return trovato;
}

function stato(modifiche: Partial<Risposte>, id: IdPasso): StatoPasso {
  return passo(calcolaPercorso(risposte(modifiche)), id).stato;
}

function idAvvisi(percorso: Percorso) {
  return percorso.avvisi.map((a) => a.id);
}

function idScadenze(percorso: Percorso) {
  return percorso.scadenze.map((s) => s.id);
}

function testoCompleto(percorso: Percorso, id: IdPasso) {
  const p = passo(percorso, id);
  return [p.perche, ...p.note].join(" ");
}

describe("struttura del percorso", () => {
  it("contiene ogni passo del catalogo una volta sola, con la versione delle regole", () => {
    const percorso = calcolaPercorso(risposte());
    expect(percorso.versioneRegole).toBe(VERSIONE_REGOLE);
    expect(percorso.passi.map((p) => p.passo.id).sort()).toEqual(PASSI.map((p) => p.id).sort());
  });

  it("ordina i passi per fase, poi nell'ordine del catalogo", () => {
    const percorso = calcolaPercorso(risposte());
    const indiciFase = percorso.passi.map((p) => FASI.indexOf(p.passo.fase));
    expect(indiciFase).toEqual([...indiciFase].sort((a, b) => a - b));
    expect(percorso.passi[0].passo.id).toBe("ditta-individuale");
  });

  it("è deterministico: stesse risposte, stesso risultato", () => {
    expect(calcolaPercorso(risposte())).toEqual(calcolaPercorso(risposte()));
  });

  it("dà a ogni passo un perché non vuoto", () => {
    const percorso = calcolaPercorso(risposte({ soci: "con_soci", cantone: "altro", permesso: "altro" }));
    for (const p of percorso.passi) expect(p.perche.length).toBeGreaterThan(10);
  });

  it("non usa formule di consulenza personale", () => {
    const tutte: Partial<Risposte>[] = [
      {},
      { soci: "con_soci" },
      { fatturato: "almeno_100k", clienti: "uno", impiego: "pieno", avviata: "oltre_3_mesi" },
      { cantone: "GR", permesso: "g", attivita: "ristorazione_alimentari", locali: "si", venditaOnline: "si" },
    ];
    for (const m of tutte) {
      const percorso = calcolaPercorso(risposte(m));
      const testi = [
        ...percorso.passi.flatMap((p) => [p.perche, ...p.note]),
        ...percorso.avvisi.map((a) => a.testo),
      ].join(" ");
      expect(testi).not.toMatch(/ti consigliamo|ti consiglio|ti raccomandiamo/i);
    }
  });

  it("ogni avviso e ogni scadenza hanno almeno una fonte https", () => {
    const percorso = calcolaPercorso(
      risposte({ fatturato: "almeno_100k", clienti: "uno", permesso: "g", attivita: "salute_benessere" }),
    );
    for (const x of [...percorso.avvisi, ...percorso.scadenze]) {
      expect(x.fonti.length).toBeGreaterThan(0);
      for (const f of x.fonti) expect(f.url).toMatch(/^https:\/\//);
    }
  });
});

describe("regole: autorizzazioni di settore", () => {
  it("ristorazione in Ticino: autorizzazione LEAR da fare e avviso", () => {
    const percorso = calcolaPercorso(risposte({ attivita: "ristorazione_alimentari" }));
    expect(passo(percorso, "autorizzazione-esercizio-pubblico").stato).toBe("da_fare");
    const avviso = percorso.avvisi.find((a) => a.id === "autorizzazione-ristorazione");
    expect(avviso?.livello).toBe("importante");
    expect(avviso?.fonti).toContain(fontiPercorso.lear);
  });

  it("LEAR: autorizzazione all'art. 5, diploma del gerente all'art. 9 e di regola, con eccezioni", () => {
    const percorso = calcolaPercorso(risposte({ attivita: "ristorazione_alimentari" }));
    const p = passo(percorso, "autorizzazione-esercizio-pubblico");
    expect(p.passo.descrizione).toContain("(LEAR, art. 5)");
    expect(p.passo.descrizione).toContain("(LEAR, art. 9)");
    expect(p.passo.descrizione).toMatch(/Di regola serve anche un gerente/);
    expect(p.passo.descrizione).toMatch(/tre anni di pratica/);
    expect(p.passo.cosaFare[0]).toBe("Leggi gli artt. 5 e 9 della LEAR.");
    expect(p.passo.fonti).toEqual(expect.arrayContaining([fontiPercorso.lear, fontiPercorso.rlear]));
    expect(fontiPercorso.lear.titolo).toContain("artt. 5 e 9");
    const avviso = percorso.avvisi.find((a) => a.id === "autorizzazione-ristorazione");
    expect(avviso?.testo).toMatch(/di regola serve un gerente/);
    expect(avviso?.testo).toMatch(/eccezioni/);
  });

  it("ristorazione fuori dal Ticino: l'autorizzazione serve lo stesso, con la procedura del proprio Cantone", () => {
    for (const cantone of ["GR", "altro"] as const) {
      const p = passo(
        calcolaPercorso(risposte({ attivita: "ristorazione_alimentari", cantone })),
        "autorizzazione-esercizio-pubblico",
      );
      expect(p.stato).toBe("da_fare");
      expect(p.perche).toMatch(/autorizzazione cantonale/);
      expect(p.note.join(" ")).toMatch(/è ticinese.*ufficio cantonale/);
    }
  });

  it("le altre attività non hanno l'autorizzazione LEAR", () => {
    expect(stato({}, "autorizzazione-esercizio-pubblico")).toBe("non_serve");
  });

  it("alimenti: notifica dell'attività al Cantone (ODerr art. 20), anche senza locale pubblico", () => {
    const percorso = calcolaPercorso(risposte({ attivita: "ristorazione_alimentari", locali: "no" }));
    const p = passo(percorso, "notifica-derrate-alimentari");
    expect(p.stato).toBe("da_fare");
    expect(p.perche).toContain("Laboratorio cantonale");
    expect(p.passo.fonti).toEqual(
      expect.arrayContaining([fontiPercorso.oderr20, fontiPercorso.laboratorioCantonaleNotifica]),
    );
    expect(p.passo.link.url).toBe(fontiPercorso.laboratorioCantonaleNotifica.url);
    expect(p.passo.descrizione).toMatch(/mercatini, feste scolastiche/);
  });

  it("alimenti fuori dal Ticino: notifica all'autorità del proprio Cantone", () => {
    const notifica = (cantone: Risposte["cantone"]) =>
      passo(calcolaPercorso(risposte({ attivita: "ristorazione_alimentari", cantone })), "notifica-derrate-alimentari");
    for (const cantone of ["GR", "altro"] as const) {
      expect(notifica(cantone).stato).toBe("da_fare");
      expect(notifica(cantone).perche).toContain("del tuo Cantone");
      expect(notifica(cantone).perche).not.toContain("Laboratorio cantonale");
    }
    expect(notifica("GR").note.join(" ")).toMatch(/Grigioni/);
  });

  it("le altre attività non hanno la notifica degli alimenti", () => {
    for (const attivita of ["digitale_creativo", "commercio_online", "salute_benessere", "altro"] as const) {
      expect(stato({ attivita }, "notifica-derrate-alimentari")).toBe("non_serve");
    }
  });

  it("salute in Ticino: autorizzazione sanitaria da fare e avviso", () => {
    const percorso = calcolaPercorso(risposte({ attivita: "salute_benessere" }));
    expect(passo(percorso, "autorizzazione-sanitaria").stato).toBe("da_fare");
    expect(idAvvisi(percorso)).toContain("autorizzazione-sanitaria");
  });

  it("salute fuori dal Ticino: autorizzazione da fare, con la procedura del proprio Cantone", () => {
    for (const cantone of ["GR", "altro"] as const) {
      const p = passo(calcolaPercorso(risposte({ attivita: "salute_benessere", cantone })), "autorizzazione-sanitaria");
      expect(p.stato).toBe("da_fare");
      expect(p.note.join(" ")).toMatch(/è ticinese.*autorità sanitaria cantonale/);
    }
    expect(stato({}, "autorizzazione-sanitaria")).toBe("non_serve");
  });

  it("edilizia e trasporti: la Suva verifica lo statuto, con avviso", () => {
    for (const attivita of ["artigianato_edilizia", "trasporti"] as const) {
      const percorso = calcolaPercorso(risposte({ attivita }));
      expect(passo(percorso, "statuto-suva").stato).toBe("da_fare");
      expect(idAvvisi(percorso)).toContain("suva-statuto");
      // La preparazione per la Suva viene prima della domanda AVS.
      const ids = percorso.passi.map((p) => p.passo.id);
      expect(ids.indexOf("statuto-suva")).toBeLessThan(ids.indexOf("riconoscimento-avs"));
    }
    expect(stato({}, "statuto-suva")).toBe("non_serve");
  });

  it("controllare le autorizzazioni vale per tutti, con i link PMI e SEFRI", () => {
    const percorso = calcolaPercorso(risposte());
    expect(passo(percorso, "autorizzazioni").stato).toBe("da_fare");
    expect(passo(percorso, "autorizzazioni").passo.fonti).toEqual(
      expect.arrayContaining([fontiPercorso.pmiMettersiInProprio, fontiPercorso.sefriProfessioniRegolamentate]),
    );
  });

  it("consulenza in Ticino: ricorda la LFid per consulenza fiscale e aziendale", () => {
    const percorso = calcolaPercorso(risposte({ attivita: "consulenza_formazione" }));
    expect(testoCompleto(percorso, "autorizzazioni")).toMatch(/LFid/);
  });

  it("attività «altro»: riprende la descrizione scritta dall'utente", () => {
    const percorso = calcolaPercorso(risposte({ attivita: "altro", attivitaAltro: "toelettatura per cani" }));
    expect(testoCompleto(percorso, "autorizzazioni")).toContain("«toelettatura per cani»");
  });
});

describe("regole: nome della ditta", () => {
  it("da solo: nome con il cognome (art. 945 CO) e controllo su Zefix", () => {
    const percorso = calcolaPercorso(risposte());
    const p = passo(percorso, "nome-ditta");
    expect(p.stato).toBe("da_fare");
    expect(p.passo.fonti).toEqual(expect.arrayContaining([fonti.co945, fontiPercorso.zefix]));
    expect(p.passo.link.url).toBe(fontiPercorso.zefix.url);
  });

  it("con soci: le regole della ditta individuale non valgono, il nome della Sagl indica la forma", () => {
    const percorso = calcolaPercorso(risposte({ soci: "con_soci" }));
    expect(passo(percorso, "nome-ditta").stato).toBe("facoltativo");
    expect(testoCompleto(percorso, "nome-ditta")).toMatch(/art\. 950 CO/);
  });
});

describe("regole: AVS", () => {
  it("riconoscimento come indipendente sempre da fare per la ditta individuale", () => {
    expect(stato({}, "riconoscimento-avs")).toBe("da_fare");
    expect(stato({}, "acconti-avs")).toBe("da_fare");
  });

  it("Ticino: indica la cassa IAS; Grigioni: la SVA di Coira; altrove: l'elenco delle casse", () => {
    expect(testoCompleto(calcolaPercorso(risposte()), "riconoscimento-avs")).toMatch(
      /Istituto delle assicurazioni sociali/,
    );
    expect(testoCompleto(calcolaPercorso(risposte({ cantone: "GR" })), "riconoscimento-avs")).toMatch(
      /Sozialversicherungsanstalt.*Coira/,
    );
    expect(testoCompleto(calcolaPercorso(risposte({ cantone: "altro" })), "riconoscimento-avs")).toMatch(
      /Cantone dove ha sede/,
    );
  });

  it("un solo cliente: avviso importante con la citazione del promemoria 2.02", () => {
    const percorso = calcolaPercorso(risposte({ clienti: "uno" }));
    const avviso = percorso.avvisi.find((a) => a.id === "un-solo-cliente");
    expect(avviso?.livello).toBe("importante");
    expect(avviso?.testo).toContain(
      "«L'attività svolta per un solo mandante è normalmente classificata come attività lucrativa dipendente»",
    );
    expect(avviso?.fonti).toContain(fonti.avsPromemoria202);
    expect(testoCompleto(percorso, "riconoscimento-avs")).toMatch(/un solo cliente/);
  });

  it("molti clienti: niente avviso sul cliente unico", () => {
    expect(idAvvisi(calcolaPercorso(risposte()))).not.toContain("un-solo-cliente");
    expect(idAvvisi(calcolaPercorso(risposte({ clienti: "pochi" })))).not.toContain("un-solo-cliente");
  });

  it("lavoro da dipendente: nota sull'attività accessoria fino a CHF 2'500 e sul tasso minimo", () => {
    const testo = testoCompleto(calcolaPercorso(risposte({ impiego: "pieno" })), "riconoscimento-avs");
    expect(testo).toContain("CHF 2'500");
    expect(testo).toContain("5,371%");
    expect(testoCompleto(calcolaPercorso(risposte()), "riconoscimento-avs")).not.toContain("CHF 2'500");
  });

  it("tasso più basso solo sotto il limite inferiore della tavola scalare (Promemoria 2.02, punto 6)", () => {
    for (const impiego of ["parziale", "pieno"] as const) {
      const note = passo(calcolaPercorso(risposte({ impiego })), "riconoscimento-avs").note;
      const nota = note.find((n) => n.includes("5,371%"));
      expect(nota).toContain(`inferiore a ${chf(avsIndipendenti[2026].valore.limiteInferioreScala)}`);
      expect(nota).toContain(`${chf(avsIndipendenti[2027].valore.limiteInferioreScala)} dal 2027`);
      expect(nota).toContain("CHF 10'100");
      expect(nota).toMatch(/Sopra questo limite vale la tavola scalare/);
    }
  });

  it("già avviata da più di 3 mesi: avviso di presentare subito la domanda", () => {
    const percorso = calcolaPercorso(risposte({ avviata: "oltre_3_mesi" }));
    expect(idAvvisi(percorso)).toContain("gia-iniziato");
    expect(passo(percorso, "riconoscimento-avs").perche).toMatch(/adesso/);
    expect(idAvvisi(calcolaPercorso(risposte({ avviata: "meno_3_mesi" })))).not.toContain("gia-iniziato");
  });

  it("acconti trimestrali 10.1, 10.4, 10.7, 10.10 nelle scadenze", () => {
    const scadenza = calcolaPercorso(risposte()).scadenze.find((s) => s.id === "acconti-avs");
    expect(scadenza?.calendario).toEqual({
      tipo: "annuale",
      date: [
        { giorno: 10, mese: 1, etichetta: "4° trimestre dell'anno prima" },
        { giorno: 10, mese: 4, etichetta: "1° trimestre" },
        { giorno: 10, mese: 7, etichetta: "2° trimestre" },
        { giorno: 10, mese: 10, etichetta: "3° trimestre" },
      ],
    });
  });

  it("acconti: la trappola del 75% e la variazione del 25% sono nel passo", () => {
    const p = passo(calcolaPercorso(risposte()), "acconti-avs");
    const cosaFare = p.passo.cosaFare.join(" ");
    expect(cosaFare).toContain("75%");
    expect(cosaFare).toContain("25%");
    expect(cosaFare).toContain("5%");
  });

  it("Ticino: contributo assegni familiari 0,85% e assegno integrativo 0,15%", () => {
    const testo = testoCompleto(calcolaPercorso(risposte()), "acconti-avs");
    expect(testo).toContain("0,85%");
    expect(testo).toContain("0,15%");
    expect(testoCompleto(calcolaPercorso(risposte({ cantone: "GR" })), "acconti-avs")).not.toContain("0,85%");
  });
});

describe("regole: registro di commercio", () => {
  it("sotto CHF 100'000: facoltativo, con tasse 80 + 20 + 20 e l'ufficio di Biasca", () => {
    const percorso = calcolaPercorso(risposte());
    const p = passo(percorso, "iscrizione-rc");
    expect(p.stato).toBe("facoltativo");
    expect(p.perche).toContain("facoltativa");
    expect(p.passo.cosaFare.join(" ")).toMatch(/CHF 80.*CHF 20.*CHF 20/);
    expect(p.passo.costoNoto?.testo).toContain("CHF 120");
    expect(p.note.join(" ")).toContain("Biasca");
    expect(p.passo.link.url).toBe(fontiPercorso.easygovDittaIndividuale.url);
  });

  it("da CHF 100'000: da fare (obbligo dall'ultimo esercizio)", () => {
    const p = passo(calcolaPercorso(risposte({ fatturato: "almeno_100k" })), "iscrizione-rc");
    expect(p.stato).toBe("da_fare");
    expect(p.perche).toContain("obbligatoria");
  });

  it("fatturato da 60'000 a meno di 100'000 e «non so»: ancora facoltativo", () => {
    expect(stato({ fatturato: "da_60k_a_100k" }, "iscrizione-rc")).toBe("facoltativo");
    expect(stato({ fatturato: "non_so" }, "iscrizione-rc")).toBe("facoltativo");
  });

  it("fuori dal Ticino rimanda all'elenco degli uffici, non a Biasca", () => {
    const note = passo(calcolaPercorso(risposte({ cantone: "GR" })), "iscrizione-rc").note.join(" ");
    expect(note).toContain("elenco ufficiale");
    expect(note).not.toContain("Via Tognola");
  });
});

describe("regole: IVA", () => {
  it("almeno CHF 100'000 previsti: assoggettato da subito, annuncio entro 30 giorni", () => {
    const percorso = calcolaPercorso(risposte({ fatturato: "almeno_100k" }));
    expect(passo(percorso, "iscrizione-iva").stato).toBe("da_fare");
    const avviso = percorso.avvisi.find((a) => a.id === "iva-da-subito");
    expect(avviso?.testo).toContain("30 giorni");
    expect(avviso?.fonti).toEqual(expect.arrayContaining([fonti.liva14, fonti.liva66]));
    expect(percorso.scadenze.find((s) => s.id === "annuncio-iva")?.calendario).toEqual({
      tipo: "dopo-inizio",
      giorni: 30,
    });
  });

  it("già avviata con almeno CHF 100'000: annunciarsi il prima possibile", () => {
    const percorso = calcolaPercorso(risposte({ fatturato: "almeno_100k", avviata: "oltre_3_mesi" }));
    expect(percorso.avvisi.find((a) => a.id === "iva-da-subito")?.testo).toMatch(/il prima possibile/);
    expect(passo(percorso, "iscrizione-iva").note.join(" ")).toMatch(/il prima possibile/);
  });

  it("sotto la soglia: non serve, e avviso di non scrivere l'IVA in fattura (art. 27 LIVA)", () => {
    for (const fatturato of ["meno_10k", "da_10k_a_60k", "da_60k_a_100k", "non_so"] as const) {
      const percorso = calcolaPercorso(risposte({ fatturato }));
      expect(passo(percorso, "iscrizione-iva").stato).toBe("non_serve");
      expect(idAvvisi(percorso)).toContain("niente-iva-in-fattura");
      expect(idAvvisi(percorso)).not.toContain("iva-da-subito");
      expect(idScadenze(percorso)).not.toContain("annuncio-iva");
      expect(passo(percorso, "fatture").perche).toMatch(/l'IVA non deve comparire/);
    }
  });

  it("vicino alla soglia o fatturato sconosciuto: controllo delle soglie a fine anno da fare", () => {
    expect(stato({ fatturato: "da_60k_a_100k" }, "soglie-annuali")).toBe("da_fare");
    expect(stato({ fatturato: "non_so" }, "soglie-annuali")).toBe("da_fare");
    expect(stato({ fatturato: "meno_10k" }, "soglie-annuali")).toBe("facoltativo");
    expect(stato({ fatturato: "almeno_100k" }, "soglie-annuali")).toBe("facoltativo");
    expect(passo(calcolaPercorso(risposte({ fatturato: "non_so" })), "soglie-annuali").perche).toMatch(
      /quanto fatturerai/,
    );
  });
});

describe("regole: assicurazioni", () => {
  it("solo in proprio: copertura infortuni da controllare (LAINF non obbligatoria)", () => {
    const p = passo(calcolaPercorso(risposte()), "assicurazione-infortuni");
    expect(p.stato).toBe("da_fare");
    expect(p.perche).toMatch(/cassa malati/);
    expect(p.passo.descrizione).toMatch(/non è obbligatoria/);
  });

  it("con un lavoro da dipendente: da verificare, non obbligatorio", () => {
    expect(stato({ impiego: "parziale" }, "assicurazione-infortuni")).toBe("facoltativo");
  });

  it("previdenza: facoltativa, con i limiti 3a 2026 e 2027", () => {
    const p = passo(calcolaPercorso(risposte()), "assicurazioni-previdenza");
    expect(p.stato).toBe("facoltativo");
    const testo = p.passo.cosaFare.join(" ");
    for (const importo of ["CHF 36'288", "CHF 36'864", "CHF 7'258", "CHF 7'373"]) expect(testo).toContain(importo);
  });
});

describe("regole: contabilità e imposte", () => {
  it("contabilità semplificata sotto CHF 500'000 e conservazione per 10 anni", () => {
    const p = passo(calcolaPercorso(risposte()), "contabilita");
    expect(p.stato).toBe("da_fare");
    expect(p.passo.descrizione).toContain("CHF 500'000");
    expect(p.passo.cosaFare.join(" ")).toContain("10 anni");
  });

  it("Ticino: dichiarazione alla cifra 2 con Modulo 10, e cifra 2.2 se c'è un salario", () => {
    const percorso = calcolaPercorso(risposte());
    const p = passo(percorso, "dichiarazione-imposte");
    expect(p.perche).toMatch(/cifra 2\./);
    expect(p.passo.cosaFare.join(" ")).toContain("Modulo 10");
    expect(passo(calcolaPercorso(risposte({ impiego: "parziale" })), "dichiarazione-imposte").perche).toMatch(
      /cifra 2\.2/,
    );
  });

  it("Ticino: prima dichiarazione senza acconti automatici, chiedere le polizze all'Ufficio esazione e condoni", () => {
    const p = passo(calcolaPercorso(risposte()), "acconti-imposte");
    expect(p.stato).toBe("da_fare");
    expect(p.passo.cosaFare.join(" ")).toMatch(/Ufficio esazione e condoni/);
  });

  it("fuori dal Ticino: imposte da verificare con il proprio Cantone", () => {
    expect(stato({ cantone: "GR" }, "acconti-imposte")).toBe("facoltativo");
    const percorso = calcolaPercorso(risposte({ cantone: "GR" }));
    expect(testoCompleto(percorso, "dichiarazione-imposte")).toMatch(/da verificare/);
  });

  it("Ticino: scadenze IFD 31.3, acconti cantonali con le date 2026 nel calendario e dichiarazione", () => {
    const percorso = calcolaPercorso(risposte());
    expect(idScadenze(percorso)).toEqual(["acconti-avs", "ifd", "acconti-cantonali", "dichiarazione"]);
    const cantonali = percorso.scadenze.find((s) => s.id === "acconti-cantonali");
    // Le date non sono nel testo (il riquadro le confronta con oggi), ma nel calendario.
    expect(cantonali?.quando).not.toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(cantonali?.calendario).toEqual({
      tipo: "fisse",
      date: [
        { data: "2026-05-31", etichetta: "1ª rata" },
        { data: "2026-07-31", etichetta: "2ª rata" },
        { data: "2026-09-30", etichetta: "3ª rata" },
      ],
    });
    expect(percorso.scadenze.find((s) => s.id === "ifd")?.calendario).toEqual({
      tipo: "annuale",
      date: [{ giorno: 31, mese: 3, etichetta: "rata unica" }],
    });
  });

  it("fuori dal Ticino: solo le scadenze AVS federali", () => {
    expect(idScadenze(calcolaPercorso(risposte({ cantone: "GR" })))).toEqual(["acconti-avs"]);
  });
});

describe("regole: soci, permessi, vendita online, locali, aiuto", () => {
  it("con soci: avviso Sagl (CHF 20'000, notaio) e passi della ditta individuale non pertinenti", () => {
    const percorso = calcolaPercorso(risposte({ soci: "con_soci" }));
    const avviso = percorso.avvisi.find((a) => a.id === "soci");
    expect(avviso?.livello).toBe("importante");
    expect(avviso?.testo).toContain("CHF 20'000");
    expect(avviso?.testo).toMatch(/notaio/);
    expect(avviso?.testo).toMatch(/più avanti/);
    expect(passo(percorso, "soci-forma-giuridica").stato).toBe("da_fare");
    expect(passo(percorso, "soci-forma-giuridica").passo.link.url).toBe(fonti.pmiChecklist.url);
    for (const id of [
      "riconoscimento-avs",
      "acconti-avs",
      "iscrizione-rc",
      "contabilita",
      "dichiarazione-imposte",
    ] as const) {
      expect(passo(percorso, id).stato).toBe("non_serve");
    }
    expect(idScadenze(percorso)).not.toContain("acconti-avs");
  });

  it("da solo: il passo sulla Sagl non serve", () => {
    expect(stato({}, "soci-forma-giuridica")).toBe("non_serve");
  });

  it("permesso G: permesso da chiedere, avviso, e niente Fondounimpresa", () => {
    const percorso = calcolaPercorso(risposte({ permesso: "g" }));
    expect(passo(percorso, "permesso-lavoro").stato).toBe("da_fare");
    expect(passo(percorso, "permesso-lavoro").perche).toMatch(/permesso G/);
    expect(idAvvisi(percorso)).toContain("permesso");
    expect(passo(percorso, "aiuto").perche).toMatch(/permesso B o C/);
  });

  it("permesso B e altro: da verificare con l'ufficio della migrazione", () => {
    expect(stato({ permesso: "b" }, "permesso-lavoro")).toBe("da_fare");
    expect(stato({ permesso: "altro" }, "permesso-lavoro")).toBe("da_fare");
    expect(stato({}, "permesso-lavoro")).toBe("non_serve");
    expect(idAvvisi(calcolaPercorso(risposte()))).not.toContain("permesso");
  });

  it("permesso da verificare: prima di iniziare se non hai ancora iniziato", () => {
    const avviso = calcolaPercorso(risposte({ permesso: "b" })).avvisi.find((a) => a.id === "permesso");
    expect(avviso?.titolo).toBe("Prima di iniziare, verifica il tuo permesso");
    expect(avviso?.testo).toBe(
      "Verifica con l'Ufficio della migrazione che il tuo permesso B ti consenta di lavorare come indipendente.",
    );
  });

  it("permesso da verificare quando hai già iniziato: subito, e con un professionista", () => {
    for (const avviata of ["meno_3_mesi", "oltre_3_mesi"] as const) {
      for (const permesso of ["g", "b", "altro"] as const) {
        const percorso = calcolaPercorso(risposte({ permesso, avviata }));
        const avviso = percorso.avvisi.find((a) => a.id === "permesso");
        expect(avviso?.titolo).toBe("Hai già iniziato: verifica subito il tuo permesso");
        expect(avviso?.testo).toMatch(/subito/);
        expect(avviso?.testo).not.toMatch(/prima di iniziare/i);
        expect(avviso?.testo).toMatch(/caso complesso: fatti aiutare da un professionista/);
        const p = passo(percorso, "permesso-lavoro");
        expect(p.stato).toBe("da_fare");
        expect(p.perche).toMatch(/hai già iniziato/i);
        expect(p.perche).not.toMatch(/prima di iniziare/);
      }
    }
    const g = calcolaPercorso(risposte({ permesso: "g", avviata: "meno_3_mesi" })).avvisi.find((a) => a.id === "permesso");
    expect(g?.testo).toContain("rivolgiti subito all'Ufficio della migrazione.");
    const fuori = calcolaPercorso(risposte({ permesso: "altro", avviata: "meno_3_mesi", cantone: "GR" })).avvisi.find(
      (a) => a.id === "permesso",
    );
    expect(fuori?.testo).toContain("con l'ufficio della migrazione del tuo Cantone");
    // Con la cittadinanza svizzera o il permesso C nessun avviso, anche se hai già iniziato.
    expect(idAvvisi(calcolaPercorso(risposte({ avviata: "meno_3_mesi" })))).not.toContain("permesso");
  });

  it("vendita online ai privati: dati sul sito (LCSl art. 3 cpv. 1 lett. s)", () => {
    const p = passo(calcolaPercorso(risposte({ venditaOnline: "si" })), "sito-online");
    expect(p.stato).toBe("da_fare");
    expect(p.passo.descrizione).toContain("lett. s");
    expect(stato({}, "sito-online")).toBe("non_serve");
  });

  it("locale aperto al pubblico: regole da verificare", () => {
    expect(stato({ locali: "si" }, "locali-pubblico")).toBe("da_fare");
    expect(stato({}, "locali-pubblico")).toBe("non_serve");
  });

  it("aiuto: Fondounimpresa fino a 15 ore in Ticino, Regione Moesa nei Grigioni", () => {
    expect(passo(calcolaPercorso(risposte()), "aiuto").perche).toContain("15 ore");
    expect(passo(calcolaPercorso(risposte({ cantone: "GR" })), "aiuto").perche).toContain("Regione Moesa");
    expect(passo(calcolaPercorso(risposte()), "aiuto").passo.fonti).toContain(fonti.albofiduciari);
  });

  it("Grigioni e altri Cantoni: avviso informativo sui limiti di Bussola", () => {
    expect(idAvvisi(calcolaPercorso(risposte({ cantone: "GR" })))).toContain("grigioni");
    expect(idAvvisi(calcolaPercorso(risposte({ cantone: "altro" })))).toContain("fuori-zona");
    const ticino = idAvvisi(calcolaPercorso(risposte()));
    expect(ticino).not.toContain("grigioni");
    expect(ticino).not.toContain("fuori-zona");
  });

  it("gli avvisi importanti vengono prima di quelli informativi", () => {
    const percorso = calcolaPercorso(risposte({ cantone: "GR", clienti: "uno", fatturato: "almeno_100k" }));
    const livelli = percorso.avvisi.map((a) => a.livello);
    expect(livelli.at(-1)).toBe("info");
    expect(livelli.indexOf("info")).toBeGreaterThan(livelli.lastIndexOf("importante"));
  });
});

describe("persone tipo", () => {
  it("grafica freelance a Lugano, molti clienti, CHF 40'000", () => {
    const percorso = calcolaPercorso(risposte());
    expect(idAvvisi(percorso)).toEqual(["niente-iva-in-fattura"]);
    const daFare = percorso.passi.filter((p) => p.stato === "da_fare").map((p) => p.passo.id);
    expect(daFare).toEqual([
      "ditta-individuale",
      "autorizzazioni",
      "nome-ditta",
      "riconoscimento-avs",
      "assicurazione-infortuni",
      "fatture",
      "contabilita",
      "acconti-avs",
      "acconti-imposte",
      "dichiarazione-imposte",
    ]);
    expect(passo(percorso, "iscrizione-rc").stato).toBe("facoltativo");
    expect(prossimoPasso(percorso, new Set())?.passo.id).toBe("ditta-individuale");
  });

  it("muratore in proprio con un solo cliente", () => {
    const percorso = calcolaPercorso(
      risposte({ attivita: "artigianato_edilizia", clienti: "uno", fatturato: "da_60k_a_100k" }),
    );
    expect(idAvvisi(percorso).slice(0, 2)).toEqual(["un-solo-cliente", "suva-statuto"]);
    expect(passo(percorso, "statuto-suva").stato).toBe("da_fare");
    expect(passo(percorso, "soglie-annuali").stato).toBe("da_fare");
    expect(testoCompleto(percorso, "riconoscimento-avs")).toMatch(/Suva/);
    expect(testoCompleto(percorso, "assicurazione-infortuni")).toMatch(/Suva/);
  });

  it("frontaliere con permesso G che fa consulenza in Ticino", () => {
    const percorso = calcolaPercorso(risposte({ permesso: "g", attivita: "consulenza_formazione" }));
    expect(idAvvisi(percorso)).toContain("permesso");
    expect(prossimoPasso(percorso, new Set(["ditta-individuale", "autorizzazioni"]))?.passo.id).toBe("permesso-lavoro");
  });

  it("ristorante in Ticino con locale aperto al pubblico", () => {
    const percorso = calcolaPercorso(
      risposte({ attivita: "ristorazione_alimentari", locali: "si", fatturato: "almeno_100k", clienti: "molti" }),
    );
    for (const id of [
      "autorizzazione-esercizio-pubblico",
      "notifica-derrate-alimentari",
      "locali-pubblico",
      "iscrizione-rc",
      "iscrizione-iva",
    ] as const) {
      expect(passo(percorso, id).stato).toBe("da_fare");
    }
    expect(idAvvisi(percorso)).toEqual(expect.arrayContaining(["autorizzazione-ristorazione", "iva-da-subito"]));
  });

  it("chi supera CHF 100'000 con vendita online", () => {
    const percorso = calcolaPercorso(
      risposte({ attivita: "commercio_online", fatturato: "almeno_100k", venditaOnline: "si" }),
    );
    expect(idScadenze(percorso)[0]).toBe("annuncio-iva");
    expect(passo(percorso, "fatture").perche).toMatch(/numero IVA/);
    expect(passo(percorso, "sito-online").stato).toBe("da_fare");
    expect(passo(percorso, "contabilita").perche).toContain("CHF 500'000");
  });

  it("Grigioni, part-time, attività accessoria sotto i CHF 10'000", () => {
    const percorso = calcolaPercorso(risposte({ cantone: "GR", impiego: "pieno", fatturato: "meno_10k" }));
    expect(idAvvisi(percorso)).toEqual(["niente-iva-in-fattura", "grigioni"]);
    expect(testoCompleto(percorso, "riconoscimento-avs")).toContain("CHF 2'500");
    expect(passo(percorso, "assicurazione-infortuni").stato).toBe("facoltativo");
  });

  it("due amici che vogliono aprire insieme", () => {
    const percorso = calcolaPercorso(risposte({ soci: "con_soci", fatturato: "almeno_100k" }));
    expect(idAvvisi(percorso)[0]).toBe("soci");
    // L'IVA vale anche per una società.
    expect(passo(percorso, "iscrizione-iva").stato).toBe("da_fare");
    expect(idScadenze(percorso)).toEqual(["annuncio-iva"]);
  });
});

describe("avanzamento e prossimo passo", () => {
  it("conta solo i passi da fare", () => {
    const percorso = calcolaPercorso(risposte());
    const totale = percorso.passi.filter((p) => p.stato === "da_fare").length;
    expect(avanzamento(percorso, new Set())).toEqual({ fatti: 0, totale });
    // Un passo facoltativo fatto non cambia il conteggio.
    expect(avanzamento(percorso, new Set(["iscrizione-rc", "aiuto"]))).toEqual({ fatti: 0, totale });
    expect(avanzamento(percorso, new Set(["ditta-individuale", "nome-ditta"]))).toEqual({ fatti: 2, totale });
  });

  it("nessun prossimo passo quando i passi da fare sono tutti fatti", () => {
    const percorso = calcolaPercorso(risposte());
    const tutti = new Set(percorso.passi.filter((p) => p.stato === "da_fare").map((p) => p.passo.id));
    expect(prossimoPasso(percorso, tutti)).toBeUndefined();
    expect(avanzamento(percorso, tutti).fatti).toBe(tutti.size);
  });
});
