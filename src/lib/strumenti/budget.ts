/**
 * Budget del primo anno: 12 mesi a partire da un mese scelto.
 *
 * Per ogni mese:
 *   risultato dell'attività = ricavi − costi variabili − costi fissi − costi di avvio
 *   flusso di cassa = risultato − accantonamento AVS − accantonamento imposte − prelievi privati
 * Gli accantonamenti sono 1/12 della stima annua: i contributi AVS si pagano
 * a rate trimestrali, le imposte l'anno dopo, ma i soldi vanno messi da parte
 * mentre si incassa.
 *
 * Semplificazioni (dette anche nell'interfaccia): tutti i costi contano
 * nell'anno, anche gli acquisti che nella contabilità vera si ammortizzano; i
 * contributi AVS si stimano sui 12 mesi come se fossero un anno civile.
 */
import { z } from "zod";
import { fonti, regole, regolePercorso, tasseRegistroCommercio } from "@/data/svizzera";
import {
  anniDisponibili,
  eAnnoAvs,
  stimaContributi,
  type AnnoAvs,
  type SituazioneAvs,
  type StimaContributi,
} from "./avs";
import { avvisoSoglie, type Avviso } from "./avvisi";
import { arrotonda, importo, leggiNumero } from "./numeri";

export const MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"] as const;
export const MESI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
] as const;

export type RigaImporto = { id: string; descrizione: string; importo: string };
export type CostoAvvio = RigaImporto & { mese: number };

export type DatiBudget = {
  /** Primo mese, "AAAA-MM". */
  meseInizio: string;
  situazione: SituazioneAvs;
  /** Ricavi previsti per ciascuno dei 12 mesi. */
  ricavi: string[];
  /** Se l'utente sceglie di iscriversi al registro di commercio (tasse e autenticazione della firma nel primo mese). */
  iscrizioneRegistro: boolean;
  costiAvvio: CostoAvvio[];
  /** Costi fissi al mese. */
  costiFissi: RigaImporto[];
  costiVariabiliPercento: string;
  prelieviMensili: string;
  riservaImpostePercento: string;
};

/** Mese successivo a quello di oggi, "AAAA-MM". */
export function meseSuccessivo(oggiIso: string): string {
  const anno = Number(oggiIso.slice(0, 4));
  const mese = Number(oggiIso.slice(5, 7));
  return mese === 12 ? `${anno + 1}-01` : `${anno}-${String(mese + 1).padStart(2, "0")}`;
}

export function datiBudgetIniziali(oggiIso: string): DatiBudget {
  return {
    meseInizio: meseSuccessivo(oggiIso),
    situazione: "principale",
    ricavi: Array.from({ length: 12 }, () => ""),
    iscrizioneRegistro: false,
    costiAvvio: [
      { id: "attrezzatura", descrizione: "Attrezzatura", importo: "", mese: 0 },
      { id: "sito", descrizione: "Sito web", importo: "", mese: 0 },
    ],
    costiFissi: [
      { id: "locali", descrizione: "Locali", importo: "" },
      { id: "assicurazioni", descrizione: "Assicurazioni", importo: "" },
      { id: "software", descrizione: "Software e abbonamenti", importo: "" },
      { id: "telefono", descrizione: "Telefono e internet", importo: "" },
      { id: "veicolo", descrizione: "Veicolo", importo: "" },
      { id: "formazione", descrizione: "Formazione", importo: "" },
      { id: "materiale", descrizione: "Materiale", importo: "" },
      { id: "altro", descrizione: "Altro", importo: "" },
    ],
    costiVariabiliPercento: "",
    prelieviMensili: "",
    riservaImpostePercento: "",
  };
}

/** Lunghezze massime salvate (nel browser, sul telefono e nell'account: src/lib/strumenti/salvati.ts). */
export const LUNGHEZZE_BUDGET = { importo: 40, descrizione: 120, id: 60, righe: 50 } as const;

const L = LUNGHEZZE_BUDGET;
const testoBreve = z.string().max(L.importo).catch("");
const riga = z.object({ id: z.string().max(L.id), descrizione: z.string().max(L.descrizione).catch(""), importo: testoBreve });
export const schemaDatiBudget = z.object({
  meseInizio: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .catch("2027-01"),
  situazione: z.enum(["principale", "accessoria"]).catch("principale"),
  ricavi: z
    .array(testoBreve)
    .transform((a) => Array.from({ length: 12 }, (_, i) => a[i] ?? ""))
    .catch(Array.from({ length: 12 }, () => "")),
  iscrizioneRegistro: z.boolean().catch(false),
  costiAvvio: z
    .array(riga.extend({ mese: z.number().int().min(0).max(11).catch(0) }))
    .max(L.righe)
    .catch([]),
  costiFissi: z.array(riga).max(L.righe).catch([]),
  costiVariabiliPercento: testoBreve,
  prelieviMensili: testoBreve,
  riservaImpostePercento: testoBreve,
}) satisfies z.ZodType<DatiBudget>;

export type MeseBudget = {
  indice: number;
  anno: number;
  /** 1-12 */
  mese: number;
  etichetta: string;
  ricavi: number;
  costiVariabili: number;
  costiFissi: number;
  costiAvvio: number;
  /** Utile prima dei contributi sociali e delle imposte. */
  risultato: number;
  accantonamentoAvs: number;
  accantonamentoImposte: number;
  prelievi: number;
  flusso: number;
  cumulato: number;
};

export type TotaliBudget = Omit<MeseBudget, "indice" | "anno" | "mese" | "etichetta" | "cumulato">;

export type RisultatoBudget = {
  mesi: MeseBudget[];
  totali: TotaliBudget;
  /** Tavola AVS usata per la stima. */
  annoAvs: AnnoAvs;
  /** true se l'anno dei 12 mesi non ha ancora una tavola e si usa la più vicina. */
  annoAvsApprossimato: boolean;
  contributi: StimaContributi;
  riservaPercento: number | null;
  riservaImposte: number;
  tassaRegistro: number;
  /** Indice del mese di pareggio, o null se nei 12 mesi non si arriva. */
  mesePareggio: number | null;
  /** Il saldo cumulato non è mai negativo. */
  pareggioSubito: boolean;
  /** Il punto più basso del saldo cumulato, come importo positivo (0 se mai sotto zero). */
  fabbisognoMassimo: number;
  meseFabbisogno: number | null;
  avvisi: Avviso[];
  /** Nessun ricavo e nessun costo: niente da mostrare. */
  vuoto: boolean;
};

export type EsitoBudget = { errori: Record<string, string>; risultato: RisultatoBudget };

/** I 12 mesi a partire da "AAAA-MM". */
export function mesiDaInizio(meseInizio: string): { anno: number; mese: number; etichetta: string }[] {
  const anno0 = Number(meseInizio.slice(0, 4));
  const mese0 = Number(meseInizio.slice(5, 7)) - 1;
  return Array.from({ length: 12 }, (_, i) => {
    const totale = mese0 + i;
    const anno = anno0 + Math.floor(totale / 12);
    const mese = (totale % 12) + 1;
    return { anno, mese, etichetta: `${MESI_BREVI[mese - 1]} ${anno}` };
  });
}

/** Anno civile con più mesi nel periodo (a pari merito il più recente), limitato agli anni con la tavola. */
export function annoAvsPerPeriodo(meseInizio: string): { anno: AnnoAvs; approssimato: boolean } {
  const conteggio = new Map<number, number>();
  for (const m of mesiDaInizio(meseInizio)) conteggio.set(m.anno, (conteggio.get(m.anno) ?? 0) + 1);
  let scelto = 0;
  for (const [anno, n] of conteggio) if (n > (conteggio.get(scelto) ?? 0) || (n === conteggio.get(scelto) && anno > scelto)) scelto = anno;
  if (eAnnoAvs(scelto)) return { anno: scelto, approssimato: false };
  const ordinati = [...anniDisponibili].sort((a, b) => a - b);
  return { anno: scelto < ordinati[0] ? ordinati[0] : ordinati[ordinati.length - 1], approssimato: true };
}

export function calcolaBudget(dati: DatiBudget): EsitoBudget {
  const errori: Record<string, string> = {};
  const leggi = (chiave: string, testo: string, max = 100_000_000, messaggio = "Scrivi un importo, per esempio 1'500, o lascia vuoto."): number => {
    if (testo.trim() === "") return 0;
    const n = leggiNumero(testo);
    if (n === null || n < 0 || n > max) {
      errori[chiave] = messaggio;
      return 0;
    }
    return n;
  };

  const ricavi = dati.ricavi.slice(0, 12).map((t, i) => leggi(`ricavi.${i}`, t));
  while (ricavi.length < 12) ricavi.push(0);
  const percVariabili = leggi("costiVariabiliPercento", dati.costiVariabiliPercento, 100, "Scrivi una percentuale da 0 a 100.");
  const prelievi = leggi("prelieviMensili", dati.prelieviMensili);
  const riservaTesto = dati.riservaImpostePercento.trim();
  const riservaPercento =
    riservaTesto === "" ? null : leggi("riservaImpostePercento", riservaTesto, 80, "Scrivi una percentuale da 0 a 80, o lascia vuoto.");
  const fissiMensili = arrotonda(dati.costiFissi.reduce((s, c) => s + leggi(`costiFissi.${c.id}`, c.importo), 0));
  const tassaRegistro = dati.iscrizioneRegistro ? costoIscrizioneRegistro() : 0;
  const avvioPerMese = Array.from({ length: 12 }, () => 0);
  for (const c of dati.costiAvvio) {
    const mese = Math.min(11, Math.max(0, Math.trunc(c.mese)));
    avvioPerMese[mese] += leggi(`costiAvvio.${c.id}`, c.importo);
  }
  avvioPerMese[0] += tassaRegistro;

  const calendario = mesiDaInizio(dati.meseInizio);
  const base = calendario.map((m, i) => {
    const costiVariabili = arrotonda((ricavi[i] * percVariabili) / 100);
    const costiAvvio = arrotonda(avvioPerMese[i]);
    return {
      ...m,
      indice: i,
      ricavi: arrotonda(ricavi[i]),
      costiVariabili,
      costiFissi: fissiMensili,
      costiAvvio,
      risultato: arrotonda(ricavi[i] - costiVariabili - fissiMensili - costiAvvio),
    };
  });

  const risultatoAnno = arrotonda(base.reduce((s, m) => s + m.risultato, 0));
  const { anno: annoAvs, approssimato } = annoAvsPerPeriodo(dati.meseInizio);
  const contributi = stimaContributi(risultatoAnno, annoAvs, dati.situazione);
  const riservaImposte =
    riservaPercento === null ? 0 : arrotonda((Math.max(0, risultatoAnno - contributi.totale) * riservaPercento) / 100);

  // Accantonamenti mensili: 1/12, con l'ultimo mese che assorbe i centesimi.
  const dodicesimi = (totale: number) => {
    const quota = arrotonda(totale / 12);
    return Array.from({ length: 12 }, (_, i) => (i < 11 ? quota : arrotonda(totale - quota * 11)));
  };
  const avsMesi = dodicesimi(contributi.totale);
  const impostePerMese = dodicesimi(riservaImposte);

  let cumulato = 0;
  const mesi: MeseBudget[] = base.map((m, i) => {
    const flusso = arrotonda(m.risultato - avsMesi[i] - impostePerMese[i] - prelievi);
    cumulato = arrotonda(cumulato + flusso);
    return { ...m, accantonamentoAvs: avsMesi[i], accantonamentoImposte: impostePerMese[i], prelievi, flusso, cumulato };
  });

  const somma = (k: keyof TotaliBudget) => arrotonda(mesi.reduce((s, m) => s + m[k], 0));
  const totali: TotaliBudget = {
    ricavi: somma("ricavi"),
    costiVariabili: somma("costiVariabili"),
    costiFissi: somma("costiFissi"),
    costiAvvio: somma("costiAvvio"),
    risultato: somma("risultato"),
    accantonamentoAvs: somma("accantonamentoAvs"),
    accantonamentoImposte: somma("accantonamentoImposte"),
    prelievi: somma("prelievi"),
    flusso: somma("flusso"),
  };

  // Pareggio: primo mese da cui il saldo cumulato resta >= 0 fino alla fine.
  let mesePareggio: number | null = null;
  for (let i = 11; i >= 0; i--) {
    if (mesi[i].cumulato >= 0) mesePareggio = i;
    else break;
  }
  const pareggioSubito = mesePareggio === 0;
  let meseFabbisogno: number | null = null;
  let minimo = 0;
  mesi.forEach((m, i) => {
    if (m.cumulato < minimo) {
      minimo = m.cumulato;
      meseFabbisogno = i;
    }
  });

  const vuoto = totali.ricavi === 0 && totali.costiFissi === 0 && totali.costiAvvio === 0 && totali.prelievi === 0;

  const avvisi: Avviso[] = [];
  const soglie = avvisoSoglie(totali.ricavi, "budget");
  if (soglie) avvisi.push(soglie);
  if (!vuoto && risultatoAnno < 0) {
    avvisi.push({
      id: "perdita",
      livello: "info",
      titolo: "Nei 12 mesi i costi superano i ricavi",
      testo:
        contributi.caso === "minimo"
          ? `Anche con una perdita, di regola la cassa AVS chiede almeno il contributo minimo (${importo(contributi.avsAiIpg, 0)} nel ${annoAvs}): l'abbiamo contato negli accantonamenti.`
          : "Con una perdita la stima dei contributi è bassa: l'importo vero lo decide la cassa di compensazione.",
      fonti: [fonti.avsPromemoria202],
    });
  }

  return {
    errori,
    risultato: {
      mesi,
      totali,
      annoAvs,
      annoAvsApprossimato: approssimato,
      contributi,
      riservaPercento,
      riservaImposte,
      tassaRegistro,
      mesePareggio,
      pareggioSubito,
      fabbisognoMassimo: arrotonda(-minimo),
      meseFabbisogno,
      avvisi,
      vuoto,
    },
  };
}

/**
 * Costo dell'iscrizione al registro di commercio per una ditta individuale:
 * tasse federali del titolare con firma individuale più l'autenticazione
 * della firma allo sportello dell'Ufficio RC ticinese.
 */
export function costoIscrizioneRegistro(): number {
  return tasseRegistroCommercio.valore.stimaTitolareConFirma + regolePercorso.autenticazioneFirmaRcTicino.valore;
}

/** Il nome del mese per esteso: "febbraio 2027". */
export function nomeMese(m: Pick<MeseBudget, "anno" | "mese">): string {
  return `${MESI[m.mese - 1]} ${m.anno}`;
}

/** Soglia dell'IVA (per i testi dell'interfaccia). */
export const sogliaIva = regole.sogliaIva;
