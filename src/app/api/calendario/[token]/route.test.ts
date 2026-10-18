import { beforeEach, describe, expect, it, vi } from "vitest";
import { improntaToken } from "@/lib/percorso/abbonamento";
import { VERSIONE_RISPOSTE } from "@/lib/percorso/risposte";

vi.mock("server-only", () => ({}));

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz012-_9";
const UTENTE = "11111111-1111-1111-1111-111111111111";

const stato = vi.hoisted(() => ({
  configurato: true,
  /** Impronta → riga di link_calendario. */
  link: new Map<string, { id: string; user_id: string; letto_il: string | null }>(),
  questionario: null as { risposte: unknown } | null,
  erroreQuestionario: null as { code: string } | null,
  cercate: [] as string[],
  letture: [] as { id: string; letto_il: string }[],
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    stato.configurato
      ? {
          from: (tabella: string) => {
            if (tabella === "link_calendario") {
              return {
                select: () => ({
                  eq: (_colonna: string, impronta: string) => ({
                    maybeSingle: async () => {
                      stato.cercate.push(impronta);
                      return { data: stato.link.get(impronta) ?? null, error: null };
                    },
                  }),
                }),
                update: (valori: { letto_il: string }) => ({
                  eq: async (_colonna: string, id: string) => {
                    stato.letture.push({ id, letto_il: valori.letto_il });
                    return { error: null };
                  },
                }),
              };
            }
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: stato.questionario, error: stato.erroreQuestionario }),
                }),
              }),
            };
          },
        }
      : null,
}));

const { GET } = await import("./route");

function chiedi(segmento: string) {
  return GET(new Request(`https://bleo.example/api/calendario/${segmento}`), {
    params: Promise.resolve({ token: segmento }),
  });
}

beforeEach(async () => {
  stato.configurato = true;
  stato.link = new Map([[await improntaToken(TOKEN), { id: "link-1", user_id: UTENTE, letto_il: null }]]);
  stato.questionario = {
    risposte: {
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
    },
  };
  stato.erroreQuestionario = null;
  stato.cercate = [];
  stato.letture = [];
});

describe("GET /api/calendario/<token>", () => {
  it("restituisce il calendario dell'utente, cercato per impronta (mai per token)", async () => {
    const risposta = await chiedi(TOKEN);
    expect(risposta.status).toBe(200);
    expect(risposta.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(risposta.headers.get("cache-control")).toBe("private, max-age=3600");
    expect(risposta.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const ics = await risposta.text();
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:acconti-avs-");
    expect(ics).toContain("UID:ifd-");
    expect(stato.cercate).toEqual([await improntaToken(TOKEN)]);
    expect(stato.cercate).not.toContain(TOKEN);
    // Prima lettura: segnata.
    expect(stato.letture.map((l) => l.id)).toEqual(["link-1"]);
  });

  it("accetta anche «.ics» in fondo al link", async () => {
    expect((await chiedi(`${TOKEN}.ics`)).status).toBe(200);
  });

  it("segna la lettura al più una volta l'ora", async () => {
    stato.link.set(await improntaToken(TOKEN), { id: "link-1", user_id: UTENTE, letto_il: new Date().toISOString() });
    expect((await chiedi(TOKEN)).status).toBe(200);
    expect(stato.letture).toEqual([]);
  });

  it("senza risposte nell'account: solo le votazioni, nessuna scadenza", async () => {
    stato.questionario = null;
    const ics = await (await chiedi(TOKEN)).text();
    expect(ics).not.toContain("UID:acconti-avs-");
  });

  it("link sconosciuto, disattivato o rovinato: 404, senza cercare forme sbagliate nel database", async () => {
    const altro = "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";
    expect((await chiedi(altro)).status).toBe(404);
    for (const sbagliato of ["corto", `${TOKEN}x`, "..%2F..%2Fetc"]) {
      const risposta = await chiedi(sbagliato);
      expect(risposta.status).toBe(404);
      expect(risposta.headers.get("cache-control")).toBe("no-store");
    }
    expect(stato.cercate).toEqual([await improntaToken(altro)]);
  });

  it("se il database non risponde: 503, così il calendario tiene la copia di prima", async () => {
    stato.erroreQuestionario = { code: "57014" };
    const errore = vi.spyOn(console, "error").mockImplementation(() => {});
    const risposta = await chiedi(TOKEN);
    expect(risposta.status).toBe(503);
    expect(await risposta.text()).not.toContain("BEGIN:VCALENDAR");
    // Nei log solo il codice.
    expect(JSON.stringify(errore.mock.calls)).not.toContain(TOKEN);
    errore.mockRestore();
  });

  it("in modalità demo (senza chiave segreta): 503", async () => {
    stato.configurato = false;
    expect((await chiedi(TOKEN)).status).toBe(503);
  });
});
