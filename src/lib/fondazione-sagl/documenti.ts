/**
 * I due documenti dello strumento «Fondare una Sagl», come contenuto per
 * crea-pdf.ts:
 *
 * - la scheda di preparazione: i dati da portare al notaio e al fiduciario,
 *   cosa controllare e i prossimi passi (check list del Portale PMI);
 * - la bozza dello statuto: solo quello che la legge chiede in ogni statuto
 *   (art. 776 CO) e la scelta su chi dirige (art. 809 CO), con la norma
 *   accanto a ogni articolo. Non usa lo statuto tipo del 2008, che precede
 *   la riforma del 2023.
 *
 * Bleo dà informazioni generali con fonti: i documenti lo dicono, e
 * rimandano al notaio e a un fiduciario autorizzato.
 */
import { chf, dataSvizzera, fonti, fontiPercorso, regole, type Fonte } from "../../data/svizzera";
import type { Blocco, DocumentoPdf } from "../pdf/crea-pdf";
import { chiDirige, controllaFondazione, totaleQuote, type DatiFondazione } from "./dati";

/** Data dell'ultimo controllo delle norme e della check list usate qui. */
export const VERIFICATO_FONDAZIONE_SAGL = "2026-10-17";

const NON_CONSULENZA =
  "Bleo dà informazioni generali con le fonti ufficiali, non una consulenza. L'atto di fondazione lo prepara il notaio; per il vostro caso chiedete a un fiduciario autorizzato (albo online del Cantone Ticino).";

/** I passi della check list del Portale PMI per creare una Sagl, in parole semplici. */
export const PASSI_CHECK_LIST = [
  "Preparate un preventivo delle spese di fondazione.",
  "Scegliete il nome dell'impresa e verificatelo al registro di commercio.",
  "Stabilite capitale, quote e come le versate (in denaro o in natura).",
  "Scegliete i soci e chi dirige la società.",
  "Scegliete una banca e aprite un conto vincolato per le quote.",
  "Preparate l'atto di fondazione e lo statuto.",
  "Fateli controllare prima dal notaio e dal registro di commercio.",
  "Se c'è un ufficio di revisione: chiedetegli la dichiarazione di accettazione.",
  "Fate l'assemblea di fondazione, con l'atto pubblico dal notaio.",
  "La Sagl viene iscritta nel registro di commercio.",
  "Con l'estratto del registro, la banca rilascia le quote versate.",
  "Annunciatevi alla cassa AVS e stipulate le assicurazioni obbligatorie (anche i fondatori sono dipendenti).",
  "Chiarite se dovete pagare l'IVA. Per le iscrizioni c'è il portale EasyGov.",
] as const;

/**
 * Nome del file PDF, uguale sul sito e nell'app: «scheda-fondazione-…» o
 * «bozza-statuto-…» con la ditta in minuscolo, senza accenti, spazi né
 * simboli («rossi-bianchi-sagl»); «sagl» se la ditta è vuota.
 */
export function nomeFilePdfFondazione(quale: "scheda" | "statuto", ditta: string): string {
  const pulito = ditta
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${quale === "scheda" ? "scheda-fondazione" : "bozza-statuto"}-${pulito || "sagl"}.pdf`;
}

function fontiBlocchi(elenco: readonly Fonte[]): Blocco[] {
  const uniche = elenco.filter((f, i) => elenco.findIndex((g) => g.url === f.url) === i);
  return [
    { tipo: "sottotitolo", testo: `Fonti ufficiali (controllate il ${dataSvizzera(VERIFICATO_FONDAZIONE_SAGL)})` },
    { tipo: "elenco", voci: uniche.map((f) => `${f.titolo} · ${f.ente} · ${f.url}`) },
  ];
}

function oVuoto(testo: string, alternativa = "(da completare)"): string {
  return testo.trim() || alternativa;
}

/** La scheda di preparazione, con la data in cui è stata preparata (ISO). */
export function schedaPreparazione(d: DatiFondazione, oggi: string): DocumentoPdf {
  const { errori, avvisi } = controllaFondazione(d);
  const dirigenti = chiDirige(d);
  const nQuote = d.valoreQuota > 0 ? d.capitale / d.valoreQuota : 0;
  const blocchi: Blocco[] = [
    { tipo: "titolo", testo: "Fondare una Sagl: scheda di preparazione" },
    {
      tipo: "paragrafo",
      tenue: true,
      testo: `Preparata con Bleo il ${dataSvizzera(oggi)}. Da portare al notaio e al fiduciario: sono i dati che servono per lo statuto e per l'atto di fondazione.`,
    },
    { tipo: "sottotitolo", testo: "1. La società" },
    {
      tipo: "tabella",
      colonne: [],
      larghezze: [1, 3],
      righe: [
        ["Ditta (nome)", oVuoto(d.ditta)],
        ["Sede (Comune)", oVuoto(d.sede)],
        ["Scopo", oVuoto(d.scopo)],
      ],
    },
    { tipo: "paragrafo", tenue: true, testo: "Nella ditta deve esserci la forma giuridica, per esempio «Sagl» (art. 950 CO)." },
    { tipo: "sottotitolo", testo: "2. Capitale e quote" },
    {
      tipo: "paragrafo",
      testo: `Capitale sociale: ${chf(d.capitale, 2)}, in ${Number.isInteger(nQuote) ? nQuote : "?"} quote da ${chf(d.valoreQuota, 2)}.`,
    },
    {
      tipo: "tabella",
      colonne: ["Socio", "Domicilio", "Quote", "Importo", "Versamento"],
      larghezze: [3, 2.4, 1, 1.6, 1.6],
      righe: [
        ...d.soci.map((s) => [
          oVuoto(s.nome, "(nome)"),
          oVuoto(s.domicilio, "-"),
          String(s.quote),
          chf(s.quote * d.valoreQuota, 2),
          s.inNatura ? "in natura" : "in denaro",
        ]),
        ["Totale", "", String(totaleQuote(d)), chf(totaleQuote(d) * d.valoreQuota, 2), ""],
      ],
    },
    {
      tipo: "paragrafo",
      tenue: true,
      testo: `Il capitale è di almeno ${chf(regole.capitaleMinimoSagl.valore)} (art. 773 CO) e alla fondazione va versato per intero (art. 777c CO). Le quote valgono più di zero (art. 774 CO) e ogni socio ne ha almeno una (art. 772 CO).`,
    },
    { tipo: "sottotitolo", testo: "3. Chi dirige" },
    {
      tipo: "paragrafo",
      testo:
        d.direzione === "tutti"
          ? "Tutti i soci insieme: è la regola della legge, se lo statuto non dice altro (art. 809 CO)."
          : "Uno o più gerenti, come prevede lo statuto (art. 809 CO), nominati dall'assemblea dei soci (art. 804 CO).",
    },
    {
      tipo: "tabella",
      colonne: ["Chi dirige", "Domicilio", "Socio", "Domiciliato in Svizzera"],
      larghezze: [3, 2.4, 1, 2],
      righe: dirigenti.map((p) => [oVuoto(p.nome, "(nome)"), oVuoto(p.domicilio, "-"), p.socio ? "sì" : "no", p.domiciliatoInSvizzera ? "sì" : "no"]),
    },
    {
      tipo: "paragrafo",
      tenue: true,
      testo: "La società deve poter essere rappresentata da una persona domiciliata in Svizzera, che sia gerente o direttore (art. 814 CO).",
    },
    { tipo: "sottotitolo", testo: "4. Banca e revisione" },
    {
      tipo: "tabella",
      colonne: [],
      larghezze: [1, 3],
      righe: [
        ["Banca per il conto vincolato", oVuoto(d.banca, "(da scegliere)")],
        [
          "Revisione",
          {
            "da-decidere": "Da decidere con il fiduciario.",
            ufficio: "Con un ufficio di revisione.",
            rinuncia: "Rinuncia alla revisione limitata (solo con il consenso di tutti i soci e al massimo 10 posti a tempo pieno; art. 727a e 818 CO).",
          }[d.revisione],
        ],
        ["Comunicazioni ai soci", d.comunicazioni === "scritto" ? "Per iscritto." : "Per iscritto o per e-mail."],
      ],
    },
  ];

  const daControllare = [...errori, ...avvisi];
  if (daControllare.length > 0) {
    blocchi.push({
      tipo: "riquadro",
      stile: "avviso",
      titolo: errori.length > 0 ? "Da completare o correggere" : "Da sapere",
      testo: daControllare.map((c) => `• ${c.testo}${c.fonte ? ` (${c.fonte.titolo})` : ""}`).join("\n"),
    });
  }

  blocchi.push(
    { tipo: "sottotitolo", testo: "5. I prossimi passi (check list del Portale PMI)" },
    { tipo: "elenco", numerato: true, voci: PASSI_CHECK_LIST },
    { tipo: "riquadro", stile: "nota", testo: NON_CONSULENZA },
    ...fontiBlocchi([
      fonti.pmiChecklist,
      fonti.co773,
      fontiPercorso.co772,
      fontiPercorso.co774,
      fontiPercorso.co777c,
      fontiPercorso.co777b,
      fontiPercorso.co950,
      fontiPercorso.co804,
      fontiPercorso.co809,
      fontiPercorso.co814,
      fontiPercorso.co727a,
      fontiPercorso.co818,
      fontiPercorso.pmiAssicurazioniSociali,
      fonti.albofiduciari,
    ]),
  );

  return {
    titolo: `Scheda di preparazione - ${oVuoto(d.ditta, "Sagl")}`,
    blocchi,
    piede: `Bleo · scheda di preparazione del ${dataSvizzera(oggi)} · informazioni generali con fonti, non una consulenza`,
  };
}

/**
 * La bozza dello statuto. Contiene solo il contenuto obbligatorio (art. 776
 * CO) e la scelta su chi dirige: per il resto valgono le regole della legge.
 */
export function bozzaStatuto(d: DatiFondazione, oggi: string): DocumentoPdf {
  const nQuote = d.valoreQuota > 0 ? d.capitale / d.valoreQuota : 0;
  const ditta = oVuoto(d.ditta, "[ditta] Sagl");
  const sede = oVuoto(d.sede, "[Comune]");
  const blocchi: Blocco[] = [
    { tipo: "titolo", testo: `Statuto della ${ditta}` },
    { tipo: "paragrafo", tenue: true, testo: `con sede a ${sede}` },
    { tipo: "sottotitolo", testo: "I. Ditta, sede e scopo" },
    {
      tipo: "articolo",
      titolo: "Articolo 1 - Ditta",
      commi: [`Sotto la ditta ${ditta} esiste una società a garanzia limitata ai sensi degli articoli 772 e seguenti del Codice delle obbligazioni (CO).`],
      norma: "Art. 776 cifra 1 CO\nArt. 950 CO",
    },
    { tipo: "articolo", titolo: "Articolo 2 - Sede", commi: [`La sede della società è a ${sede}.`], norma: "Art. 776 cifra 1 CO" },
    {
      tipo: "articolo",
      titolo: "Articolo 3 - Scopo",
      commi: [`Lo scopo della società è: ${oVuoto(d.scopo, "[descrivete in modo preciso l'attività]")}`],
      norma: "Art. 776 cifra 2 CO",
    },
    { tipo: "sottotitolo", testo: "II. Capitale" },
    {
      tipo: "articolo",
      titolo: "Articolo 4 - Capitale sociale",
      commi: [
        `Il capitale sociale ammonta a ${chf(d.capitale, 2)}.`,
        `Esso è suddiviso in ${Number.isInteger(nQuote) ? nQuote : "[numero]"} quote sociali con un valore nominale di ${chf(d.valoreQuota, 2)} ciascuna.`,
      ],
      norma: "Art. 773 CO\nArt. 774 CO\nArt. 776 cifra 3 CO",
    },
    { tipo: "sottotitolo", testo: "III. Gestione" },
    d.direzione === "tutti"
      ? { tipo: "articolo", titolo: "Articolo 5 - Gestione", commi: ["I soci esercitano in comune la gestione della società."], norma: "Art. 809 cpv. 1 CO" }
      : {
          tipo: "articolo",
          titolo: "Articolo 5 - Gestione",
          commi: ["La gestione della società è affidata a uno o più gerenti, nominati dall'assemblea dei soci."],
          norma: "Art. 809 cpv. 1 CO\nArt. 804 cpv. 2 cifra 2 CO",
        },
    { tipo: "sottotitolo", testo: "IV. Comunicazioni" },
    {
      tipo: "articolo",
      titolo: "Articolo 6 - Comunicazioni ai soci",
      commi: [d.comunicazioni === "scritto" ? "Le comunicazioni della società ai soci avvengono per iscritto." : "Le comunicazioni della società ai soci avvengono per iscritto o per e-mail."],
      norma: "Art. 776 cifra 4 CO",
    },
    {
      tipo: "riquadro",
      stile: "avviso",
      titolo: "Cosa manca in questa bozza",
      testo:
        "Questa bozza contiene solo quello che la legge chiede in ogni statuto (art. 776 CO) e la scelta su chi dirige (art. 809 CO). Per tutto il resto valgono le regole della legge. Altre regole valgono solo se sono scritte nello statuto, per esempio versamenti suppletivi, prestazioni accessorie, divieto di concorrenza o diritti di prelazione (art. 777a CO): decidetele con il notaio o con un fiduciario autorizzato.",
    },
    {
      tipo: "paragrafo",
      tenue: true,
      testo: "Lo statuto lo stabiliscono i fondatori nell'atto di fondazione, un atto pubblico fatto dal notaio (art. 777 CO). Questa bozza non è firmata e non ha valore da sola.",
    },
    { tipo: "riquadro", stile: "nota", testo: NON_CONSULENZA },
    ...fontiBlocchi([
      fontiPercorso.co776,
      fontiPercorso.co772,
      fonti.co773,
      fontiPercorso.co774,
      fontiPercorso.co804,
      fontiPercorso.co809,
      fontiPercorso.co950,
      fontiPercorso.co777,
      fontiPercorso.co777a,
      fonti.albofiduciari,
    ]),
  ];
  return {
    titolo: `Bozza dello statuto - ${ditta}`,
    fascia: "BOZZA da far controllare al notaio - non è un documento ufficiale",
    blocchi,
    piede: `Bleo · bozza dello statuto del ${dataSvizzera(oggi)} · da far controllare al notaio, non è una consulenza`,
  };
}
