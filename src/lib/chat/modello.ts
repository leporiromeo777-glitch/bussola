export const MODELLO_PREDEFINITO = "claude-opus-5-5";

/** Modello da ANTHROPIC_MODEL; una variabile vuota vale come non impostata. */
export function scegliModello(variabile: string | undefined): string {
  return variabile?.trim() || MODELLO_PREDEFINITO;
}

/**
 * Modelli che accettano `fallbacks: "default"` (beta server-side-fallback-2026-07-01):
 * se i filtri di sicurezza rifiutano una richiesta, il server la riprova su
 * un altro modello. Per gli altri modelli il parametro non si manda.
 */
const CON_FALLBACK = ["claude-opus-5", "claude-fable-5", "claude-mythos-5", "claude-sonnet-5-5"];

export function supportaFallback(modello: string): boolean {
  return CON_FALLBACK.some((prefisso) => modello === prefisso || modello.startsWith(`${prefisso}-`));
}
