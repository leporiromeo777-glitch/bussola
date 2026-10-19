/**
 * Instagram e pagina Facebook con la Graph API di Meta (accesso con
 * Facebook Login for Business). Basta un token della pagina: se viene da un
 * token utente di lunga durata non scade (vedi social/README.md).
 * Instagram e Facebook prendono le immagini da un indirizzo pubblico.
 */
export type ConfigMeta = {
  /** Token della pagina Facebook collegata all'account Instagram. */
  token: string;
  /** Versione della Graph API, per esempio "v24.0". */
  versione: string;
  fetch?: typeof fetch;
  /** Per i test: niente attese vere. */
  attesa?: (ms: number) => Promise<void>;
};

type Risposta = Record<string, unknown> & { id?: string };

const GRAPH = "https://graph.facebook.com";
/** Controllo dello stato dei contenitori di Instagram: ogni 5 secondi, al massimo per 2 minuti. */
const PAUSA_MS = 5_000;
const CONTROLLI = 24;

const aspetta = (ms: number) => new Promise<void>((fatto) => setTimeout(fatto, ms));

async function graph(cfg: ConfigMeta, metodo: "GET" | "POST", percorso: string, parametri: Record<string, string>) {
  const f = cfg.fetch ?? fetch;
  const url = `${GRAPH}/${cfg.versione}/${percorso}`;
  const corpo = new URLSearchParams({ ...parametri, access_token: cfg.token });
  const risposta = metodo === "GET" ? await f(`${url}?${corpo}`) : await f(url, { method: "POST", body: corpo });
  const json = (await risposta.json().catch(() => ({}))) as Risposta & { error?: { message?: string } };
  // Il messaggio non contiene mai l'indirizzo: ci sarebbe il token.
  if (!risposta.ok || json.error) {
    throw new Error(`Meta, ${metodo} ${percorso}: ${json.error?.message ?? `HTTP ${risposta.status}`}`);
  }
  return json;
}

function id(risposta: Risposta, cosa: string): string {
  if (typeof risposta.id !== "string") throw new Error(`Meta: nessun id per ${cosa}`);
  return risposta.id;
}

/** Aspetta che un contenitore di Instagram sia pronto (FINISHED) prima di usarlo. */
async function attendiContenitore(cfg: ConfigMeta, contenitore: string) {
  for (let i = 0; i < CONTROLLI; i++) {
    const { status_code: stato } = await graph(cfg, "GET", contenitore, { fields: "status_code" });
    if (stato === "FINISHED") return;
    if (stato === "ERROR" || stato === "EXPIRED") throw new Error(`Instagram: il contenitore ${contenitore} è in stato ${stato}`);
    await (cfg.attesa ?? aspetta)(PAUSA_MS);
  }
  throw new Error(`Instagram: il contenitore ${contenitore} non è pronto dopo ${(CONTROLLI * PAUSA_MS) / 1000} secondi`);
}

/** Pubblica un carosello (da 2 a 10 immagini JPEG) e restituisce l'id del post. */
export async function pubblicaInstagram(cfg: ConfigMeta, igUserId: string, immagini: readonly string[], didascalia: string) {
  if (immagini.length < 2 || immagini.length > 10) throw new Error("Instagram: un carosello ha da 2 a 10 immagini");
  const figli: string[] = [];
  for (const url of immagini) {
    const figlio = id(await graph(cfg, "POST", `${igUserId}/media`, { image_url: url, is_carousel_item: "true" }), url);
    await attendiContenitore(cfg, figlio);
    figli.push(figlio);
  }
  const carosello = id(
    await graph(cfg, "POST", `${igUserId}/media`, { media_type: "CAROUSEL", children: figli.join(","), caption: didascalia }),
    "il carosello",
  );
  await attendiContenitore(cfg, carosello);
  return id(await graph(cfg, "POST", `${igUserId}/media_publish`, { creation_id: carosello }), "la pubblicazione");
}

/** Pubblica un post con più foto sulla pagina e restituisce il suo id. */
export async function pubblicaFacebook(cfg: ConfigMeta, paginaId: string, immagini: readonly string[], messaggio: string) {
  const foto: string[] = [];
  // Prima le foto, non pubblicate; poi il post che le contiene tutte.
  for (const url of immagini) foto.push(id(await graph(cfg, "POST", `${paginaId}/photos`, { url, published: "false" }), url));
  const parametri: Record<string, string> = { message: messaggio };
  foto.forEach((fbid, i) => {
    parametri[`attached_media[${i}]`] = JSON.stringify({ media_fbid: fbid });
  });
  return id(await graph(cfg, "POST", `${paginaId}/feed`, parametri), "il post");
}
