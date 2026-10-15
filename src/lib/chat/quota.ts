import { FUSO_ORARIO } from "./formato";
import type { Piano, QuotaPubblica } from "./tipi";

/**
 * Domande alla chat incluse nel piano gratuito, per mese di calendario (ora di Zurigo).
 * Lo stesso numero è in public.prenota_domanda (supabase/migrations): cambiali insieme.
 */
export const DOMANDE_GRATIS_AL_MESE = 10;

export type ProfiloPiano = { piano: string | null; piano_scade_il: string | null };

export type Quota = {
  piano: Piano;
  illimitata: boolean;
  limite: number | null;
  usate: number;
  rimanenti: number | null;
  esaurita: boolean;
  /** Inizio del mese corrente e del successivo, nell'ora di Zurigo. */
  inizioMese: Date;
  rinnovo: Date;
  scadenzaPiano: Date | null;
};

const PIANI: readonly Piano[] = ["gratis", "avvio", "accompagnamento", "partner"];

const formatoParti = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO_ORARIO,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** Anno, mese (1-12) e ora locale di un istante a Zurigo. */
function partiZurigo(istante: Date) {
  const valori: Record<string, number> = {};
  for (const parte of formatoParti.formatToParts(istante)) {
    if (parte.type !== "literal") valori[parte.type] = Number(parte.value);
  }
  return {
    anno: valori.year ?? 1970,
    mese: valori.month ?? 1,
    giorno: valori.day ?? 1,
    ora: valori.hour ?? 0,
    minuto: valori.minute ?? 0,
    secondo: valori.second ?? 0,
  };
}

/** Differenza in millisecondi tra l'ora di Zurigo e UTC in un dato istante (+1 h o +2 h). */
function scartoZurigo(istante: Date): number {
  const p = partiZurigo(istante);
  const comeSeFosseUtc = Date.UTC(p.anno, p.mese - 1, p.giorno, p.ora, p.minuto, p.secondo);
  return comeSeFosseUtc - Math.floor(istante.getTime() / 1000) * 1000;
}

/** Istante della mezzanotte del primo giorno del mese (mese 1-12, anche fuori intervallo) a Zurigo. */
function primoDelMeseZurigo(anno: number, mese: number): Date {
  const mezzanotteUtc = Date.UTC(anno, mese - 1, 1);
  const stima = mezzanotteUtc - scartoZurigo(new Date(mezzanotteUtc));
  // Seconda passata: lo scarto giusto è quello dell'istante trovato (ora legale o solare).
  return new Date(mezzanotteUtc - scartoZurigo(new Date(stima)));
}

/** Inizio del mese di calendario in corso, nell'ora di Zurigo. */
export function inizioMese(ora: Date): Date {
  const { anno, mese } = partiZurigo(ora);
  return primoDelMeseZurigo(anno, mese);
}

/** Inizio del mese di calendario successivo, nell'ora di Zurigo. */
export function inizioMeseSuccessivo(ora: Date): Date {
  const { anno, mese } = partiZurigo(ora);
  return primoDelMeseZurigo(anno, mese + 1);
}

/**
 * Il piano che vale adesso. "avvio" vale fino a `piano_scade_il`, poi si
 * torna a "gratis" (senza data di scadenza resta valido). Valori sconosciuti
 * o mancanti valgono come "gratis".
 */
export function pianoEffettivo(profilo: ProfiloPiano | null, ora: Date): Piano {
  const piano = PIANI.find((p) => p === profilo?.piano) ?? "gratis";
  if (piano === "avvio" && profilo?.piano_scade_il) {
    const scadenza = new Date(profilo.piano_scade_il);
    if (!Number.isNaN(scadenza.getTime()) && scadenza.getTime() <= ora.getTime()) return "gratis";
  }
  return piano;
}

/** Calcola la quota del mese dato il profilo e le domande già fatte nel mese corrente. */
export function calcolaQuota(profilo: ProfiloPiano | null, usate: number, ora: Date): Quota {
  const piano = pianoEffettivo(profilo, ora);
  const illimitata = piano !== "gratis";
  const limite = illimitata ? null : DOMANDE_GRATIS_AL_MESE;
  const rimanenti = limite === null ? null : Math.max(0, limite - usate);
  const scadenza = piano === "avvio" && profilo?.piano_scade_il ? new Date(profilo.piano_scade_il) : null;
  return {
    piano,
    illimitata,
    limite,
    usate,
    rimanenti,
    esaurita: rimanenti === 0,
    inizioMese: inizioMese(ora),
    rinnovo: inizioMeseSuccessivo(ora),
    scadenzaPiano: scadenza && !Number.isNaN(scadenza.getTime()) ? scadenza : null,
  };
}

/** Data AAAA-MM-GG di un istante, nell'ora di Zurigo. */
function dataZurigo(istante: Date): string {
  const { anno, mese, giorno } = partiZurigo(istante);
  return `${anno}-${String(mese).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
}

/** La parte della quota che si può mandare al browser. */
export function quotaPubblica(quota: Quota): QuotaPubblica {
  return {
    piano: quota.piano,
    illimitata: quota.illimitata,
    limite: quota.limite,
    rimanenti: quota.rimanenti,
    rinnovo_il: dataZurigo(quota.rinnovo),
    piano_scade_il: quota.scadenzaPiano ? dataZurigo(quota.scadenzaPiano) : null,
  };
}
