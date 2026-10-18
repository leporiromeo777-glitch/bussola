/**
 * «Clienti e ore»: dalle righe del database (centesimi, snake_case) ai tipi
 * delle API (franchi, camelCase) e ritorno. Logica pura.
 */
import { daCentesimi, inCentesimi } from "@/lib/conti/importi";
import type { Cliente, VoceOre } from "./tipi";
import type { DatiCliente, DatiVoce, ModificaVoce } from "./validazione";

export const COLONNE_CLIENTE = "id, nome, via, numero, npa, localita, paese, email, tariffa_centesimi";
export const COLONNE_ORE = "id, cliente_id, data, minuti, descrizione, tariffa_centesimi, fatturata_il";

export type RigaCliente = {
  id: string;
  nome: string;
  via: string;
  numero: string;
  npa: string;
  localita: string;
  paese: string;
  email: string | null;
  tariffa_centesimi: number | string | null;
};

export type RigaOre = {
  id: string;
  cliente_id: string;
  data: string;
  minuti: number;
  descrizione: string;
  tariffa_centesimi: number | string | null;
  fatturata_il: string | null;
};

const franchi = (centesimi: number | string | null) => (centesimi === null ? null : daCentesimi(centesimi));
const centesimi = (franchi: number | null) => (franchi === null ? null : inCentesimi(franchi));

export function clienteDaRiga(r: RigaCliente): Cliente {
  return {
    id: r.id,
    nome: r.nome,
    via: r.via,
    numero: r.numero,
    npa: r.npa,
    localita: r.localita,
    paese: r.paese,
    email: r.email,
    tariffa: franchi(r.tariffa_centesimi),
  };
}

export function voceDaRiga(r: RigaOre): VoceOre {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    data: r.data.slice(0, 10),
    minuti: r.minuti,
    descrizione: r.descrizione,
    tariffa: franchi(r.tariffa_centesimi),
    fatturataIl: r.fatturata_il?.slice(0, 10) ?? null,
  };
}

/** Colonne di un cliente (nuovo o modificato): solo i campi presenti. */
export function colonneCliente(c: Partial<DatiCliente>): Record<string, unknown> {
  const riga: Record<string, unknown> = {};
  for (const campo of ["nome", "via", "numero", "npa", "localita", "paese", "email"] as const) {
    if (c[campo] !== undefined) riga[campo] = c[campo];
  }
  if (c.tariffa !== undefined) riga.tariffa_centesimi = centesimi(c.tariffa);
  return riga;
}

export function rigaNuovoCliente(userId: string, c: DatiCliente) {
  return { user_id: userId, ...colonneCliente(c) };
}

export function rigaNuovaVoce(userId: string, v: DatiVoce) {
  return {
    user_id: userId,
    cliente_id: v.clienteId,
    data: v.data,
    minuti: v.minuti,
    descrizione: v.descrizione,
    tariffa_centesimi: centesimi(v.tariffa),
  };
}

/** Colonne da aggiornare per una modifica a una voce. */
export function aggiornamentoVoce(m: ModificaVoce, adesso: string): Record<string, unknown> {
  const riga: Record<string, unknown> = { aggiornato_il: adesso };
  if (m.clienteId !== undefined) riga.cliente_id = m.clienteId;
  if (m.data !== undefined) riga.data = m.data;
  if (m.minuti !== undefined) riga.minuti = m.minuti;
  if (m.descrizione !== undefined) riga.descrizione = m.descrizione;
  if (m.tariffa !== undefined) riga.tariffa_centesimi = centesimi(m.tariffa);
  if (m.fatturataIl !== undefined) riga.fatturata_il = m.fatturataIl;
  return riga;
}
