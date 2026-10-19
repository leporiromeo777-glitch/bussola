import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RispostaDocumenti } from "./account";
import { ArchivioAccount, type Chiamata, type EsitoChiamata, type OpzioniChiamata } from "./archivio-account";
import { emittenteVuoto, nuovoDocumento, type Documento, type Emittente } from "./documenti";

const emittente: Emittente = { ...emittenteVuoto(), nome: "Giulia Bernasconi", npa: "6500", localita: "Bellinzona" };

const doc = (id: string, campi: Partial<Documento> = {}): Documento => ({
  ...nuovoDocumento("fattura", emittente, [], {
    id,
    oggiIso: "2026-10-19",
    adessoIso: "2026-10-19T10:00:00.000Z",
    idRiga: () => `${id}-r1`,
  }),
  ...campi,
});

type Richiesta = { percorso: string; metodo: string; corpo?: unknown; keepalive?: boolean };

/** Un finto sito: risponde con quello che il test decide, e registra le richieste. */
function finto() {
  const richieste: Richiesta[] = [];
  let risposte: ((r: Richiesta) => EsitoChiamata<unknown> | Promise<EsitoChiamata<unknown>>)[] = [];
  let elenco: RispostaDocumenti = { documenti: [], emittente: null };
  const chiama: Chiamata = async <T,>(percorso: string, opzioni: OpzioniChiamata = {}) => {
    const r = { percorso, metodo: opzioni.metodo ?? "GET", corpo: opzioni.corpo, keepalive: opzioni.keepalive };
    richieste.push(r);
    const prossima = risposte.shift();
    if (prossima) return (await prossima(r)) as EsitoChiamata<T>;
    if (r.metodo === "GET") return { ok: true, dati: structuredClone(elenco) as T };
    return { ok: true, dati: { ok: true } as T };
  };
  return {
    chiama,
    richieste,
    salvataggi: () => richieste.filter((r) => r.metodo !== "GET"),
    imposta: (e: RispostaDocumenti) => {
      elenco = e;
    },
    poi: (...r: typeof risposte) => {
      risposte = [...risposte, ...r];
    },
  };
}

const errore = (stato: number | null, messaggio = "Errore"): EsitoChiamata<never> => ({ ok: false, messaggio, stato });

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("ArchivioAccount: lettura", () => {
  it("legge una volta sola documenti ed emittente; prima della lettura non si cambia niente", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001")], emittente });
    const archivio = new ArchivioAccount(sito.chiama);
    archivio.aggiornaDocumenti((l) => [...l, doc("x1b2c3d4-0001")]);
    expect(archivio.istantanea().documenti).toBeNull();
    await archivio.carica();
    await archivio.carica();
    expect(sito.richieste).toHaveLength(1);
    expect(archivio.istantanea()).toMatchObject({
      caricamento: "pronto",
      emittente,
      emittenteNellAccount: true,
      salvataggio: "salvato",
    });
    expect(archivio.istantanea().documenti?.map((d) => d.id)).toEqual(["a1b2c3d4-0001"]);
  });

  it("se la lettura non riesce lo dice, e si può riprovare", async () => {
    const sito = finto();
    sito.poi(() => errore(null, "Non riesco a raggiungere Bleo"));
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    expect(archivio.istantanea()).toMatchObject({ caricamento: "errore", errore: { messaggio: "Non riesco a raggiungere Bleo" } });
    await archivio.carica();
    expect(archivio.istantanea()).toMatchObject({ caricamento: "pronto", errore: null, documenti: [] });
  });

  it("rileggendo, le modifiche non ancora salvate restano quelle fatte qui", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001"), doc("a1b2c3d4-0002")], emittente: null });
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    archivio.aggiornaDocumenti((l) => [
      ...l.filter((d) => d.id !== "a1b2c3d4-0002").map((d) => ({ ...d, note: "cambiata qui" })),
      doc("a1b2c3d4-0003"),
    ]);
    sito.imposta({ documenti: [doc("a1b2c3d4-0001", { note: "vecchia" }), doc("a1b2c3d4-0002"), doc("a1b2c3d4-0004")], emittente });
    await archivio.carica({ forza: true });
    const documenti = archivio.istantanea().documenti ?? [];
    expect(documenti.map((d) => [d.id, d.note])).toEqual([
      ["a1b2c3d4-0001", "cambiata qui"],
      ["a1b2c3d4-0004", ""],
      ["a1b2c3d4-0003", ""],
    ]);
    expect(archivio.istantanea().emittente).toEqual(emittente);
  });
});

describe("ArchivioAccount: salvataggio", () => {
  it("salva dopo una pausa solo i documenti cambiati, cancella quelli tolti, e l'emittente", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001"), doc("a1b2c3d4-0002")], emittente: null });
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    archivio.aggiornaDocumenti((l) => l.map((d) => (d.id === "a1b2c3d4-0001" ? { ...d, note: "a" } : d)));
    archivio.aggiornaDocumenti((l) => l.map((d) => (d.id === "a1b2c3d4-0001" ? { ...d, note: "ab" } : d)));
    archivio.aggiornaDocumenti((l) => l.filter((d) => d.id !== "a1b2c3d4-0002"));
    archivio.aggiornaEmittente(() => emittente);
    expect(archivio.istantanea().salvataggio).toBe("in_attesa");
    expect(archivio.inAttesa()).toBe(true);
    expect(sito.salvataggi()).toEqual([]);

    await vi.advanceTimersByTimeAsync(800);
    expect(sito.salvataggi()).toEqual([
      { percorso: "/api/strumenti/documenti/a1b2c3d4-0001", metodo: "PUT", corpo: expect.objectContaining({ note: "ab" }), keepalive: false },
      { percorso: "/api/strumenti/documenti/a1b2c3d4-0002", metodo: "DELETE", corpo: undefined, keepalive: false },
      { percorso: "/api/strumenti/emittente", metodo: "PUT", corpo: emittente, keepalive: false },
    ]);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "salvato", emittenteNellAccount: true });
    expect(archivio.inAttesa()).toBe(false);
  });

  it("una modifica fatta mentre si salva viene salvata dopo", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001")], emittente: null });
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    let rispondi: () => void = () => {};
    sito.poi(
      () =>
        new Promise((ok) => {
          rispondi = () => ok({ ok: true, dati: null });
        }),
    );
    archivio.aggiornaDocumenti((l) => l.map((d) => ({ ...d, note: "prima" })));
    await vi.advanceTimersByTimeAsync(800);
    archivio.aggiornaDocumenti((l) => l.map((d) => ({ ...d, note: "dopo" })));
    rispondi();
    await vi.advanceTimersByTimeAsync(800);
    const corpi = sito.salvataggi().map((r) => (r.corpo as Documento).note);
    expect(corpi).toEqual(["prima", "dopo"]);
    expect(archivio.istantanea().salvataggio).toBe("salvato");
  });

  it("senza rete riprova da solo, sempre con l'ultima versione", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001")], emittente: null });
    const archivio = new ArchivioAccount(sito.chiama, { attese: [1000, 5000] });
    await archivio.carica();
    sito.poi(
      () => errore(null, "Non riesco a raggiungere Bleo"),
      () => errore(503, "Riprova tra poco"),
    );
    archivio.aggiornaDocumenti((l) => l.map((d) => ({ ...d, note: "x" })));
    await vi.advanceTimersByTimeAsync(800);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "errore", erroreSalvataggio: { stato: null } });
    await vi.advanceTimersByTimeAsync(1000);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "errore", erroreSalvataggio: { stato: 503 } });
    await vi.advanceTimersByTimeAsync(4999);
    expect(sito.salvataggi()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(sito.salvataggi()).toHaveLength(3);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "salvato", erroreSalvataggio: null });
  });

  it("con l'accesso scaduto o dati rifiutati non riprova da solo, ma alla modifica dopo sì", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001"), doc("a1b2c3d4-0002")], emittente: null });
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    sito.poi(() => errore(400, "Questo documento non si può salvare così"));
    archivio.aggiornaDocumenti((l) => l.map((d) => ({ ...d, note: "x" })));
    await vi.advanceTimersByTimeAsync(800);
    // Il primo è rifiutato, il secondo si salva lo stesso.
    expect(sito.salvataggi()).toHaveLength(2);
    expect(archivio.istantanea()).toMatchObject({ salvataggio: "errore", erroreSalvataggio: { stato: 400 } });
    await vi.advanceTimersByTimeAsync(120_000);
    expect(sito.salvataggi()).toHaveLength(2);

    sito.poi(() => errore(401, "Accedi di nuovo"));
    archivio.aggiornaDocumenti((l) => l.map((d) => ({ ...d, note: "y" })));
    await vi.advanceTimersByTimeAsync(800);
    expect(archivio.istantanea()).toMatchObject({ erroreSalvataggio: { stato: 401 } });
    expect(sito.salvataggi()).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(sito.salvataggi()).toHaveLength(3);

    await archivio.salva();
    expect(sito.salvataggi()).toHaveLength(5);
    expect(archivio.istantanea().salvataggio).toBe("salvato");
  });

  it("salva subito su richiesta, anche con keepalive (pagina che si chiude)", async () => {
    const sito = finto();
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    archivio.aggiornaDocumenti((l) => [...l, doc("a1b2c3d4-0009")]);
    await archivio.salva({ keepalive: true });
    expect(sito.salvataggi()).toEqual([
      expect.objectContaining({ percorso: "/api/strumenti/documenti/a1b2c3d4-0009", metodo: "PUT", keepalive: true }),
    ]);
    await vi.advanceTimersByTimeAsync(5000);
    expect(sito.salvataggi()).toHaveLength(1);
  });

  it("un documento già cancellato altrove (404) va bene", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001")], emittente: null });
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    sito.poi(() => errore(404, "Non c'è più"));
    archivio.aggiornaDocumenti(() => []);
    await vi.advanceTimersByTimeAsync(800);
    expect(archivio.istantanea().salvataggio).toBe("salvato");
  });
});

describe("ArchivioAccount: importazione e uscita", () => {
  it("importa a gruppi e aggiunge solo i documenti nuovi; l'emittente solo se l'account non lo ha", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001")], emittente: null });
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    const locali = Array.from({ length: 30 }, (_, i) => doc(`l0000000-${String(i).padStart(4, "0")}`));
    sito.poi(
      (r) => ({
        ok: true,
        dati: {
          importati: (r.corpo as { documenti: Documento[] }).documenti.slice(1).map((d) => d.id),
          giaPresenti: [(r.corpo as { documenti: Documento[] }).documenti[0].id],
          scartati: 0,
          emittente: true,
        },
      }),
      (r) => ({
        ok: true,
        dati: { importati: (r.corpo as { documenti: Documento[] }).documenti.map((d) => d.id), giaPresenti: [], scartati: 1, emittente: false },
      }),
    );
    const esito = await archivio.importa(locali, emittente);
    expect(esito).toMatchObject({ ok: true, scartati: 1 });
    if (!esito.ok) throw new Error("atteso ok");
    expect(esito.importati).toHaveLength(29);
    expect(esito.giaPresenti).toEqual(["l0000000-0000"]);
    const corpi = sito.salvataggi().map((r) => r.corpo as { documenti: Documento[]; emittente?: Emittente });
    expect(corpi.map((c) => c.documenti.length)).toEqual([25, 5]);
    expect(corpi[0].emittente).toEqual(emittente);
    expect(corpi[1].emittente).toBeUndefined();
    expect(archivio.istantanea().documenti).toHaveLength(30);
    expect(archivio.istantanea()).toMatchObject({ emittente, emittenteNellAccount: true });
  });

  it("se un gruppo non passa, dice quanti sono già stati importati", async () => {
    const sito = finto();
    const archivio = new ArchivioAccount(sito.chiama);
    await archivio.carica();
    sito.poi(() => errore(409, "Troppi documenti"));
    const esito = await archivio.importa([doc("a1b2c3d4-0001")], null);
    expect(esito).toEqual({ ok: false, errore: { messaggio: "Troppi documenti", stato: 409 }, importati: [] });
  });

  it("azzera dimentica tutto e ignora le risposte arrivate dopo", async () => {
    const sito = finto();
    sito.imposta({ documenti: [doc("a1b2c3d4-0001")], emittente });
    const archivio = new ArchivioAccount(sito.chiama);
    const lettura = archivio.carica();
    archivio.azzera();
    await lettura;
    expect(archivio.istantanea()).toMatchObject({ caricamento: "da_fare", documenti: null, emittente: null });
    await archivio.carica();
    archivio.aggiornaDocumenti(() => []);
    archivio.azzera();
    await vi.advanceTimersByTimeAsync(5000);
    expect(sito.salvataggi()).toEqual([]);
  });

  it("avvisa chi ascolta a ogni cambiamento", async () => {
    const sito = finto();
    const archivio = new ArchivioAccount(sito.chiama);
    const ascolta = vi.fn();
    const smetti = archivio.iscrivi(ascolta);
    await archivio.carica();
    expect(ascolta).toHaveBeenCalled();
    const volte = ascolta.mock.calls.length;
    smetti();
    archivio.aggiornaDocumenti(() => [doc("a1b2c3d4-0001")]);
    expect(ascolta.mock.calls.length).toBe(volte);
  });
});
