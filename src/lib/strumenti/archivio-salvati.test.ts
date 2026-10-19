import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Chiamata, EsitoChiamata, OpzioniChiamata } from "./archivio-account";
import { ArchivioStrumento } from "./archivio-salvati";
import { datiBudgetIniziali, type DatiBudget } from "./budget";
import { datiPianoIniziali } from "./business-plan";

const OGGI = "2026-10-19";
const iniziale = () => datiBudgetIniziali(OGGI);
const budget = (ricavo: string): DatiBudget => ({ ...iniziale(), ricavi: Array.from({ length: 12 }, () => ricavo) });

type Richiesta = { percorso: string; metodo: string; corpo?: unknown; keepalive?: boolean };

/** Un finto sito: risponde con quello che il test decide, e registra le richieste. */
function finto() {
  const richieste: Richiesta[] = [];
  let risposte: ((r: Richiesta) => EsitoChiamata<unknown> | Promise<EsitoChiamata<unknown>>)[] = [];
  let nellAccount: unknown = null;
  const chiama: Chiamata = async <T,>(percorso: string, opzioni: OpzioniChiamata = {}) => {
    const r = { percorso, metodo: opzioni.metodo ?? "GET", corpo: opzioni.corpo, keepalive: opzioni.keepalive };
    richieste.push(r);
    const prossima = risposte.shift();
    if (prossima) return (await prossima(r)) as EsitoChiamata<T>;
    if (r.metodo === "GET") {
      return { ok: true, dati: { dati: structuredClone(nellAccount), aggiornatoIl: nellAccount ? "2026-10-18T08:00:00.000Z" : null } as T };
    }
    if (r.metodo === "DELETE") return { ok: true, dati: undefined as T };
    return { ok: true, dati: { aggiornatoIl: "2026-10-19T10:00:00.000Z" } as T };
  };
  return {
    chiama,
    richieste,
    salvataggi: () => richieste.filter((r) => r.metodo !== "GET"),
    imposta: (dati: unknown) => {
      nellAccount = dati;
    },
    poi: (...r: typeof risposte) => {
      risposte = [...risposte, ...r];
    },
  };
}

const errore = (stato: number | null, messaggio = "Errore"): EsitoChiamata<never> => ({ ok: false, messaggio, stato });
const nuovo = (sito: ReturnType<typeof finto>) => new ArchivioStrumento("budget", sito.chiama, { oggi: () => OGGI });

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("ArchivioStrumento: lettura", () => {
  it("legge una volta sola; senza dati nell'account mostra quelli iniziali", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    archivio.aggiorna(() => budget("1"));
    expect(archivio.istantanea().dati).toBeNull();
    await archivio.carica();
    await archivio.carica();
    expect(sito.richieste).toEqual([{ percorso: "/api/strumenti/salvati/budget", metodo: "GET", corpo: undefined, keepalive: undefined }]);
    expect(archivio.istantanea()).toMatchObject({ caricamento: "pronto", nellAccount: false, dati: iniziale(), salvataggio: "salvato" });
  });

  it("con i dati nell'account li mostra, riletti con lo schema dello strumento", async () => {
    const sito = finto();
    sito.imposta({ ...budget("2000"), extra: "via" });
    const archivio = nuovo(sito);
    await archivio.carica();
    expect(archivio.istantanea()).toMatchObject({ nellAccount: true, dati: budget("2000"), aggiornatoIl: "2026-10-18T08:00:00.000Z" });
  });

  it("se la lettura non riesce lo dice, e si può riprovare", async () => {
    const sito = finto();
    sito.poi(
      () => errore(null, "Non riesco a raggiungere Bleo"),
      () => ({ ok: true, dati: { qualcosa: "di strano" } }),
    );
    const archivio = nuovo(sito);
    await archivio.carica();
    expect(archivio.istantanea()).toMatchObject({ caricamento: "errore", errore: { messaggio: "Non riesco a raggiungere Bleo" } });
    await archivio.carica();
    expect(archivio.istantanea()).toMatchObject({ caricamento: "errore", errore: { messaggio: "Risposta inattesa da Bleo. Riprova tra poco." } });
    await archivio.carica();
    expect(archivio.istantanea()).toMatchObject({ caricamento: "pronto", errore: null });
  });

  it("rileggendo (dopo una modifica sull'altro dispositivo) si vedono i dati nuovi, ma non sopra quelli non ancora salvati", async () => {
    const sito = finto();
    sito.imposta(budget("100"));
    const archivio = nuovo(sito);
    await archivio.carica();
    sito.imposta(budget("200"));
    await archivio.carica({ forza: true });
    expect(archivio.istantanea().dati).toEqual(budget("200"));
    archivio.aggiorna(() => budget("300"));
    sito.imposta(budget("400"));
    await archivio.carica({ forza: true });
    expect(archivio.istantanea().dati).toEqual(budget("300"));
  });
});

describe("ArchivioStrumento: salvataggio", () => {
  it("salva dopo una pausa solo l'ultima versione", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    archivio.aggiorna((d) => ({ ...d, prelieviMensili: "3" }));
    archivio.aggiorna((d) => ({ ...d, prelieviMensili: "3000" }));
    expect(archivio.istantanea().salvataggio).toBe("in_attesa");
    expect(archivio.inAttesa()).toBe(true);
    await vi.advanceTimersByTimeAsync(799);
    expect(sito.salvataggi()).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(sito.salvataggi()).toEqual([
      { percorso: "/api/strumenti/salvati/budget", metodo: "PUT", corpo: { ...iniziale(), prelieviMensili: "3000" }, keepalive: false },
    ]);
    expect(archivio.istantanea()).toMatchObject({
      salvataggio: "salvato",
      nellAccount: true,
      aggiornatoIl: "2026-10-19T10:00:00.000Z",
    });
    expect(archivio.inAttesa()).toBe(false);
  });

  it("niente salvataggio se la modifica non cambia niente", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    archivio.aggiorna((d) => d);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(sito.salvataggi()).toEqual([]);
  });

  it("una modifica fatta mentre salva parte dopo, con i dati nuovi", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    let rispondi: (e: EsitoChiamata<unknown>) => void = () => {};
    sito.poi(() => new Promise((ok) => (rispondi = ok)));
    archivio.aggiorna(() => budget("1"));
    await vi.advanceTimersByTimeAsync(800);
    expect(archivio.istantanea().salvataggio).toBe("in_corso");
    archivio.aggiorna(() => budget("2"));
    rispondi({ ok: true, dati: { aggiornatoIl: "2026-10-19T10:00:00.000Z" } });
    await vi.advanceTimersByTimeAsync(0);
    expect(archivio.istantanea().salvataggio).toBe("in_attesa");
    await vi.advanceTimersByTimeAsync(800);
    expect(sito.salvataggi().map((r) => (r.corpo as DatiBudget).ricavi[0])).toEqual(["1", "2"]);
    expect(archivio.istantanea().salvataggio).toBe("salvato");
  });

  it("senza rete riprova da solo, con attese sempre più lunghe", async () => {
    const sito = finto();
    const archivio = new ArchivioStrumento("budget", sito.chiama, { oggi: () => OGGI, attese: [1_000, 3_000] });
    await archivio.carica();
    sito.poi(
      () => errore(null, "Non riesco a raggiungere Bleo"),
      () => errore(503, "Non riesco a salvare"),
    );
    archivio.aggiorna(() => budget("1"));
    await vi.advanceTimersByTimeAsync(800);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "errore", erroreSalvataggio: { stato: null } });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "errore", erroreSalvataggio: { stato: 503 } });
    await vi.advanceTimersByTimeAsync(2_999);
    expect(sito.salvataggi()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(sito.salvataggi()).toHaveLength(3);
    expect(archivio.istantanea().salvataggio).toBe("salvato");
  });

  it("dati rifiutati o accesso scaduto: non riprova uguale, ma alla prossima modifica sì", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    sito.poi(() => errore(401, "Accedi di nuovo"));
    archivio.aggiorna(() => budget("1"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sito.salvataggi()).toHaveLength(1);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "errore", erroreSalvataggio: { stato: 401 } });
    archivio.aggiorna(() => budget("2"));
    await vi.advanceTimersByTimeAsync(800);
    expect(sito.salvataggi()).toHaveLength(2);
    expect(archivio.istantanea().salvataggio).toBe("salvato");
  });

  it("salva subito su richiesta, anche con keepalive", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    archivio.aggiorna(() => budget("1"));
    await archivio.salva({ keepalive: true });
    expect(sito.salvataggi()).toEqual([expect.objectContaining({ metodo: "PUT", keepalive: true })]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(sito.salvataggi()).toHaveLength(1);
  });

  it("«ricomincia da zero»: dati iniziali e riga cancellata dall'account (anche se era già cancellata)", async () => {
    const sito = finto();
    sito.imposta(budget("100"));
    const archivio = nuovo(sito);
    await archivio.carica();
    archivio.cancella();
    expect(archivio.istantanea().dati).toEqual(iniziale());
    await vi.advanceTimersByTimeAsync(0);
    expect(sito.salvataggi()).toEqual([expect.objectContaining({ metodo: "DELETE" })]);
    expect(archivio.istantanea()).toMatchObject({ nellAccount: false, aggiornatoIl: null, salvataggio: "salvato" });

    sito.poi(() => errore(404, "Niente da cancellare"));
    archivio.cancella();
    await vi.advanceTimersByTimeAsync(0);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "salvato", erroreSalvataggio: null });

    // Si ricomincia a scrivere: si salva di nuovo.
    archivio.aggiorna(() => budget("5"));
    await vi.advanceTimersByTimeAsync(800);
    expect(sito.salvataggi().map((r) => r.metodo)).toEqual(["DELETE", "DELETE", "PUT"]);
    expect(archivio.istantanea().nellAccount).toBe(true);
  });
});

describe("ArchivioStrumento: copia dal browser o dal telefono", () => {
  it("copia nell'account vuoto", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    sito.poi((r) => ({ ok: true, dati: { importato: true, dati: r.corpo, aggiornatoIl: "2026-10-19T11:00:00.000Z" } }));
    expect(await archivio.importa(budget("700"))).toEqual({ ok: true, importato: true });
    expect(sito.salvataggi()).toEqual([expect.objectContaining({ metodo: "POST", corpo: budget("700") })]);
    expect(archivio.istantanea()).toMatchObject({ dati: budget("700"), nellAccount: true, aggiornatoIl: "2026-10-19T11:00:00.000Z" });
  });

  it("se nel frattempo l'account ha i suoi dati, restano quelli", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    sito.poi(() => ({ ok: true, dati: { importato: false, dati: budget("50"), aggiornatoIl: "2026-10-19T09:00:00.000Z" } }));
    expect(await archivio.importa(budget("700"))).toEqual({ ok: true, importato: false });
    expect(archivio.istantanea()).toMatchObject({ dati: budget("50"), nellAccount: true });
  });

  it("prima della copia salva le modifiche fatte qui; un errore si restituisce", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    await archivio.carica();
    archivio.aggiorna(() => budget("9"));
    sito.poi(
      () => ({ ok: true, dati: { aggiornatoIl: "2026-10-19T10:00:00.000Z" } }),
      () => errore(503, "Non riesco a salvare"),
    );
    expect(await archivio.importa(budget("700"))).toEqual({ ok: false, errore: { messaggio: "Non riesco a salvare", stato: 503 } });
    expect(sito.salvataggi().map((r) => r.metodo)).toEqual(["PUT", "POST"]);
    expect(archivio.istantanea().dati).toEqual(budget("9"));
  });

  it("sostituisce i dati dell'account con quelli scelti e li salva subito", async () => {
    const sito = finto();
    sito.imposta(budget("50"));
    const archivio = nuovo(sito);
    await archivio.carica();
    expect(await archivio.sostituisci(budget("700"))).toEqual({ ok: true });
    expect(sito.salvataggi()).toEqual([expect.objectContaining({ metodo: "PUT", corpo: budget("700") })]);
    sito.poi(() => errore(400, "Dati non validi"));
    expect(await archivio.sostituisci(budget("800"))).toEqual({ ok: false, errore: { messaggio: "Dati non validi", stato: 400 } });
  });
});

describe("ArchivioStrumento: uscita dall'account", () => {
  it("azzera dimentica tutto e ignora le risposte arrivate dopo", async () => {
    const sito = finto();
    const archivio = nuovo(sito);
    let rispondi: (e: EsitoChiamata<unknown>) => void = () => {};
    sito.poi(() => new Promise((ok) => (rispondi = ok)));
    const lettura = archivio.carica();
    archivio.azzera();
    rispondi({ ok: true, dati: { dati: budget("1"), aggiornatoIl: null } });
    await lettura;
    expect(archivio.istantanea()).toMatchObject({ caricamento: "da_fare", dati: null });
  });

  it("vale anche per il business plan", async () => {
    const sito = finto();
    const archivio = new ArchivioStrumento("business-plan", sito.chiama);
    await archivio.carica();
    expect(archivio.istantanea().dati).toEqual(datiPianoIniziali());
    archivio.aggiorna((d) => ({ ...d, nomeAttivita: "Siti Rossi" }));
    await vi.advanceTimersByTimeAsync(800);
    expect(sito.salvataggi()).toEqual([
      expect.objectContaining({ percorso: "/api/strumenti/salvati/business-plan", metodo: "PUT", corpo: { ...datiPianoIniziali(), nomeAttivita: "Siti Rossi" } }),
    ]);
  });
});
