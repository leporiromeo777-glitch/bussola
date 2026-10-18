/**
 * «Cassetto dei documenti»: le scadenze. Quanto manca, il testo del badge
 * («Scade tra 12 giorni», «Scaduto»), i gruppi dell'elenco e gli eventi per
 * il file di calendario. Logica pura, la usano il sito e l'app.
 *
 * Un documento che «scade il 19.10.2026» vale ancora quel giorno: il
 * 19.10.2026 «scade oggi», dal 20.10.2026 è «scaduto».
 */
import { dataSvizzera } from "@/data/svizzera";
import { dataIsoValida, type EventoCalendario } from "@/lib/percorso/calendario";
import { GIORNI_IN_SCADENZA } from "./limiti";
import { etichettaTipoDocumento, type TipoDocumento } from "./tipi";

export type StatoScadenza =
  | { tipo: "nessuna" }
  /** Scaduto da `giorni` giorni (almeno 1). */
  | { tipo: "scaduto"; giorni: number }
  /** Scade entro GIORNI_IN_SCADENZA giorni (0 = oggi). */
  | { tipo: "in_scadenza"; giorni: number }
  /** Scade più avanti. */
  | { tipo: "valido"; giorni: number };

/** Giorni da `da` ad `a` (date AAAA-MM-GG), in UTC: niente sorprese con l'ora legale. */
export function giorniTra(da: string, a: string): number {
  const inizio = Date.UTC(Number(da.slice(0, 4)), Number(da.slice(5, 7)) - 1, Number(da.slice(8, 10)));
  const fine = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
  return Math.round((fine - inizio) / 86_400_000);
}

export function statoScadenza(scadeIl: string | null, oggi: string): StatoScadenza {
  if (!scadeIl || !dataIsoValida(scadeIl)) return { tipo: "nessuna" };
  const giorni = giorniTra(oggi, scadeIl);
  if (giorni < 0) return { tipo: "scaduto", giorni: -giorni };
  if (giorni <= GIORNI_IN_SCADENZA) return { tipo: "in_scadenza", giorni };
  return { tipo: "valido", giorni };
}

export type BadgeScadenza = {
  testo: string;
  /** pericolo: scaduto; attenzione: scade presto; neutro: scade più avanti. */
  tono: "pericolo" | "attenzione" | "neutro";
};

/** «Scaduto», «Scade oggi», «Scade domani», «Scade tra 12 giorni», «Scade il 19.10.2027»; null senza scadenza. */
export function badgeScadenza(scadeIl: string | null, oggi: string): BadgeScadenza | null {
  const stato = statoScadenza(scadeIl, oggi);
  switch (stato.tipo) {
    case "nessuna":
      return null;
    case "scaduto":
      return { testo: "Scaduto", tono: "pericolo" };
    case "in_scadenza":
      return {
        testo: stato.giorni === 0 ? "Scade oggi" : stato.giorni === 1 ? "Scade domani" : `Scade tra ${stato.giorni} giorni`,
        tono: "attenzione",
      };
    case "valido":
      return { testo: `Scade il ${dataSvizzera(scadeIl!)}`, tono: "neutro" };
  }
}

/** La frase sotto il titolo: «Scaduto il 01.10.2026», «Scade il 19.10.2026» o «Senza scadenza». */
export function testoDataScadenza(scadeIl: string | null, oggi: string): string {
  const stato = statoScadenza(scadeIl, oggi);
  if (stato.tipo === "nessuna") return "Senza scadenza";
  return `${stato.tipo === "scaduto" ? "Scaduto il" : "Scade il"} ${dataSvizzera(scadeIl!)}`;
}

/** true se il documento è scaduto o scade entro GIORNI_IN_SCADENZA giorni. */
export function daGuardare(scadeIl: string | null, oggi: string): boolean {
  const tipo = statoScadenza(scadeIl, oggi).tipo;
  return tipo === "scaduto" || tipo === "in_scadenza";
}

type ConScadenza = { scadeIl: string | null; titolo: string };

const perTitolo = (a: ConScadenza, b: ConScadenza) => a.titolo.localeCompare(b.titolo, "it", { sensitivity: "base" });

/**
 * L'elenco in due gruppi:
 * - daGuardare: scaduti e in scadenza, prima quelli scaduti da più tempo;
 * - altri: prima quelli con una scadenza (la più vicina in cima), poi quelli
 *   senza scadenza, in ordine di titolo.
 */
export function raggruppaDocumenti<T extends ConScadenza>(
  documenti: readonly T[],
  oggi: string,
): { daGuardare: T[]; altri: T[] } {
  const perData = (a: T, b: T) => (a.scadeIl ?? "").localeCompare(b.scadeIl ?? "") || perTitolo(a, b);
  const urgenti = documenti.filter((d) => daGuardare(d.scadeIl, oggi)).sort(perData);
  const conData = documenti
    .filter((d) => statoScadenza(d.scadeIl, oggi).tipo === "valido")
    .sort(perData);
  const senza = documenti.filter((d) => statoScadenza(d.scadeIl, oggi).tipo === "nessuna").sort(perTitolo);
  return { daGuardare: urgenti, altri: [...conData, ...senza] };
}

/** Quanti documenti sono scaduti o scadono presto (per il pallino sul link al cassetto). */
export function contaDaGuardare(documenti: readonly { scadeIl: string | null }[], oggi: string): number {
  return documenti.filter((d) => daGuardare(d.scadeIl, oggi)).length;
}

/**
 * Le scadenze dei documenti come eventi per il file di calendario (.ics): solo
 * quelle da oggi in poi. L'uid è stabile: reimportando il file l'evento si
 * aggiorna invece di duplicarsi.
 */
export function eventiDocumenti(
  documenti: readonly { id: string; titolo: string; tipo: TipoDocumento; scadeIl: string | null }[],
  oggi: string,
  url?: string,
): EventoCalendario[] {
  return documenti
    .filter((d): d is typeof d & { scadeIl: string } => Boolean(d.scadeIl && dataIsoValida(d.scadeIl) && d.scadeIl >= oggi))
    .sort((a, b) => a.scadeIl.localeCompare(b.scadeIl))
    .map((d) => ({
      uid: `cassetto-${d.id}@bleo`,
      data: d.scadeIl,
      titolo: `Scade: ${d.titolo}`,
      descrizione: `${etichettaTipoDocumento(d.tipo)}. Lo trovi nel cassetto dei documenti di Bleo: ricordati di rinnovarlo per tempo.`,
      ...(url ? { url } : {}),
    }));
}

/**
 * Una data scritta a mano come in Svizzera («19.10.2026», «1.2.2027» o
 * «19/10/2026») in AAAA-MM-GG; null se non è una data esistente. Per i campi
 * di testo dell'app.
 */
export function isoDaDataScritta(testo: string): string | null {
  const parti = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(testo.trim());
  if (!parti) return null;
  const iso = `${parti[3]}-${parti[2].padStart(2, "0")}-${parti[1].padStart(2, "0")}`;
  return dataIsoValida(iso) ? iso : null;
}
