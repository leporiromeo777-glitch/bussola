/**
 * Numeri e importi per gli strumenti: lettura di quello che scrive l'utente,
 * arrotondamenti e formato svizzero. Gli importi si calcolano in franchi con
 * due decimali; per sommare righe di fattura si usano i centesimi interi.
 */

const SEPARATORI_MIGLIAIA = /['’‘\s  ]/g;

/**
 * Legge un numero scritto a mano: `1'200`, `1 200`, `1200.50`, `1200,50`,
 * `1.200,50`, `CHF 80`, `8,1%`. Un solo punto seguito da esattamente 3 cifre
 * vale come separatore delle migliaia, come si scrive spesso in Ticino:
 * `1.500` = 1500, `60.000` = 60000 (ma `0.125` resta 0.125 e `1.50` resta
 * 1.5). Restituisce null se il campo è vuoto o non è un numero.
 */
export function leggiNumero(testo: string | null | undefined): number | null {
  if (testo == null) return null;
  let t = testo.trim().replace(/^chf/i, "").replace(/%$/, "").replace(SEPARATORI_MIGLIAIA, "");
  if (t === "" || t === "-" || t === "+") return null;
  // Segno meno tipografico.
  t = t.replace(/^[−–]/, "-");

  const ultimaVirgola = t.lastIndexOf(",");
  const ultimoPunto = t.lastIndexOf(".");
  if (ultimaVirgola >= 0 && ultimoPunto >= 0) {
    // Entrambi: l'ultimo è il separatore dei decimali, l'altro delle migliaia.
    const decimale = ultimaVirgola > ultimoPunto ? "," : ".";
    const migliaia = decimale === "," ? "." : ",";
    t = t.split(migliaia).join("").replace(decimale, ".");
  } else if (ultimaVirgola >= 0) {
    if (t.indexOf(",") !== ultimaVirgola) return null;
    t = t.replace(",", ".");
  } else if (ultimoPunto >= 0 && t.indexOf(".") !== ultimoPunto) {
    // 1.200.000: punti come separatori delle migliaia.
    if (!/^-?\d{1,3}(\.\d{3})+$/.test(t)) return null;
    t = t.split(".").join("");
  } else if (/^[-+]?[1-9]\d{0,2}\.\d{3}$/.test(t)) {
    // 1.500 o 60.000: un solo punto con 3 cifre dopo, all'italiana.
    t = t.replace(".", "");
  }

  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Arrotonda a `decimali` cifre (arrotondamento commerciale, 0,5 verso l'alto in valore assoluto). */
export function arrotonda(valore: number, decimali = 2): number {
  if (!Number.isFinite(valore)) return valore;
  const segno = valore < 0 ? -1 : 1;
  const assoluto = Math.abs(valore);
  const fattore = 10 ** decimali;
  // Oltre 10^15 i decimali non sono più rappresentabili.
  if (assoluto >= 1e15) return valore;
  // Numeri molto piccoli sono già in notazione esponenziale.
  if (String(assoluto).includes("e")) return (segno * Math.round(assoluto * fattore)) / fattore;
  // La notazione esponenziale evita gli errori di 1.005 * 100 = 100.49999…
  const spostato = Math.round(Number(`${assoluto}e${decimali}`));
  const risultato = Number(`${spostato}e-${decimali}`);
  return segno * (Number.isFinite(risultato) ? risultato : spostato / fattore);
}

/** Importo in centesimi interi (per somme esatte). */
export function inCentesimi(franchi: number): number {
  return Math.round(arrotonda(franchi, 2) * 100);
}

/** Da centesimi interi a franchi. */
export function daCentesimi(centesimi: number): number {
  return arrotonda(centesimi / 100, 2);
}

/** Arrotondamento svizzero ai 5 centesimi più vicini (per es. 10.02 → 10.00, 10.03 → 10.05). */
export function arrotonda5Centesimi(franchi: number): number {
  const c = inCentesimi(franchi);
  const segno = c < 0 ? -1 : 1;
  return daCentesimi(segno * Math.round(Math.abs(c) / 5) * 5);
}

/** Arrotonda per eccesso a un multiplo di `passo` (per es. tariffe al franco intero). */
export function arrotondaPerEccesso(valore: number, passo = 1): number {
  const n = arrotonda(valore / passo, 6);
  return arrotonda(Math.ceil(n) * passo, 2);
}

/** Numero alla svizzera senza valuta: 1'234 o 1'234.50. */
export function numeroSvizzero(valore: number, decimali: 0 | 1 | 2 = 0): string {
  const arrotondato = arrotonda(valore, decimali);
  const segno = arrotondato < 0 ? "-" : "";
  const [intero, dec] = Math.abs(arrotondato).toFixed(decimali).split(".");
  const conApostrofi = intero.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${segno}${conApostrofi}${dec ? `.${dec}` : ""}`;
}

/**
 * Numero non monetario (ore, settimane, percentuali scelte): al massimo
 * `decimali` cifre, virgola decimale, niente zeri inutili. 45 → "45", 7.5 → "7,5".
 */
export function numeroBreve(valore: number, decimali: 0 | 1 | 2 = 1): string {
  const testo = numeroSvizzero(valore, decimali);
  const pulito = testo.includes(".") ? testo.replace(/0+$/, "").replace(/\.$/, "") : testo;
  return pulito.replace(".", ",");
}

/** Importo con valuta: CHF 1'234.50 (o EUR). Arrotonda prima di formattare. */
export function importo(valore: number, decimali: 0 | 2 = 2, valuta = "CHF"): string {
  const testo = numeroSvizzero(valore, decimali);
  return testo.startsWith("-") ? `-${valuta} ${testo.slice(1)}` : `${valuta} ${testo}`;
}

/** Limita un numero a un intervallo. */
export function limita(valore: number, minimo: number, massimo: number): number {
  return Math.min(massimo, Math.max(minimo, valore));
}
