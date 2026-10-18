import { describe, expect, it } from "vitest";
import { VOTAZIONI, type Votazione } from "@/data/votazioni";
import {
  AGGIORNA_OGNI,
  analizzaLinkSalvato,
  dataZurigo,
  eventiAbbonamento,
  icsAbbonamento,
  improntaToken,
  leggiLinkCreato,
  leggiStatoCalendario,
  linkCalendario,
  linkGoogleCalendar,
  linkWebcal,
  LUNGHEZZA_TOKEN_CALENDARIO,
  NOME_CALENDARIO_ABBONAMENTO,
  nuovoTokenCalendario,
  percorsoCalendario,
  serializzaLinkSalvato,
  tokenCalendarioValido,
  tokenDaSegmento,
} from "./abbonamento";
import { CHIAVE_LINK_CALENDARIO } from "./archivio";
import { eventiDaScadenze } from "./calendario";
import { calcolaPercorso } from "./regole";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";

const ticino: Risposte = {
  versione: VERSIONE_RISPOSTE,
  attivita: "digitale_creativo",
  cantone: "TI",
  soci: "solo",
  fatturato: "almeno_100k",
  clienti: "molti",
  impiego: "no",
  avviata: "no",
  permesso: "svizzero_c",
  locali: "no",
  venditaOnline: "no",
};

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz012-_9";

function votazione(id: string, data: string): Votazione {
  return {
    id,
    data,
    livello: "federale",
    oggetto: `Oggetto ${id}`,
    titoloBreve: `Tema ${id}`,
    cosaCambia: "Cambia qualcosa.",
    chiRiguarda: "Chi è iscritto all'IVA.",
    fonti: [{ titolo: "Fonte", url: "https://www.fedlex.admin.ch/eli/fga/2026/1/it", ente: "Confederazione (Fedlex)" }],
    verificatoIl: "2026-10-18",
  };
}

/** Ricompone le righe piegate (RFC 5545, 3.1). */
function spiega(ics: string): string[] {
  return ics.replace(/\r\n /g, "").split("\r\n");
}

describe("token del link", () => {
  it("ha 32 caratteri base64url, cioè 192 bit casuali", () => {
    const token = nuovoTokenCalendario();
    expect(LUNGHEZZA_TOKEN_CALENDARIO * 6).toBeGreaterThanOrEqual(128);
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(tokenCalendarioValido(token)).toBe(true);
    expect(nuovoTokenCalendario()).not.toBe(token);
  });

  it("usa tutti i 64 caratteri, in modo uniforme (6 bit bassi di ogni byte)", () => {
    const visti = new Set<string>();
    for (let inizio = 0; inizio < 256; inizio += 32) {
      const token = nuovoTokenCalendario((b) => b.map((_, i) => inizio + i));
      for (const c of token) visti.add(c);
    }
    expect(visti.size).toBe(64);
    expect(nuovoTokenCalendario((b) => b.fill(0))).toBe("A".repeat(32));
    expect(nuovoTokenCalendario((b) => b.fill(255))).toBe("_".repeat(32));
  });

  it("dall'URL: accetta anche «.ics» in fondo, rifiuta tutto il resto", () => {
    expect(tokenDaSegmento(TOKEN)).toBe(TOKEN);
    expect(tokenDaSegmento(`${TOKEN}.ics`)).toBe(TOKEN);
    for (const sbagliato of [
      "",
      "abc",
      `${TOKEN}x`,
      TOKEN.slice(1),
      `${TOKEN.slice(1)}/`,
      `${TOKEN.slice(1)}.`,
      `${TOKEN}.ics.ics`,
    ]) {
      expect(tokenDaSegmento(sbagliato), sbagliato).toBeNull();
    }
    expect(tokenCalendarioValido(42)).toBe(false);
  });

  it("l'impronta è lo SHA-256 in esadecimale minuscolo", async () => {
    expect(await improntaToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    const impronta = await improntaToken(TOKEN);
    expect(impronta).toMatch(/^[0-9a-f]{64}$/);
    expect(await improntaToken(TOKEN)).toBe(impronta);
    expect(await improntaToken(`${TOKEN.slice(0, -1)}8`)).not.toBe(impronta);
  });
});

describe("link per i calendari", () => {
  const link = linkCalendario("https://bleo.example/", percorsoCalendario(TOKEN));

  it("link completo, webcal:// per Apple, cid per Google", () => {
    expect(link).toBe(`https://bleo.example/api/calendario/${TOKEN}`);
    expect(linkWebcal(link)).toBe(`webcal://bleo.example/api/calendario/${TOKEN}`);
    expect(linkWebcal("http://localhost:3000/api/calendario/x")).toBe("webcal://localhost:3000/api/calendario/x");
    expect(linkGoogleCalendar(link)).toBe(
      `https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fbleo.example%2Fapi%2Fcalendario%2F${TOKEN}`,
    );
  });
});

describe("dataZurigo", () => {
  it("usa il fuso di Zurigo, con l'ora legale", () => {
    expect(dataZurigo(new Date("2026-12-31T22:59:00Z"))).toBe("2026-12-31");
    expect(dataZurigo(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    expect(dataZurigo(new Date("2026-06-30T22:30:00Z"))).toBe("2026-07-01");
    expect(dataZurigo(new Date("2026-06-30T21:30:00Z"))).toBe("2026-06-30");
  });
});

describe("eventi del calendario a cui ci si iscrive", () => {
  const oggi = "2026-10-18";
  const eventi = eventiAbbonamento(ticino, VOTAZIONI, oggi);
  const uid = eventi.map((e) => e.uid);

  it("le scadenze di quest'anno e del prossimo, con gli stessi UID del file .ics", () => {
    const scadenze = calcolaPercorso(ticino).scadenze;
    const attesi = [...eventiDaScadenze(scadenze, { anno: 2026 }), ...eventiDaScadenze(scadenze, { anno: 2027 })];
    for (const e of attesi) expect(uid).toContain(e.uid);
    expect(uid).toContain("acconti-avs-2026-01-10@bussola");
    expect(uid).toContain("acconti-avs-2027-10-10@bussola");
    expect(uid).toContain("ifd-2027-03-31@bussola");
    expect(uid.some((u) => u.startsWith("acconti-avs-2028"))).toBe(false);
  });

  it("niente termine IVA dall'inizio (Bleo non salva la data di inizio) né dichiarazione senza data", () => {
    expect(uid.some((u) => u.startsWith("annuncio-iva"))).toBe(false);
    expect(uid.some((u) => u.startsWith("dichiarazione"))).toBe(false);
  });

  it("le votazioni da seguire, con il loro UID", () => {
    expect(uid).toContain("votazione-2026-11-29-iva-avs@bussola");
  });

  it("un evento per UID, in ordine di data", () => {
    expect(new Set(uid).size).toBe(uid.length);
    const date = eventi.map((e) => e.data);
    expect([...date].sort()).toEqual(date);
  });

  it("votazioni dall'inizio dell'anno in poi: quelle appena passate restano, quelle dell'anno prima no", () => {
    const elenco = [
      votazione("vecchia", "2025-11-30"),
      votazione("marzo", "2026-03-08"),
      votazione("futura", "2027-02-14"),
    ];
    expect(eventiAbbonamento(null, elenco, oggi).map((e) => e.uid)).toEqual([
      "votazione-marzo@bussola",
      "votazione-futura@bussola",
    ]);
  });

  it("senza risposte nell'account restano solo le votazioni", () => {
    const soloVoti = eventiAbbonamento(null, VOTAZIONI, oggi);
    expect(soloVoti.length).toBeGreaterThan(0);
    expect(soloVoti.every((e) => e.uid.startsWith("votazione-"))).toBe(true);
  });

  it("con i soci: niente acconti AVS della ditta individuale", () => {
    const conSoci = eventiAbbonamento({ ...ticino, soci: "con_soci" }, [], oggi);
    expect(conSoci.some((e) => e.uid.startsWith("acconti-avs"))).toBe(false);
  });

  it("dal 1° gennaio passa all'anno seguente", () => {
    const capodanno = eventiAbbonamento(ticino, [], "2027-01-01").map((e) => e.uid);
    expect(capodanno).toContain("acconti-avs-2028-01-10@bussola");
    expect(capodanno.some((u) => u.startsWith("acconti-avs-2026"))).toBe(false);
  });

  it("con una data non valida non inventa niente", () => {
    expect(eventiAbbonamento(ticino, VOTAZIONI, "18.10.2026")).toEqual([]);
  });
});

describe("icsAbbonamento", () => {
  const prima = icsAbbonamento(ticino, VOTAZIONI, new Date("2026-10-18T10:00:00Z"));
  const dopo = icsAbbonamento(ticino, VOTAZIONI, new Date("2026-10-19T04:00:00Z"));
  const righe = spiega(prima);

  it("nome, descrizione e intervallo di aggiornamento del calendario", () => {
    expect(righe).toContain(`X-WR-CALNAME:${NOME_CALENDARIO_ABBONAMENTO}`);
    expect(righe).toContain(`REFRESH-INTERVAL;VALUE=DURATION:${AGGIORNA_OGNI}`);
    expect(righe).toContain(`X-PUBLISHED-TTL:${AGGIORNA_OGNI}`);
    expect(righe.some((r) => r.startsWith("X-WR-CALDESC:Le scadenze del tuo percorso"))).toBe(true);
    expect(prima.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("a ogni lettura gli stessi eventi con gli stessi UID: il calendario li aggiorna, non li duplica", () => {
    const uid = (ics: string) => spiega(ics).filter((r) => r.startsWith("UID:"));
    expect(uid(dopo)).toEqual(uid(prima));
    const senzaTimbro = (ics: string) => spiega(ics).filter((r) => !r.startsWith("DTSTAMP:"));
    expect(senzaTimbro(dopo)).toEqual(senzaTimbro(prima));
  });

  it("niente dati personali oltre alle scadenze: nessuna email, nessun nome", () => {
    expect(prima).not.toMatch(/@(?!bussola)[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(prima).not.toContain("ATTENDEE");
    expect(prima).not.toContain("ORGANIZER");
  });
});

describe("copia del link sul dispositivo", () => {
  const UTENTE = "11111111-1111-1111-1111-111111111111";
  const salvato = { userId: UTENTE, id: "link-1", percorso: percorsoCalendario(TOKEN) };
  const grezzo = serializzaLinkSalvato(salvato);

  it("vale solo per l'utente collegato e per il link ancora attivo", () => {
    expect(CHIAVE_LINK_CALENDARIO).toBe("bussola:calendario:link");
    expect(analizzaLinkSalvato(grezzo, UTENTE, "link-1")).toEqual(salvato);
    expect(analizzaLinkSalvato(grezzo, "22222222-2222-2222-2222-222222222222", "link-1")).toBeNull();
    expect(analizzaLinkSalvato(grezzo, UTENTE, "link-2")).toBeNull();
    expect(analizzaLinkSalvato(grezzo, UTENTE, null)).toBeNull();
    expect(analizzaLinkSalvato(grezzo, null, "link-1")).toBeNull();
  });

  it("scarta dati rovinati o percorsi che non sono un link di Bleo", () => {
    expect(analizzaLinkSalvato(null, UTENTE, "link-1")).toBeNull();
    expect(analizzaLinkSalvato("{rotto", UTENTE, "link-1")).toBeNull();
    expect(analizzaLinkSalvato("null", UTENTE, "link-1")).toBeNull();
    for (const percorso of ["https://altro.example/x", "/api/calendario/corto", `/api/altro/${TOKEN}`, 42]) {
      expect(analizzaLinkSalvato(JSON.stringify({ ...salvato, percorso }), UTENTE, "link-1")).toBeNull();
    }
  });
});

describe("risposte dell'API", () => {
  it("leggiStatoCalendario: valida il link e le risposte dell'account", () => {
    const link = { id: "a", creatoIl: "2026-10-18T10:00:00Z", lettoIl: null };
    expect(
      leggiStatoCalendario({ link, percorso: { risposte: ticino, aggiornatoIl: "2026-10-18T09:00:00Z" } }),
    ).toEqual({
      link,
      percorso: { risposte: ticino, aggiornatoIl: "2026-10-18T09:00:00Z" },
    });
    // Risposte di una versione vecchia: come se non ci fossero.
    expect(
      leggiStatoCalendario({ link: null, percorso: { risposte: { versione: "vecchia" }, aggiornatoIl: "2026-10-18" } }),
    ).toEqual({ link: null, percorso: null });
    expect(leggiStatoCalendario({ link: { id: 1 }, percorso: null })).toBeNull();
    expect(leggiStatoCalendario(null)).toBeNull();
  });

  it("leggiLinkCreato: il percorso deve contenere un token valido", () => {
    const creato = { id: "a", creatoIl: "2026-10-18T10:00:00Z", percorso: percorsoCalendario(TOKEN) };
    expect(leggiLinkCreato(creato)).toEqual(creato);
    expect(leggiLinkCreato({ ...creato, percorso: "/api/calendario/x" })).toBeNull();
    expect(leggiLinkCreato({ ...creato, percorso: `https://altro.example/api/calendario/${TOKEN}` })).toBeNull();
    expect(leggiLinkCreato({ id: "a" })).toBeNull();
  });
});
