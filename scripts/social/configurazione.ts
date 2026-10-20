/**
 * Legge dalle variabili d'ambiente cosa pubblicare e dove (vedi
 * social/README.md). Un social senza credenziali non è un errore: si salta,
 * così si possono collegare i social uno alla volta.
 */
import { oggiInSvizzera, PIATTAFORME, type Piattaforma } from "../../src/lib/social/post";

/** Versioni delle API: Meta ne mantiene ognuna circa due anni, LinkedIn circa uno. */
export const VERSIONE_META = "v26.0";
export const VERSIONE_LINKEDIN = "202610";

export type Configurazione = {
  /** Giorno del post (ISO). */
  data: string;
  /** Solo prova: mostra i testi senza pubblicare. */
  prova: boolean;
  piattaforme: Piattaforma[];
  sitoUrl: string | null;
  /** Indirizzo pubblico della cartella social/ (Instagram e Facebook scaricano le immagini da lì). */
  immaginiUrl: string | null;
  meta: { token: string; versione: string; paginaId: string | null; instagramId: string | null } | null;
  linkedin: { token: string; versione: string } | null;
  errori: string[];
};

type Ambiente = Record<string, string | undefined>;

function valore(env: Ambiente, ...nomi: string[]): string | null {
  for (const nome of nomi) {
    const v = env[nome]?.trim();
    if (v) return v;
  }
  return null;
}

function urlHttps(testo: string | null): string | null {
  if (!testo) return null;
  try {
    const url = new URL(testo);
    return url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export function leggiConfigurazione(env: Ambiente, adesso: Date = new Date()): Configurazione {
  const errori: string[] = [];

  const data = valore(env, "SOCIAL_DATA") ?? oggiInSvizzera(adesso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) errori.push(`SOCIAL_DATA deve essere AAAA-MM-GG, non «${data}».`);

  const richieste = (valore(env, "SOCIAL_PIATTAFORME") ?? PIATTAFORME.join(","))
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const sconosciute = richieste.filter((p) => !(PIATTAFORME as readonly string[]).includes(p));
  if (sconosciute.length) errori.push(`SOCIAL_PIATTAFORME: social sconosciuti (${sconosciute.join(", ")}); si usano ${PIATTAFORME.join(", ")}.`);
  const piattaforme = PIATTAFORME.filter((p) => richieste.includes(p));

  const sito = valore(env, "SITO_URL", "NEXT_PUBLIC_SITO_URL");
  const sitoUrl = urlHttps(sito);
  if (sito && !sitoUrl) errori.push(`SITO_URL deve essere un indirizzo https, non «${sito}».`);

  const repository = valore(env, "GITHUB_REPOSITORY");
  const commit = valore(env, "GITHUB_SHA");
  const immagini =
    valore(env, "SOCIAL_IMMAGINI_URL") ??
    (repository && commit ? `https://raw.githubusercontent.com/${repository}/${commit}/social` : null);
  const immaginiUrl = urlHttps(immagini);
  if (immagini && !immaginiUrl) errori.push(`SOCIAL_IMMAGINI_URL deve essere un indirizzo https, non «${immagini}».`);

  const tokenMeta = valore(env, "META_PAGE_TOKEN");
  const tokenLinkedIn = valore(env, "LINKEDIN_TOKEN");

  return {
    data,
    prova: /^(1|true|si|sì)$/i.test(valore(env, "SOCIAL_PROVA") ?? ""),
    piattaforme,
    sitoUrl,
    immaginiUrl,
    meta: tokenMeta
      ? {
          token: tokenMeta,
          versione: valore(env, "META_GRAPH_VERSIONE") ?? VERSIONE_META,
          paginaId: valore(env, "FACEBOOK_PAGE_ID"),
          instagramId: valore(env, "INSTAGRAM_USER_ID"),
        }
      : null,
    linkedin: tokenLinkedIn ? { token: tokenLinkedIn, versione: valore(env, "LINKEDIN_VERSIONE") ?? VERSIONE_LINKEDIN } : null,
    errori,
  };
}

/**
 * Perché un social non si può usare: «non collegato» (mancano le credenziali,
 * si salta) o «incompleto» (credenziali senza il resto: è un errore).
 * null se è tutto pronto.
 */
export function statoPiattaforma(
  conf: Configurazione,
  piattaforma: Piattaforma,
): { stato: "non collegato" | "incompleto"; motivo: string } | null {
  const mancano = (cosa: string[]) => ({ stato: "incompleto" as const, motivo: `manca ${cosa.join(" e ")}` });
  switch (piattaforma) {
    case "instagram": {
      if (!conf.meta?.instagramId) return { stato: "non collegato", motivo: "mancano META_PAGE_TOKEN o INSTAGRAM_USER_ID" };
      return conf.immaginiUrl ? null : mancano(["SOCIAL_IMMAGINI_URL"]);
    }
    case "facebook": {
      if (!conf.meta?.paginaId) return { stato: "non collegato", motivo: "mancano META_PAGE_TOKEN o FACEBOOK_PAGE_ID" };
      const cosa = [...(conf.immaginiUrl ? [] : ["SOCIAL_IMMAGINI_URL"]), ...(conf.sitoUrl ? [] : ["SITO_URL"])];
      return cosa.length ? mancano(cosa) : null;
    }
    case "linkedin": {
      if (!conf.linkedin) return { stato: "non collegato", motivo: "manca LINKEDIN_TOKEN" };
      return conf.sitoUrl ? null : mancano(["SITO_URL"]);
    }
  }
}
