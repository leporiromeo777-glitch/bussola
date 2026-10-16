/**
 * «I tuoi conti»: dalle righe del database (centesimi, snake_case) ai tipi
 * delle API (franchi, camelCase) e ritorno. Logica pura.
 */
import { daCentesimi, inCentesimi } from "./importi";
import { statoFattura } from "./riepilogo";
import type { CategoriaId, FatturaEmessa, Movimento, OrigineMovimento, StatoMovimento, TipoMovimento } from "./tipi";
import type { DatiLetti } from "./lettura";
import type { ModificaMovimento, NuovaFattura, NuovoMovimento } from "./validazione";

export const COLONNE_MOVIMENTO =
  "id, tipo, data, importo_centesimi, descrizione, controparte, categoria, stato, origine, fattura_id, documento_id, nota";
export const COLONNE_FATTURA = "id, numero, cliente, data, scadenza, importo_centesimi, pagata_il";

export type RigaMovimento = {
  id: string;
  tipo: TipoMovimento;
  data: string;
  importo_centesimi: number | string;
  descrizione: string;
  controparte: string | null;
  categoria: CategoriaId;
  stato: StatoMovimento;
  origine: OrigineMovimento;
  fattura_id: string | null;
  documento_id: string | null;
  nota: string | null;
};

export type RigaFattura = {
  id: string;
  numero: string;
  cliente: string;
  data: string;
  scadenza: string | null;
  importo_centesimi: number | string;
  pagata_il: string | null;
};

export function movimentoDaRiga(r: RigaMovimento): Movimento {
  return {
    id: r.id,
    tipo: r.tipo,
    data: r.data.slice(0, 10),
    importo: daCentesimi(r.importo_centesimi),
    descrizione: r.descrizione,
    controparte: r.controparte,
    categoria: r.categoria,
    stato: r.stato,
    origine: r.origine,
    fatturaId: r.fattura_id,
    documentoId: r.documento_id,
    nota: r.nota,
  };
}

export function fatturaDaRiga(r: RigaFattura, oggi: string): FatturaEmessa {
  const pagataIl = r.pagata_il?.slice(0, 10) ?? null;
  const scadenza = r.scadenza?.slice(0, 10) ?? null;
  return {
    id: r.id,
    numero: r.numero,
    cliente: r.cliente,
    data: r.data.slice(0, 10),
    scadenza,
    importo: daCentesimi(r.importo_centesimi),
    stato: statoFattura({ pagataIl, scadenza }, oggi),
    pagataIl,
  };
}

/** Riga da inserire per un movimento scritto a mano: già confermato. */
export function rigaNuovoMovimento(userId: string, m: NuovoMovimento) {
  return {
    user_id: userId,
    tipo: m.tipo,
    data: m.data,
    importo_centesimi: inCentesimi(m.importo),
    descrizione: m.descrizione,
    controparte: m.controparte,
    categoria: m.categoria,
    stato: "confermato" as const,
    origine: "manuale" as const,
  };
}

/** Riga da inserire per un movimento letto da foto o email: sempre da confermare. */
export function rigaMovimentoLetto(
  userId: string,
  dati: DatiLetti,
  origine: "foto" | "email",
  documentoId: string | null,
) {
  return {
    user_id: userId,
    tipo: dati.tipo,
    data: dati.data,
    importo_centesimi: inCentesimi(dati.importo),
    descrizione: dati.descrizione,
    controparte: dati.controparte,
    categoria: dati.categoria,
    stato: "da_confermare" as const,
    origine,
    documento_id: documentoId,
    nota: dati.nota,
  };
}

/** Colonne da aggiornare per una modifica (tipo e categoria già resi coerenti). */
export function aggiornamentoMovimento(
  modifica: ModificaMovimento,
  coerenti: { tipo: TipoMovimento; categoria: CategoriaId },
  adesso: string,
) {
  const riga: Record<string, unknown> = { tipo: coerenti.tipo, categoria: coerenti.categoria, aggiornato_il: adesso };
  if (modifica.stato) riga.stato = modifica.stato;
  if (modifica.data) riga.data = modifica.data;
  if (modifica.importo !== undefined) riga.importo_centesimi = inCentesimi(modifica.importo);
  if (modifica.descrizione !== undefined) riga.descrizione = modifica.descrizione;
  if (modifica.controparte !== undefined) riga.controparte = modifica.controparte;
  return riga;
}

export function rigaNuovaFattura(userId: string, f: NuovaFattura, adesso: string) {
  return {
    user_id: userId,
    numero: f.numero,
    cliente: f.cliente,
    data: f.data,
    scadenza: f.scadenza,
    importo_centesimi: inCentesimi(f.importo),
    riferimento: f.riferimento,
    aggiornato_il: adesso,
  };
}
