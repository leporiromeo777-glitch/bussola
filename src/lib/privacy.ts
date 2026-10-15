import { sito } from "@/lib/sito";

/**
 * Parti dell'informativa sulla privacy (src/app/privacy/page.tsx) che
 * dipendono dalla configurazione o vanno completate prima del lancio. Le parti
 * ancora da completare sono scritte tra parentesi quadre, come i dati del
 * titolare: finché ce n'è una, l'informativa è incompleta e la lista d'attesa
 * resta in modalità demo (LPD art. 19: si informa al momento della raccolta).
 */

/** true se il testo contiene una parte tra parentesi quadre da completare. */
export function contieneSegnaposto(testo: string): boolean {
  return /\[[^\]]+\]/.test(testo);
}

/**
 * Dove sono salvati i dati del database, secondo la regione del progetto
 * Supabase: "svizzera" = eu-central-2 (Zurigo), "ue" = eu-central-1
 * (Francoforte). Senza valore resta da indicare.
 */
export function luogoDatabase(regione: string | undefined): string {
  switch (regione?.trim().toLowerCase()) {
    case "svizzera":
      return "in Svizzera (Zurigo)";
    case "ue":
      return "nell'Unione europea (Francoforte, Germania)";
    default:
      return "in Svizzera o nell'Unione europea [da indicare prima del lancio]";
  }
}

/**
 * Elenco ufficiale delle imprese americane certificate secondo lo Swiss-U.S.
 * Data Privacy Framework. Solo per queste gli Stati Uniti hanno una protezione
 * adeguata (OPDa, allegato 1).
 */
export const ELENCO_DPF = {
  url: "https://www.dataprivacyframework.gov/list",
  verificatoIl: "2026-10-15",
} as const;

/** Allegato 1 dell'ordinanza sulla protezione dei dati (Stati con protezione adeguata). */
export const OPDA = "https://www.fedlex.admin.ch/eli/cc/2022/568/it";

const CERTIFICATO_DPF = "certificazione secondo lo Swiss-U.S. Data Privacy Framework";

/*
 * Clausole tipo riconosciute dall'IFPDT (LPD art. 16 cpv. 2 lett. d). Per
 * togliere la parte tra parentesi quadre: accetta il contratto sul
 * trattamento dei dati (DPA) del fornitore con le clausole tipo e
 * l'adeguamento per la Svizzera, e conserva una copia.
 */
const CLAUSOLE_TIPO =
  "clausole contrattuali standard (art. 16 cpv. 2 lett. d LPD) [da confermare prima del lancio]";

/**
 * Garanzia per i dati comunicati negli Stati Uniti, fornitore per fornitore
 * (LPD art. 19 cpv. 4). Controllato su ELENCO_DPF il 15.10.2026: Vercel e
 * Netlify hanno la certificazione Swiss-U.S. attiva; Supabase e Anthropic non
 * sono nell'elenco; Resend è certificata solo EU-U.S. e UK, non Swiss-U.S.
 * Ricontrolla prima del lancio: le certificazioni scadono ogni anno.
 */
export const GARANZIE_USA = {
  vercel: CERTIFICATO_DPF,
  netlify: CERTIFICATO_DPF,
  supabase: CLAUSOLE_TIPO,
  anthropic: CLAUSOLE_TIPO,
  resend: CLAUSOLE_TIPO,
} as const;

export type Fornitore = { nome: string; garanzia: string | null };

/**
 * Fornitore di hosting, da BUSSOLA_HOSTING: next.config.ts lo fissa durante
 * la build leggendo le variabili VERCEL e NETLIFY.
 */
export function fornitoreHosting(hosting: string | undefined): Fornitore {
  switch (hosting) {
    case "vercel":
      return { nome: "Vercel Inc. (USA)", garanzia: GARANZIE_USA.vercel };
    case "netlify":
      return { nome: "Netlify, Inc. (USA)", garanzia: GARANZIE_USA.netlify };
    default:
      return {
        nome: "Netlify, Inc. oppure Vercel Inc. (USA), secondo il fornitore scelto [da indicare prima del lancio]",
        garanzia: null,
      };
  }
}

/*
 * Per quanto tempo l'hosting e il database tengono i registri tecnici (log):
 * dipende dal piano scelto. Scrivi la durata e togli la parte tra parentesi.
 */
export const DURATA_DATI_TECNICI =
  "per il tempo previsto dal fornitore di hosting e del database [durata da indicare prima del lancio]";

export type InformativaPrivacy = {
  luogoDati: string;
  hosting: Fornitore;
  durataDatiTecnici: string;
  /** Le parti ancora da completare (vuoto se l'informativa è completa). */
  daCompletare: string[];
  incompleta: boolean;
};

export function informativaDa(config: {
  regioneDati: string | undefined;
  hosting: string | undefined;
  titolare: Readonly<Record<string, string>>;
}): InformativaPrivacy {
  const luogoDati = luogoDatabase(config.regioneDati);
  const hosting = fornitoreHosting(config.hosting);
  const parti: [string, string][] = [
    ["dati del titolare", Object.values(config.titolare).join(" ")],
    ["luogo del database (NEXT_PUBLIC_SUPABASE_REGIONE_DATI)", luogoDati],
    ["fornitore di hosting", hosting.nome],
    ["durata dei dati tecnici", DURATA_DATI_TECNICI],
    ...Object.entries(GARANZIE_USA).map(([fornitore, garanzia]): [string, string] => [
      `garanzia per gli USA di ${fornitore}`,
      garanzia,
    ]),
  ];
  const daCompletare = parti.filter(([, testo]) => contieneSegnaposto(testo)).map(([nome]) => nome);
  return { luogoDati, hosting, durataDatiTecnici: DURATA_DATI_TECNICI, daCompletare, incompleta: daCompletare.length > 0 };
}

/** L'informativa di questo sito, con le variabili fissate durante la build. */
export const informativaPrivacy = informativaDa({
  regioneDati: process.env.NEXT_PUBLIC_SUPABASE_REGIONE_DATI,
  hosting: process.env.BUSSOLA_HOSTING,
  titolare: sito.titolare,
});
