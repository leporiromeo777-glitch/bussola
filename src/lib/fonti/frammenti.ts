import type { Blocco } from "./blocchi";

export type Frammento = { posizione: number; titolo_sezione: string | null; testo: string };

export type OpzioniFrammenti = {
  /** Sotto questa lunghezza un frammento continua anche oltre un titolo. */
  minimo?: number;
  /** Lunghezza a cui si cerca di chiudere il frammento. */
  obiettivo?: number;
  /** Lunghezza massima: oltre si divide anche un paragrafo, per frasi. */
  massimo?: number;
};

const PREDEFINITE = { minimo: 400, obiettivo: 1_000, massimo: 1_500 } satisfies Required<OpzioniFrammenti>;

/**
 * Divide i blocchi di una pagina in frammenti di circa 1'000-1'500 caratteri,
 * tagliando sui confini di titoli e paragrafi. Ogni frammento ricorda il
 * titolo più vicino che lo precede (`titolo_sezione`).
 */
export function dividiInFrammenti(blocchi: Blocco[], opzioni: OpzioniFrammenti = {}): Frammento[] {
  const { minimo, obiettivo, massimo } = { ...PREDEFINITE, ...opzioni };
  const frammenti: Frammento[] = [];
  let titoloCorrente: string | null = null;
  let sezione: string | null = null;
  let parti: string[] = [];
  let lunghezza = 0;

  const chiudi = () => {
    const testo = parti.join("\n").trim();
    if (testo) frammenti.push({ posizione: frammenti.length + 1, titolo_sezione: sezione, testo });
    parti = [];
    lunghezza = 0;
    sezione = titoloCorrente;
  };
  const aggiungi = (testo: string) => {
    if (parti.length === 0) sezione = titoloCorrente;
    parti.push(testo);
    lunghezza += testo.length + 1;
  };

  for (const blocco of blocchi) {
    if (blocco.tipo === "titolo") {
      if (lunghezza >= minimo) {
        titoloCorrente = blocco.testo;
        chiudi();
      } else if (parti.length > 0) {
        // Frammento ancora corto: il titolo entra nel testo e si continua.
        aggiungi(blocco.testo);
        if (lunghezza > massimo) chiudi();
        titoloCorrente = blocco.testo;
      } else {
        titoloCorrente = blocco.testo;
        sezione = blocco.testo;
      }
      continue;
    }

    const testo = blocco.tipo === "punto" ? `- ${blocco.testo}` : blocco.testo;
    for (const pezzo of spezza(testo, massimo)) {
      if (lunghezza > 0 && lunghezza + pezzo.length > massimo) chiudi();
      aggiungi(pezzo);
      if (lunghezza >= obiettivo) chiudi();
    }
  }
  chiudi();
  return frammenti;
}

/** Divide un testo troppo lungo per frasi; una frase enorme si taglia sugli spazi. */
export function spezza(testo: string, massimo: number): string[] {
  if (testo.length <= massimo) return [testo];
  const frasi = testo.split(/(?<=[.!?;])\s+(?=[\p{Lu}\d«"“(-])/u);
  const pezzi: string[] = [];
  let corrente = "";
  for (const frase of frasi.flatMap((f) => tagliaSuSpazi(f, massimo))) {
    if (corrente && corrente.length + 1 + frase.length > massimo) {
      pezzi.push(corrente);
      corrente = frase;
    } else {
      corrente = corrente ? `${corrente} ${frase}` : frase;
    }
  }
  if (corrente) pezzi.push(corrente);
  return pezzi;
}

function tagliaSuSpazi(frase: string, massimo: number): string[] {
  const pezzi: string[] = [];
  let resto = frase;
  while (resto.length > massimo) {
    const taglio = resto.lastIndexOf(" ", massimo);
    const punto = taglio > massimo / 2 ? taglio : massimo;
    pezzi.push(resto.slice(0, punto).trim());
    resto = resto.slice(punto).trim();
  }
  if (resto) pezzi.push(resto);
  return pezzi;
}
