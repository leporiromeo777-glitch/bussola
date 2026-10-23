/**
 * Fa partire il workflow dei post social (.github/workflows/social.yml) con
 * formato «auto», ogni ora (orario in netlify.toml). Lo schedule di GitHub
 * salta molte esecuzioni (il 23.10 tre in dodici ore, nessuna dopo le 13),
 * quello di Netlify no. Cosa pubblicare lo decide poi il workflow
 * (scripts/social/turno.ts); il registro evita i doppioni.
 *
 * Serve la variabile GITHUB_TOKEN_SOCIAL su Netlify: un token «fine-grained»
 * di GitHub solo per questo repository, con il permesso Actions in lettura e
 * scrittura (social/README.md). Senza, la funzione non fa nulla.
 */
import { momentoDiControllare } from "../../scripts/social/turno";

const WORKFLOW = "https://api.github.com/repos/leporiromeo777-glitch/bussola/actions/workflows/social.yml/dispatches";

export default async function turnoSocial(): Promise<void> {
  const token = process.env.GITHUB_TOKEN_SOCIAL;
  if (!token) {
    console.warn("[turno-social] manca GITHUB_TOKEN_SOCIAL: il workflow resta solo sullo schedule di GitHub.");
    return;
  }
  if (!momentoDiControllare(new Date())) return;
  const risposta = await fetch(WORKFLOW, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "bleo-turno-social",
    },
    body: JSON.stringify({ ref: "main", inputs: { formato: "auto", prova: "false" } }),
    signal: AbortSignal.timeout(10_000),
  });
  // 401: token sbagliato o scaduto; 403/404: manca il permesso Actions sul repository.
  if (!risposta.ok) console.error(`[turno-social] GitHub ha risposto ${risposta.status}`);
}
