/**
 * Le votazioni da ricordare (src/data/votazioni.ts): quali sono ancora da
 * venire e come metterle nel calendario o nei promemoria del telefono.
 */
import type { LivelloVotazione, Votazione } from "@/data/votazioni";
import type { EventoCalendario } from "@/lib/percorso/calendario";

/** Le votazioni da oggi in poi (il giorno del voto compreso), dalla più vicina. `oggi` è AAAA-MM-GG. */
export function votazioniInArrivo(votazioni: readonly Votazione[], oggi: string): Votazione[] {
  return votazioni.filter((v) => v.data >= oggi).sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
}

export function etichettaLivello(livello: LivelloVotazione): string {
  switch (livello) {
    case "federale":
      return "Votazione federale";
    case "cantonale":
      return "Votazione cantonale";
    case "comunale":
      return "Votazione comunale";
  }
}

/** Un evento di calendario per ogni votazione, con il link al testo ufficiale. */
export function eventiVotazioni(votazioni: readonly Votazione[]): EventoCalendario[] {
  return votazioni.map((v) => ({
    uid: `votazione-${v.id}@bussola`,
    data: v.data,
    titolo: `${etichettaLivello(v.livello)}: ${v.titoloBreve}`,
    descrizione: `${v.oggetto}. ${v.cosaCambia} ${v.chiRiguarda} Fonte: ${v.fonti[0].url}`,
    url: v.fonti[0].url,
    genere: "votazione",
  }));
}
