/**
 * Regole della QR-fattura svizzera (linee guida SIX 2.3) per la sezione
 * pagamento: IBAN e QR-IBAN, riferimento QR (QRR, modulo 10 ricorsivo),
 * Creditor Reference (SCOR, ISO 11649, modulo 97-10), indirizzi strutturati
 * (tipo "S"), importo e caratteri ammessi.
 *
 * La validazione è nostra e in italiano; swissqrbill disegna poi la sezione.
 */
import { datiStrumenti } from "@/data/svizzera";
import { arrotonda } from "./numeri";

export type TipoRiferimento = "QRR" | "SCOR" | "NON";
export type Valuta = "CHF" | "EUR";

/** Toglie spazi e mette in maiuscolo. */
export function normalizzaIban(testo: string): string {
  return testo.replace(/[\s ]/g, "").toUpperCase();
}

/** Resto della divisione per 97 di una stringa di cifre e lettere (A=10 … Z=35). */
export function mod97(testo: string): number {
  let resto = 0;
  for (const c of testo.toUpperCase()) {
    const codice = c.charCodeAt(0);
    const valore = codice >= 65 && codice <= 90 ? String(codice - 55) : c;
    for (const cifra of valore) {
      if (cifra < "0" || cifra > "9") return -1;
      resto = (resto * 10 + Number(cifra)) % 97;
    }
  }
  return resto;
}

/** IBAN valido secondo la struttura e la cifra di controllo modulo 97 (qualsiasi paese). */
export function ibanValido(testo: string): boolean {
  const iban = normalizzaIban(testo);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  return mod97(iban.slice(4) + iban.slice(0, 4)) === 1;
}

/** QR-IBAN: IBAN CH/LI con QR-IID (posizioni 5-9) tra 30000 e 31999. */
export function eQrIban(testo: string): boolean {
  const iban = normalizzaIban(testo);
  if (!/^(CH|LI)\d{7}[A-Z0-9]{12}$/.test(iban)) return false;
  const iid = Number(iban.slice(4, 9));
  const { da, a } = datiStrumenti.qrIid.valore;
  return iid >= da && iid <= a;
}

/** IBAN a gruppi di 4: CH93 0076 2011 6238 5295 7. */
export function formattaIban(testo: string): string {
  return normalizzaIban(testo).replace(/(.{4})(?=.)/g, "$1 ");
}

export type EsitoIban = { ok: true; iban: string; qrIban: boolean } | { ok: false; errore: string };

export function validaIbanPerQr(testo: string): EsitoIban {
  const iban = normalizzaIban(testo);
  if (iban === "") return { ok: false, errore: "Scrivi l'IBAN del conto su cui vuoi ricevere i pagamenti." };
  if (!/^(CH|LI)/.test(iban)) {
    return { ok: false, errore: "Nella QR-fattura si possono usare solo conti svizzeri o del Liechtenstein (IBAN che inizia con CH o LI)." };
  }
  if (!/^(CH|LI)\d{2}[A-Z0-9]{17}$/.test(iban)) {
    return { ok: false, errore: "Un IBAN svizzero ha 21 caratteri, per esempio CH93 0076 2011 6238 5295 7." };
  }
  if (!ibanValido(iban)) return { ok: false, errore: "L'IBAN non è valido: controlla di averlo copiato senza errori." };
  return { ok: true, iban, qrIban: eQrIban(iban) };
}

// --- Riferimento QR (QRR): 27 cifre, l'ultima è il controllo modulo 10 ricorsivo.

const TABELLA_MOD10 = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];

/** Cifra di controllo modulo 10 ricorsivo (linee guida SIX, allegato B). */
export function cifraControlloMod10(cifre: string): number {
  let riporto = 0;
  for (const c of cifre) riporto = TABELLA_MOD10[(riporto + Number(c)) % 10];
  return (10 - riporto) % 10;
}

export function riferimentoQrValido(testo: string): boolean {
  const r = testo.replace(/\s/g, "");
  if (!/^\d{27}$/.test(r)) return false;
  return cifraControlloMod10(r.slice(0, 26)) === Number(r[26]);
}

/**
 * Crea un riferimento QR dalle cifre di un testo (per es. il numero della
 * fattura "F-2026-007" → …2026007 + controllo). Null se non ci sono cifre o
 * se sono più di 26.
 */
export function creaRiferimentoQr(base: string): string | null {
  const cifre = base.replace(/\D/g, "");
  if (cifre === "" || cifre.length > 26) return null;
  const corpo = cifre.padStart(26, "0");
  return `${corpo}${cifraControlloMod10(corpo)}`;
}

/** 21 00000 00003 13947 14300 09017 */
export function formattaRiferimentoQr(testo: string): string {
  const r = testo.replace(/\s/g, "");
  return `${r.slice(0, 2)} ${r.slice(2).replace(/(.{5})(?=.)/g, "$1 ")}`.trim();
}

// --- Creditor Reference (SCOR, ISO 11649): "RF" + 2 cifre di controllo + fino a 21 caratteri.

export function riferimentoScorValido(testo: string): boolean {
  const r = testo.replace(/\s/g, "").toUpperCase();
  if (!/^RF\d{2}[A-Z0-9]{1,21}$/.test(r)) return false;
  return mod97(r.slice(4) + r.slice(0, 4)) === 1;
}

/** Crea un Creditor Reference da lettere e cifre di un testo. Null se vuoto o più di 21 caratteri. */
export function creaRiferimentoScor(base: string): string | null {
  const corpo = base.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (corpo === "" || corpo.length > 21) return null;
  const controllo = 98 - mod97(`${corpo}RF00`);
  return `RF${String(controllo).padStart(2, "0")}${corpo}`;
}

/** RF18 5390 0754 7034 */
export function formattaRiferimentoScor(testo: string): string {
  return testo.replace(/\s/g, "").toUpperCase().replace(/(.{4})(?=.)/g, "$1 ");
}

export function formattaRiferimento(tipo: TipoRiferimento, valore: string): string {
  if (tipo === "QRR") return formattaRiferimentoQr(valore);
  if (tipo === "SCOR") return formattaRiferimentoScor(valore);
  return "";
}

// --- Caratteri e indirizzi.

/** Caratteri ammessi nel codice QR (linee guida SIX, cap. 4.1.1). */
const CARATTERE_AMMESSO = /[ -~ -ſȘ-ț€]/u;

/** Sostituisce i caratteri tipografici più comuni con quelli ammessi (’ → ', “ → ", – → -). */
export function pulisciTestoQr(testo: string): string {
  return testo
    .replace(/[’‘‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[–—‒−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\t\r\n]+/g, " ");
}

/** Caratteri non ammessi rimasti dopo la pulizia (senza doppioni). */
export function caratteriNonAmmessi(testo: string): string[] {
  const fuori = new Set<string>();
  for (const c of pulisciTestoQr(testo)) if (!CARATTERE_AMMESSO.test(c)) fuori.add(c);
  return [...fuori];
}

export type IndirizzoStrutturato = {
  nome: string;
  via: string;
  numero: string;
  npa: string;
  localita: string;
  /** Codice ISO a 2 lettere, per es. CH. */
  paese: string;
};

export type CampoIndirizzo = keyof IndirizzoStrutturato;

const LUNGHEZZE: Record<CampoIndirizzo, number> = { nome: 70, via: 70, numero: 16, npa: 16, localita: 35, paese: 2 };
const NOMI_CAMPI: Record<CampoIndirizzo, string> = {
  nome: "il nome",
  via: "la via",
  numero: "il numero civico",
  npa: "il NPA",
  localita: "la località",
  paese: "il paese",
};

/**
 * Indirizzo strutturato (tipo "S"): nome, NPA, località e paese obbligatori;
 * via e numero facoltativi (linee guida SIX, cap. 4.3.1).
 */
export function validaIndirizzoQr(ind: IndirizzoStrutturato): Partial<Record<CampoIndirizzo, string>> {
  const errori: Partial<Record<CampoIndirizzo, string>> = {};
  for (const campo of ["nome", "npa", "localita", "paese"] as const) {
    if (ind[campo].trim() === "") errori[campo] = `Manca ${NOMI_CAMPI[campo]}.`;
  }
  for (const campo of Object.keys(LUNGHEZZE) as CampoIndirizzo[]) {
    const valore = pulisciTestoQr(ind[campo].trim());
    if (!errori[campo] && valore.length > LUNGHEZZE[campo]) {
      errori[campo] = `Al massimo ${LUNGHEZZE[campo]} caratteri.`;
    }
    const fuori = caratteriNonAmmessi(valore);
    if (!errori[campo] && fuori.length > 0) {
      errori[campo] = `Carattere non ammesso nella QR-fattura: ${fuori.join(" ")}`;
    }
  }
  if (!errori.paese && !/^[A-Za-z]{2}$/.test(ind.paese.trim())) errori.paese = "Usa il codice a 2 lettere, per esempio CH.";
  return errori;
}

/** L'indirizzo è compilato abbastanza da finire nella QR-fattura? */
export function indirizzoCompleto(ind: IndirizzoStrutturato): boolean {
  return Object.keys(validaIndirizzoQr(ind)).length === 0;
}

export function validaImportoQr(importo: number): string | null {
  const { minimo, massimo } = datiStrumenti.importoQr.valore;
  if (!Number.isFinite(importo) || arrotonda(importo, 2) < minimo) {
    return "Nella QR-fattura l'importo deve essere di almeno 0.01.";
  }
  if (arrotonda(importo, 2) > massimo) return "Importo troppo alto per la QR-fattura (al massimo 999'999'999.99).";
  return null;
}

// --- Sezione pagamento completa.

export type DatiPagamentoQr = {
  iban: string;
  riferimento: { tipo: TipoRiferimento; valore: string };
  importo: number;
  valuta: Valuta;
  creditore: IndirizzoStrutturato;
  /** Facoltativo: se manca, la sezione mostra un riquadro vuoto da compilare a mano. */
  debitore?: IndirizzoStrutturato;
  messaggio?: string;
};

/** Dati nel formato di swissqrbill (`Data`). */
export type DatiSwissQrBill = {
  currency: Valuta;
  amount: number;
  reference?: string;
  message?: string;
  creditor: { account: string; name: string; address: string; buildingNumber?: string; zip: string; city: string; country: string };
  debtor?: { name: string; address: string; buildingNumber?: string; zip: string; city: string; country: string };
};

export type ErroreQr = { campo: string; messaggio: string };

function perSwissQrBill(ind: IndirizzoStrutturato) {
  const pulito = (t: string) => pulisciTestoQr(t.trim());
  const numero = pulito(ind.numero);
  return {
    name: pulito(ind.nome),
    address: pulito(ind.via),
    ...(numero ? { buildingNumber: numero } : {}),
    zip: pulito(ind.npa),
    city: pulito(ind.localita),
    country: ind.paese.trim().toUpperCase(),
  };
}

export function validaPagamentoQr(d: DatiPagamentoQr): { ok: true; dati: DatiSwissQrBill } | { ok: false; errori: ErroreQr[] } {
  const errori: ErroreQr[] = [];

  const iban = validaIbanPerQr(d.iban);
  if (!iban.ok) errori.push({ campo: "iban", messaggio: iban.errore });

  if (iban.ok) {
    const { tipo, valore } = d.riferimento;
    if (iban.qrIban) {
      if (tipo !== "QRR") {
        errori.push({ campo: "riferimento", messaggio: "Con un QR-IBAN serve il riferimento QR (27 cifre)." });
      } else if (!riferimentoQrValido(valore)) {
        errori.push({ campo: "riferimento", messaggio: "Il riferimento QR non è valido: 27 cifre, l'ultima di controllo." });
      }
    } else if (tipo === "QRR") {
      errori.push({
        campo: "riferimento",
        messaggio: "Il riferimento QR si usa solo con un QR-IBAN: con un IBAN normale usa il Creditor Reference (RF) o nessun riferimento.",
      });
    } else if (tipo === "SCOR" && !riferimentoScorValido(valore)) {
      errori.push({ campo: "riferimento", messaggio: "Il Creditor Reference non è valido (formato RF + 2 cifre + fino a 21 caratteri)." });
    }
  }

  if (!["CHF", "EUR"].includes(d.valuta)) errori.push({ campo: "valuta", messaggio: "La QR-fattura accetta solo CHF o EUR." });
  const erroreImporto = validaImportoQr(d.importo);
  if (erroreImporto) errori.push({ campo: "importo", messaggio: erroreImporto });

  for (const [campo, messaggio] of Object.entries(validaIndirizzoQr(d.creditore))) {
    errori.push({ campo: `creditore.${campo}`, messaggio });
  }
  if (d.debitore) {
    for (const [campo, messaggio] of Object.entries(validaIndirizzoQr(d.debitore))) {
      errori.push({ campo: `debitore.${campo}`, messaggio });
    }
  }

  const messaggio = d.messaggio ? pulisciTestoQr(d.messaggio.trim()) : "";
  if (messaggio.length > 140) errori.push({ campo: "messaggio", messaggio: "Il messaggio può avere al massimo 140 caratteri." });
  if (caratteriNonAmmessi(messaggio).length > 0) {
    errori.push({ campo: "messaggio", messaggio: `Carattere non ammesso: ${caratteriNonAmmessi(messaggio).join(" ")}` });
  }

  if (errori.length > 0 || !iban.ok) return { ok: false, errori };

  const riferimento = d.riferimento.tipo === "NON" ? undefined : d.riferimento.valore.replace(/\s/g, "").toUpperCase();
  return {
    ok: true,
    dati: {
      currency: d.valuta,
      amount: arrotonda(d.importo, 2),
      ...(riferimento ? { reference: riferimento } : {}),
      ...(messaggio ? { message: messaggio } : {}),
      creditor: { account: iban.iban, ...perSwissQrBill(d.creditore) },
      ...(d.debitore ? { debtor: perSwissQrBill(d.debitore) } : {}),
    },
  };
}
