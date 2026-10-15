/** Lunghezza massima salvata per la provenienza (es. "instagram", "volantino-usi"). */
export const PROVENIENZA_MAX = 60;

/**
 * Ripulisce il valore di ?utm_source o ?ref: niente caratteri di controllo,
 * spazi compattati, al massimo 60 caratteri. Restituisce null se vuoto.
 */
export function normalizzaProvenienza(valore: unknown): string | null {
  if (typeof valore !== "string") return null;
  const pulito = valore
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Array.from taglia per caratteri, non per unità UTF-16 (emoji comprese).
  const tagliato = Array.from(pulito).slice(0, PROVENIENZA_MAX).join("").trim();
  return tagliato === "" ? null : tagliato;
}

/** Provenienza dai parametri dell'URL: prima utm_source, poi ref. */
export function provenienzaDaParametri(parametri: URLSearchParams): string | null {
  return normalizzaProvenienza(parametri.get("utm_source")) ?? normalizzaProvenienza(parametri.get("ref"));
}

/** Provenienza da un URL completo (es. l'intestazione Referer). Null se l'URL non è valido. */
export function provenienzaDaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return provenienzaDaParametri(new URL(url).searchParams);
  } catch {
    return null;
  }
}
