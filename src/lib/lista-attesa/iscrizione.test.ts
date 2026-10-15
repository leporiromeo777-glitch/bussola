import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mittente } from "./email";
import {
  esitoFinto,
  registraIscrizione,
  type ArchivioListaAttesa,
  type InviaEmail,
  type RigaNuova,
} from "./iscrizione";
import { messaggioIscrizione } from "./messaggi";
import type { DatiIscrizione } from "./validazione";

const mittente: Mittente = {
  nomeSito: "Bussola",
  urlSito: "https://bussola.example",
  titolare: { nome: "Maria Esempio", indirizzo: "Via Esempio 1, 6900 Lugano", email: "ciao@bussola.example" },
};
const TOKEN = "3f2b8c1e-7a4d-4f6b-9c2e-1d5a6b7c8d9e";

const dati: DatiIscrizione = {
  email: "giulia@example.ch",
  nome: "Giulia",
  cantone: "TI",
  situazione: "idea",
  consenso: true,
  provenienza: "instagram",
};

/** Archivio in memoria che imita l'indice unico su lower(email). */
function archivioFinto(opzioni: { guasto?: boolean } = {}) {
  const righe: (RigaNuova & { token: string })[] = [];
  const archivio: ArchivioListaAttesa = {
    async inserisci(riga) {
      if (opzioni.guasto) throw new Error("connessione rifiutata");
      if (righe.some((r) => r.email.toLowerCase() === riga.email.toLowerCase())) return { tipo: "duplicata" };
      righe.push({ ...riga, token: TOKEN });
      return { tipo: "nuova", token: TOKEN };
    },
    conferma: async () => "non_trovata",
    trova: async () => null,
    cancella: async () => false,
  };
  return { archivio, righe };
}

afterEach(() => vi.restoreAllMocks());

describe("registraIscrizione", () => {
  it("in modalità demo (niente database) non salva nulla", async () => {
    const invia = vi.fn<InviaEmail>();
    expect(await registraIscrizione(dati, { archivio: null, inviaEmail: invia, mittente })).toEqual({ tipo: "demo" });
    expect(invia).not.toHaveBeenCalled();
  });

  it("salva la riga con il consenso e senza email se Resend non è configurato", async () => {
    const { archivio, righe } = archivioFinto();
    const esito = await registraIscrizione(dati, { archivio, inviaEmail: null, mittente });
    expect(esito).toEqual({ tipo: "ok", conferma: "lancio" });
    expect(righe).toEqual([
      {
        email: "giulia@example.ch",
        nome: "Giulia",
        cantone: "TI",
        situazione: "idea",
        provenienza: "instagram",
        consenso_email: true,
        token: TOKEN,
      },
    ]);
  });

  it("invia l'email di conferma con il token se Resend è configurato", async () => {
    const { archivio } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const esito = await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente });
    expect(esito).toEqual({ tipo: "ok", conferma: "email" });
    expect(invia).toHaveBeenCalledOnce();
    const messaggio = invia.mock.calls[0]![0];
    expect(messaggio.a).toBe("giulia@example.ch");
    expect(messaggio.testo).toContain(`/lista-attesa/conferma?token=${TOKEN}`);
    expect(messaggio.chiaveIdempotenza).toBe(`lista-attesa-conferma/${TOKEN}`);
  });

  it("se l'invio fallisce l'iscrizione resta salvata e lo dice", async () => {
    const { archivio, righe } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(false);
    expect(await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente })).toEqual({
      tipo: "ok",
      conferma: "lancio",
    });
    expect(righe).toHaveLength(1);
  });

  it("un'email già in lista dà la stessa risposta di una nuova e non manda email", async () => {
    const { archivio } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const prima = await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente });
    const seconda = await registraIscrizione(
      { ...dati, email: "giulia@example.ch" },
      { archivio, inviaEmail: invia, mittente },
    );
    expect(seconda).toEqual(prima);
    expect(invia).toHaveBeenCalledOnce();
    expect(messaggioIscrizione(seconda, "giulia@example.ch")).toEqual(messaggioIscrizione(prima, "giulia@example.ch"));
  });

  it("senza Resend anche il duplicato risponde come una nuova iscrizione", async () => {
    const { archivio } = archivioFinto();
    await registraIscrizione(dati, { archivio, inviaEmail: null, mittente });
    expect(await registraIscrizione(dati, { archivio, inviaEmail: null, mittente })).toEqual({
      tipo: "ok",
      conferma: "lancio",
    });
  });

  it("l'email di conferma non contiene il nome scritto nel modulo", async () => {
    const { archivio } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    await registraIscrizione({ ...dati, nome: "Giulia Spam" }, { archivio, inviaEmail: invia, mittente });
    const messaggio = invia.mock.calls[0]![0];
    expect(messaggio.testo).not.toContain("Giulia Spam");
    expect(messaggio.html).not.toContain("Giulia Spam");
  });

  it("oltre il limite per connessione non salva e non manda email", async () => {
    const { archivio, righe } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const esito = await registraIscrizione(dati, {
      archivio,
      inviaEmail: invia,
      mittente,
      richiestaConsentita: async () => false,
    });
    expect(esito).toEqual({ tipo: "troppe_richieste" });
    expect(righe).toEqual([]);
    expect(invia).not.toHaveBeenCalled();
    expect(messaggioIscrizione(esito, "giulia@example.ch").testo).toMatch(/troppe iscrizioni/);
  });

  it("entro il limite per connessione iscrive come sempre", async () => {
    const { archivio, righe } = archivioFinto();
    const consentita = vi.fn(async () => true);
    const esito = await registraIscrizione(dati, {
      archivio,
      inviaEmail: null,
      mittente,
      richiestaConsentita: consentita,
    });
    expect(esito).toEqual({ tipo: "ok", conferma: "lancio" });
    expect(consentita).toHaveBeenCalledOnce();
    expect(righe).toHaveLength(1);
  });

  it("se il database non risponde restituisce un errore senza scrivere l'email nei log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { archivio } = archivioFinto({ guasto: true });
    expect(await registraIscrizione(dati, { archivio, inviaEmail: null, mittente })).toEqual({ tipo: "errore" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("giulia@example.ch");
  });
});

describe("esitoFinto (campo trappola)", () => {
  it("imita la risposta di un'iscrizione riuscita", () => {
    expect(esitoFinto(true)).toEqual({ tipo: "ok", conferma: "email" });
    expect(esitoFinto(false)).toEqual({ tipo: "ok", conferma: "lancio" });
  });
});

describe("messaggioIscrizione", () => {
  it("chiede di controllare l'email senza rivelare se l'indirizzo era già in lista", () => {
    const m = messaggioIscrizione({ tipo: "ok", conferma: "email" }, "giulia@example.ch");
    expect(m.testo).toContain("giulia@example.ch");
    expect(m.testo).toContain("Se eri già in lista");
  });

  it("senza email di conferma promette di scrivere all'apertura", () => {
    expect(messaggioIscrizione({ tipo: "ok", conferma: "lancio" }, "giulia@example.ch").testo).toBe(
      "Ti scriveremo a giulia@example.ch quando apre la beta chiusa.",
    );
  });

  it("spiega la modalità demo e gli errori", () => {
    expect(messaggioIscrizione({ tipo: "demo" }, "x@example.ch").titolo).toMatch(/non ancora attive/);
    expect(messaggioIscrizione({ tipo: "errore" }, "x@example.ch").testo).toMatch(/Riprova/);
  });
});
