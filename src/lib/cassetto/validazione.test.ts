import { describe, expect, it } from "vitest";
import { MESSAGGI_LETTERA, PESO_MASSIMO_IMMAGINE } from "@/lib/lettera/richiesta";
import { LUNGHEZZE_CASSETTO } from "./limiti";
import { TIPI_DOCUMENTO, etichettaTipoDocumento, eTipoDocumento } from "./tipi";
import {
  MESSAGGI_CASSETTO,
  aggiornamentoDocumento,
  documentoDaRiga,
  leggiModificaDocumento,
  leggiNuovoDocumento,
  nomeFileCassetto,
} from "./validazione";

// Un PNG di 1×1 pixel e l'inizio di un PDF, in base64.
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF").toString("base64");

function corpo(campi: Record<string, unknown> = {}, file: Record<string, unknown> = {}) {
  return {
    titolo: "Polizza RC aziendale",
    tipo: "polizza",
    scadeIl: "2027-01-31",
    nota: "Rinnovo con l'agenzia di Lugano",
    file: { tipo: "image/png", dati: PNG, nomeFile: "polizza.png", ...file },
    ...campi,
  };
}

describe("tipi di documento", () => {
  it("ha la lista corta di tipi, con «Altro» in fondo", () => {
    expect(TIPI_DOCUMENTO.map((t) => t.id)).toEqual([
      "decisione_avs",
      "numero_iva",
      "estratto_rc",
      "polizza",
      "permesso",
      "contratto",
      "autorizzazione",
      "altro",
    ]);
    expect(etichettaTipoDocumento("estratto_rc")).toBe("Estratto del registro di commercio");
    expect(eTipoDocumento("permesso")).toBe(true);
    expect(eTipoDocumento("ricevuta")).toBe(false);
  });
});

describe("leggiNuovoDocumento", () => {
  it("accetta un documento completo con foto o PDF", () => {
    const esito = leggiNuovoDocumento(corpo());
    expect(esito).toMatchObject({
      ok: true,
      dati: {
        titolo: "Polizza RC aziendale",
        tipo: "polizza",
        scadeIl: "2027-01-31",
        nota: "Rinnovo con l'agenzia di Lugano",
        file: { tipo: "image/png", nome: "polizza.png" },
      },
    });
    const pdf = leggiNuovoDocumento(corpo({ scadeIl: null, nota: "" }, { tipo: "application/pdf", dati: PDF, nomeFile: undefined }));
    expect(pdf).toMatchObject({ ok: true, dati: { scadeIl: null, nota: null, file: { tipo: "application/pdf", nome: null } } });
  });

  it("scadenza e nota sono facoltative; il titolo si pulisce dagli spazi", () => {
    const senza: Record<string, unknown> = corpo({ titolo: "  Permesso B  ", tipo: "permesso" });
    delete senza.scadeIl;
    delete senza.nota;
    const esito = leggiNuovoDocumento(senza);
    expect(esito).toMatchObject({ ok: true, dati: { titolo: "Permesso B", scadeIl: null, nota: null } });
  });

  it("rifiuta titolo vuoto o lungo, tipo sconosciuto, date strane e campi in più", () => {
    expect(leggiNuovoDocumento(corpo({ titolo: "   " }))).toEqual({ ok: false, stato: 400, messaggio: MESSAGGI_CASSETTO.titolo });
    expect(leggiNuovoDocumento(corpo({ titolo: "x".repeat(LUNGHEZZE_CASSETTO.titolo + 1) }))).toEqual({
      ok: false,
      stato: 400,
      messaggio: MESSAGGI_CASSETTO.titoloLungo,
    });
    expect(leggiNuovoDocumento(corpo({ tipo: "ricevuta" }))).toEqual({ ok: false, stato: 400, messaggio: MESSAGGI_CASSETTO.tipo });
    for (const scadeIl of ["2027-02-30", "31.01.2027", "1999-12-31", "2101-01-01", 20270131]) {
      expect(leggiNuovoDocumento(corpo({ scadeIl }))).toEqual({ ok: false, stato: 400, messaggio: MESSAGGI_CASSETTO.scadenza });
    }
    expect(leggiNuovoDocumento(corpo({ nota: "x".repeat(LUNGHEZZE_CASSETTO.nota + 1) }))).toEqual({
      ok: false,
      stato: 400,
      messaggio: MESSAGGI_CASSETTO.nota,
    });
    expect(leggiNuovoDocumento(corpo({ user_id: "altro" }))).toMatchObject({ ok: false, stato: 400 });
    expect(leggiNuovoDocumento("ciao")).toMatchObject({ ok: false, stato: 400 });
  });

  it("senza file, o con un file che non è una foto o un PDF valido: errore chiaro", () => {
    const senzaFile: Record<string, unknown> = corpo();
    delete senzaFile.file;
    expect(leggiNuovoDocumento(senzaFile)).toEqual({ ok: false, stato: 400, messaggio: MESSAGGI_CASSETTO.fileMancante });
    expect(leggiNuovoDocumento(corpo({}, { dati: "" }))).toEqual({ ok: false, stato: 400, messaggio: MESSAGGI_LETTERA.fileVuoto });
    expect(leggiNuovoDocumento(corpo({}, { tipo: "image/heic" }))).toEqual({
      ok: false,
      stato: 415,
      messaggio: MESSAGGI_LETTERA.tipoNonValido,
    });
    // Dichiarato PDF ma è un PNG.
    expect(leggiNuovoDocumento(corpo({}, { tipo: "application/pdf" }))).toMatchObject({ ok: false, stato: 415 });
    expect(leggiNuovoDocumento(corpo({}, { dati: "A".repeat(Math.ceil(PESO_MASSIMO_IMMAGINE / 3) * 4 + 4) }))).toMatchObject({
      ok: false,
      stato: 413,
    });
    expect(leggiNuovoDocumento(corpo({}, { altro: 1 }))).toEqual({ ok: false, stato: 400, messaggio: MESSAGGI_CASSETTO.fileMancante });
  });

  it("il nome del file perde barre e caratteri di controllo", () => {
    expect(nomeFileCassetto("../../etc/passwd")).toBe(".. .. etc passwd");
    expect(nomeFileCassetto("a\u0000b.pdf")).toBe("a b.pdf");
    expect(nomeFileCassetto("   ")).toBeNull();
    expect(nomeFileCassetto(42)).toBeNull();
    expect(nomeFileCassetto("x".repeat(500))).toHaveLength(LUNGHEZZE_CASSETTO.nomeFile);
  });
});

describe("leggiModificaDocumento", () => {
  it("cambia solo i campi mandati; nota vuota e scadenza null tolgono il valore", () => {
    expect(leggiModificaDocumento({ titolo: " Nuovo nome " })).toEqual({ ok: true, dati: { titolo: "Nuovo nome" } });
    expect(leggiModificaDocumento({ scadeIl: null, nota: "" })).toEqual({ ok: true, dati: { scadeIl: null, nota: null } });
    expect(leggiModificaDocumento({ tipo: "contratto", scadeIl: "2028-06-30" })).toEqual({
      ok: true,
      dati: { tipo: "contratto", scadeIl: "2028-06-30" },
    });
  });

  it("rifiuta corpi vuoti, campi sconosciuti (anche il file) e valori non validi", () => {
    expect(leggiModificaDocumento({})).toEqual({ ok: false, messaggio: MESSAGGI_CASSETTO.modificaVuota });
    expect(leggiModificaDocumento({ percorso: "altro/x.pdf" }).ok).toBe(false);
    expect(leggiModificaDocumento({ file: { tipo: "image/png", dati: PNG } }).ok).toBe(false);
    expect(leggiModificaDocumento({ titolo: "" })).toEqual({ ok: false, messaggio: MESSAGGI_CASSETTO.titolo });
    expect(leggiModificaDocumento({ scadeIl: "domani" })).toEqual({ ok: false, messaggio: MESSAGGI_CASSETTO.scadenza });
    expect(leggiModificaDocumento(null).ok).toBe(false);
  });
});

describe("righe del database", () => {
  it("dalla riga al documento delle API e dalla modifica alle colonne", () => {
    expect(
      documentoDaRiga({
        id: "d1",
        titolo: "Permesso B",
        tipo: "permesso",
        scade_il: "2027-05-31",
        nota: null,
        tipo_file: "image/jpeg",
        nome_file: "permesso.jpg",
        byte: "120000",
        creato_il: "2026-10-19T08:00:00+00:00",
        aggiornato_il: "2026-10-19T08:00:00+00:00",
      }),
    ).toEqual({
      id: "d1",
      titolo: "Permesso B",
      tipo: "permesso",
      scadeIl: "2027-05-31",
      nota: null,
      file: { tipo: "image/jpeg", nome: "permesso.jpg", byte: 120000 },
      creatoIl: "2026-10-19T08:00:00+00:00",
      aggiornatoIl: "2026-10-19T08:00:00+00:00",
    });
    expect(aggiornamentoDocumento({ titolo: "A", scadeIl: null }, "2026-10-19T10:00:00.000Z")).toEqual({
      aggiornato_il: "2026-10-19T10:00:00.000Z",
      titolo: "A",
      scade_il: null,
    });
  });
});
