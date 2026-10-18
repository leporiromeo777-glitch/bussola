import { beforeEach, describe, expect, it, vi } from "vitest";
import { improntaToken, leggiLinkCreato, leggiStatoCalendario } from "@/lib/percorso/abbonamento";
import { VERSIONE_RISPOSTE } from "@/lib/percorso/risposte";

vi.mock("server-only", () => ({}));

const UTENTE = "11111111-1111-1111-1111-111111111111";
const RISPOSTE = {
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

const stato = vi.hoisted(() => ({
  utente: { ok: true } as { ok: true } | { ok: false; motivo: "non_configurato" | "non_collegato" },
  link: null as { id: string; creato_il: string; letto_il: string | null } | null,
  questionario: null as { risposte: unknown; aggiornato_il: string } | null,
  chiamate: [] as { funzione: string; argomenti: Record<string, unknown> }[],
  salvate: [] as Record<string, unknown>[],
  cancellazioni: [] as string[],
}));

function client() {
  return {
    rpc: async (funzione: string, argomenti: Record<string, unknown>) => {
      stato.chiamate.push({ funzione, argomenti });
      stato.link = { id: "link-nuovo", creato_il: "2026-10-18T10:00:00+00:00", letto_il: null };
      return { data: [{ id: "link-nuovo", creato_il: "2026-10-18T10:00:00+00:00" }], error: null };
    },
    from: (tabella: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: tabella === "link_calendario" ? stato.link : stato.questionario,
            error: null,
          }),
        }),
      }),
      upsert: async (riga: Record<string, unknown>) => {
        stato.salvate.push(riga);
        stato.questionario = { risposte: riga.risposte, aggiornato_il: String(riga.aggiornato_il) };
        return { error: null };
      },
      delete: () => ({
        eq: async (_colonna: string, valore: string) => {
          stato.cancellazioni.push(`${tabella}:${valore}`);
          stato.link = null;
          return { error: null };
        },
      }),
    }),
  };
}

vi.mock("@/lib/supabase/richiesta", () => ({
  utenteDaRichiesta: async () =>
    stato.utente.ok ? { ok: true, supabase: client(), user: { id: UTENTE } } : stato.utente,
}));

const { DELETE, GET, POST, PUT } = await import("./route");

function richiesta(metodo: string, corpo?: unknown) {
  return new Request("https://bleo.example/api/calendario", {
    method: metodo,
    headers: corpo === undefined ? {} : { "content-type": "application/json" },
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://progetto.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_prova");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_prova");
  stato.utente = { ok: true };
  stato.link = null;
  stato.questionario = null;
  stato.chiamate = [];
  stato.salvate = [];
  stato.cancellazioni = [];
});

describe("/api/calendario", () => {
  it("POST crea il token sul server e manda al database solo la sua impronta", async () => {
    const risposta = await POST(richiesta("POST"));
    expect(risposta.status).toBe(201);
    expect(risposta.headers.get("cache-control")).toBe("no-store");
    const creato = leggiLinkCreato(await risposta.json());
    expect(creato).not.toBeNull();
    const token = creato!.percorso.split("/").at(-1)!;
    expect(stato.chiamate).toEqual([
      { funzione: "nuovo_link_calendario", argomenti: { p_impronta: await improntaToken(token) } },
    ]);
    expect(JSON.stringify(stato.chiamate)).not.toContain(token);
    // Ogni volta un token diverso.
    const secondo = leggiLinkCreato(await (await POST(richiesta("POST"))).json());
    expect(secondo?.percorso).not.toBe(creato?.percorso);
  });

  it("GET dice se c'è un link (senza token) e quali risposte usa il calendario", async () => {
    expect(leggiStatoCalendario(await (await GET(richiesta("GET"))).json())).toEqual({ link: null, percorso: null });
    stato.link = { id: "link-1", creato_il: "2026-10-18T10:00:00+00:00", letto_il: null };
    stato.questionario = { risposte: RISPOSTE, aggiornato_il: "2026-10-17T08:00:00+00:00" };
    const corpo = await (await GET(richiesta("GET"))).json();
    expect(corpo).toEqual({
      link: { id: "link-1", creatoIl: "2026-10-18T10:00:00+00:00", lettoIl: null },
      percorso: { risposte: RISPOSTE, aggiornatoIl: "2026-10-17T08:00:00+00:00" },
    });
  });

  it("PUT salva nell'account solo risposte valide", async () => {
    const ok = await PUT(richiesta("PUT", { risposte: RISPOSTE }));
    expect(ok.status).toBe(200);
    expect(stato.salvate).toHaveLength(1);
    expect(stato.salvate[0]).toMatchObject({ user_id: UTENTE, risposte: RISPOSTE });
    expect(leggiStatoCalendario(await ok.json())?.percorso?.risposte).toEqual(RISPOSTE);

    for (const corpo of [
      { risposte: { ...RISPOSTE, cantone: "ZH" } },
      { altro: 1 },
      "non json",
      { risposte: "x".repeat(9000) },
    ]) {
      expect((await PUT(richiesta("PUT", corpo))).status).toBe(400);
    }
    expect((await PUT(new Request("https://bleo.example/api/calendario", { method: "PUT", body: "{}" }))).status).toBe(
      400,
    );
    expect(stato.salvate).toHaveLength(1);
  });

  it("DELETE disattiva il link dell'utente", async () => {
    stato.link = { id: "link-1", creato_il: "2026-10-18T10:00:00+00:00", letto_il: null };
    const risposta = await DELETE(richiesta("DELETE"));
    expect(risposta.status).toBe(204);
    expect(stato.cancellazioni).toEqual([`link_calendario:${UTENTE}`]);
  });

  it("401 senza accesso, 503 in modalità demo o senza chiave segreta", async () => {
    stato.utente = { ok: false, motivo: "non_collegato" };
    expect((await GET(richiesta("GET"))).status).toBe(401);
    expect((await POST(richiesta("POST"))).status).toBe(401);
    stato.utente = { ok: false, motivo: "non_configurato" };
    expect((await GET(richiesta("GET"))).status).toBe(503);
    stato.utente = { ok: true };
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect((await POST(richiesta("POST"))).status).toBe(503);
    expect(stato.chiamate).toEqual([]);
  });
});
