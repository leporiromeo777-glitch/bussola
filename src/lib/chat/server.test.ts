import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cancellazioni: { tabella: string; filtri: [string, unknown][] }[] = [];
let adminConfigurato = true;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    adminConfigurato
      ? {
          from: (tabella: string) => ({
            delete: () => {
              const voce = { tabella, filtri: [] as [string, unknown][] };
              cancellazioni.push(voce);
              const catena = {
                eq(colonna: string, valore: unknown) {
                  voce.filtri.push([colonna, valore]);
                  return catena;
                },
                then: (risolvi: (r: { error: null }) => unknown) => risolvi({ error: null }),
              };
              return catena;
            },
          }),
        }
      : null,
}));

const { dipendenzeChat, prenotaDomanda } = await import("./server");

type Client = Parameters<typeof prenotaDomanda>[0];

function clientRpc(risposta: { data: unknown; error: { code?: string; message: string } | null }) {
  const chiamate: [string, unknown][] = [];
  const client = {
    rpc: async (nome: string, argomenti: unknown) => {
      chiamate.push([nome, argomenti]);
      return risposta;
    },
  } as unknown as Client;
  return { client, chiamate };
}

beforeEach(() => {
  cancellazioni.length = 0;
  adminConfigurato = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("prenotaDomanda", () => {
  it("prenota la domanda con la funzione atomica del database", async () => {
    const { client, chiamate } = clientRpc({ data: 42, error: null });
    expect(await prenotaDomanda(client, "Devo iscrivermi all'IVA?")).toEqual({ tipo: "prenotata", id: 42 });
    expect(chiamate).toEqual([["prenota_domanda", { p_domanda: "Devo iscrivermi all'IVA?" }]]);
  });

  it("null dal database vuol dire quota esaurita", async () => {
    const { client } = clientRpc({ data: null, error: null });
    expect(await prenotaDomanda(client, "Domanda?")).toEqual({ tipo: "quota_esaurita" });
  });

  it("un errore del database o un id strano non fanno partire la domanda", async () => {
    expect(await prenotaDomanda(clientRpc({ data: null, error: { message: "giù" } }).client, "Domanda?")).toEqual({
      tipo: "errore",
    });
    expect(await prenotaDomanda(clientRpc({ data: "abc", error: null }).client, "Domanda?")).toEqual({
      tipo: "errore",
    });
  });
});

describe("dipendenzeChat", () => {
  function dipendenze(segnale: AbortSignal) {
    const { client, chiamate } = clientRpc({ data: null, error: null });
    const dip = dipendenzeChat({
      supabase: client,
      userId: "utente-1",
      idDomanda: 7,
      anthropic: {} as Anthropic,
      segnale,
    });
    return { dip, chiamate };
  }

  it("salva completa la riga prenotata con chiudi_domanda", async () => {
    const { dip, chiamate } = dipendenze(new AbortController().signal);
    await dip.salva({ fonti_citate: ["iva"], senza_risposta: false });
    expect(chiamate).toEqual([["chiudi_domanda", { p_id: 7, p_fonti: ["iva"], p_senza: false }]]);
  });

  it("annulla cancella la prenotazione con la chiave segreta, solo per quell'utente", async () => {
    const { dip } = dipendenze(new AbortController().signal);
    await dip.annulla();
    expect(cancellazioni).toEqual([
      {
        tabella: "domande_chat",
        filtri: [
          ["id", 7],
          ["user_id", "utente-1"],
        ],
      },
    ]);
  });

  it("se chi chiede ha interrotto la richiesta la domanda resta contata", async () => {
    const controllo = new AbortController();
    controllo.abort();
    const { dip } = dipendenze(controllo.signal);
    await dip.annulla();
    expect(cancellazioni).toEqual([]);
  });

  it("senza chiave segreta non annulla nulla", async () => {
    adminConfigurato = false;
    const { dip } = dipendenze(new AbortController().signal);
    await expect(dip.annulla()).resolves.toBeUndefined();
    expect(cancellazioni).toEqual([]);
  });
});
