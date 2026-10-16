import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const stato = vi.hoisted(() => ({
  letture: 0,
  massimo: 50,
  registrate: [] as Record<string, unknown>[],
  aggiornamenti: [] as { tabella: string; valori: Record<string, unknown> }[],
}));

vi.mock("./server", () => ({
  registra: () => {},
  prenotaLettura: async () => {
    stato.letture++;
    return stato.letture <= stato.massimo;
  },
  registraRicevuta: async (r: Record<string, unknown>) => {
    stato.registrate.push(r);
    return { esito: "creato", movimento: {} };
  },
}));

const { elaboraEmail } = await import("./ricezione");

const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Page >> endobj\n%%EOF");
const ID = "4ef9a417-02e9-4d39-ad75-9611e0fcc33c";

const admin = {
  from: (tabella: string) => ({
    update: (valori: Record<string, unknown>) => ({
      eq: async () => {
        stato.aggiornamenti.push({ tabella, valori });
        return { error: null };
      },
    }),
  }),
};

function base() {
  return {
    admin: admin as never,
    anthropic: {} as never,
    chiaveResend: "re_prova",
    userId: "11111111-1111-1111-1111-111111111111",
    rigaId: "riga-1",
    resendId: ID,
  };
}

/** Finto fetch: email, elenco allegati e download. */
function servi(email: Record<string, unknown>, allegati: Record<string, unknown>[] = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL) => {
      const indirizzo = String(url);
      if (indirizzo === `https://api.resend.com/emails/receiving/${ID}`) return Response.json({ id: ID, ...email });
      if (indirizzo === `https://api.resend.com/emails/receiving/${ID}/attachments`) return Response.json({ data: allegati });
      if (indirizzo.startsWith("https://inbound-cdn.resend.com/")) return new Response(PDF);
      return new Response("non trovato", { status: 404 });
    }),
  );
}

beforeEach(() => {
  stato.letture = 0;
  stato.massimo = 50;
  stato.registrate = [];
  stato.aggiornamenti = [];
});
afterEach(() => vi.unstubAllGlobals());

describe("elaboraEmail", () => {
  it("salva codice e link della conferma di Gmail e si ferma", async () => {
    servi({
      from: "forwarding-noreply@google.com",
      subject: "(#152648392) Conferma dell'inoltro di Gmail - Ricevi posta da mario@gmail.com",
      text: "Codice di conferma: 152648392\nhttps://mail-settings.google.com/mail/vf-%5Babc%5D-xyz",
      authentication: { spf: "pass", dkim: "pass", dmarc: "pass" },
      attachments: [],
    });
    expect(await elaboraEmail(base())).toBe("conferma_gmail");
    expect(stato.aggiornamenti[0]).toMatchObject({
      tabella: "conti_caselle",
      valori: { conferma_codice: "152648392", conferma_link: "https://mail-settings.google.com/mail/vf-%5Babc%5D-xyz" },
    });
    expect(stato.aggiornamenti.at(-1)).toEqual({ tabella: "conti_email", valori: { esito: "conferma_gmail" } });
    expect(stato.registrate).toEqual([]);
    expect(stato.letture).toBe(0);
  });

  it("scarica e legge gli allegati PDF, con mittente e oggetto come contesto", async () => {
    const allegato = {
      id: "a1",
      filename: "Fattura-123.pdf",
      content_type: "application/pdf",
      size: PDF.length,
      download_url: "https://inbound-cdn.resend.com/x/attachments/a1?signature=s",
    };
    servi({ from: "fatture@swisscom.ch", subject: "La tua fattura", attachments: [allegato] }, [allegato]);
    expect(await elaboraEmail(base())).toBe("letta");
    expect(stato.registrate).toHaveLength(1);
    expect(stato.registrate[0]).toMatchObject({
      origine: "email",
      emailId: "riga-1",
      file: { tipo: "application/pdf", nome: "Fattura-123.pdf" },
      contenuto: { tipo: "application/pdf", contesto: { mittente: "fatture@swisscom.ch", oggetto: "La tua fattura" } },
    });
  });

  it("un allegato che dice di essere un PDF ma non lo è non si legge", async () => {
    const allegato = {
      id: "a1",
      filename: "fattura.pdf",
      content_type: "application/pdf",
      size: 10,
      download_url: "https://altro.example/finto.pdf",
    };
    servi({ from: "x@y.ch", subject: "Fattura", attachments: [allegato] }, [allegato]);
    expect(await elaboraEmail(base())).toBe("errore");
    expect(stato.registrate).toEqual([]);
  });

  it("senza allegati legge il testo di una conferma d'ordine", async () => {
    servi({ from: "ordini@galaxus.ch", subject: "Conferma d'ordine", text: "Grazie!\nTotale CHF 89.90", attachments: [] });
    expect(await elaboraEmail(base())).toBe("letta");
    expect(stato.registrate[0]).toMatchObject({
      file: { tipo: "text/plain", nome: "email.txt" },
      contenuto: { tipo: "text/plain", testo: "Grazie!\nTotale CHF 89.90", oggetto: "Conferma d'ordine" },
    });
  });

  it("spam e limite del giorno: non legge niente", async () => {
    servi({ from: "x@y.ch", subject: "Fattura", headers: { "X-Spam-Flag": "YES" }, text: "Totale CHF 10", attachments: [] });
    expect(await elaboraEmail(base())).toBe("spam");
    stato.massimo = 0;
    servi({ from: "x@y.ch", subject: "Ordine", text: "Totale CHF 10", attachments: [] });
    expect(await elaboraEmail(base())).toBe("limite");
    expect(stato.registrate).toEqual([]);
  });

  it("se Resend non risponde: errore, scritto nella riga dell'email", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("errore", { status: 500 })));
    expect(await elaboraEmail(base())).toBe("errore");
    expect(stato.aggiornamenti).toEqual([{ tabella: "conti_email", valori: { esito: "errore" } }]);
  });
});
