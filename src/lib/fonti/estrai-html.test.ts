import { describe, expect, it } from "vitest";
import { estraiTestoHtml } from "./estrai-html";

const pagina = (corpo: string, testa = "<title>Titolo della scheda</title>") =>
  `<!doctype html><html lang="it"><head>${testa}<style>p{color:red}</style></head><body>${corpo}</body></html>`;

describe("estraiTestoHtml", () => {
  it("prende il contenuto di <main> e lascia fuori menu, intestazione, piè di pagina e cookie", () => {
    const html = pagina(`
      <header><a href="/">Logo del Cantone</a><nav><ul><li>Home</li><li>Contatti</li></ul></nav></header>
      <div id="cookie-banner">Questo sito usa i cookie. <button>Accetto</button></div>
      <main id="main-content">
        <h1>Iscrizione di nuova ditta individuale</h1>
        <p>Le persone fisiche che gestiscono un'impresa in forma commerciale devono iscriversi.</p>
        <script>window.tracciamento = true;</script>
        <form><label>Cerca</label><input name="q"></form>
      </main>
      <footer>© Repubblica e Cantone Ticino</footer>`);

    const { titolo, blocchi } = estraiTestoHtml(html);
    expect(titolo).toBe("Iscrizione di nuova ditta individuale");
    expect(blocchi).toEqual([
      { tipo: "titolo", livello: 1, testo: "Iscrizione di nuova ditta individuale" },
      {
        tipo: "paragrafo",
        testo: "Le persone fisiche che gestiscono un'impresa in forma commerciale devono iscriversi.",
      },
    ]);
    const tutto = JSON.stringify(blocchi);
    for (const escluso of ["Logo", "Contatti", "cookie", "Accetto", "tracciamento", "Cerca", "©"]) {
      expect(tutto).not.toContain(escluso);
    }
  });

  it("non toglie il contenuto se una classe dei cookie è sul body o su main", () => {
    const html = `<html><body class="cookie-banner-visible"><main class="consent-ok"><p>Testo utile.</p></main></body></html>`;
    expect(estraiTestoHtml(html).blocchi).toEqual([{ tipo: "paragrafo", testo: "Testo utile." }]);
  });

  it("senza <main> usa <article> o #content", () => {
    expect(estraiTestoHtml(pagina(`<nav>Menu</nav><article><p>Testo dell'articolo.</p></article>`)).blocchi).toEqual([
      { tipo: "paragrafo", testo: "Testo dell'articolo." },
    ]);
    expect(
      estraiTestoHtml(pagina(`<div id="menu">Menu laterale</div><div id="content"><p>Contenuto.</p></div>`)).blocchi,
    ).toEqual([{ tipo: "paragrafo", testo: "Contenuto." }]);
  });

  it("in mancanza di tutto usa il body, senza intestazione e piè di pagina", () => {
    const { titolo, blocchi } = estraiTestoHtml(
      pagina(`<header>Testata</header><div><h2>Sezione</h2><p>Paragrafo.</p></div><footer>Fondo</footer>`),
    );
    expect(titolo).toBe("Titolo della scheda");
    expect(blocchi).toEqual([
      { tipo: "titolo", livello: 2, testo: "Sezione" },
      { tipo: "paragrafo", testo: "Paragrafo." },
    ]);
  });

  it("tiene il testo in linea unito, segna i punti degli elenchi e le righe delle tabelle", () => {
    const html = pagina(`<main>
      <p>Il contributo <strong>minimo</strong> è di <abbr title="franchi">CHF</abbr>&nbsp;530<br>all'anno.</p>
      <ul><li>AVS</li><li>AI <ul><li>dettaglio</li></ul></li></ul>
      <table><tr><th>Anno</th><th>Tasso</th></tr><tr><td>2025</td><td>1,5 %</td></tr></table>
    </main>`);
    expect(estraiTestoHtml(html).blocchi).toEqual([
      { tipo: "paragrafo", testo: "Il contributo minimo è di CHF 530 all'anno." },
      { tipo: "punto", testo: "AVS" },
      { tipo: "punto", testo: "AI" },
      { tipo: "punto", testo: "dettaglio" },
      { tipo: "paragrafo", testo: "Anno | Tasso" },
      { tipo: "paragrafo", testo: "2025 | 1,5 %" },
    ]);
  });

  it("legge i titoli delle fisarmoniche dentro i pulsanti e scarta gli altri pulsanti", () => {
    const html = pagina(`<main>
      <button class="accordion__button"><h3>Quando inizia l'assoggettamento obbligatorio?</h3></button>
      <div class="accordion__drawer"><p>Dall'inizio dell'attività.</p></div>
      <button>Stampa</button>
    </main>`);
    expect(estraiTestoHtml(html).blocchi).toEqual([
      { tipo: "titolo", livello: 3, testo: "Quando inizia l'assoggettamento obbligatorio?" },
      { tipo: "paragrafo", testo: "Dall'inizio dell'attività." },
    ]);
  });

  it("scarta elementi nascosti, testi solo per lettori di schermo e righe senza parole", () => {
    const html = pagina(`<main>
      <p hidden>Nascosto</p><p aria-hidden="true">Icona</p><span class="sr-only">Link esterno</span>
      <p>»</p><p>|</p><p>Vero contenuto.</p>
    </main>`);
    expect(estraiTestoHtml(html).blocchi).toEqual([{ tipo: "paragrafo", testo: "Vero contenuto." }]);
  });

  it("toglie un blocco ripetuto subito dopo se stesso (versione mobile e desktop)", () => {
    const html = pagina(`<main><h1>Ditta individuale</h1><h1>Ditta individuale</h1><p>Testo.</p><p>Testo.</p></main>`);
    expect(estraiTestoHtml(html).blocchi).toEqual([
      { tipo: "titolo", livello: 1, testo: "Ditta individuale" },
      { tipo: "paragrafo", testo: "Testo." },
    ]);
  });
});
