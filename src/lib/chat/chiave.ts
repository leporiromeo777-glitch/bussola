/** Indirizzo dell'API di Anthropic: la chat la chiama sempre direttamente. */
export const URL_API_ANTHROPIC = "https://api.anthropic.com";

type Ambiente = Record<string, string | undefined>;

/**
 * La chiave di Claude da usare, o null (chat in modalità demo).
 *
 * Su Netlify l'AI Gateway, se nessuno ha impostato una chiave propria, mette
 * da solo nelle funzioni ANTHROPIC_API_KEY e ANTHROPIC_BASE_URL: le domande
 * passerebbero allora da Netlify, con i suoi crediti, e l'informativa sulla
 * privacy non lo prevede. Quella chiave non vale: la chat si accende solo con
 * una chiave di Anthropic impostata da noi.
 */
export function chiaveAnthropic(env: Ambiente): string | null {
  const chiave = env.ANTHROPIC_API_KEY?.trim();
  if (!chiave) return null;
  const chiaveGateway = env.NETLIFY_AI_GATEWAY_KEY?.trim();
  if (chiaveGateway && chiave === chiaveGateway) return null;
  const base = env.ANTHROPIC_BASE_URL?.trim();
  if (base && base.replace(/\/+$/, "") !== URL_API_ANTHROPIC) return null;
  return chiave;
}
