/**
 * Didascalie e testi alternativi dei post social (src/data/social.ts), uguali
 * per tutti i social tranne l'invito: su Instagram i link nel testo non si
 * aprono, quindi si rimanda al link nella bio.
 */
import { AVVISO, HASHTAG_COMUNI, INVITO, type PostSocial } from "@/data/social";
import { dataSvizzera } from "@/data/svizzera";

export const PIATTAFORME = ["instagram", "facebook", "linkedin"] as const;
export type Piattaforma = (typeof PIATTAFORME)[number];

/** Lunghezza massima della didascalia di ogni social. */
export const LIMITI_DIDASCALIA: Record<Piattaforma, number> = {
  instagram: 2_200,
  facebook: 63_206,
  linkedin: 3_000,
};

/** Giorno di oggi in Svizzera (ISO), quello che decide quale post esce. */
export function oggiInSvizzera(adesso: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(adesso);
}

/** Link alla lista d'attesa con la provenienza, che la lista salva con l'iscrizione. */
export function linkListaAttesa(sitoUrl: string, piattaforma: Piattaforma): string {
  const url = new URL("/lista-attesa", sitoUrl);
  url.searchParams.set("utm_source", piattaforma);
  return url.toString();
}

/**
 * Caratteri riservati del formato «little» di LinkedIn: vanno preceduti da
 * una barra rovesciata, altrimenti il post può uscire tagliato.
 */
export function testoLinkedIn(testo: string): string {
  return testo.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);
}

export function didascalia(post: PostSocial, piattaforma: Piattaforma, sitoUrl: string): string {
  const fonti = post.fonti.map((f) => `• ${f.titolo}, ${f.ente}: ${f.url}`);
  const invito =
    piattaforma === "instagram" ? `${INVITO}: link nella bio.` : `${INVITO}: ${linkListaAttesa(sitoUrl, piattaforma)}`;
  const corpo = [
    post.testo,
    "",
    `${post.fonti.length === 1 ? "Fonte" : "Fonti"} (controllate il ${dataSvizzera(post.verificatoIl)}):`,
    ...fonti,
    "",
    AVVISO,
    "",
    invito,
  ].join("\n");
  const hashtag = [...HASHTAG_COMUNI, ...post.hashtag].join(" ");
  // Gli hashtag restano senza barre: su LinkedIn «#parola» è già un hashtag.
  return `${piattaforma === "linkedin" ? testoLinkedIn(corpo) : corpo}\n\n${hashtag}`;
}

/** Descrizione di ogni immagine del post, per chi usa un lettore di schermo. */
export function testiAlternativi(post: PostSocial): string[] {
  const schede = post.schede.map((s) => {
    switch (s.tipo) {
      case "copertina":
        return `${s.occhiello}: ${s.titolo}`;
      case "punti":
        return `${s.titolo}: ${s.punti.join("; ")}`;
      case "cifra":
        return `${s.cifra} ${s.testo}`;
    }
  });
  const fonte = post.fonti[0];
  return [...schede, `Fonte: ${fonte.titolo}, ${fonte.ente}. ${INVITO}.`];
}
