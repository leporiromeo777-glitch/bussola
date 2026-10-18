/**
 * «Clienti e ore»: durate, importi, mesi e riepilogo per cliente.
 * Logica pura, senza browser né Node: la usano il sito, le API e l'app.
 *
 * In fattura le ore vanno in centesimi d'ora (1 h 20 min = 1.33 h) e
 * l'importo è ore × tariffa arrotondato al centesimo, esattamente come lo
 * calcola lo strumento fattura (calcolaRiga): così i totali che vedi qui sono
 * quelli della fattura. L'arrotondamento ai 5 centesimi resta una scelta
 * dello strumento fattura, sul totale.
 */
import { calcolaRiga } from "@/lib/strumenti/documenti";
import { arrotonda, daCentesimi, inCentesimi, numeroSvizzero } from "@/lib/strumenti/numeri";
import type { Cliente, Mese, VoceOre } from "./tipi";

/* ------------------------------------------------------------------ */
/* Durate                                                              */
/* ------------------------------------------------------------------ */

/** Ore e minuti → minuti totali (1 h 20 min → 80). Null se non è una durata intera. */
export function inMinuti(ore: number, minuti: number): number | null {
  if (!Number.isInteger(ore) || !Number.isInteger(minuti) || ore < 0 || minuti < 0 || minuti > 59) return null;
  return ore * 60 + minuti;
}

/** Minuti → ore e minuti separati (80 → { ore: 1, minuti: 20 }). */
export function oreEMinuti(minuti: number): { ore: number; minuti: number } {
  const totale = Math.max(0, Math.round(minuti));
  return { ore: Math.floor(totale / 60), minuti: totale % 60 };
}

/** Durata leggibile: 80 → «1 h 20 min», 45 → «45 min», 120 → «2 h», 0 → «0 min». */
export function durata(minuti: number): string {
  const { ore, minuti: resto } = oreEMinuti(minuti);
  const oreTesto = ore > 0 ? `${numeroSvizzero(ore, 0)} h` : "";
  if (ore > 0 && resto > 0) return `${oreTesto} ${resto} min`;
  return ore > 0 ? oreTesto : `${resto} min`;
}

/** Ore in fattura, con due decimali (centesimi d'ora): 80 min → 1.33, 90 min → 1.5. */
export function oreInFattura(minuti: number): number {
  return arrotonda(minuti / 60, 2);
}

/**
 * Quantità per lo strumento fattura: al massimo due decimali, con il punto e
 * senza separatori delle migliaia («1.33», «2», «1250.5»). Mai tre decimali:
 * lo strumento leggerebbe «1.500» come millecinquecento.
 */
export function quantitaOre(minuti: number): string {
  return String(oreInFattura(minuti));
}

/** Prezzo per lo strumento fattura: «120.00»; vuoto se non c'è la tariffa. */
export function prezzoTesto(tariffa: number | null): string {
  return tariffa === null ? "" : daCentesimi(inCentesimi(tariffa)).toFixed(2);
}

/**
 * true se in fattura le ore sono esatte (1 h 30 min = 1.5 h); false se si
 * arrotondano (1 h 20 min = 1.33 h): succede quando i minuti non sono un
 * multiplo di 3 (3 minuti = 0.05 h).
 */
export function oreInFatturaEsatte(minuti: number): boolean {
  return Math.abs(oreInFattura(minuti) * 60 - minuti) < 1e-9;
}

/** Ore decimali da mostrare accanto alla durata: «1.33 h». */
export function oreDecimali(minuti: number): string {
  return `${quantitaOre(minuti)} h`;
}

/* ------------------------------------------------------------------ */
/* Importi                                                             */
/* ------------------------------------------------------------------ */

/** La tariffa che vale per una voce: la sua, altrimenti quella del cliente, altrimenti nessuna. */
export function tariffaVoce(voce: Pick<VoceOre, "tariffa">, cliente: Pick<Cliente, "tariffa"> | null | undefined): number | null {
  return voce.tariffa ?? cliente?.tariffa ?? null;
}

/** Importo di una durata a una tariffa, come una riga dello strumento fattura. Null senza tariffa. */
export function importoOre(minuti: number, tariffa: number | null): number | null {
  if (tariffa === null) return null;
  return calcolaRiga({
    id: "",
    descrizione: "",
    quantita: quantitaOre(minuti),
    unita: "h",
    prezzo: prezzoTesto(tariffa),
    aliquota: "normale",
  }).importo;
}

/* ------------------------------------------------------------------ */
/* Mesi                                                                */
/* ------------------------------------------------------------------ */

const NOMI_MESI = [
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

/** true se è un mese AAAA-MM tra il 2000 e il 2100. */
export function meseValido(valore: unknown): valore is Mese {
  if (typeof valore !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(valore)) return false;
  const anno = Number(valore.slice(0, 4));
  return anno >= 2000 && anno <= 2100;
}

/** Il mese di una data: 2026-10-19 → 2026-10. */
export function meseDi(data: string): Mese {
  return data.slice(0, 7);
}

/** Primo e ultimo giorno del mese: 2026-02 → 2026-02-01 … 2026-02-28. */
export function intervalloMese(mese: Mese): { inizio: string; fine: string } {
  const [anno, numero] = [Number(mese.slice(0, 4)), Number(mese.slice(5, 7))];
  const giorni = new Date(Date.UTC(anno, numero, 0)).getUTCDate();
  return { inizio: `${mese}-01`, fine: `${mese}-${String(giorni).padStart(2, "0")}` };
}

/** Il mese prima (-1) o dopo (+1): 2026-01 - 1 → 2025-12. */
export function spostaMese(mese: Mese, delta: number): Mese {
  const indice = Number(mese.slice(0, 4)) * 12 + Number(mese.slice(5, 7)) - 1 + delta;
  return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, "0")}`;
}

/** 2026-10 → «ottobre 2026». */
export function nomeMese(mese: Mese): string {
  return `${NOMI_MESI[Number(mese.slice(5, 7)) - 1]} ${mese.slice(0, 4)}`;
}

/** Mesi con ore non ancora fatturate e i loro minuti, dal più recente. */
export function mesiDaFatturare(voci: readonly Pick<VoceOre, "data" | "minuti">[]): { mese: Mese; minuti: number }[] {
  const perMese = new Map<Mese, number>();
  for (const v of voci) perMese.set(meseDi(v.data), (perMese.get(meseDi(v.data)) ?? 0) + v.minuti);
  return [...perMese.entries()].map(([mese, minuti]) => ({ mese, minuti })).sort((a, b) => b.mese.localeCompare(a.mese));
}

/* ------------------------------------------------------------------ */
/* Riepilogo del mese per cliente                                      */
/* ------------------------------------------------------------------ */

export type Totali = {
  voci: number;
  minuti: number;
  /** Somma degli importi delle voci con una tariffa. */
  importo: number;
  /** Voci senza tariffa (né loro né del cliente): non contano nell'importo. */
  senzaTariffa: number;
};

export type GruppoCliente = {
  cliente: Cliente;
  /** Dalla più recente. */
  voci: VoceOre[];
  totale: Totali;
  daFatturare: Totali;
  /** Giorni in cui sono state fatturate le voci di questo mese, dal più recente. */
  fatturateIl: string[];
};

export type RiepilogoMese = {
  gruppi: GruppoCliente[];
  totale: Totali;
  daFatturare: Totali;
};

function totali(voci: readonly VoceOre[], cliente: Cliente | null): Totali {
  let centesimi = 0;
  let senzaTariffa = 0;
  let minuti = 0;
  for (const v of voci) {
    minuti += v.minuti;
    const importo = importoOre(v.minuti, tariffaVoce(v, cliente));
    if (importo === null) senzaTariffa++;
    else centesimi += inCentesimi(importo);
  }
  return { voci: voci.length, minuti, importo: daCentesimi(centesimi), senzaTariffa };
}

function somma(a: Totali, b: Totali): Totali {
  return {
    voci: a.voci + b.voci,
    minuti: a.minuti + b.minuti,
    importo: daCentesimi(inCentesimi(a.importo) + inCentesimi(b.importo)),
    senzaTariffa: a.senzaTariffa + b.senzaTariffa,
  };
}

const VUOTO: Totali = { voci: 0, minuti: 0, importo: 0, senzaTariffa: 0 };

/** Dalla più recente; a pari data, l'ordine resta quello ricevuto. */
function perData(a: VoceOre, b: VoceOre) {
  return b.data.localeCompare(a.data);
}

/**
 * Le voci di un mese raggruppate per cliente (in ordine di nome), con le ore,
 * l'importo e quanto resta da fatturare. Le voci di clienti che non ci sono
 * più si ignorano.
 */
export function riepilogoMese(voci: readonly VoceOre[], clienti: readonly Cliente[]): RiepilogoMese {
  const perCliente = new Map<string, VoceOre[]>();
  for (const v of voci) {
    const elenco = perCliente.get(v.clienteId);
    if (elenco) elenco.push(v);
    else perCliente.set(v.clienteId, [v]);
  }
  const gruppi: GruppoCliente[] = [];
  for (const cliente of clienti) {
    const sue = perCliente.get(cliente.id);
    if (!sue) continue;
    const ordinate = [...sue].sort(perData);
    const fatturate = new Set(ordinate.flatMap((v) => (v.fatturataIl ? [v.fatturataIl] : [])));
    gruppi.push({
      cliente,
      voci: ordinate,
      totale: totali(ordinate, cliente),
      daFatturare: totali(
        ordinate.filter((v) => !v.fatturataIl),
        cliente,
      ),
      fatturateIl: [...fatturate].sort((a, b) => b.localeCompare(a)),
    });
  }
  gruppi.sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome, "it", { sensitivity: "base" }));
  return {
    gruppi,
    totale: gruppi.reduce((t, g) => somma(t, g.totale), VUOTO),
    daFatturare: gruppi.reduce((t, g) => somma(t, g.daFatturare), VUOTO),
  };
}

/** Clienti in ordine di nome, come nella rubrica. */
export function clientiInOrdine<T extends Pick<Cliente, "nome">>(clienti: readonly T[]): T[] {
  return [...clienti].sort((a, b) => a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }));
}
