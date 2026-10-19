/**
 * «Oggi»: il riassunto del giorno in cima alla schermata Inizio dell'app.
 * Quando l'attività è aperta, ogni giorno contano fatture da incassare,
 * scadenze, documenti, ore da fatturare e soldi da mettere da parte: qui si
 * decide quali schede mostrare, in che ordine e con quali testi. Funzioni
 * pure (niente data di sistema): l'app legge i dati con le sue funzioni
 * (conti, ore, cassetto) e li passa qui.
 *
 * Da dove vengono le cifre:
 * - date delle scadenze: il percorso (src/lib/percorso/regole.ts), con le
 *   fonti ufficiali, come nel calendario e nei promemoria;
 * - votazioni: src/data/votazioni.ts, con le fonti e la data di controllo;
 * - «Quanto mettere da parte»: il calcolo di src/lib/conti/da-parte.ts;
 * - fatture, documenti e ore: i dati che l'utente ha scritto nell'account.
 * I giorni qui sotto (quando una scheda compare) sono scelte di Bleo per il
 * riassunto, non valori di legge.
 */
import { dataSvizzera, type Fonte } from "@/data/svizzera";
import type { Votazione } from "@/data/votazioni";
import { GIORNI_IN_SCADENZA } from "@/lib/cassetto/limiti";
import { badgeScadenza, daGuardare, statoScadenza, testoDataScadenza } from "@/lib/cassetto/scadenze";
import { durata, intervalloMese, meseDi, nomeMese } from "@/lib/clienti/ore";
import type { Mese } from "@/lib/clienti/tipi";
import { calcolaDaParte, sottotitoloDaParte, type DatiConti, type ImpostazioniDaParte } from "@/lib/conti/da-parte";
import { giorniTra } from "@/lib/conti/importi";
import { giorniDiRitardo, livelloConsigliato, NOMI_LIVELLO, testoRitardo, testoSollecitoInviato } from "@/lib/conti/sollecito";
import type { FatturaEmessa } from "@/lib/conti/tipi";
import { eventiDaScadenze } from "@/lib/percorso/calendario";
import { GIORNI_PRIMA } from "@/lib/percorso/promemoria";
import type { Scadenza } from "@/lib/percorso/regole";
import { quando } from "@/lib/percorso/settimana";
import { importo } from "@/lib/strumenti/numeri";
import { etichettaLivello, votazioniInArrivo } from "@/lib/votazioni";

/* ------------------------------------------------------------------ */
/* Soglie (scelte di Bleo, non valori di legge)                        */
/* ------------------------------------------------------------------ */

/** Una fattura non pagata «scade presto» se scade entro tanti giorni (oggi compreso). */
export const GIORNI_FATTURE_IN_SCADENZA = 7;
/** Una scadenza del percorso compare se cade entro tanti giorni. */
export const GIORNI_SCADENZA_VICINA = 30;
/** Entro tanti giorni la scadenza è urgente: come il promemoria sul telefono, una settimana prima. */
export const GIORNI_SCADENZA_URGENTE = GIORNI_PRIMA;
/** Un documento è da guardare se è scaduto o scade entro tanti giorni: come nel cassetto (primo promemoria). */
export const GIORNI_DOCUMENTI = GIORNI_IN_SCADENZA;
/** Una votazione da seguire compare quando mancano al massimo tanti giorni. */
export const GIORNI_VOTAZIONE = 14;
/** Fatture scadute mostrate una per una; le altre stanno in una scheda sola. */
export const MASSIMO_FATTURE_SCADUTE = 3;
/** Righe al massimo in una scheda con più voci (documenti, fatture, mesi). */
export const MASSIMO_RIGHE = 3;

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

/** alta: da fare subito; media: presto; info: da sapere. */
export type Urgenza = "alta" | "media" | "info";

export type GenereCarta =
  | "fattura-scaduta"
  | "altre-fatture-scadute"
  | "fatture-in-scadenza"
  | "scadenza"
  | "documenti"
  | "ore-passate"
  | "ore-mese"
  | "votazione"
  | "da-parte";

/** Dove porta l'azione della scheda. */
export type DestinazioneOggi =
  | { schermata: "sollecito"; fatturaId: string }
  | { schermata: "conti" }
  | { schermata: "documenti" }
  | { schermata: "ore"; mese: Mese }
  | { schermata: "percorso" }
  | { schermata: "fonte"; url: string };

export type CartaOggi = {
  /** Stabile tra un aggiornamento e l'altro. */
  id: string;
  genere: GenereCarta;
  urgenza: Urgenza;
  /** Due parole sopra il titolo: «Fattura scaduta», «Scadenza». */
  etichetta: string;
  titolo: string;
  testo: string;
  /** Righe in più, una per voce (documenti, fatture, mesi). */
  righe: string[];
  azione: { titolo: string; /** Per VoiceOver e TalkBack. */ suggerimento: string; destinazione: DestinazioneOggi };
  /** La fonte ufficiale della data (scadenze e votazioni). */
  fonte: (Fonte & { verificatoIl?: string }) | null;
  /** La data che conta (AAAA-MM-GG): a parità di urgenza va prima la più vecchia. */
  data: string | null;
};

type FatturaOggi = Pick<FatturaEmessa, "id" | "numero" | "cliente" | "scadenza" | "importo" | "pagataIl" | "sollecito">;
type DocumentoOggi = { id: string; titolo: string; scadeIl: string | null };

export type DatiOggi = {
  /** AAAA-MM-GG, data del telefono. */
  oggi: string;
  /** Le scadenze del percorso; null se il questionario non è fatto. */
  scadenze: readonly Scadenza[] | null;
  votazioni: readonly Votazione[];
  /** Dall'account; mancano se non c'è l'accesso o non sono (ancora) arrivati. */
  fatture?: readonly FatturaOggi[];
  documenti?: readonly DocumentoOggi[];
  /** Mesi con ore non ancora fatturate (RispostaOre.daFatturare). */
  oreDaFatturare?: readonly { mese: Mese; minuti: number }[];
  /** Riepilogo dell'anno dei conti e le scelte di «Quanto mettere da parte» salvate sul telefono. */
  daParte?: { conti: DatiConti; impostazioni: ImpostazioniDaParte };
};

/* ------------------------------------------------------------------ */
/* Le schede                                                           */
/* ------------------------------------------------------------------ */

const ORDINE_URGENZA: Record<Urgenza, number> = { alta: 0, media: 1, info: 2 };
const ORDINE_GENERE: readonly GenereCarta[] = [
  "fattura-scaduta",
  "altre-fatture-scadute",
  "scadenza",
  "documenti",
  "fatture-in-scadenza",
  "ore-passate",
  "ore-mese",
  "votazione",
  "da-parte",
];

/** Le schede di oggi, dalla più urgente. Vuoto se non c'è niente da segnalare. */
export function carteOggi(d: DatiOggi): CartaOggi[] {
  const carte: CartaOggi[] = [
    ...(d.fatture ? carteFatture(d.fatture, d.oggi) : []),
    ...(d.scadenze ? carteScadenze(d.scadenze, d.oggi) : []),
    ...(d.documenti ? carteDocumenti(d.documenti, d.oggi) : []),
    ...(d.oreDaFatturare ? carteOre(d.oreDaFatturare, d.oggi) : []),
    ...carteVotazioni(d.votazioni, d.oggi, d.scadenze !== null),
    ...(d.daParte ? carteDaParte(d.daParte.conti, d.daParte.impostazioni, d.oggi) : []),
  ];
  return carte.sort(
    (a, b) =>
      ORDINE_URGENZA[a.urgenza] - ORDINE_URGENZA[b.urgenza] ||
      (a.data ?? "9999-12-31").localeCompare(b.data ?? "9999-12-31") ||
      ORDINE_GENERE.indexOf(a.genere) - ORDINE_GENERE.indexOf(b.genere) ||
      a.id.localeCompare(b.id),
  );
}

/** true se almeno una scheda chiede di fare qualcosa (urgenza alta o media). */
export function serveAttenzione(carte: readonly CartaOggi[]): boolean {
  return carte.some((c) => c.urgenza !== "info");
}

function maiuscola(testo: string): string {
  return `${testo.charAt(0).toUpperCase()}${testo.slice(1)}`;
}

function minuscola(testo: string): string {
  return `${testo.charAt(0).toLowerCase()}${testo.slice(1)}`;
}

/** Le prime MASSIMO_RIGHE righe, più «e altri N» se ce ne sono di più. */
function primeRighe(righe: readonly string[], altri: (n: number) => string): string[] {
  const resto = righe.length - MASSIMO_RIGHE;
  return resto > 0 ? [...righe.slice(0, MASSIMO_RIGHE), altri(resto)] : [...righe];
}

/** «scade oggi», «scade domani», «scade tra 3 giorni». */
function scade(giorni: number): string {
  return `scade ${quando(giorni)}`;
}

// --- Fatture emesse.

function carteFatture(fatture: readonly FatturaOggi[], oggi: string): CartaOggi[] {
  const nonPagate = fatture.filter((f): f is FatturaOggi & { scadenza: string } => !f.pagataIl && Boolean(f.scadenza));
  const perScadenza = (a: { scadenza: string; numero: string }, b: { scadenza: string; numero: string }) =>
    a.scadenza.localeCompare(b.scadenza) || a.numero.localeCompare(b.numero);

  const scadute = nonPagate.filter((f) => giorniDiRitardo(f, oggi) > 0).sort(perScadenza);
  const carte = scadute.slice(0, MASSIMO_FATTURE_SCADUTE).map((f) => cartaFatturaScaduta(f, oggi));
  const altre = scadute.slice(MASSIMO_FATTURE_SCADUTE);
  if (altre.length > 0) {
    const totale = altre.reduce((s, f) => s + f.importo, 0);
    carte.push({
      id: "altre-fatture-scadute",
      genere: "altre-fatture-scadute",
      urgenza: "alta",
      etichetta: "Fatture scadute",
      titolo: altre.length === 1 ? "Un'altra fattura scaduta" : `Altre ${altre.length} fatture scadute`,
      testo: `In tutto ${importo(totale)} da incassare. In «I tuoi conti» Bleo ti prepara il sollecito per ognuna.`,
      righe: [],
      azione: { titolo: "Vedi le fatture", suggerimento: "Apre le fatture emesse in I tuoi conti", destinazione: { schermata: "conti" } },
      fonte: null,
      data: altre[0].scadenza,
    });
  }

  const presto = nonPagate
    .filter((f) => {
      const giorni = giorniTra(oggi, f.scadenza);
      return giorni >= 0 && giorni <= GIORNI_FATTURE_IN_SCADENZA;
    })
    .sort(perScadenza);
  if (presto.length > 0) carte.push(cartaFattureInScadenza(presto, oggi));
  return carte;
}

function cartaFatturaScaduta(f: FatturaOggi & { scadenza: string }, oggi: string): CartaOggi {
  const livello = livelloConsigliato(f);
  const ritardo = minuscola(testoRitardo(giorniDiRitardo(f, oggi)));
  const sollecito = f.sollecito ? ` ${testoSollecitoInviato(f.sollecito)}.` : "";
  return {
    id: `fattura-${f.id}`,
    genere: "fattura-scaduta",
    urgenza: "alta",
    etichetta: "Fattura scaduta",
    titolo: `${f.cliente}: fattura non pagata`,
    testo: `Fattura ${f.numero} di ${importo(f.importo)}, da pagare entro il ${dataSvizzera(f.scadenza)}: ${ritardo}.${sollecito}`,
    righe: [],
    azione: {
      titolo: livello === 2 ? `Manda il ${NOMI_LIVELLO[2].breve}` : "Manda un sollecito",
      suggerimento: `Prepara il testo del sollecito per la fattura ${f.numero}`,
      destinazione: { schermata: "sollecito", fatturaId: f.id },
    },
    fonte: null,
    data: f.scadenza,
  };
}

function cartaFattureInScadenza(fatture: readonly (FatturaOggi & { scadenza: string })[], oggi: string): CartaOggi {
  const azione = {
    titolo: "Vedi le fatture",
    suggerimento: "Apre le fatture emesse in I tuoi conti",
    destinazione: { schermata: "conti" } as const,
  };
  const [prima] = fatture;
  if (fatture.length === 1) {
    return {
      id: "fatture-in-scadenza",
      genere: "fatture-in-scadenza",
      urgenza: "media",
      etichetta: "Fattura in scadenza",
      titolo: `La fattura ${prima.numero} ${scade(giorniTra(oggi, prima.scadenza))}`,
      testo: `${prima.cliente}, ${importo(prima.importo)}, da pagare entro il ${dataSvizzera(prima.scadenza)}. Quando ti pagano, tocca «Segna pagata».`,
      righe: [],
      azione,
      fonte: null,
      data: prima.scadenza,
    };
  }
  const totale = fatture.reduce((s, f) => s + f.importo, 0);
  return {
    id: "fatture-in-scadenza",
    genere: "fatture-in-scadenza",
    urgenza: "media",
    etichetta: "Fatture in scadenza",
    titolo: `${fatture.length} fatture scadono entro ${GIORNI_FATTURE_IN_SCADENZA} giorni`,
    testo: `In tutto ${importo(totale)} da incassare.`,
    righe: primeRighe(
      fatture.map((f) => `${f.numero}, ${f.cliente}: ${scade(giorniTra(oggi, f.scadenza))} (${dataSvizzera(f.scadenza)})`),
      (n) => (n === 1 ? "e un'altra" : `e altre ${n}`),
    ),
    azione,
    fonte: null,
    data: prima.scadenza,
  };
}

// --- Scadenze del percorso (acconti AVS, imposte...), come nel calendario e nei promemoria.

function carteScadenze(scadenze: readonly Scadenza[], oggi: string): CartaOggi[] {
  const anno = Number(oggi.slice(0, 4));
  const visti = new Set<string>();
  const vicine = scadenze
    .flatMap((scadenza) =>
      [anno, anno + 1].flatMap((a) => eventiDaScadenze([scadenza], { anno: a }).map((evento) => ({ evento, scadenza }))),
    )
    .map((v) => ({ ...v, giorni: giorniTra(oggi, v.evento.data) }))
    .filter((v) => v.giorni >= 0 && v.giorni <= GIORNI_SCADENZA_VICINA)
    .filter((v) => (visti.has(v.evento.uid) ? false : (visti.add(v.evento.uid), true)))
    .sort((a, b) => a.evento.data.localeCompare(b.evento.data) || a.evento.uid.localeCompare(b.evento.uid));
  const [prima, ...poi] = vicine;
  if (!prima) return [];

  const data = dataSvizzera(prima.evento.data);
  const quandoTesto = prima.giorni === 0 ? `Oggi, ${data}.` : `${maiuscola(quando(prima.giorni))}, il ${data}.`;
  const altre =
    poi.length === 0
      ? ""
      : poi.length === 1
        ? ` Poi un'altra scadenza entro ${GIORNI_SCADENZA_VICINA} giorni.`
        : ` Poi altre ${poi.length} scadenze entro ${GIORNI_SCADENZA_VICINA} giorni.`;
  const fonte = prima.scadenza.fonti[0] ?? null;
  return [
    {
      id: `scadenza-${prima.evento.uid}`,
      genere: "scadenza",
      urgenza: prima.giorni <= GIORNI_SCADENZA_URGENTE ? "alta" : "media",
      etichetta: "Scadenza",
      titolo: prima.evento.titolo,
      testo: `${quandoTesto}${altre}`,
      righe: [],
      azione: {
        titolo: "Vedi le scadenze",
        suggerimento: "Apre le scadenze del percorso, con le fonti ufficiali e i promemoria",
        destinazione: { schermata: "percorso" },
      },
      fonte,
      data: prima.evento.data,
    },
  ];
}

// --- Cassetto dei documenti.

function carteDocumenti(documenti: readonly DocumentoOggi[], oggi: string): CartaOggi[] {
  const urgenti = documenti
    .filter((d): d is DocumentoOggi & { scadeIl: string } => daGuardare(d.scadeIl, oggi))
    .sort((a, b) => a.scadeIl.localeCompare(b.scadeIl) || a.titolo.localeCompare(b.titolo, "it", { sensitivity: "base" }));
  if (urgenti.length === 0) return [];

  const scaduto = (d: { scadeIl: string }) => statoScadenza(d.scadeIl, oggi).tipo === "scaduto";
  /** «Scaduto il 01.10.2026», «Scade oggi», «Scade tra 12 giorni». */
  const stato = (d: { scadeIl: string }) =>
    scaduto(d) ? testoDataScadenza(d.scadeIl, oggi) : (badgeScadenza(d.scadeIl, oggi)?.testo ?? testoDataScadenza(d.scadeIl, oggi));
  const azione = {
    titolo: "Apri il cassetto",
    suggerimento: "Apre il cassetto dei documenti",
    destinazione: { schermata: "documenti" } as const,
  };
  const urgenza: Urgenza = urgenti.some(scaduto) ? "alta" : "media";
  const [primo] = urgenti;

  if (urgenti.length === 1) {
    return [
      {
        id: "documenti",
        genere: "documenti",
        urgenza,
        etichetta: "Documento",
        titolo: primo.titolo,
        testo: scaduto(primo)
          ? `${stato(primo)}. Se l'hai già rinnovato, carica nel cassetto quello nuovo.`
          : `${stato(primo)} (${dataSvizzera(primo.scadeIl)}): ricordati di rinnovarlo per tempo.`,
        righe: [],
        azione,
        fonte: null,
        data: primo.scadeIl,
      },
    ];
  }
  return [
    {
      id: "documenti",
      genere: "documenti",
      urgenza,
      etichetta: "Documenti",
      titolo: `${urgenti.length} documenti da guardare`,
      testo: `Scaduti o in scadenza nei prossimi ${GIORNI_DOCUMENTI} giorni: ricordati di rinnovarli per tempo.`,
      righe: primeRighe(
        urgenti.map((d) => `${d.titolo}: ${minuscola(stato(d))}`),
        (n) => (n === 1 ? "e un altro" : `e altri ${n}`),
      ),
      azione,
      fonte: null,
      data: primo.scadeIl,
    },
  ];
}

// --- Clienti e ore.

function carteOre(daFatturare: readonly { mese: Mese; minuti: number }[], oggi: string): CartaOggi[] {
  const corrente = meseDi(oggi);
  const conOre = daFatturare.filter((m) => m.minuti > 0);
  const passati = conOre.filter((m) => m.mese < corrente).sort((a, b) => a.mese.localeCompare(b.mese));
  const questo = conOre.find((m) => m.mese === corrente);
  const carte: CartaOggi[] = [];

  const [piuVecchio] = passati;
  if (piuVecchio) {
    const azione = {
      titolo: "Crea la fattura",
      suggerimento: `Apre Clienti e ore su ${nomeMese(piuVecchio.mese)}`,
      destinazione: { schermata: "ore", mese: piuVecchio.mese } as const,
    };
    carte.push(
      passati.length === 1
        ? {
            id: "ore-passate",
            genere: "ore-passate",
            urgenza: "media",
            etichetta: "Ore da fatturare",
            titolo: `Ore di ${nomeMese(piuVecchio.mese)} da fatturare`,
            testo: `${durata(piuVecchio.minuti)} non ancora in una fattura.`,
            righe: [],
            azione,
            fonte: null,
            data: intervalloMese(piuVecchio.mese).fine,
          }
        : {
            id: "ore-passate",
            genere: "ore-passate",
            urgenza: "media",
            etichetta: "Ore da fatturare",
            titolo: `Ore da fatturare in ${passati.length} mesi`,
            testo: "Non sono ancora in una fattura: comincia dal mese più vecchio.",
            righe: primeRighe(
              passati.map((m) => `${maiuscola(nomeMese(m.mese))}: ${durata(m.minuti)}`),
              (n) => (n === 1 ? "e un altro mese" : `e altri ${n} mesi`),
            ),
            azione,
            fonte: null,
            data: intervalloMese(piuVecchio.mese).fine,
          },
    );
  }

  if (questo) {
    carte.push({
      id: "ore-mese",
      genere: "ore-mese",
      urgenza: "info",
      etichetta: "Ore da fatturare",
      titolo: `Ore di ${nomeMese(questo.mese)} da fatturare`,
      testo: `Finora ${durata(questo.minuti)}. Quando hai finito il lavoro del mese, crea la fattura.`,
      righe: [],
      azione: {
        titolo: "Crea la fattura",
        suggerimento: `Apre Clienti e ore su ${nomeMese(questo.mese)}`,
        destinazione: { schermata: "ore", mese: questo.mese },
      },
      fonte: null,
      data: intervalloMese(questo.mese).fine,
    });
  }
  return carte;
}

// --- Votazioni da seguire.

function carteVotazioni(votazioni: readonly Votazione[], oggi: string, conPercorso: boolean): CartaOggi[] {
  return votazioniInArrivo(votazioni, oggi)
    .filter((v) => giorniTra(oggi, v.data) <= GIORNI_VOTAZIONE)
    .map((v): CartaOggi => {
      const fonte = v.fonti[0];
      return {
        id: `votazione-${v.id}`,
        genere: "votazione",
        urgenza: "info",
        etichetta: etichettaLivello(v.livello),
        titolo: v.titoloBreve,
        testo: `Si vota ${quando(giorniTra(oggi, v.data))}, il ${dataSvizzera(v.data)}. ${v.chiRiguarda}`,
        righe: [],
        azione: conPercorso
          ? {
              titolo: "Cosa cambia",
              suggerimento: "Apre le votazioni da seguire nel percorso, con le fonti ufficiali",
              destinazione: { schermata: "percorso" },
            }
          : {
              titolo: "Leggi il testo ufficiale",
              suggerimento: `Apre ${fonte.titolo}`,
              destinazione: { schermata: "fonte", url: fonte.url },
            },
        fonte: { ...fonte, verificatoIl: v.verificatoIl },
        data: v.data,
      };
    });
}

// --- Quanto mettere da parte.

function carteDaParte(conti: DatiConti, impostazioni: ImpostazioniDaParte, oggi: string): CartaOggi[] {
  const { stima: s } = calcolaDaParte(conti, oggi, impostazioni);
  if (s.vuoto || !s.annoInCorso || s.alMese.totale <= 0) return [];
  return [
    {
      id: "da-parte",
      genere: "da-parte",
      urgenza: "info",
      etichetta: "Da mettere da parte",
      titolo: `Questo mese circa ${importo(s.alMese.totale, 0)}`,
      testo: `${maiuscola(sottotitoloDaParte(s))}. È una stima dai conti che hai confermato.`,
      righe: [],
      azione: {
        titolo: "Vedi il calcolo",
        suggerimento: "Apre «Quanto mettere da parte» in I tuoi conti, con le fonti ufficiali",
        destinazione: { schermata: "conti" },
      },
      fonte: null,
      data: null,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Le frasi intorno alle schede                                        */
/* ------------------------------------------------------------------ */

/** I dati dell'account che «Oggi» legge. */
export type FonteDati = "conti" | "ore" | "documenti";

const NOMI_FONTI: Record<FonteDati, string> = { conti: "i conti", ore: "le ore", documenti: "i documenti" };
const ORDINE_FONTI: readonly FonteDati[] = ["conti", "ore", "documenti"];

/** «a», «a e b», «a, b e c». */
export function elenco(parole: readonly string[]): string {
  if (parole.length <= 1) return parole.join("");
  return `${parole.slice(0, -1).join(", ")} e ${parole.at(-1)}`;
}

function nomi(fonti: readonly FonteDati[]): string {
  return elenco(ORDINE_FONTI.filter((f) => fonti.includes(f)).map((f) => NOMI_FONTI[f]));
}

export const TESTI_OGGI = {
  titolo: "Oggi",
  tuttoInOrdine: "Tutto in ordine per oggi.",
  /** Quando qualcosa non si è potuto leggere: non diciamo che è tutto in ordine. */
  nienteDaSegnalare: "Niente da segnalare in quello che sono riuscito a leggere.",
  accedi: "Accedi per vedere qui anche le fatture da incassare, le ore da fatturare e i documenti in scadenza.",
  accediDiNuovo: "Accedi di nuovo per vedere qui i conti, le ore e i documenti.",
  demo: "In questa versione di prova non c'è l'accesso: qui vedi le scadenze del percorso e le votazioni. Fatture, ore e documenti arrivano con l'account.",
} as const;

/** La riga serena, se nessuna scheda chiede di fare qualcosa; null altrimenti. */
export function rigaTranquilla(carte: readonly CartaOggi[], conErrori: boolean): string | null {
  if (serveAttenzione(carte)) return null;
  return conErrori ? TESTI_OGGI.nienteDaSegnalare : TESTI_OGGI.tuttoInOrdine;
}

/** «Leggo i conti, le ore e i documenti…» */
export function testoAttesa(fonti: readonly FonteDati[]): string {
  return `Leggo ${nomi(fonti)}…`;
}

/** «Non riesco a leggere i conti e i documenti. Tira giù per riprovare.» */
export function testoErrori(fonti: readonly FonteDati[]): string {
  return `Non riesco a leggere ${nomi(fonti)}. Tira giù per riprovare.`;
}

const GIORNI_SETTIMANA = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"] as const;

/** «lunedì 19.10.2026» */
export function giornoDiOggi(oggi: string): string {
  const [anno, mese, giorno] = oggi.split("-").map(Number);
  return `${GIORNI_SETTIMANA[new Date(Date.UTC(anno, mese - 1, giorno)).getUTCDay()]} ${dataSvizzera(oggi)}`;
}
