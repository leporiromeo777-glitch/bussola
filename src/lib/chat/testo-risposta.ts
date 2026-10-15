import type { BloccoRisposta, CitazioneMappata } from "./tipi";

export type Parte =
  | { tipo: "testo"; testo: string; grassetto: boolean }
  | { tipo: "citazioni"; citazioni: CitazioneMappata[] };

export type Elemento = { tipo: "paragrafo"; parti: Parte[] } | { tipo: "elenco"; punti: Parte[][] };

const SEGNO_PUNTO = /^\s*(?:[-*•]|\d{1,2}[.)])\s+/;
const SEGNO_TITOLO = /^\s*#{1,6}\s+/;

type Riga = Parte[];

/** Testo semplice di una risposta, senza numeri delle fonti (per la cronologia e i controlli). */
export function testoSemplice(risposta: BloccoRisposta[]): string {
  return risposta
    .map((b) => b.testo)
    .join("")
    .trim();
}

/**
 * Prepara una risposta per la pagina: unisce i blocchi (che Claude divide a
 * ogni citazione), riconosce paragrafi, elenchi puntati e **grassetto**, e
 * mette i numeri delle fonti subito dopo il testo citato. Niente HTML: il
 * risultato si disegna con elementi React, quindi il testo resta testo.
 */
export function strutturaRisposta(blocchi: BloccoRisposta[]): Elemento[] {
  const righe = dividiInRighe(blocchi);
  const elementi: Elemento[] = [];

  for (const riga of righe) {
    const testo = riga
      .map((p) => (p.tipo === "testo" ? p.testo : ""))
      .join("")
      .trim();
    const haCitazioni = riga.some((p) => p.tipo === "citazioni");
    if (!testo && !haCitazioni) continue;

    const primo = riga.find((p) => p.tipo === "testo");
    if (primo?.tipo === "testo" && SEGNO_PUNTO.test(primo.testo)) {
      primo.testo = primo.testo.replace(SEGNO_PUNTO, "");
      const punto = ripulisci(riga);
      const ultimo = elementi.at(-1);
      if (ultimo?.tipo === "elenco") ultimo.punti.push(punto);
      else elementi.push({ tipo: "elenco", punti: [punto] });
      continue;
    }
    if (primo?.tipo === "testo" && SEGNO_TITOLO.test(primo.testo)) {
      primo.testo = primo.testo.replace(SEGNO_TITOLO, "");
      for (const parte of riga) if (parte.tipo === "testo") parte.grassetto = true;
    }
    elementi.push({ tipo: "paragrafo", parti: ripulisci(riga) });
  }
  return elementi;
}

function dividiInRighe(blocchi: BloccoRisposta[]): Riga[] {
  const righe: Riga[] = [[]];
  let grassetto = false;

  for (const blocco of blocchi) {
    blocco.testo.split("\n").forEach((segmento, i) => {
      if (i > 0) {
        righe.push([]);
        grassetto = false;
      }
      const riga = righe[righe.length - 1] ?? [];
      segmento.split("**").forEach((pezzo, j) => {
        if (j > 0) grassetto = !grassetto;
        if (pezzo) riga.push({ tipo: "testo", testo: pezzo, grassetto });
      });
    });

    if (blocco.citazioni.length > 0) {
      // Se il blocco finiva con un a capo, i numeri vanno sull'ultima riga con del testo.
      const conTesto = [...righe].reverse().find((r) => r.some((p) => p.tipo === "testo"));
      (conTesto ?? righe[righe.length - 1] ?? []).push({ tipo: "citazioni", citazioni: blocco.citazioni });
    }
  }
  return righe;
}

/** Toglie gli spazi all'inizio e alla fine della riga e unisce i numeri vicini. */
function ripulisci(riga: Riga): Parte[] {
  const parti: Parte[] = [];
  for (const parte of riga) {
    const precedente = parti.at(-1);
    if (parte.tipo === "citazioni" && precedente?.tipo === "citazioni") {
      for (const c of parte.citazioni) {
        if (!precedente.citazioni.some((p) => p.numero === c.numero)) precedente.citazioni.push(c);
      }
    } else if (parte.tipo === "citazioni") {
      parti.push({ tipo: "citazioni", citazioni: [...parte.citazioni] });
    } else {
      parti.push({ ...parte });
    }
  }
  const primo = parti.find((p) => p.tipo === "testo");
  if (primo?.tipo === "testo") primo.testo = primo.testo.trimStart();
  const ultimo = [...parti].reverse().find((p) => p.tipo === "testo");
  if (ultimo?.tipo === "testo") ultimo.testo = ultimo.testo.trimEnd();
  return parti.filter((p) => p.tipo === "citazioni" || p.testo.length > 0);
}
