import { beforeEach, describe, expect, it, vi } from "vitest";
import { chiaveSegreto, firmaSvix } from "@/lib/conti/firma";

vi.mock("server-only", () => ({}));

const SEGRETO = `whsec_${Buffer.from("segreto-di-prova-per-i-test-1234").toString("base64")}`;
const TOKEN = "k3m7q2xw5vbn4hjd6tyrz2pqaa";
const DOMINIO = "abc123.resend.app";
const UTENTE = "11111111-1111-1111-1111-111111111111";

const stato = vi.hoisted(() => ({
  casella: null as { user_id: string } | null,
  erroreInserimento: null as { code: string } | null,
  inserite: [] as Record<string, unknown>[],
  dopo: [] as (() => Promise<void>)[],
  elaborate: [] as Record<string, unknown>[],
}));

vi.mock("next/server", () => ({ after: (fn: () => Promise<void>) => stato.dopo.push(fn) }));
vi.mock("@/lib/chat/server", () => ({ creaClientAnthropic: () => null }));
vi.mock("@/lib/conti/ricezione", () => ({
  elaboraEmail: async (e: Record<string, unknown>) => {
    stato.elaborate.push(e);
    return "letta";
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (tabella: string) => {
      if (tabella === "conti_caselle") {
        return {
          select: () => ({ eq: (_c: string, token: string) => ({ maybeSingle: async () => ({ data: token === TOKEN ? stato.casella : null, error: null }) }) }),
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      return {
        insert: (riga: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              if (stato.erroreInserimento) return { data: null, error: stato.erroreInserimento };
              stato.inserite.push(riga);
              return { data: { id: "riga-1" }, error: null };
            },
          }),
        }),
      };
    },
  }),
}));

const { POST } = await import("./route");

function richiesta(evento: unknown, opzioni: { firma?: string; timestamp?: number } = {}) {
  const corpo = JSON.stringify(evento);
  const timestamp = String(opzioni.timestamp ?? Math.floor(Date.now() / 1000));
  const firma = opzioni.firma ?? `v1,${firmaSvix(chiaveSegreto(SEGRETO)!, "msg_1", timestamp, corpo)}`;
  return new Request("https://bleo.example/api/conti/email-in", {
    method: "POST",
    headers: { "content-type": "application/json", "svix-id": "msg_1", "svix-timestamp": timestamp, "svix-signature": firma },
    body: corpo,
  });
}

const ricevuta = (destinatari: string[]) => ({
  type: "email.received",
  created_at: "2026-10-16T10:00:00.000Z",
  data: {
    email_id: "56761188-7520-42d8-8898-ff6fc54ce618",
    from: "Shop <fatture@shop.ch>",
    to: ["mario@gmail.com"],
    received_for: destinatari,
    subject: "La tua fattura",
    attachments: [],
  },
});

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("RESEND_WEBHOOK_SECRET", SEGRETO);
  vi.stubEnv("RESEND_DOMINIO_RICEZIONE", DOMINIO);
  vi.stubEnv("RESEND_API_KEY", "re_prova");
  stato.casella = { user_id: UTENTE };
  stato.erroreInserimento = null;
  stato.inserite = [];
  stato.dopo = [];
  stato.elaborate = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/conti/email-in", () => {
  it("con la firma giusta registra l'email e la elabora dopo la risposta", async () => {
    const risposta = await POST(richiesta(ricevuta([`ricevute-${TOKEN}@${DOMINIO}`])));
    expect(risposta.status).toBe(200);
    expect(stato.inserite).toEqual([
      {
        user_id: UTENTE,
        resend_id: "56761188-7520-42d8-8898-ff6fc54ce618",
        mittente: "fatture@shop.ch",
        oggetto: "La tua fattura",
      },
    ]);
    expect(stato.elaborate).toEqual([]);
    await stato.dopo[0]?.();
    expect(stato.elaborate).toMatchObject([
      { userId: UTENTE, rigaId: "riga-1", resendId: "56761188-7520-42d8-8898-ff6fc54ce618", chiaveResend: "re_prova" },
    ]);
  });

  it("rifiuta una firma sbagliata o vecchia", async () => {
    expect((await POST(richiesta(ricevuta([]), { firma: "v1,AAAA" }))).status).toBe(401);
    const vecchia = Math.floor(Date.now() / 1000) - 3600;
    expect((await POST(richiesta(ricevuta([]), { timestamp: vecchia }))).status).toBe(401);
    expect(stato.inserite).toEqual([]);
  });

  it("ignora altri eventi, destinatari sconosciuti e token senza casella", async () => {
    expect(await (await POST(richiesta({ type: "email.sent", data: { email_id: "x" } }))).json()).toEqual({
      ok: true,
      ignorato: "email.sent",
    });
    expect((await POST(richiesta(ricevuta(["altro@example.ch"])))).status).toBe(200);
    stato.casella = null;
    expect((await POST(richiesta(ricevuta([`ricevute-${TOKEN}@${DOMINIO}`])))).status).toBe(200);
    expect(stato.dopo).toEqual([]);
  });

  it("la stessa email mandata di nuovo da Resend non si rilegge", async () => {
    stato.erroreInserimento = { code: "23505" };
    const risposta = await POST(richiesta(ricevuta([`ricevute-${TOKEN}@${DOMINIO}`])));
    expect(await risposta.json()).toEqual({ ok: true, ignorato: "doppione" });
    expect(stato.dopo).toEqual([]);
  });

  it("senza configurazione risponde 503", async () => {
    vi.stubEnv("RESEND_DOMINIO_RICEZIONE", "");
    expect((await POST(richiesta(ricevuta([])))).status).toBe(503);
  });
});
