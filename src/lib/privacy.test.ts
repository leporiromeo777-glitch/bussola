import { describe, expect, it } from "vitest";
import {
  contieneSegnaposto,
  ELENCO_DPF,
  fornitoreHosting,
  GARANZIE_USA,
  informativaDa,
  luogoDatabase,
  SERVER_NETLIFY,
  trattamentiAttivi,
} from "./privacy";

const titolareCompleto = { nome: "Maria Rossi", indirizzo: "Via Nassa 1, 6900 Lugano", email: "ciao@esempio.ch" };

describe("luogoDatabase", () => {
  it("indica la Svizzera per la regione di Zurigo", () => {
    expect(luogoDatabase("svizzera")).toBe("in Svizzera (Zurigo)");
    expect(luogoDatabase(" Svizzera ")).toBe("in Svizzera (Zurigo)");
  });

  it("indica l'Unione europea per la regione di Francoforte", () => {
    expect(luogoDatabase("ue")).toBe("nell'Unione europea (Francoforte, Germania)");
  });

  it("senza un valore valido lascia la parte da completare", () => {
    for (const valore of [undefined, "", "zurigo"]) {
      expect(luogoDatabase(valore)).toContain("[da indicare prima del lancio]");
    }
  });
});

describe("contieneSegnaposto", () => {
  it("riconosce le parti tra parentesi quadre", () => {
    expect(contieneSegnaposto("Netlify [da indicare prima del lancio]")).toBe(true);
    expect(contieneSegnaposto("[email di contatto]")).toBe(true);
    expect(contieneSegnaposto("Vercel Inc. (USA)")).toBe(false);
    expect(contieneSegnaposto("vuote []")).toBe(false);
  });
});

describe("fornitoreHosting", () => {
  it("nomina il fornitore e la sua garanzia per gli USA", () => {
    expect(fornitoreHosting("vercel")).toEqual({ nome: "Vercel Inc. (USA)", garanzia: GARANZIE_USA.vercel, server: null });
    expect(fornitoreHosting("netlify").nome).toBe("Netlify, Inc. (USA)");
  });

  it("su Netlify dice che il server gira negli Stati Uniti (Ohio)", () => {
    expect(fornitoreHosting("netlify").server).toBe(SERVER_NETLIFY);
    expect(SERVER_NETLIFY).toBe("negli Stati Uniti (Ohio)");
    expect(fornitoreHosting(undefined).server).toBeNull();
  });

  it("senza fornitore lascia la parte da completare", () => {
    expect(contieneSegnaposto(fornitoreHosting(undefined).nome)).toBe(true);
    expect(fornitoreHosting("").garanzia).toBeNull();
  });
});

describe("GARANZIE_USA", () => {
  it("indica per ogni fornitore la certificazione DPF o le clausole standard", () => {
    for (const garanzia of Object.values(GARANZIE_USA)) {
      expect(garanzia).toMatch(/Swiss-U\.S\. Data Privacy Framework|clausole contrattuali standard dell'UE con l'adeguamento per la Svizzera \(art\. 16 cpv\. 2 lett\. d LPD\)/);
      expect(garanzia).not.toMatch(/\[/);
    }
    expect(ELENCO_DPF.url).toMatch(/^https:\/\//);
    expect(ELENCO_DPF.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("informativaDa", () => {
  it("è completa con titolare, regione e hosting indicati", () => {
    const informativa = informativaDa({ regioneDati: "svizzera", hosting: "netlify", titolare: titolareCompleto });
    // Garanzie per l'estero e durata dei log sono state verificate il 16.10.2026.
    expect(informativa.daCompletare).toEqual([]);
    expect(informativa.incompleta).toBe(false);
  });

  it("segnala titolare, regione e hosting mancanti", () => {
    const informativa = informativaDa({
      regioneDati: undefined,
      hosting: undefined,
      titolare: { ...titolareCompleto, email: "[email di contatto]" },
    });
    expect(informativa.daCompletare).toEqual(
      expect.arrayContaining([
        "dati del titolare",
        "luogo del database (NEXT_PUBLIC_SUPABASE_REGIONE_DATI)",
        "fornitore di hosting",
      ]),
    );
  });
});

describe("trattamentiAttivi", () => {
  const supabase = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" };

  it("senza variabili non c'è niente di attivo", () => {
    expect(trattamentiAttivi({})).toEqual({
      account: false,
      chat: false,
      email: false,
      protezioneModuli: false,
      verificaAntiRobot: false,
      statistiche: false,
    });
  });

  it("la chat è attiva solo con Supabase e una chiave di Anthropic nostra", () => {
    expect(trattamentiAttivi({ ...supabase }).chat).toBe(false);
    expect(trattamentiAttivi({ ANTHROPIC_API_KEY: "sk-ant-x" }).chat).toBe(false);
    expect(trattamentiAttivi({ ...supabase, ANTHROPIC_API_KEY: "sk-ant-x" }).chat).toBe(true);
    // Chiave messa da Netlify AI Gateway: la chat resta spenta.
    expect(
      trattamentiAttivi({ ...supabase, ANTHROPIC_API_KEY: "gw", NETLIFY_AI_GATEWAY_KEY: "gw" }).chat,
    ).toBe(false);
    expect(
      trattamentiAttivi({ ...supabase, ANTHROPIC_API_KEY: "sk-ant-x", ANTHROPIC_BASE_URL: "https://gateway.example" }).chat,
    ).toBe(false);
  });

  it("le email partono solo con chiave Resend e mittente", () => {
    expect(trattamentiAttivi({ RESEND_API_KEY: "re_x" }).email).toBe(false);
    expect(trattamentiAttivi({ RESEND_API_KEY: "re_x", EMAIL_MITTENTE: "Bleo <ciao@esempio.ch>" }).email).toBe(true);
    expect(trattamentiAttivi({ RESEND_API_KEY: " ", EMAIL_MITTENTE: "x" }).email).toBe(false);
  });

  it("la protezione dei moduli richiede la chiave segreta di Supabase", () => {
    expect(trattamentiAttivi({ ...supabase }).protezioneModuli).toBe(false);
    expect(trattamentiAttivi({ ...supabase, SUPABASE_SECRET_KEY: "sb_secret_x" }).protezioneModuli).toBe(true);
    expect(trattamentiAttivi({ ...supabase }).account).toBe(true);
  });

  it("Turnstile e Plausible dipendono dalle loro chiavi pubbliche", () => {
    const attivi = trattamentiAttivi({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x", NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "bussola.ch" });
    expect(attivi.verificaAntiRobot).toBe(true);
    expect(attivi.statistiche).toBe(true);
  });
});
