/**
 * Un PDF A4 da un documento semplice (titoli, paragrafi, tabelle, articoli
 * con la norma di legge accanto, riquadri), con pdf-lib: niente browser,
 * così va bene per il sito e per l'app. Caratteri standard (Helvetica):
 * coprono l'italiano («», àèéìòù, ’); i simboli che non conoscono diventano
 * «?». In fondo a ogni pagina: il piè di pagina e «Pagina N di M».
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

export type Blocco =
  | { tipo: "titolo"; testo: string }
  | { tipo: "sottotitolo"; testo: string }
  | { tipo: "paragrafo"; testo: string; tenue?: boolean }
  | { tipo: "elenco"; voci: readonly string[]; numerato?: boolean }
  | { tipo: "tabella"; colonne: readonly string[]; righe: readonly (readonly string[])[]; larghezze: readonly number[] }
  /** Un articolo di uno statuto: titolo, commi e la norma di legge a destra. */
  | { tipo: "articolo"; titolo: string; commi: readonly string[]; norma: string }
  /** Un riquadro colorato: «avviso» (arancio) o «nota» (verde acqua). */
  | { tipo: "riquadro"; stile: "avviso" | "nota"; titolo?: string; testo: string };

export type DocumentoPdf = {
  /** Titolo nei metadati del file. */
  titolo: string;
  /** Una fascia in cima alla prima pagina (per esempio «BOZZA»). */
  fascia?: string;
  blocchi: readonly Blocco[];
  /** Una riga in fondo a ogni pagina. */
  piede: string;
};

const A4 = { larghezza: 595.28, altezza: 841.89 };
const MARGINE = { lato: 56, alto: 60, basso: 70 };
const LARGHEZZA_TESTO = A4.larghezza - 2 * MARGINE.lato;
const COLONNA_NORMA = 120;

const COLORI = {
  testo: rgb(0.11, 0.12, 0.14),
  tenue: rgb(0.3, 0.32, 0.36),
  marchio: rgb(0.06, 0.37, 0.42),
  accento: rgb(0.61, 0.36, 0.11),
  linea: rgb(0.84, 0.82, 0.79),
  fondoNota: rgb(0.93, 0.96, 0.97),
  fondoAvviso: rgb(0.99, 0.95, 0.9),
};

type Caratteri = { normale: PDFFont; grassetto: PDFFont; corsivo: PDFFont };

/** Sostituisce i caratteri che Helvetica (WinAnsi) non sa scrivere. */
function sicuro(testo: string, font: PDFFont): string {
  let fuori = "";
  for (const c of testo.replace(/ /g, " ")) {
    if (c === "\n") {
      fuori += c;
      continue;
    }
    try {
      font.encodeText(c);
      fuori += c;
    } catch {
      fuori += "?";
    }
  }
  return fuori;
}

/** Va a capo per stare in `larghezza`; rispetta gli a capo del testo. */
export function righeDi(testo: string, font: PDFFont, corpo: number, larghezza: number): string[] {
  const righe: string[] = [];
  for (const paragrafo of sicuro(testo, font).split("\n")) {
    let riga = "";
    for (const parola of paragrafo.split(/\s+/).filter(Boolean)) {
      const prova = riga ? `${riga} ${parola}` : parola;
      if (font.widthOfTextAtSize(prova, corpo) <= larghezza || !riga) riga = prova;
      else {
        righe.push(riga);
        riga = parola;
      }
    }
    righe.push(riga);
  }
  return righe;
}

/** Disegna i blocchi pagina dopo pagina. */
class Impaginatore {
  pagina!: PDFPage;
  y = 0;
  constructor(
    private readonly pdf: PDFDocument,
    private readonly f: Caratteri,
  ) {
    this.nuovaPagina();
  }

  nuovaPagina() {
    this.pagina = this.pdf.addPage([A4.larghezza, A4.altezza]);
    this.y = A4.altezza - MARGINE.alto;
  }

  /** Se mancano `altezza` punti, si passa alla pagina dopo. */
  spazio(altezza: number) {
    if (this.y - altezza < MARGINE.basso) this.nuovaPagina();
  }

  testo(righe: readonly string[], x: number, font: PDFFont, corpo: number, colore = COLORI.testo, interlinea = 1.35) {
    for (const r of righe) {
      this.spazio(corpo * interlinea);
      this.y -= corpo;
      this.pagina.drawText(r, { x, y: this.y, size: corpo, font, color: colore });
      this.y -= corpo * (interlinea - 1);
    }
  }

  fascia(testo: string) {
    const h = 30;
    this.pagina.drawRectangle({ x: MARGINE.lato, y: this.y - h, width: LARGHEZZA_TESTO, height: h, color: COLORI.accento });
    const t = sicuro(testo, this.f.grassetto);
    const w = this.f.grassetto.widthOfTextAtSize(t, 12);
    this.pagina.drawText(t, { x: MARGINE.lato + (LARGHEZZA_TESTO - w) / 2, y: this.y - 19.5, size: 12, font: this.f.grassetto, color: rgb(1, 1, 1) });
    this.y -= h + 18;
  }

  blocco(b: Blocco) {
    const { normale, grassetto } = this.f;
    switch (b.tipo) {
      case "titolo":
        this.spazio(60);
        this.testo(righeDi(b.testo, grassetto, 20, LARGHEZZA_TESTO), MARGINE.lato, grassetto, 20, COLORI.marchio, 1.25);
        this.y -= 8;
        break;
      case "sottotitolo":
        // Un sottotitolo non resta da solo in fondo alla pagina.
        this.spazio(60);
        this.y -= 8;
        this.testo(righeDi(b.testo, grassetto, 13, LARGHEZZA_TESTO), MARGINE.lato, grassetto, 13, COLORI.marchio);
        this.pagina.drawLine({
          start: { x: MARGINE.lato, y: this.y - 2 },
          end: { x: MARGINE.lato + LARGHEZZA_TESTO, y: this.y - 2 },
          thickness: 0.6,
          color: COLORI.linea,
        });
        this.y -= 8;
        break;
      case "paragrafo":
        this.testo(righeDi(b.testo, normale, 10.5, LARGHEZZA_TESTO), MARGINE.lato, normale, 10.5, b.tenue ? COLORI.tenue : COLORI.testo);
        this.y -= 6;
        break;
      case "elenco":
        b.voci.forEach((voce, i) => {
          const segno = b.numerato ? `${i + 1}.` : "•";
          const righe = righeDi(voce, normale, 10.5, LARGHEZZA_TESTO - 18);
          this.spazio(14.2);
          const yInizio = this.y;
          this.pagina.drawText(sicuro(segno, normale), { x: MARGINE.lato, y: yInizio - 10.5, size: 10.5, font: normale, color: COLORI.marchio });
          this.testo(righe, MARGINE.lato + 18, normale, 10.5);
          this.y -= 2;
        });
        this.y -= 4;
        break;
      case "tabella":
        this.tabella(b.colonne, b.righe, b.larghezze);
        break;
      case "articolo": {
        const larghezza = LARGHEZZA_TESTO - COLONNA_NORMA - 12;
        const norma = righeDi(b.norma, normale, 8.5, COLONNA_NORMA);
        this.spazio(50);
        this.y -= 4;
        this.testo(righeDi(b.titolo, grassetto, 11, larghezza), MARGINE.lato, grassetto, 11);
        const yNorma = this.y;
        const paginaNorma = this.pagina;
        b.commi.forEach((comma, i) => {
          const prefisso = b.commi.length > 1 ? `${i + 1}  ` : "";
          this.testo(righeDi(prefisso + comma, normale, 10.5, larghezza), MARGINE.lato, normale, 10.5);
          this.y -= 3;
        });
        norma.forEach((r, i) =>
          paginaNorma.drawText(r, {
            x: MARGINE.lato + LARGHEZZA_TESTO - COLONNA_NORMA,
            y: yNorma - 9 - i * 11,
            size: 8.5,
            font: normale,
            color: COLORI.tenue,
          }),
        );
        this.y -= 6;
        break;
      }
      case "riquadro": {
        const corpo = 10;
        const larghezza = LARGHEZZA_TESTO - 24;
        const titolo = b.titolo ? righeDi(b.titolo, grassetto, corpo + 0.5, larghezza) : [];
        const righe = righeDi(b.testo, normale, corpo, larghezza);
        const h = (titolo.length + righe.length) * corpo * 1.35 + 20;
        this.spazio(h + 8);
        this.pagina.drawRectangle({
          x: MARGINE.lato,
          y: this.y - h,
          width: LARGHEZZA_TESTO,
          height: h,
          color: b.stile === "avviso" ? COLORI.fondoAvviso : COLORI.fondoNota,
          borderColor: b.stile === "avviso" ? COLORI.accento : COLORI.marchio,
          borderWidth: 0.8,
        });
        const fine = this.y - h;
        this.y -= 10;
        this.testo(titolo, MARGINE.lato + 12, grassetto, corpo + 0.5, b.stile === "avviso" ? COLORI.accento : COLORI.marchio);
        this.testo(righe, MARGINE.lato + 12, normale, corpo);
        this.y = fine - 10;
        break;
      }
    }
  }

  tabella(colonne: readonly string[], righe: readonly (readonly string[])[], larghezze: readonly number[]) {
    const { normale, grassetto } = this.f;
    const totale = larghezze.reduce((a, b) => a + b, 0);
    const w = larghezze.map((l) => (l / totale) * LARGHEZZA_TESTO);
    const corpo = 9.5;
    const riga = (celle: readonly string[], font: PDFFont, fondo?: ReturnType<typeof rgb>) => {
      const testi = celle.map((c, i) => righeDi(c, font, corpo, w[i] - 10));
      const h = Math.max(...testi.map((t) => t.length)) * corpo * 1.3 + 8;
      this.spazio(h);
      if (fondo) this.pagina.drawRectangle({ x: MARGINE.lato, y: this.y - h, width: LARGHEZZA_TESTO, height: h, color: fondo });
      let x = MARGINE.lato;
      testi.forEach((t, i) => {
        t.forEach((r, k) => this.pagina.drawText(r, { x: x + 5, y: this.y - 4 - corpo - k * corpo * 1.3, size: corpo, font, color: COLORI.testo }));
        x += w[i];
      });
      this.y -= h;
      this.pagina.drawLine({ start: { x: MARGINE.lato, y: this.y }, end: { x: MARGINE.lato + LARGHEZZA_TESTO, y: this.y }, thickness: 0.5, color: COLORI.linea });
    };
    if (colonne.length) riga(colonne, grassetto, COLORI.fondoNota);
    for (const r of righe) riga(r, normale);
    this.y -= 10;
  }
}

/** Il PDF del documento, come byte da scaricare o salvare. */
export async function creaPdf(doc: DocumentoPdf): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(doc.titolo);
  pdf.setAuthor("Bleo");
  pdf.setCreator("Bleo");
  pdf.setLanguage("it-CH");
  const f: Caratteri = {
    normale: await pdf.embedFont(StandardFonts.Helvetica),
    grassetto: await pdf.embedFont(StandardFonts.HelveticaBold),
    corsivo: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };
  const impaginatore = new Impaginatore(pdf, f);
  if (doc.fascia) impaginatore.fascia(doc.fascia);
  for (const b of doc.blocchi) impaginatore.blocco(b);

  const pagine = pdf.getPages();
  pagine.forEach((p, i) => {
    const piede = righeDi(doc.piede, f.corsivo, 8, LARGHEZZA_TESTO - 70);
    piede.forEach((r, k) => p.drawText(r, { x: MARGINE.lato, y: 40 - k * 10, size: 8, font: f.corsivo, color: COLORI.tenue }));
    const numero = `Pagina ${i + 1} di ${pagine.length}`;
    p.drawText(numero, {
      x: MARGINE.lato + LARGHEZZA_TESTO - f.normale.widthOfTextAtSize(numero, 8),
      y: 40,
      size: 8,
      font: f.normale,
      color: COLORI.tenue,
    });
  });
  return pdf.save();
}
