import { describe, expect, it } from "vitest";
import { fonti, fontiPercorso } from "@/data/svizzera";
import { VOTAZIONI, type Votazione } from "@/data/votazioni";
import { calcolaDaParte, impostazioniIniziali, type DatiConti } from "@/lib/conti/da-parte";
import type { FatturaEmessa } from "@/lib/conti/tipi";
import { calcolaPercorso } from "@/lib/percorso/regole";
import { VERSIONE_RISPOSTE, type Risposte } from "@/lib/percorso/risposte";
import { arrotonda, importo } from "@/lib/strumenti/numeri";
import {
  GIORNI_DOCUMENTI,
  GIORNI_FATTURE_IN_SCADENZA,
  GIORNI_SCADENZA_VICINA,
  GIORNI_VOTAZIONE,
  MASSIMO_FATTURE_SCADUTE,
  TESTI_OGGI,
  carteOggi,
  elenco,
  giornoDiOggi,
  rigaTranquilla,
  serveAttenzione,
  testoAttesa,
  testoErrori,
  type DatiOggi,
} from "./carte";

const OGGI = "2026-10-19";

const risposte: Risposte = {
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
};
const { scadenze } = calcolaPercorso(risposte);

function dati(campi: Partial<DatiOggi> = {}): DatiOggi {
  return { oggi: OGGI, scadenze: null, votazioni: [], ...campi };
}

let contatore = 0;
function fattura(campi: Partial<FatturaEmessa> = {}): FatturaEmessa {
  contatore++;
  return {
    id: `f${contatore}`,
    numero: `F-2026-00${contatore}`,
    cliente: "Rossi SA",
    data: "2026-09-01",
    scadenza: "2026-10-01",
    importo: 1250.5,
    stato: "aperta",
    pagataIl: null,
    riferimento: null,
    sollecito: null,
    ...campi,
  };
}

/** Riepilogo minimo dei conti: lo stesso utile ogni mese da gennaio a `fino`. */
function conti(anno: number, fino: number, entrate: number, uscite: number): DatiConti {
  const perMese = Array.from({ length: 12 }, (_, i) => ({
    mese: i + 1,
    entrate: i < fino ? entrate : 0,
    uscite: i < fino ? uscite : 0,
  }));
  const e = arrotonda(entrate * fino);
  const u = arrotonda(uscite * fino);
  return { anno, entrate: e, uscite: u, risultato: arrotonda(e - u), perMese };
}

describe("niente da segnalare", () => {
  it("senza dati: nessuna scheda e la riga serena", () => {
    const carte = carteOggi(dati());
    expect(carte).toEqual([]);
    expect(serveAttenzione(carte)).toBe(false);
    expect(rigaTranquilla(carte, false)).toBe("Tutto in ordine per oggi.");
  });

  it("se qualcosa non si è letto non dice che è tutto in ordine", () => {
    expect(rigaTranquilla([], true)).toBe(TESTI_OGGI.nienteDaSegnalare);
    expect(rigaTranquilla([], true)).not.toContain("Tutto in ordine");
  });

  it("con dati vuoti dall'account: ancora niente", () => {
    expect(carteOggi(dati({ fatture: [], documenti: [], oreDaFatturare: [] }))).toEqual([]);
  });
});

describe("fatture scadute", () => {
  it("una scheda per fattura, urgente, con «Manda un sollecito» verso il sollecito di quella fattura", () => {
    const f = fattura({ cliente: "Bianchi Sagl", numero: "F-2026-003", scadenza: "2026-10-07", importo: 1250.5 });
    const [carta] = carteOggi(dati({ fatture: [f] }));
    expect(carta.genere).toBe("fattura-scaduta");
    expect(carta.urgenza).toBe("alta");
    expect(carta.titolo).toBe("Bianchi Sagl: fattura non pagata");
    expect(carta.testo).toBe("Fattura F-2026-003 di CHF 1'250.50, da pagare entro il 07.10.2026: scaduta da 12 giorni.");
    expect(carta.azione.titolo).toBe("Manda un sollecito");
    expect(carta.azione.destinazione).toEqual({ schermata: "sollecito", fatturaId: f.id });
    expect(rigaTranquilla([carta], false)).toBeNull();
  });

  it("dopo il primo sollecito propone il secondo e ricorda quando hai mandato il primo", () => {
    const f = fattura({ scadenza: "2026-09-30", sollecito: { livello: 1, inviatoIl: "2026-10-10" } });
    const [carta] = carteOggi(dati({ fatture: [f] }));
    expect(carta.azione.titolo).toBe("Manda il 2° sollecito");
    expect(carta.testo).toContain("1° sollecito inviato il 10.10.2026.");
  });

  it("le pagate, quelle senza scadenza e quelle che scadono oggi non sono scadute", () => {
    const carte = carteOggi(
      dati({
        fatture: [
          fattura({ scadenza: "2026-10-01", pagataIl: "2026-10-05", stato: "pagata" }),
          fattura({ scadenza: null }),
          fattura({ scadenza: OGGI }),
        ],
      }),
    );
    expect(carte.map((c) => c.genere)).toEqual(["fatture-in-scadenza"]);
  });

  it("dalla più vecchia; oltre il massimo, le altre in una scheda sola con il totale", () => {
    const fatture = [
      fattura({ scadenza: "2026-10-10", importo: 100 }),
      fattura({ scadenza: "2026-09-01", importo: 200 }),
      fattura({ scadenza: "2026-10-01", importo: 300 }),
      fattura({ scadenza: "2026-10-15", importo: 400 }),
      fattura({ scadenza: "2026-10-18", importo: 500 }),
    ];
    const carte = carteOggi(dati({ fatture }));
    const singole = carte.filter((c) => c.genere === "fattura-scaduta");
    expect(singole).toHaveLength(MASSIMO_FATTURE_SCADUTE);
    expect(singole.map((c) => c.data)).toEqual(["2026-09-01", "2026-10-01", "2026-10-10"]);
    const altre = carte.find((c) => c.genere === "altre-fatture-scadute");
    expect(altre?.titolo).toBe("Altre 2 fatture scadute");
    expect(altre?.testo).toContain(`In tutto ${importo(900)} da incassare.`);
    expect(altre?.azione.destinazione).toEqual({ schermata: "conti" });
  });
});

describe("fatture che scadono presto", () => {
  it(`entro ${GIORNI_FATTURE_IN_SCADENZA} giorni, oggi compreso; dopo no`, () => {
    const una = carteOggi(dati({ fatture: [fattura({ numero: "F-2026-010", scadenza: "2026-10-22", importo: 800 })] }));
    expect(una).toHaveLength(1);
    expect(una[0].urgenza).toBe("media");
    expect(una[0].titolo).toBe("La fattura F-2026-010 scade tra 3 giorni");
    expect(una[0].testo).toContain("Rossi SA, CHF 800.00, da pagare entro il 22.10.2026.");

    expect(carteOggi(dati({ fatture: [fattura({ scadenza: OGGI })] }))[0].titolo).toMatch(/scade oggi$/);
    expect(carteOggi(dati({ fatture: [fattura({ scadenza: "2026-10-20" })] }))[0].titolo).toMatch(/scade domani$/);
    expect(carteOggi(dati({ fatture: [fattura({ scadenza: "2026-10-26" })] }))).toHaveLength(1);
    expect(carteOggi(dati({ fatture: [fattura({ scadenza: "2026-10-27" })] }))).toEqual([]);
  });

  it("più fatture: una scheda con il totale e una riga per fattura", () => {
    const [carta] = carteOggi(
      dati({
        fatture: [
          fattura({ numero: "F-2026-021", cliente: "Verdi", scadenza: "2026-10-24", importo: 100 }),
          fattura({ numero: "F-2026-020", cliente: "Neri", scadenza: "2026-10-21", importo: 50.25 }),
        ],
      }),
    );
    expect(carta.titolo).toBe(`2 fatture scadono entro ${GIORNI_FATTURE_IN_SCADENZA} giorni`);
    expect(carta.testo).toBe(`In tutto ${importo(150.25)} da incassare.`);
    expect(carta.righe).toEqual([
      "F-2026-020, Neri: scade tra 2 giorni (21.10.2026)",
      "F-2026-021, Verdi: scade tra 5 giorni (24.10.2026)",
    ]);
  });
});

describe("scadenze del percorso", () => {
  it(`compare solo entro ${GIORNI_SCADENZA_VICINA} giorni: il 19.10.2026 il prossimo acconto AVS è troppo lontano`, () => {
    expect(carteOggi(dati({ scadenze }))).toEqual([]);
  });

  it("una settimana prima è urgente, con la fonte ufficiale e il link alle scadenze", () => {
    const [carta] = carteOggi(dati({ oggi: "2027-01-04", scadenze }));
    expect(carta.genere).toBe("scadenza");
    expect(carta.urgenza).toBe("alta");
    expect(carta.titolo).toBe("Acconto AVS (4° trimestre dell'anno prima)");
    expect(carta.testo).toBe("Tra 6 giorni, il 10.01.2027.");
    expect(carta.fonte?.url).toBe(fonti.avsPromemoria202.url);
    expect(carta.azione.destinazione).toEqual({ schermata: "percorso" });
  });

  it("guarda già all'anno dopo; più lontano di una settimana è «media»", () => {
    const [carta] = carteOggi(dati({ oggi: "2026-12-15", scadenze }));
    expect(carta.data).toBe("2027-01-10");
    expect(carta.urgenza).toBe("media");
    expect(carta.testo).toBe("Tra 26 giorni, il 10.01.2027.");
  });

  it("il giorno stesso dice «Oggi»", () => {
    expect(carteOggi(dati({ oggi: "2027-01-10", scadenze }))[0].testo).toBe("Oggi, 10.01.2027.");
  });

  it("la più vicina, con le altre in arrivo contate", () => {
    const [carta] = carteOggi(dati({ oggi: "2026-09-15", scadenze }));
    expect(carta.data).toBe("2026-09-30");
    expect(carta.titolo).toContain("Acconto dell'imposta cantonale");
    expect(carta.fonte?.url).toBe(fontiPercorso.dcAccontoCantonale.url);
    expect(carta.testo).toBe(`Tra 15 giorni, il 30.09.2026. Poi un'altra scadenza entro ${GIORNI_SCADENZA_VICINA} giorni.`);
  });
});

describe("documenti del cassetto", () => {
  const doc = (titolo: string, scadeIl: string | null) => ({ id: titolo, titolo, scadeIl });

  it("uno scaduto è urgente; apre il cassetto", () => {
    const [carta] = carteOggi(dati({ documenti: [doc("Permesso B", "2026-10-01"), doc("Contratto", null)] }));
    expect(carta.urgenza).toBe("alta");
    expect(carta.titolo).toBe("Permesso B");
    expect(carta.testo).toBe("Scaduto il 01.10.2026. Se l'hai già rinnovato, carica nel cassetto quello nuovo.");
    expect(carta.azione.destinazione).toEqual({ schermata: "documenti" });
  });

  it(`uno in scadenza entro ${GIORNI_DOCUMENTI} giorni è «media»; più in là niente`, () => {
    const [carta] = carteOggi(dati({ documenti: [doc("Polizza RC", "2026-10-31")] }));
    expect(carta.urgenza).toBe("media");
    expect(carta.testo).toBe("Scade tra 12 giorni (31.10.2026): ricordati di rinnovarlo per tempo.");
    expect(carteOggi(dati({ documenti: [doc("Polizza RC", "2026-11-18")] }))).toHaveLength(1);
    expect(carteOggi(dati({ documenti: [doc("Polizza RC", "2026-11-19")] }))).toEqual([]);
  });

  it("più documenti: una scheda, dal più vecchio, al massimo tre righe", () => {
    const [carta] = carteOggi(
      dati({
        documenti: [
          doc("Polizza RC", "2026-10-31"),
          doc("Permesso B", "2026-10-01"),
          doc("Numero IVA", OGGI),
          doc("Autorizzazione", "2026-11-10"),
          doc("Decisione AVS", "2026-11-01"),
        ],
      }),
    );
    expect(carta.urgenza).toBe("alta");
    expect(carta.titolo).toBe("5 documenti da guardare");
    expect(carta.righe).toEqual([
      "Permesso B: scaduto il 01.10.2026",
      "Numero IVA: scade oggi",
      "Polizza RC: scade tra 12 giorni",
      "e altri 2",
    ]);
  });
});

describe("ore da fatturare", () => {
  it("mesi passati: «Crea la fattura» sul mese più vecchio", () => {
    const [carta] = carteOggi(
      dati({
        oreDaFatturare: [
          { mese: "2026-10", minuti: 300 },
          { mese: "2026-09", minuti: 750 },
          { mese: "2026-07", minuti: 90 },
        ],
      }),
    );
    expect(carta.genere).toBe("ore-passate");
    expect(carta.urgenza).toBe("media");
    expect(carta.titolo).toBe("Ore da fatturare in 2 mesi");
    expect(carta.righe).toEqual(["Luglio 2026: 1 h 30 min", "Settembre 2026: 12 h 30 min"]);
    expect(carta.azione).toMatchObject({ titolo: "Crea la fattura", destinazione: { schermata: "ore", mese: "2026-07" } });
  });

  it("un mese passato solo", () => {
    const [carta] = carteOggi(dati({ oreDaFatturare: [{ mese: "2026-09", minuti: 750 }] }));
    expect(carta.titolo).toBe("Ore di settembre 2026 da fatturare");
    expect(carta.testo).toBe("12 h 30 min non ancora in una fattura.");
  });

  it("le ore di questo mese sono da sapere, non urgenti", () => {
    const carte = carteOggi(dati({ oreDaFatturare: [{ mese: "2026-10", minuti: 480 }] }));
    expect(carte).toHaveLength(1);
    expect(carte[0]).toMatchObject({
      genere: "ore-mese",
      urgenza: "info",
      titolo: "Ore di ottobre 2026 da fatturare",
      testo: "Finora 8 h. Quando hai finito il lavoro del mese, crea la fattura.",
      azione: { titolo: "Crea la fattura", destinazione: { schermata: "ore", mese: "2026-10" } },
    });
    expect(rigaTranquilla(carte, false)).toBe("Tutto in ordine per oggi.");
  });
});

describe("votazioni da seguire", () => {
  const [votazione] = VOTAZIONI;

  it(`compare solo quando mancano al massimo ${GIORNI_VOTAZIONE} giorni`, () => {
    expect(carteOggi(dati({ votazioni: VOTAZIONI }))).toEqual([]);
    const giorno = "2026-11-15";
    const [carta] = carteOggi(dati({ oggi: giorno, votazioni: VOTAZIONI }));
    expect(carta).toMatchObject({ genere: "votazione", urgenza: "info", titolo: votazione.titoloBreve });
    expect(carta.etichetta).toBe("Votazione federale");
    expect(carta.testo.startsWith("Si vota tra 14 giorni, il 29.11.2026.")).toBe(true);
    expect(carta.fonte).toMatchObject({ url: votazione.fonti[0].url, verificatoIl: votazione.verificatoIl });
    expect(carteOggi(dati({ oggi: "2026-11-14", votazioni: VOTAZIONI }))).toEqual([]);
    expect(carteOggi(dati({ oggi: "2026-11-30", votazioni: VOTAZIONI }))).toEqual([]);
  });

  it("con il percorso apre le votazioni del percorso, senza apre il testo ufficiale", () => {
    const giorno = "2026-11-20";
    const conPercorso = carteOggi(dati({ oggi: giorno, scadenze, votazioni: VOTAZIONI })).find((c) => c.genere === "votazione");
    expect(conPercorso?.azione.destinazione).toEqual({ schermata: "percorso" });
    const senza = carteOggi(dati({ oggi: giorno, votazioni: VOTAZIONI }))[0];
    expect(senza.azione.destinazione).toEqual({ schermata: "fonte", url: votazione.fonti[0].url });
  });

  it("le votazioni passate non compaiono", () => {
    const vecchia: Votazione = { ...votazione, id: "vecchia", data: "2026-10-18" };
    expect(carteOggi(dati({ votazioni: [vecchia] }))).toEqual([]);
  });
});

describe("quanto mettere da parte", () => {
  it("in breve, con la stessa cifra della scheda Conti", () => {
    const riepilogo = conti(2026, 10, 6000, 1000);
    const impostazioni = { ...impostazioniIniziali(), riservaImpostePercento: "15" };
    const attesa = calcolaDaParte(riepilogo, OGGI, impostazioni).stima;
    const [carta] = carteOggi(dati({ daParte: { conti: riepilogo, impostazioni } }));
    expect(carta.genere).toBe("da-parte");
    expect(carta.urgenza).toBe("info");
    expect(carta.titolo).toBe(`Questo mese circa ${importo(attesa.alMese.totale, 0)}`);
    expect(carta.testo).toContain(`${importo(attesa.alMese.avs, 0)} per i contributi AVS`);
    expect(carta.testo).toContain("È una stima dai conti che hai confermato.");
    expect(carta.azione.destinazione).toEqual({ schermata: "conti" });
  });

  it("senza imposte scelte lo dice; senza conti confermati niente scheda", () => {
    const [carta] = carteOggi(dati({ daParte: { conti: conti(2026, 10, 6000, 1000), impostazioni: impostazioniIniziali() } }));
    expect(carta.testo).toContain("Per i contributi AVS: le imposte non sono ancora incluse.");
    expect(carteOggi(dati({ daParte: { conti: conti(2026, 0, 0, 0), impostazioni: impostazioniIniziali() } }))).toEqual([]);
  });

  it("solo per l'anno in corso", () => {
    expect(carteOggi(dati({ daParte: { conti: conti(2025, 12, 6000, 1000), impostazioni: impostazioniIniziali() } }))).toEqual([]);
  });
});

describe("ordine", () => {
  it("prima le urgenti (dalla data più vecchia), poi quelle presto, poi quelle da sapere", () => {
    const carte = carteOggi(
      dati({
        oggi: "2027-01-04",
        scadenze,
        fatture: [
          fattura({ id: "presto", scadenza: "2027-01-08" }),
          fattura({ id: "scaduta", scadenza: "2026-12-20" }),
        ],
        documenti: [{ id: "d", titolo: "Permesso B", scadeIl: "2027-01-20" }],
        oreDaFatturare: [
          { mese: "2027-01", minuti: 60 },
          { mese: "2026-12", minuti: 600 },
        ],
        daParte: { conti: conti(2027, 1, 6000, 1000), impostazioni: impostazioniIniziali() },
      }),
    );
    expect(carte.map((c) => c.genere)).toEqual([
      "fattura-scaduta", // alta, 20.12.2026
      "scadenza", // alta, 10.01.2027
      "ore-passate", // media, 31.12.2026
      "fatture-in-scadenza", // media, 08.01.2027
      "documenti", // media, 20.01.2027
      "ore-mese", // info
      "da-parte", // info, senza data
    ]);
    expect(new Set(carte.map((c) => c.id)).size).toBe(carte.length);
  });
});

describe("frasi", () => {
  it("elenchi in italiano", () => {
    expect(elenco([])).toBe("");
    expect(elenco(["a"])).toBe("a");
    expect(elenco(["a", "b"])).toBe("a e b");
    expect(elenco(["a", "b", "c"])).toBe("a, b e c");
  });

  it("attesa ed errori nominano le fonti nell'ordine giusto", () => {
    expect(testoAttesa(["documenti", "conti", "ore"])).toBe("Leggo i conti, le ore e i documenti…");
    expect(testoErrori(["documenti", "conti"])).toBe("Non riesco a leggere i conti e i documenti. Tira giù per riprovare.");
    expect(testoErrori(["ore"])).toBe("Non riesco a leggere le ore. Tira giù per riprovare.");
  });

  it("il giorno di oggi con il nome e la data svizzera", () => {
    expect(giornoDiOggi("2026-10-19")).toBe("lunedì 19.10.2026");
    expect(giornoDiOggi("2027-01-03")).toBe("domenica 03.01.2027");
  });
});
