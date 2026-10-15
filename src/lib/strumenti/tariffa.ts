/**
 * Tariffa oraria minima: quanto fatturare per avere il reddito che vuoi,
 * dopo i costi dell'attività e i contributi sociali (AVS/AI/IPG e supplementi
 * ticinesi), prima delle imposte.
 *
 * Il calcolo, dal fondo:
 * 1. utile dopo i contributi = reddito voluto + pilastro 3a + riserva imposte
 *    (la riserva è una percentuale dell'utile dopo i contributi, scelta da te);
 * 2. utile prima dei contributi: il più piccolo utile U tale che
 *    U − contributi(U) >= utile dopo i contributi. I contributi dipendono da U
 *    (circolarità): lo risolve `minimoInCentesimi`;
 * 3. fatturato = U + costi fissi;
 * 4. tariffa oraria = fatturato / ore fatturabili nell'anno.
 *
 * Non calcoliamo le imposte: la riserva la sceglie l'utente (per stimarla c'è
 * il calcolatore ufficiale dell'AFC).
 */
import { z } from "zod";
import {
  annoPredefinito,
  puntiDiSalto,
  stimaContributi,
  type AnnoAvs,
  type SituazioneAvs,
  type StimaContributi,
} from "./avs";
import { avvisiPilastro3a, avvisoSoglie, type Avviso } from "./avvisi";
import { arrotonda, arrotondaPerEccesso, leggiNumero } from "./numeri";
import { minimoInCentesimi } from "./risolutore";

export const CATEGORIE_COSTI = [
  { id: "locali", etichetta: "Locali", esempio: "affitto di ufficio, atelier o spazio di lavoro" },
  { id: "assicurazioni", etichetta: "Assicurazioni", esempio: "RC professionale, cose, infortuni facoltativa" },
  { id: "software", etichetta: "Software e abbonamenti", esempio: "programmi, app, cloud, sito" },
  { id: "telefono", etichetta: "Telefono e internet", esempio: "la parte usata per il lavoro" },
  { id: "veicolo", etichetta: "Veicolo", esempio: "la parte usata per il lavoro" },
  { id: "formazione", etichetta: "Formazione", esempio: "corsi, libri, fiere" },
  { id: "materiale", etichetta: "Materiale", esempio: "attrezzi, materiale di consumo" },
  { id: "altro", etichetta: "Altro", esempio: "banca, fiduciario, marketing" },
] as const;

export type CategoriaCosto = (typeof CATEGORIE_COSTI)[number]["id"];

/** Quello che l'utente scrive (testo, così si può digitare liberamente). */
export type DatiTariffa = {
  anno: AnnoAvs;
  situazione: SituazioneAvs;
  redditoDesiderato: string;
  settimaneVacanza: string;
  giorniAssenza: string;
  giorniLavorativiSettimana: string;
  oreFatturabiliSettimana: string;
  oreGiornata: string;
  costiFissi: Record<CategoriaCosto, string>;
  pilastro3a: string;
  riservaImpostePercento: string;
};

const costiVuoti = Object.fromEntries(CATEGORIE_COSTI.map((c) => [c.id, ""])) as Record<CategoriaCosto, string>;

/** Valori di esempio: l'utente li cambia con i suoi. I costi partono da zero. */
export function datiTariffaIniziali(oggiIso: string): DatiTariffa {
  return {
    anno: annoPredefinito(oggiIso),
    situazione: "principale",
    redditoDesiderato: "48'000",
    settimaneVacanza: "5",
    giorniAssenza: "10",
    giorniLavorativiSettimana: "5",
    oreFatturabiliSettimana: "25",
    oreGiornata: "8",
    costiFissi: { ...costiVuoti },
    pilastro3a: "",
    riservaImpostePercento: "",
  };
}

const testo = z.string().max(40).catch("");
export const schemaDatiTariffa = z.object({
  anno: z.literal([2026, 2027]).catch(2027),
  situazione: z.enum(["principale", "accessoria"]).catch("principale"),
  redditoDesiderato: testo,
  settimaneVacanza: testo,
  giorniAssenza: testo,
  giorniLavorativiSettimana: testo,
  oreFatturabiliSettimana: testo,
  oreGiornata: testo,
  costiFissi: z
    .object(Object.fromEntries(CATEGORIE_COSTI.map((c) => [c.id, testo])) as Record<CategoriaCosto, typeof testo>)
    .catch({ ...costiVuoti }),
  pilastro3a: testo,
  riservaImpostePercento: testo,
}) satisfies z.ZodType<DatiTariffa>;

export type CampoTariffa =
  | Exclude<keyof DatiTariffa, "costiFissi" | "anno" | "situazione">
  | `costiFissi.${CategoriaCosto}`;

export type RisultatoTariffa = {
  anno: AnnoAvs;
  situazione: SituazioneAvs;
  settimaneLavorative: number;
  giorniLavorativi: number;
  oreFatturabiliAnno: number;
  oreGiornata: number;
  reddito: number;
  pilastro3a: number;
  riservaPercento: number | null;
  riservaImposte: number;
  /** Reddito + 3a + riserva: quello che deve restare dopo i contributi. */
  utileDopoContributi: number;
  /** Base dei contributi AVS (utile prima dei contributi sociali). */
  utilePrimaDeiContributi: number;
  contributi: StimaContributi;
  costiFissi: number;
  costiPerCategoria: Record<CategoriaCosto, number>;
  fatturato: number;
  tariffaOraria: number;
  tariffaOrariaArrotondata: number;
  tariffaGiornaliera: number;
  avvisi: Avviso[];
};

export type EsitoTariffa =
  | { ok: true; risultato: RisultatoTariffa }
  | { ok: false; errori: Partial<Record<CampoTariffa, string>> };

const SETTIMANE_ANNO = 52;

function numeroFacoltativo(t: string): number | null | "errore" {
  if (t.trim() === "") return null;
  const n = leggiNumero(t);
  return n === null ? "errore" : n;
}

export function calcolaTariffa(dati: DatiTariffa): EsitoTariffa {
  const errori: Partial<Record<CampoTariffa, string>> = {};
  const leggi = (
    campo: CampoTariffa,
    valore: string,
    { obbligatorio = false, min = 0, max = Infinity, messaggio }: { obbligatorio?: boolean; min?: number; max?: number; messaggio: string },
  ): number => {
    const n = numeroFacoltativo(valore);
    if (n === null) {
      if (obbligatorio) errori[campo] = messaggio;
      return 0;
    }
    if (n === "errore" || n < min || n > max) {
      errori[campo] = messaggio;
      return 0;
    }
    return n;
  };

  const reddito = leggi("redditoDesiderato", dati.redditoDesiderato, {
    obbligatorio: true,
    max: 10_000_000,
    messaggio: "Scrivi quanto vuoi guadagnare in un anno, per esempio 48'000.",
  });
  const vacanza = leggi("settimaneVacanza", dati.settimaneVacanza, {
    max: 51,
    messaggio: "Scrivi le settimane di vacanza, da 0 a 51.",
  });
  const giorniSettimana = leggi("giorniLavorativiSettimana", dati.giorniLavorativiSettimana, {
    obbligatorio: true,
    min: 1,
    max: 7,
    messaggio: "Scrivi quanti giorni lavori a settimana, da 1 a 7.",
  });
  const assenze = leggi("giorniAssenza", dati.giorniAssenza, {
    max: 365,
    messaggio: "Scrivi i giorni di malattia e festivi, da 0 a 365.",
  });
  const oreSettimana = leggi("oreFatturabiliSettimana", dati.oreFatturabiliSettimana, {
    obbligatorio: true,
    min: 0.5,
    max: 100,
    messaggio: "Scrivi le ore che puoi fatturare a settimana, per esempio 25.",
  });
  const oreGiornata = leggi("oreGiornata", dati.oreGiornata, {
    obbligatorio: true,
    min: 0.5,
    max: 24,
    messaggio: "Scrivi quante ore dura una giornata fatturata, per esempio 8.",
  });
  const pilastro3a = leggi("pilastro3a", dati.pilastro3a, {
    max: 1_000_000,
    messaggio: "Scrivi un importo annuo, per esempio 3'000, o lascia vuoto.",
  });
  const riservaTesto = numeroFacoltativo(dati.riservaImpostePercento);
  let riservaPercento: number | null = null;
  if (riservaTesto === "errore" || (typeof riservaTesto === "number" && (riservaTesto < 0 || riservaTesto > 80))) {
    errori.riservaImpostePercento = "Scrivi una percentuale da 0 a 80, o lascia vuoto.";
  } else if (typeof riservaTesto === "number") {
    riservaPercento = riservaTesto;
  }

  const costiPerCategoria = {} as Record<CategoriaCosto, number>;
  for (const c of CATEGORIE_COSTI) {
    costiPerCategoria[c.id] = leggi(`costiFissi.${c.id}`, dati.costiFissi[c.id] ?? "", {
      max: 10_000_000,
      messaggio: "Scrivi un importo annuo positivo, o lascia vuoto.",
    });
  }

  const settimaneLavorative = arrotonda(SETTIMANE_ANNO - vacanza - (giorniSettimana > 0 ? assenze / giorniSettimana : 0), 4);
  if (!errori.settimaneVacanza && !errori.giorniAssenza && !errori.giorniLavorativiSettimana && settimaneLavorative <= 0) {
    errori.giorniAssenza = "Con queste vacanze e assenze non resta tempo per lavorare: riduci i giorni o le settimane.";
  }
  if (!errori.oreFatturabiliSettimana && !errori.giorniLavorativiSettimana && oreSettimana > giorniSettimana * 24) {
    errori.oreFatturabiliSettimana = "Sono più ore di quante ce ne siano nei tuoi giorni di lavoro.";
  }
  if (Object.keys(errori).length > 0) return { ok: false, errori };

  const oreFatturabiliAnno = arrotonda(settimaneLavorative * oreSettimana, 2);
  const costiFissi = arrotonda(Object.values(costiPerCategoria).reduce((s, v) => s + v, 0));

  const quotaRiserva = (riservaPercento ?? 0) / 100;
  const utileDopoContributi = arrotonda((reddito + pilastro3a) / (1 - quotaRiserva));
  const riservaImposte = arrotonda(utileDopoContributi - reddito - pilastro3a);

  const netto = (utile: number) => arrotonda(utile - stimaContributi(utile, dati.anno, dati.situazione).totale);
  const utilePrimaDeiContributi = minimoInCentesimi(netto, utileDopoContributi, puntiDiSalto(dati.anno, dati.situazione), {
    massimo: 100_000_000,
  });
  if (utilePrimaDeiContributi === null) {
    return { ok: false, errori: { redditoDesiderato: "Importo troppo alto per questo calcolo." } };
  }
  const contributi = stimaContributi(utilePrimaDeiContributi, dati.anno, dati.situazione);
  const fatturato = arrotonda(utilePrimaDeiContributi + costiFissi);
  const tariffaOraria = fatturato / oreFatturabiliAnno;

  const avvisi: Avviso[] = [];
  const soglie = avvisoSoglie(fatturato, "tariffa");
  if (soglie) avvisi.push(soglie);
  avvisi.push(...avvisiPilastro3a(pilastro3a, utilePrimaDeiContributi - contributi.totale, dati.anno));

  return {
    ok: true,
    risultato: {
      anno: dati.anno,
      situazione: dati.situazione,
      settimaneLavorative,
      giorniLavorativi: arrotonda(settimaneLavorative * giorniSettimana, 1),
      oreFatturabiliAnno,
      oreGiornata,
      reddito,
      pilastro3a,
      riservaPercento,
      riservaImposte,
      utileDopoContributi,
      utilePrimaDeiContributi,
      contributi,
      costiFissi,
      costiPerCategoria,
      fatturato,
      tariffaOraria: arrotonda(tariffaOraria, 2),
      tariffaOrariaArrotondata: arrotondaPerEccesso(tariffaOraria, 1),
      tariffaGiornaliera: arrotondaPerEccesso(tariffaOraria * oreGiornata, 1),
      avvisi,
    },
  };
}
