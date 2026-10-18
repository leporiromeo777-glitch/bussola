/**
 * «I tuoi conti»: importi e date. Nel database gli importi sono centesimi
 * interi; nelle API e nella pagina sono franchi con due decimali.
 * Logica pura, senza browser né Node.
 */
import { CATEGORIE, type CategoriaId, type TipoMovimento } from "./tipi";

/** Franchi → centesimi interi (48.5 → 4850). Arrotonda al centesimo. */
export function inCentesimi(franchi: number): number {
  if (!Number.isFinite(franchi)) throw new RangeError("importo non valido");
  // Prima a 2 decimali con la notazione esponenziale: 1.005 → 1.01, non 1.00.
  const segno = franchi < 0 ? -1 : 1;
  const assoluto = Math.abs(franchi);
  // Numeri molto piccoli o grandi sono già in notazione esponenziale.
  const centesimi = String(assoluto).includes("e") ? Math.round(assoluto * 100) : Math.round(Number(`${assoluto}e2`));
  return segno * centesimi;
}

/** Centesimi → franchi (4850 → 48.5). */
export function daCentesimi(centesimi: number | string | bigint): number {
  const n = typeof centesimi === "number" ? centesimi : Number(centesimi);
  return Math.round(n) / 100;
}

/** true se il numero ha al massimo due decimali (48.5, 48.55; non 48.555). */
export function haDueDecimali(franchi: number): boolean {
  return Number.isFinite(franchi) && Math.abs(inCentesimi(franchi) / 100 - franchi) < 1e-9;
}

/** Formato svizzero con due decimali: CHF 1'234.50. */
export function chf2(franchi: number): string {
  const segno = franchi < 0 ? "-" : "";
  const [intero, dec] = (Math.abs(inCentesimi(franchi)) / 100).toFixed(2).split(".");
  return `${segno}CHF ${intero.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${dec}`;
}

/* ------------------------------------------------------------------ */
/* Date                                                                */
/* ------------------------------------------------------------------ */

const FORMATO_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** true se è una data AAAA-MM-GG esistente (niente 31.02). */
export function dataIsoValida(iso: unknown): iso is string {
  if (typeof iso !== "string") return false;
  const parti = FORMATO_ISO.exec(iso);
  if (!parti) return false;
  const [anno, mese, giorno] = [Number(parti[1]), Number(parti[2]), Number(parti[3])];
  if (anno < 1900 || anno > 2200 || mese < 1 || mese > 12 || giorno < 1) return false;
  return giorno <= new Date(Date.UTC(anno, mese, 0)).getUTCDate();
}

/** Data ISO più (o meno) un numero di giorni: 2026-10-31 + 1 → 2026-11-01. */
export function aggiungiGiorni(iso: string, giorni: number): string {
  const [anno, mese, giorno] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(anno, mese - 1, giorno + giorni)).toISOString().slice(0, 10);
}

/** Giorni da `da` ad `a` (date ISO): positivi se `a` viene dopo. */
export function giorniTra(da: string, a: string): number {
  const utc = (iso: string) => {
    const [anno, mese, giorno] = iso.slice(0, 10).split("-").map(Number);
    return Date.UTC(anno, mese - 1, giorno);
  };
  return Math.round((utc(a) - utc(da)) / 86_400_000);
}

/** Data di oggi a Zurigo, AAAA-MM-GG. */
export function oggiZurigo(adesso: Date = new Date()): string {
  // en-CA scrive le date come AAAA-MM-GG.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(adesso);
}

/** 2026-10-19 → 19.10.2026 */
export function dataSvizzeraBreve(iso: string): string {
  const [a, m, g] = iso.slice(0, 10).split("-");
  return `${g}.${m}.${a}`;
}

/** Anno valido per i conti (dal parametro ?anno=), altrimenti null. */
export function leggiAnno(valore: unknown): number | null {
  if (typeof valore !== "string" || !/^\d{4}$/.test(valore)) return null;
  const anno = Number(valore);
  return anno >= 2000 && anno <= 2100 ? anno : null;
}

/* ------------------------------------------------------------------ */
/* Categorie                                                           */
/* ------------------------------------------------------------------ */

const PER_ID = new Map<string, (typeof CATEGORIE)[number]>(CATEGORIE.map((c) => [c.id, c]));

export function eCategoria(valore: unknown): valore is CategoriaId {
  return typeof valore === "string" && PER_ID.has(valore);
}

export function tipoCategoria(id: CategoriaId): TipoMovimento {
  return PER_ID.get(id)!.tipo;
}

export function etichettaCategoria(id: CategoriaId): string {
  return PER_ID.get(id)?.etichetta ?? id;
}

export function categoriePer(tipo: TipoMovimento) {
  return CATEGORIE.filter((c) => c.tipo === tipo);
}

/** Categoria di ripiego per un tipo: «Altre entrate» o «Altre uscite». */
export function categoriaPredefinita(tipo: TipoMovimento): CategoriaId {
  return tipo === "entrata" ? "altre_entrate" : "altre_uscite";
}

/** La categoria se va bene per il tipo, altrimenti quella di ripiego. */
export function categoriaPerTipo(categoria: unknown, tipo: TipoMovimento): CategoriaId {
  return eCategoria(categoria) && tipoCategoria(categoria) === tipo ? categoria : categoriaPredefinita(tipo);
}
