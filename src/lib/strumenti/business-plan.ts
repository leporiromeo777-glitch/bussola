/**
 * Business plan di una pagina: le domande guidate, i limiti di lunghezza che
 * fanno stare tutto su un foglio A4 e i testi importati da tariffa e budget.
 */
import { z } from "zod";
import { nomeMese, type DatiBudget, type RisultatoBudget } from "./budget";
import { importo, numeroBreve, numeroSvizzero } from "./numeri";
import type { RisultatoTariffa } from "./tariffa";

export type CampoPiano =
  | "idea"
  | "problema"
  | "perChi"
  | "soluzione"
  | "prezzo"
  | "clienti"
  | "concorrenti"
  | "costi"
  | "ricavi"
  | "rischi"
  | "passi";

export type DefinizioneCampo = {
  id: CampoPiano;
  titolo: string;
  domanda: string;
  esempio: string;
  /** Caratteri consigliati perché tutto stia su una pagina. */
  consigliati: number;
  righe: number;
};

export const CAMPI_PIANO: readonly DefinizioneCampo[] = [
  {
    id: "idea",
    titolo: "L'idea in una frase",
    domanda: "Cosa fai, per chi e cosa ti rende diverso, in una frase.",
    esempio: "Faccio siti web semplici per bar e negozi del Locarnese, pronti in due settimane e facili da aggiornare.",
    consigliati: 160,
    righe: 2,
  },
  {
    id: "problema",
    titolo: "Il problema",
    domanda: "Quale problema hanno i tuoi clienti? Come lo risolvono oggi?",
    esempio: "Molti piccoli negozi non hanno un sito o ne hanno uno vecchio: i clienti non trovano orari, prodotti e contatti.",
    consigliati: 350,
    righe: 3,
  },
  {
    id: "perChi",
    titolo: "Per chi",
    domanda: "Chi sono i tuoi clienti? Dove sono? Quanti potrebbero essere?",
    esempio: "Bar, negozi e artigiani tra Locarno e Bellinzona con meno di 10 collaboratori.",
    consigliati: 300,
    righe: 3,
  },
  {
    id: "soluzione",
    titolo: "Soluzione e offerta",
    domanda: "Cosa vendi esattamente? Un prodotto, un servizio, un pacchetto?",
    esempio: "Pacchetto sito di 3 pagine con foto, mappa e orari; aggiornamenti mensili su richiesta.",
    consigliati: 400,
    righe: 4,
  },
  {
    id: "prezzo",
    titolo: "Prezzo",
    domanda: "Quanto chiedi e come lo hai calcolato?",
    esempio: "Pacchetto a prezzo fisso; lavori extra a ore. Prezzi calcolati con lo strumento Tariffa oraria.",
    consigliati: 250,
    righe: 3,
  },
  {
    id: "clienti",
    titolo: "Come trovi i clienti",
    domanda: "Come ti fai conoscere? Chi sono i primi 5 clienti a cui chiedere?",
    esempio: "Passaparola, visite di persona ai negozi, profilo Instagram con prima e dopo, accordo con un fotografo.",
    consigliati: 350,
    righe: 3,
  },
  {
    id: "concorrenti",
    titolo: "Concorrenti e perché scelgono te",
    domanda: "Chi offre già qualcosa di simile? Perché un cliente dovrebbe scegliere te?",
    esempio: "Agenzie web (più care, tempi lunghi) e costruttori fai-da-te (tempo del cliente). Io: prezzo chiaro, vicino, in italiano.",
    consigliati: 350,
    righe: 3,
  },
  {
    id: "costi",
    titolo: "Costi principali",
    domanda: "Quali sono le spese più importanti, all'avvio e ogni mese?",
    esempio: "Computer e programmi all'avvio; abbonamenti software, telefono e assicurazioni ogni mese.",
    consigliati: 300,
    righe: 3,
  },
  {
    id: "ricavi",
    titolo: "Ricavi attesi",
    domanda: "Quanto pensi di incassare nel primo anno? Quando arrivi al pareggio?",
    esempio: "Primo anno: 2 siti al mese da marzo. Pareggio previsto in estate.",
    consigliati: 300,
    righe: 3,
  },
  {
    id: "rischi",
    titolo: "Rischi e come li gestisci",
    domanda: "Cosa potrebbe andare storto e cosa fai se succede?",
    esempio: "Pochi clienti nei primi mesi: tengo un lavoro part-time fino a giugno. Un solo cliente grande: cerco sempre altri mandanti.",
    consigliati: 350,
    righe: 3,
  },
  {
    id: "passi",
    titolo: "I prossimi 3 passi",
    domanda: "Cosa fai nelle prossime settimane? Tre azioni concrete, con una data.",
    esempio: "1. Entro il 15.11 parlo con 10 negozianti. 2. Entro il 30.11 preparo 2 siti di esempio. 3. A dicembre chiedo il riconoscimento come indipendente alla cassa AVS.",
    consigliati: 300,
    righe: 3,
  },
];

export type DatiPiano = {
  nomeAttivita: string;
  titolare: string;
  campi: Record<CampoPiano, string>;
};

export function datiPianoIniziali(): DatiPiano {
  return {
    nomeAttivita: "",
    titolare: "",
    campi: Object.fromEntries(CAMPI_PIANO.map((c) => [c.id, ""])) as Record<CampoPiano, string>,
  };
}

/** Limite massimo salvato per campo (il doppio del consigliato): oltre non si scrive. */
export const MASSIMO_ASSOLUTO = 2;

const testoCampo = (max: number) => z.string().max(max).catch("");
export const schemaDatiPiano = z.object({
  nomeAttivita: testoCampo(120),
  titolare: testoCampo(120),
  campi: z
    .object(
      Object.fromEntries(CAMPI_PIANO.map((c) => [c.id, testoCampo(c.consigliati * MASSIMO_ASSOLUTO)])) as Record<
        CampoPiano,
        ReturnType<typeof testoCampo>
      >,
    )
    .catch(datiPianoIniziali().campi),
}) satisfies z.ZodType<DatiPiano>;

export type StatoLunghezza = { caratteri: number; consigliati: number; stato: "vuoto" | "ok" | "quasi" | "lungo" };

/** Quanti caratteri e se il testo sta ancora nella pagina. */
export function statoLunghezza(testo: string, consigliati: number): StatoLunghezza {
  const caratteri = testo.trim().length;
  const stato = caratteri === 0 ? "vuoto" : caratteri > consigliati ? "lungo" : caratteri > consigliati * 0.85 ? "quasi" : "ok";
  return { caratteri, consigliati, stato };
}

/** Quanti campi sono compilati (per una barra di avanzamento). */
export function campiCompilati(dati: DatiPiano): number {
  return CAMPI_PIANO.filter((c) => dati.campi[c.id].trim() !== "").length;
}

/** Il piano supera la lunghezza consigliata in qualche campo? */
export function campiTroppoLunghi(dati: DatiPiano): CampoPiano[] {
  return CAMPI_PIANO.filter((c) => statoLunghezza(dati.campi[c.id], c.consigliati).stato === "lungo").map((c) => c.id);
}

// --- Testi importati dagli altri strumenti.

export function testoPrezzoDaTariffa(r: RisultatoTariffa): string {
  return (
    `Tariffa minima: ${importo(r.tariffaOrariaArrotondata, 0)} all'ora (${importo(r.tariffaGiornaliera, 0)} per una giornata di ${numeroBreve(r.oreGiornata)} ore), ` +
    `per un reddito di ${importo(r.reddito, 0)} all'anno con ${numeroSvizzero(r.oreFatturabiliAnno)} ore fatturabili. Importi senza IVA.`
  );
}

export function testoCostiDaBudget(r: RisultatoBudget, dati: DatiBudget): string {
  const parti: string[] = [];
  const fissi = r.mesi[0]?.costiFissi ?? 0;
  if (fissi > 0) {
    const voci = dati.costiFissi
      .filter((c) => c.importo.trim() && c.descrizione.trim())
      .map((c) => c.descrizione.trim().toLowerCase())
      .slice(0, 4);
    parti.push(`Costi fissi ${importo(fissi, 0)} al mese${voci.length ? ` (${voci.join(", ")})` : ""}.`);
  }
  if (r.totali.costiAvvio > 0) {
    const voci = dati.costiAvvio
      .filter((c) => c.importo.trim() && c.descrizione.trim())
      .map((c) => c.descrizione.trim().toLowerCase())
      .slice(0, 4);
    if (r.tassaRegistro > 0) voci.push("iscrizione al registro di commercio");
    parti.push(`Costi di avvio ${importo(r.totali.costiAvvio, 0)}${voci.length ? ` (${voci.join(", ")})` : ""}.`);
  }
  if (r.totali.costiVariabili > 0) parti.push(`Costi variabili ${dati.costiVariabiliPercento.trim()}% dei ricavi.`);
  parti.push(`Contributi AVS e supplementi stimati: ${importo(r.contributi.totale, 0)} all'anno.`);
  return parti.join(" ");
}

export function testoRicaviDaBudget(r: RisultatoBudget): string {
  const primo = r.mesi[0];
  const ultimo = r.mesi[r.mesi.length - 1];
  const periodo = primo && ultimo ? `${primo.etichetta} – ${ultimo.etichetta}` : "12 mesi";
  const pareggio =
    r.mesePareggio === null
      ? "Nei primi 12 mesi il saldo resta negativo."
      : r.pareggioSubito
        ? "Saldo positivo fin dal primo mese."
        : `Pareggio previsto a ${nomeMese(r.mesi[r.mesePareggio])}.`;
  return (
    `Primi 12 mesi (${periodo}): ricavi ${importo(r.totali.ricavi, 0)}, ` +
    `risultato prima di AVS e imposte ${importo(r.totali.risultato, 0)}. ${pareggio}`
  );
}
