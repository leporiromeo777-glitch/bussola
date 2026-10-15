import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mittente } from "./email";
import {
  chiaveInvioConferma,
  esitoFinto,
  registraIscrizione,
  serveInvioConferma,
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

type RigaFinta = RigaNuova & { token: string; confermato_il: string | null; conferma_inviata_il: string | null };

/** Archivio in memoria che imita l'indice unico su lower(email). */
function archivioFinto(opzioni: { guasto?: boolean } = {}) {
  const righe: RigaFinta[] = [];
  const invii: string[] = [];
  const archivio: ArchivioListaAttesa = {
    async inserisci(riga) {
      if (opzioni.guasto) throw new Error("connessione rifiutata");
      const esistente = righe.find((r) => r.email.toLowerCase() === riga.email.toLowerCase());
      if (esistente) {
        return {
          tipo: "duplicata",
          token: esistente.token,
          confermata: esistente.confermato_il !== null,
          ultimoInvio: esistente.conferma_inviata_il,
        };
      }
      righe.push({ ...riga, token: TOKEN, confermato_il: null, conferma_inviata_il: null });
      return { tipo: "nuova", token: TOKEN };
    },
    async segnaInvio(token) {
      invii.push(token);
      const riga = righe.find((r) => r.token === token);
      if (riga) riga.conferma_inviata_il = ORA.toISOString();
    },
    conferma: async () => "non_trovata",
    trova: async () => null,
    cancella: async () => false,
  };
  return { archivio, righe, invii };
}

const ORA = new Date("2026-10-19T09:00:00Z");
const oreFa = (ore: number) => new Date(ORA.getTime() - ore * 3_600_000).toISOString();

afterEach(() => vi.restoreAllMocks());

describe("registraIscrizione", () => {
  it("in modalità demo (niente database) non salva nulla", async () => {
    const invia = vi.fn<InviaEmail>();
    expect(await registraIscrizione(dati, { archivio: null, inviaEmail: invia, mittente })).toEqual({ tipo: "demo" });
    expect(invia).not.toHaveBeenCalled();
  });

  it("salva la riga con il consenso e senza email se Resend non è configurato", async () => {
    const { archivio, righe, invii } = archivioFinto();
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
        confermato_il: null,
        conferma_inviata_il: null,
      },
    ]);
    expect(invii).toEqual([]);
  });

  it("invia l'email di conferma con il token e segna la data di invio", async () => {
    const { archivio, invii } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const esito = await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    expect(esito).toEqual({ tipo: "ok", conferma: "email" });
    expect(invia).toHaveBeenCalledOnce();
    const messaggio = invia.mock.calls[0]![0];
    expect(messaggio.a).toBe("giulia@example.ch");
    expect(messaggio.testo).toContain(`/lista-attesa/conferma?token=${TOKEN}`);
    expect(messaggio.chiaveIdempotenza).toBe(`lista-attesa-conferma/${TOKEN}/2026-10-19`);
    expect(invii).toEqual([TOKEN]);
  });

  it("se l'invio fallisce l'esito non cambia e la data di invio resta vuota", async () => {
    const { archivio, righe, invii } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(false);
    expect(await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA })).toEqual({
      tipo: "ok",
      conferma: "email",
    });
    expect(righe).toHaveLength(1);
    expect(invii).toEqual([]);
  });

  it("dopo un invio fallito, iscriversi di nuovo rimanda subito il link", async () => {
    const { archivio, invii } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    expect(invia).toHaveBeenCalledTimes(2);
    expect(invii).toEqual([TOKEN]);
  });

  it("già in lista ma non confermata: rimanda la stessa email con la chiave del giorno", async () => {
    const { archivio, righe } = archivioFinto();
    righe.push({ ...dati, consenso_email: true, token: TOKEN, confermato_il: null, conferma_inviata_il: oreFa(25) });
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const esito = await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    expect(esito).toEqual({ tipo: "ok", conferma: "email" });
    expect(invia).toHaveBeenCalledOnce();
    const messaggio = invia.mock.calls[0]![0];
    expect(messaggio.a).toBe("giulia@example.ch");
    expect(messaggio.testo).toContain(`/lista-attesa/conferma?token=${TOKEN}`);
    expect(messaggio.chiaveIdempotenza).toBe(`lista-attesa-conferma/${TOKEN}/2026-10-19`);
    expect(righe[0]?.conferma_inviata_il).toBe(ORA.toISOString());
  });

  it("già in lista, non confermata, ma salvata quando l'email non era attiva: manda il link", async () => {
    const { archivio, righe } = archivioFinto();
    righe.push({ ...dati, consenso_email: true, token: TOKEN, confermato_il: null, conferma_inviata_il: null });
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    expect(invia).toHaveBeenCalledOnce();
  });

  it("già in lista con un invio nelle ultime 24 ore: nessuna nuova email", async () => {
    const { archivio, righe } = archivioFinto();
    righe.push({ ...dati, consenso_email: true, token: TOKEN, confermato_il: null, conferma_inviata_il: oreFa(23) });
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const esito = await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    expect(esito).toEqual({ tipo: "ok", conferma: "email" });
    expect(invia).not.toHaveBeenCalled();
  });

  it("già in lista e confermata: nessuna email", async () => {
    const { archivio, righe } = archivioFinto();
    righe.push({
      ...dati,
      consenso_email: true,
      token: TOKEN,
      confermato_il: oreFa(100),
      conferma_inviata_il: oreFa(200),
    });
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const esito = await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    expect(esito).toEqual({ tipo: "ok", conferma: "email" });
    expect(invia).not.toHaveBeenCalled();
  });

  it("un'email già in lista dà la stessa risposta di una nuova e non manda una seconda email lo stesso giorno", async () => {
    const { archivio } = archivioFinto();
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    const prima = await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA });
    const seconda = await registraIscrizione(
      { ...dati, email: "giulia@example.ch" },
      { archivio, inviaEmail: invia, mittente, ora: ORA },
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

  it("se la data di invio non si salva l'iscrizione resta riuscita", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { archivio } = archivioFinto();
    archivio.segnaInvio = async () => {
      throw new Error("update non riuscito");
    };
    const invia = vi.fn<InviaEmail>().mockResolvedValue(true);
    expect(await registraIscrizione(dati, { archivio, inviaEmail: invia, mittente, ora: ORA })).toEqual({
      tipo: "ok",
      conferma: "email",
    });
    expect(log).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain("giulia@example.ch");
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
  it("chiede di controllare l'email e spiega come riavere il link, senza rivelare se l'indirizzo era già in lista", () => {
    const m = messaggioIscrizione({ tipo: "ok", conferma: "email" }, "giulia@example.ch");
    expect(m.testo).toContain("giulia@example.ch");
    expect(m.testo).toContain("iscriviti di nuovo con lo stesso indirizzo");
    expect(m.testo).toContain("al massimo una volta al giorno");
    expect(m.testo).toContain("Se avevi già confermato, non devi fare nulla");
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

describe("serveInvioConferma e chiaveInvioConferma", () => {
  it("manda alle nuove e alle non confermate senza invii nelle ultime 24 ore", () => {
    const base = { tipo: "duplicata" as const, token: TOKEN, confermata: false };
    expect(serveInvioConferma({ tipo: "nuova", token: TOKEN }, ORA)).toBe(true);
    expect(serveInvioConferma({ ...base, ultimoInvio: null }, ORA)).toBe(true);
    expect(serveInvioConferma({ ...base, ultimoInvio: oreFa(24) }, ORA)).toBe(true);
    expect(serveInvioConferma({ ...base, ultimoInvio: oreFa(23.9) }, ORA)).toBe(false);
    expect(serveInvioConferma({ ...base, confermata: true, ultimoInvio: null }, ORA)).toBe(false);
  });

  it("la chiave cambia con il giorno di Zurigo", () => {
    // 19.10.2026 23:30 UTC = 20.10.2026 01:30 a Zurigo
    expect(chiaveInvioConferma(TOKEN, new Date("2026-10-19T23:30:00Z"))).toBe(`lista-attesa-conferma/${TOKEN}/2026-10-20`);
    expect(chiaveInvioConferma(TOKEN, new Date("2026-10-19T21:30:00Z"))).toBe(`lista-attesa-conferma/${TOKEN}/2026-10-19`);
  });
});
