import { describe, expect, it } from "vitest";
import {
  MESSAGGI_LETTERA,
  PESO_MASSIMO_IMMAGINE,
  PESO_MASSIMO_PDF,
  byteDaBase64,
  dimensioniRidotte,
  formatoMegabyte,
  inizioBase64,
  leggiRichiestaLettera,
  riconosciTipo,
  stimaPaginePdf,
} from "./richiesta";

const b64 = (byte: number[] | string) =>
  Buffer.from(typeof byte === "string" ? Buffer.from(byte, "latin1") : Uint8Array.from(byte)).toString("base64");

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP = "RIFF\x24\x00\x00\x00WEBPVP8 ";
const PDF = "%PDF-1.7\n%\xe2\xe3\xcf\xd3\n";

describe("base64", () => {
  it("calcola i byte decodificati senza decodificare", () => {
    expect(byteDaBase64(b64("abc"))).toBe(3);
    expect(byteDaBase64(b64("ab"))).toBe(2);
    expect(byteDaBase64(b64("a"))).toBe(1);
    expect(byteDaBase64(b64(JPEG))).toBe(JPEG.length);
  });

  it("rifiuta testi che non sono base64", () => {
    expect(byteDaBase64("")).toBeNull();
    expect(byteDaBase64("abc")).toBeNull();
    expect(byteDaBase64("ab!c")).toBeNull();
    expect(byteDaBase64("data:image/jpeg;base64,/9j/")).toBeNull();
    expect(byteDaBase64("QUJD\nREVG")).toBeNull();
    expect(byteDaBase64("QU=D")).toBeNull();
  });

  it("decodifica i primi byte come Buffer", () => {
    const dati = b64(PDF);
    expect([...inizioBase64(dati, 8)]).toEqual([...Buffer.from(PDF, "latin1").subarray(0, 8)]);
    expect([...inizioBase64(b64([1, 2]), 12)]).toEqual([1, 2]);
  });
});

describe("riconosciTipo", () => {
  it("riconosce JPEG, PNG, WebP e PDF dai primi byte", () => {
    expect(riconosciTipo(Uint8Array.from(JPEG))).toBe("image/jpeg");
    expect(riconosciTipo(Uint8Array.from(PNG))).toBe("image/png");
    expect(riconosciTipo(Buffer.from(WEBP, "latin1"))).toBe("image/webp");
    expect(riconosciTipo(Buffer.from(PDF, "latin1"))).toBe("application/pdf");
  });

  it("non riconosce altri file", () => {
    expect(riconosciTipo(Buffer.from("GIF89a......", "latin1"))).toBeNull();
    expect(riconosciTipo(Buffer.from("RIFF\x24\x00\x00\x00WAVEfmt ", "latin1"))).toBeNull();
    expect(riconosciTipo(Buffer.from("<html><body>", "latin1"))).toBeNull();
    expect(riconosciTipo(new Uint8Array())).toBeNull();
  });
});

describe("leggiRichiestaLettera", () => {
  it("accetta una foto e un PDF validi", () => {
    expect(leggiRichiestaLettera({ tipo: "image/jpeg", dati: b64(JPEG) })).toEqual({
      ok: true,
      dati: { tipo: "image/jpeg", dati: b64(JPEG), byte: JPEG.length },
    });
    expect(leggiRichiestaLettera({ tipo: "image/png", dati: b64(PNG) }).ok).toBe(true);
    expect(leggiRichiestaLettera({ tipo: "image/webp", dati: b64(WEBP) }).ok).toBe(true);
    expect(leggiRichiestaLettera({ tipo: "application/pdf", dati: b64(PDF) }).ok).toBe(true);
  });

  it("rifiuta corpi non validi con 400", () => {
    for (const corpo of [null, [], "testo", {}, { tipo: "image/jpeg" }, { tipo: 1, dati: "x" }]) {
      const esito = leggiRichiestaLettera(corpo);
      expect(esito.ok).toBe(false);
      if (!esito.ok) expect(esito.stato).toBe(400);
    }
    expect(leggiRichiestaLettera({ tipo: "image/jpeg" })).toMatchObject({ messaggio: MESSAGGI_LETTERA.fileMancante });
    expect(leggiRichiestaLettera({ tipo: "image/jpeg", dati: "" })).toMatchObject({
      stato: 400,
      messaggio: MESSAGGI_LETTERA.fileVuoto,
    });
    expect(leggiRichiestaLettera({ tipo: "image/jpeg", dati: "non è base64" })).toMatchObject({ stato: 400 });
  });

  it("rifiuta con 415 i tipi non accettati e i file che non corrispondono al tipo", () => {
    expect(leggiRichiestaLettera({ tipo: "image/gif", dati: b64("GIF89a") })).toMatchObject({
      stato: 415,
      messaggio: MESSAGGI_LETTERA.tipoNonValido,
    });
    expect(leggiRichiestaLettera({ tipo: "text/html", dati: b64("<html>") })).toMatchObject({ stato: 415 });
    // Un PDF dichiarato come foto, una foto dichiarata come PDF, un HTML dichiarato come JPEG.
    expect(leggiRichiestaLettera({ tipo: "image/jpeg", dati: b64(PDF) })).toMatchObject({
      stato: 415,
      messaggio: MESSAGGI_LETTERA.fileNonCorrisponde,
    });
    expect(leggiRichiestaLettera({ tipo: "application/pdf", dati: b64(JPEG) })).toMatchObject({ stato: 415 });
    expect(leggiRichiestaLettera({ tipo: "image/jpeg", dati: b64("<script>alert(1)</script>") })).toMatchObject({
      stato: 415,
    });
  });

  it("rifiuta con 413 i file troppo pesanti, con il limite del loro tipo", () => {
    const foto = Buffer.alloc(PESO_MASSIMO_IMMAGINE + 1);
    foto.set(JPEG);
    expect(leggiRichiestaLettera({ tipo: "image/jpeg", dati: foto.toString("base64") })).toMatchObject({
      stato: 413,
      messaggio: MESSAGGI_LETTERA.immagineGrande,
    });
    const fotoAlLimite = Buffer.alloc(PESO_MASSIMO_IMMAGINE);
    fotoAlLimite.set(JPEG);
    expect(leggiRichiestaLettera({ tipo: "image/jpeg", dati: fotoAlLimite.toString("base64") }).ok).toBe(true);

    const pdf = Buffer.alloc(PESO_MASSIMO_PDF + 1);
    pdf.write(PDF, "latin1");
    expect(leggiRichiestaLettera({ tipo: "application/pdf", dati: pdf.toString("base64") })).toMatchObject({
      stato: 413,
      messaggio: MESSAGGI_LETTERA.pdfGrande,
    });
    // Un testo enorme si rifiuta prima di controllarlo carattere per carattere.
    expect(leggiRichiestaLettera({ tipo: "image/png", dati: "!".repeat(4_000_000) })).toMatchObject({ stato: 413 });
  });

  it("scrive i limiti in formato svizzero", () => {
    expect(formatoMegabyte(3_500_000)).toBe("3,5 MB");
    expect(formatoMegabyte(2_000_000)).toBe("2 MB");
    expect(formatoMegabyte(320_400)).toBe("320 kB");
    expect(formatoMegabyte(200)).toBe("1 kB");
    expect(MESSAGGI_LETTERA.pdfGrande).toContain("3,5 MB");
  });
});

describe("stimaPaginePdf", () => {
  const pdf = (testo: string) => Buffer.from(`%PDF-1.4\n${testo}\n%%EOF`, "latin1");

  it("legge /Count dell'albero delle pagine", () => {
    expect(stimaPaginePdf(pdf("1 0 obj << /Type /Pages /Kids [3 0 R 4 0 R] /Count 12 >> endobj"))).toBe(12);
    expect(stimaPaginePdf(pdf("1 0 obj <</Count 3/Kids[4 0 R]/Type/Pages>> endobj"))).toBe(3);
  });

  it("conta gli oggetti /Page se manca /Count", () => {
    const pagine = Array.from({ length: 4 }, (_, i) => `${i + 3} 0 obj << /Type /Page /Parent 2 0 R >> endobj`);
    expect(stimaPaginePdf(pdf(pagine.join("\n")))).toBe(4);
  });

  it("restituisce null se le pagine non si vedono (oggetti compressi)", () => {
    expect(stimaPaginePdf(pdf("1 0 obj << /Type /ObjStm /N 5 /Length 100 >> stream ... endstream"))).toBeNull();
  });
});

describe("dimensioniRidotte", () => {
  it("riduce il lato lungo a 1600 px mantenendo le proporzioni", () => {
    expect(dimensioniRidotte(4032, 3024)).toEqual({ larghezza: 1600, altezza: 1200 });
    expect(dimensioniRidotte(3024, 4032)).toEqual({ larghezza: 1200, altezza: 1600 });
    expect(dimensioniRidotte(3000, 1000, 1200)).toEqual({ larghezza: 1200, altezza: 400 });
  });

  it("non ingrandisce le foto piccole e gestisce valori non validi", () => {
    expect(dimensioniRidotte(800, 600)).toEqual({ larghezza: 800, altezza: 600 });
    expect(dimensioniRidotte(0, 600)).toEqual({ larghezza: 0, altezza: 0 });
    expect(dimensioniRidotte(Number.NaN, 600)).toEqual({ larghezza: 0, altezza: 0 });
  });
});
