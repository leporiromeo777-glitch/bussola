/**
 * Il vestito della mascotte (il compagno di viaggio del percorso): cappello,
 * occhiali e sciarpa scelti dall'utente. Si salva solo nel browser.
 */

export const CAPPELLI = {
  nessuno: "Nessuno",
  "cappellino-nero": "Cappellino nero",
  "cappellino-beige": "Cappellino beige",
  pescatore: "Cappello da pescatore",
  "berretto-ruggine": "Berretto ruggine",
  "berretto-blu": "Berretto blu",
} as const;

export const OCCHIALI = {
  nessuno: "Nessuno",
  sole: "Da sole",
  tondi: "Tondi colorati",
  vista: "Da vista",
} as const;

export const SCIARPE = {
  nessuna: "Nessuna",
  verde: "Verde",
  beige: "Beige",
} as const;

export type Cappello = keyof typeof CAPPELLI;
export type Occhiali = keyof typeof OCCHIALI;
export type Sciarpa = keyof typeof SCIARPE;

export type Vestito = { cappello: Cappello; occhiali: Occhiali; sciarpa: Sciarpa };

export const VESTITO_PREDEFINITO: Vestito = { cappello: "nessuno", occhiali: "nessuno", sciarpa: "nessuna" };

export const CHIAVE_VESTITO = "bussola:mascotte:vestito";

function scelta<T extends string>(valore: unknown, ammessi: Record<T, string>, predefinito: T): T {
  return typeof valore === "string" && Object.hasOwn(ammessi, valore) ? (valore as T) : predefinito;
}

/** Vestito salvato nel browser: i valori sconosciuti tornano a quelli predefiniti. */
export function analizzaVestito(grezzo: string | null): Vestito {
  if (!grezzo) return VESTITO_PREDEFINITO;
  try {
    const dati: unknown = JSON.parse(grezzo);
    if (!dati || typeof dati !== "object") return VESTITO_PREDEFINITO;
    const { cappello, occhiali, sciarpa } = dati as Record<string, unknown>;
    return {
      cappello: scelta(cappello, CAPPELLI, VESTITO_PREDEFINITO.cappello),
      occhiali: scelta(occhiali, OCCHIALI, VESTITO_PREDEFINITO.occhiali),
      sciarpa: scelta(sciarpa, SCIARPE, VESTITO_PREDEFINITO.sciarpa),
    };
  } catch {
    return VESTITO_PREDEFINITO;
  }
}

/** Descrizione per lettori di schermo, per esempio «con berretto blu e occhiali da sole». */
export function descriviVestito(v: Vestito): string {
  const parti: string[] = [];
  if (v.cappello !== "nessuno") parti.push(CAPPELLI[v.cappello].toLowerCase());
  if (v.occhiali !== "nessuno") parti.push(`occhiali ${OCCHIALI[v.occhiali].toLowerCase()}`);
  if (v.sciarpa !== "nessuna") parti.push(`sciarpa ${SCIARPE[v.sciarpa].toLowerCase()}`);
  if (parti.length === 0) return "senza accessori";
  const ultima = parti.pop();
  return `con ${parti.length ? `${parti.join(", ")} e ` : ""}${ultima}`;
}
