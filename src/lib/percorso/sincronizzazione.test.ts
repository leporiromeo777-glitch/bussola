import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IdPasso } from "@/data/passi";
import type { EsitoChiamata, OpzioniChiamata } from "@/lib/strumenti/archivio-account";
import { leggiModifichePassi, leggiRichiestaRisposte, PERCORSO_API, type PercorsoAccount } from "./account-api";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";
import { conNuoveRisposte, conPassoCambiato, COPIA_VUOTA, type CopiaLocale } from "./sincronizza";
import { SincronizzazionePercorso } from "./sincronizzazione";

const UTENTE = { id: "utente-a", email: "a@example.ch" };
const ALTRO = { id: "utente-b", email: "b@example.ch" };

const base: Risposte = {
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
const diverse: Risposte = { ...base, fatturato: "almeno_100k" };

/** Il sito, in memoria: l'account dell'utente e le chiamate ricevute. */
function sito(iniziale: Partial<PercorsoAccount> = {}) {
  const account: PercorsoAccount = { risposte: null, aggiornatoIl: null, passiFatti: [], ...iniziale };
  const chiamate: { metodo: string; corpo?: unknown }[] = [];
  let guasto: { stato: number | null; volte: number } | null = null;
  let orologio = Date.parse("2026-10-19T10:00:00Z");
  const chiama = async <T,>(percorso: string, opzioni: OpzioniChiamata = {}): Promise<EsitoChiamata<T>> => {
    expect(percorso).toBe(PERCORSO_API);
    const metodo = opzioni.metodo ?? "GET";
    chiamate.push({ metodo, corpo: opzioni.corpo });
    await Promise.resolve();
    if (guasto && guasto.volte > 0) {
      guasto.volte--;
      return { ok: false, messaggio: "guasto", stato: guasto.stato };
    }
    if (metodo === "PUT") {
      const risposte = leggiRichiestaRisposte(opzioni.corpo);
      if (!risposte) return { ok: false, messaggio: "non valide", stato: 400 };
      account.risposte = risposte;
      orologio += 60_000;
      account.aggiornatoIl = new Date(orologio).toISOString();
    } else if (metodo === "PATCH") {
      const modifiche = leggiModifichePassi(opzioni.corpo);
      if (!modifiche) return { ok: false, messaggio: "non validi", stato: 400 };
      account.passiFatti = [...account.passiFatti.filter((id) => !modifiche.daFare.includes(id))];
      for (const id of modifiche.fatti) if (!account.passiFatti.includes(id)) account.passiFatti.push(id);
    }
    return { ok: true, dati: structuredClone(account) as T };
  };
  return {
    account,
    chiamate,
    chiama,
    guasta(stato: number | null, volte = 1) {
      guasto = { stato, volte };
    },
  };
}

/** La memoria del telefono, in memoria. */
function telefono(iniziale: Partial<CopiaLocale> = {}) {
  let copia: CopiaLocale = { ...COPIA_VUOTA, ...iniziale };
  const cambi: { risposte: boolean; passi: boolean }[] = [];
  return {
    leggiCopia: () => copia,
    scriviCopia: (nuova: CopiaLocale) => {
      copia = structuredClone(nuova);
    },
    dopoCambio: (c: { risposte: boolean; passi: boolean }) => cambi.push(c),
    cambi,
    get copia() {
      return copia;
    },
    set copia(nuova: CopiaLocale) {
      copia = nuova;
    },
  };
}

function crea(s: ReturnType<typeof sito>, t: ReturnType<typeof telefono>) {
  return new SincronizzazionePercorso(
    { chiama: s.chiama, leggiCopia: t.leggiCopia, scriviCopia: t.scriviCopia, dopoCambio: t.dopoCambio },
    { ritardo: 100, attese: [1_000, 5_000] },
  );
}

const salvate = (risposte: Risposte, aggiornatoIl = "2026-10-18T10:00:00.000Z") => ({ risposte, aggiornatoIl });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SincronizzazionePercorso", () => {
  it("senza accesso non chiama il sito", async () => {
    const s = sito();
    const t = telefono({ risposte: salvate(base) });
    const sinc = crea(s, t);
    sinc.modificaLocale();
    await sinc.sincronizza();
    await vi.runAllTimersAsync();
    expect(s.chiamate).toEqual([]);
    expect(sinc.istantanea().fase).toBe("senza_accesso");
  });

  it("all'accesso da un telefono nuovo porta sul telefono il percorso fatto sul sito", async () => {
    const s = sito({ risposte: base, aggiornatoIl: "2026-10-18T10:00:00.000Z", passiFatti: ["riconoscimento-avs"] });
    const t = telefono();
    const sinc = crea(s, t);
    sinc.impostaUtente(UTENTE);
    expect(sinc.istantanea().fase).toBe("controllo");
    await vi.runAllTimersAsync();
    expect(t.copia).toEqual({
      risposte: salvate(base),
      passiFatti: ["riconoscimento-avs"],
      proprietario: UTENTE.id,
      inSospeso: null,
    });
    expect(t.cambi).toEqual([{ risposte: true, passi: true }]);
    expect(sinc.istantanea()).toMatchObject({ fase: "salvato", occupato: false, email: UTENTE.email });
    expect(s.chiamate.map((c) => c.metodo)).toEqual(["GET"]);
  });

  it("percorso fatto sul telefono senza accesso: chiede, e solo dopo il sì lo salva nell'account", async () => {
    const s = sito();
    const t = telefono({ risposte: salvate(base), passiFatti: ["riconoscimento-avs"] });
    const sinc = crea(s, t);
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();
    expect(sinc.istantanea()).toMatchObject({
      fase: "da_confermare",
      domanda: { soloPassi: false, sostituisce: false, passiNuovi: 1 },
    });
    expect(s.chiamate.map((c) => c.metodo)).toEqual(["GET"]);
    expect(t.copia.proprietario).toBeNull();

    await sinc.conferma();
    expect(s.account).toMatchObject({ risposte: base, passiFatti: ["riconoscimento-avs"] });
    expect(t.copia).toMatchObject({ proprietario: UTENTE.id, inSospeso: null, passiFatti: ["riconoscimento-avs"] });
    expect(sinc.istantanea()).toMatchObject({ fase: "salvato", domanda: null, scritture: 1 });
  });

  it("dopo il no resta solo sul telefono, anche ai controlli successivi, finché non dice sì", async () => {
    const s = sito({ risposte: diverse, aggiornatoIl: "2026-10-17T10:00:00.000Z" });
    const t = telefono({ risposte: salvate(base) });
    const sinc = crea(s, t);
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();
    expect(sinc.istantanea().domanda).toEqual({ soloPassi: false, sostituisce: true, passiNuovi: 0 });
    sinc.rifiuta();
    expect(sinc.istantanea().fase).toBe("rifiutato");
    await sinc.sincronizza();
    expect(sinc.istantanea().fase).toBe("rifiutato");
    expect(s.account.risposte).toEqual(diverse);
    expect(t.copia.risposte?.risposte).toEqual(base);
    await sinc.conferma();
    expect(s.account.risposte).toEqual(base);
    expect(sinc.istantanea().fase).toBe("salvato");
  });

  it("un passo segnato senza rete resta sul telefono e si manda da solo quando la rete torna", async () => {
    const s = sito({ risposte: base, aggiornatoIl: "2026-10-18T10:00:00.000Z" });
    const t = telefono({ risposte: salvate(base), proprietario: UTENTE.id });
    const sinc = crea(s, t);
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();
    expect(sinc.istantanea().fase).toBe("salvato");

    t.copia = conPassoCambiato(t.copia, "riconoscimento-avs", true);
    s.guasta(null, 2);
    sinc.modificaLocale();
    expect(sinc.istantanea().fase).toBe("da_mandare");
    await vi.advanceTimersByTimeAsync(100);
    expect(sinc.istantanea()).toMatchObject({ fase: "da_mandare", errore: { stato: null } });
    expect(t.copia.passiFatti).toEqual(["riconoscimento-avs"]);
    expect(t.copia.inSospeso).toEqual({ utente: UTENTE.id, passi: { "riconoscimento-avs": true } });
    // Primo nuovo tentativo dopo 1 s (ancora guasto), il secondo dopo altri 5 s.
    await vi.advanceTimersByTimeAsync(1_000);
    expect(s.account.passiFatti).toEqual([]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(s.account.passiFatti).toEqual(["riconoscimento-avs"]);
    expect(t.copia.inSospeso).toBeNull();
    expect(sinc.istantanea()).toMatchObject({ fase: "salvato", errore: null });
  });

  it("una modifica fatta mentre si salva non si perde", async () => {
    const s = sito({ risposte: base, aggiornatoIl: "2026-10-18T10:00:00.000Z" });
    const t = telefono({ risposte: salvate(base), proprietario: UTENTE.id });
    const sinc = crea(s, t);
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();

    t.copia = conPassoCambiato(t.copia, "riconoscimento-avs", true);
    const salvataggio = sinc.sincronizza();
    // Mentre la prima richiesta è in viaggio, l'utente toglie la spunta e ne mette un'altra.
    t.copia = conPassoCambiato(conPassoCambiato(t.copia, "riconoscimento-avs", false), "nome-ditta", true);
    sinc.modificaLocale();
    await salvataggio;
    await vi.runAllTimersAsync();
    expect(s.account.passiFatti).toEqual(["nome-ditta"]);
    expect(t.copia.passiFatti).toEqual(["nome-ditta"]);
    expect(t.copia.inSospeso).toBeNull();
    expect(sinc.istantanea().fase).toBe("salvato");
  });

  it("il questionario rifatto sul telefono con l'accesso va nell'account; dal sito arrivano i passi nuovi", async () => {
    const s = sito({ risposte: base, aggiornatoIl: "2026-10-18T10:00:00.000Z", passiFatti: ["riconoscimento-avs"] });
    const t = telefono();
    const sinc = crea(s, t);
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();

    t.copia = conNuoveRisposte(t.copia, salvate(diverse, "2026-10-19T09:00:00.000Z"), UTENTE.id);
    sinc.modificaLocale();
    await vi.runAllTimersAsync();
    expect(s.account.risposte).toEqual(diverse);
    expect(t.copia.risposte).toEqual({ risposte: diverse, aggiornatoIl: s.account.aggiornatoIl });

    // Sul sito: un passo in più.
    s.account.passiFatti.push("nome-ditta");
    await sinc.sincronizza();
    expect(t.copia.passiFatti).toEqual(["riconoscimento-avs", "nome-ditta"]);
    expect(t.cambi.at(-1)).toEqual({ risposte: false, passi: true });
  });

  it("se il sito non tiene una modifica non la rimanda all'infinito: resta sul telefono", async () => {
    const s = sito({ risposte: base, aggiornatoIl: "2026-10-18T10:00:00.000Z" });
    const t = telefono({ risposte: salvate(base), proprietario: UTENTE.id });
    const chiamaSenzaPassi: typeof s.chiama = (percorso, opzioni) =>
      opzioni?.metodo === "PATCH" ? s.chiama(percorso, { metodo: "GET" }) : s.chiama(percorso, opzioni);
    const sinc = new SincronizzazionePercorso(
      { chiama: chiamaSenzaPassi, leggiCopia: t.leggiCopia, scriviCopia: t.scriviCopia },
      { ritardo: 100, attese: [1_000] },
    );
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();
    t.copia = conPassoCambiato(t.copia, "riconoscimento-avs", true);
    sinc.modificaLocale();
    await vi.runAllTimersAsync();
    expect(s.chiamate.length).toBeLessThan(6);
    expect(sinc.istantanea().fase).toBe("errore");
    expect(t.copia.passiFatti).toEqual(["riconoscimento-avs"]);
    expect(t.copia.inSospeso).toEqual({ utente: UTENTE.id, passi: { "riconoscimento-avs": true } });
  });

  it("accesso scaduto: lo dice e non riprova da solo", async () => {
    const s = sito();
    const t = telefono({ risposte: salvate(base), proprietario: UTENTE.id });
    const sinc = crea(s, t);
    s.guasta(401, 5);
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();
    expect(sinc.istantanea()).toMatchObject({ fase: "accesso_scaduto", errore: { stato: 401 } });
    expect(s.chiamate).toHaveLength(1);
    expect(t.copia.risposte).toEqual(salvate(base));
  });

  it("senza rete al primo controllo: il telefono resta com'è e si riprova", async () => {
    const s = sito({ risposte: diverse, aggiornatoIl: "2026-10-18T10:00:00.000Z" });
    const t = telefono({ risposte: salvate(base, "2026-10-01T10:00:00.000Z"), proprietario: UTENTE.id });
    const sinc = crea(s, t);
    s.guasta(null, 1);
    sinc.impostaUtente(UTENTE);
    await vi.advanceTimersByTimeAsync(0);
    expect(sinc.istantanea().fase).toBe("non_raggiungibile");
    expect(t.copia.risposte?.risposte).toEqual(base);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(sinc.istantanea().fase).toBe("salvato");
    expect(t.copia.risposte?.risposte).toEqual(diverse);
  });

  it("cambiando account le risposte ancora in viaggio non toccano il telefono", async () => {
    const s = sito({ risposte: base, aggiornatoIl: "2026-10-18T10:00:00.000Z" });
    const t = telefono();
    const sinc = crea(s, t);
    sinc.impostaUtente(UTENTE);
    // La lettura parte subito; prima che arrivi la risposta, l'utente esce.
    const inViaggio = sinc.sincronizza();
    sinc.impostaUtente(null);
    await inViaggio;
    await vi.runAllTimersAsync();
    expect(t.copia).toEqual(COPIA_VUOTA);
    expect(sinc.istantanea().fase).toBe("senza_accesso");
    // Un altro account: la sua copia.
    sinc.impostaUtente(ALTRO);
    await vi.runAllTimersAsync();
    expect(t.copia.proprietario).toBe(ALTRO.id);
  });

  it("daSalvare: vero se qualcosa del telefono non è (o forse non è) nell'account", async () => {
    const s = sito({ risposte: base, aggiornatoIl: "2026-10-18T10:00:00.000Z" });
    const t = telefono();
    const sinc = crea(s, t);
    expect(sinc.daSalvare()).toBe(false);
    sinc.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();
    expect(sinc.daSalvare()).toBe(false);
    t.copia = conPassoCambiato(t.copia, "riconoscimento-avs", true);
    sinc.modificaLocale();
    expect(sinc.daSalvare()).toBe(true);
    await vi.runAllTimersAsync();
    expect(sinc.daSalvare()).toBe(false);
    // Percorso del telefono rifiutato: non è nell'account.
    const t2 = telefono({ risposte: salvate(diverse, "2030-01-01T00:00:00.000Z"), passiFatti: [] as IdPasso[] });
    const sinc2 = crea(s, t2);
    sinc2.impostaUtente(UTENTE);
    await vi.runAllTimersAsync();
    sinc2.rifiuta();
    expect(sinc2.daSalvare()).toBe(true);
  });
});
