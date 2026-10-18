export const MODELLO_PREDEFINITO = "claude-sonnet-5-5";

/** Modello da ANTHROPIC_MODEL; una variabile vuota vale come non impostata. */
export function scegliModello(variabile: string | undefined): string {
  return variabile?.trim() || MODELLO_PREDEFINITO;
}

/**
 * Modello di «Raccontami la tua idea» (src/app/api/racconta): un compito di
 * estrazione breve, per cui basta un modello veloce ed economico.
 */
export const MODELLO_RACCONTO_PREDEFINITO = "claude-haiku-5-5";

/** Modello da ANTHROPIC_MODEL_RACCONTO; una variabile vuota vale come non impostata. */
export function scegliModelloRacconto(variabile: string | undefined): string {
  return variabile?.trim() || MODELLO_RACCONTO_PREDEFINITO;
}

/**
 * Modelli delle altre funzioni con l'AI, ognuno con la sua variabile
 * (vuota = predefinito): leggere una lettera fotografata chiede un modello
 * che veda bene le immagini; testi e nomi bastano a un modello economico.
 * Le ricevute di «I tuoi conti» arrivano anche da sole, con le email
 * inoltrate: conta il costo, quindi lo stesso modello di «Racconta a Bleo».
 */
export const MODELLI_FUNZIONI = {
  lettera: { variabile: "ANTHROPIC_MODEL_LETTERA", predefinito: "claude-sonnet-5-5" },
  testi: { variabile: "ANTHROPIC_MODEL_TESTI", predefinito: "claude-haiku-5-5" },
  nomeDitta: { variabile: "ANTHROPIC_MODEL_NOME", predefinito: "claude-haiku-5-5" },
  ricevuta: { variabile: "ANTHROPIC_MODEL_RICEVUTE", predefinito: MODELLO_RACCONTO_PREDEFINITO },
  /** Le parole di ricerca della chat: un passaggio breve prima di ogni risposta, conta la velocità. */
  ricerca: { variabile: "ANTHROPIC_MODEL_RICERCA", predefinito: "claude-haiku-5-5" },
} as const;

export type FunzioneAi = keyof typeof MODELLI_FUNZIONI;

export function scegliModelloFunzione(
  funzione: FunzioneAi,
  ambiente: Record<string, string | undefined> = process.env,
): string {
  const { variabile, predefinito } = MODELLI_FUNZIONI[funzione];
  return ambiente[variabile]?.trim() || predefinito;
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
