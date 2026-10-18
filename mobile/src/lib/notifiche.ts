/**
 * Promemoria delle scadenze come notifiche locali: niente server, niente
 * token push. Si riprogrammano tutti ogni volta che cambia il percorso o
 * cambiano le scadenze dei documenti del cassetto.
 */
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { VOTAZIONI } from "@/data/votazioni";
import {
  PREFISSO_PROMEMORIA_DOCUMENTO,
  pianificaPromemoriaDocumenti,
  unisciPromemoria,
  type ScadenzaDocumento,
} from "@/lib/cassetto/promemoria";
import { analizzaPassiFatti, analizzaRisposteSalvate, CHIAVE_PASSI_FATTI, CHIAVE_RISPOSTE } from "@/lib/percorso/archivio";
import { annoScadenzario, eventiDaScadenze } from "@/lib/percorso/calendario";
import { pianificaPromemoria, type Promemoria } from "@/lib/percorso/promemoria";
import { calcolaPercorso, type Percorso, type Scadenza } from "@/lib/percorso/regole";
import { prossimiLunedi, riassuntoSettimana } from "@/lib/percorso/settimana";
import { eventiVotazioni, votazioniInArrivo } from "@/lib/votazioni";
import { leggiScadenzeDocumenti } from "./cassetto";
import { leggi } from "./memoria";
import { CHIAVE_PROMEMORIA, CHIAVE_SETTIMANA, oggiLocale } from "./stato";

const CANALE = "scadenze";

export function configuraNotifiche(): void {
  if (Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Chiede il permesso (una volta sola: poi il sistema risponde da solo). */
export async function chiediPermesso(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANALE, {
      name: "Scadenze",
      importance: AndroidImportance.DEFAULT,
    });
  }
  const attuali = await Notifications.getPermissionsAsync();
  if (attuali.granted) return true;
  const risposta = await Notifications.requestPermissionsAsync();
  return risposta.granted;
}

/** Quante notifiche del lunedì tenere programmate in anticipo. */
const LUNEDI_IN_ANTICIPO = 4;

export type OpzioniNotifiche = {
  /** null se il questionario non è fatto: niente scadenze del percorso né riassunto del lunedì. */
  percorso: Percorso | null;
  fatti: ReadonlySet<string>;
  /** Promemoria delle scadenze (percorso, votazioni e documenti del cassetto: un solo interruttore). */
  scadenze: boolean;
  settimana: boolean;
  /** Scadenze dei documenti; se mancano, quelle salvate sul telefono. */
  documenti?: readonly ScadenzaDocumento[];
};

/** Quanti promemoria sono stati programmati: scadenze del percorso (con le votazioni) e documenti. */
export type EsitoNotifiche = { scadenze: number; documenti: number };

// Una riprogrammazione alla volta: cancellare e riprogrammare in parallelo potrebbe lasciare doppioni.
let coda: Promise<unknown> = Promise.resolve();
function inCoda<T>(lavoro: () => Promise<T>): Promise<T> {
  const risultato = coda.then(lavoro, lavoro);
  coda = risultato.catch(() => {});
  return risultato;
}

/**
 * Cancella tutte le notifiche programmate e rifà quelle scelte: i promemoria
 * delle scadenze (percorso, votazioni, documenti del cassetto: i più vicini,
 * entro il massimo di notifiche) e il riassunto del lunedì alle 9.
 */
export function programmaTutte(opzioni: OpzioniNotifiche): Promise<EsitoNotifiche> {
  if (Platform.OS === "web") return Promise.resolve({ scadenze: 0, documenti: 0 });
  return inCoda(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const adesso = new Date();
    const piano = opzioni.scadenze
      ? unisciPromemoria([
          opzioni.percorso ? promemoriaPercorso(opzioni.percorso.scadenze, adesso) : [],
          pianificaPromemoriaDocumenti(opzioni.documenti ?? leggiScadenzeDocumenti(), adessoLocale(adesso)),
        ])
      : [];
    for (const p of piano) await programmaUno(p);
    if (opzioni.settimana && opzioni.percorso) {
      for (const lunedi of prossimiLunedi(oggiLocale(), LUNEDI_IN_ANTICIPO)) {
        const [a, m, g] = lunedi.split("-").map(Number);
        const { testo } = riassuntoSettimana(opzioni.percorso, opzioni.fatti, lunedi);
        await Notifications.scheduleNotificationAsync({
          identifier: `settimana-${lunedi}`,
          content: { title: "La tua settimana con Bleo", body: testo, data: { settimana: lunedi } },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(a, m - 1, g, 9, 0),
            ...(Platform.OS === "android" ? { channelId: CANALE } : {}),
          },
        });
      }
    }
    const documenti = piano.filter((p) => p.id.startsWith(PREFISSO_PROMEMORIA_DOCUMENTO)).length;
    return { scadenze: piano.length - documenti, documenti };
  });
}

/** Come programmaTutte; restituisce quante scadenze del percorso ha programmato. */
export async function programmaNotifiche(opzioni: OpzioniNotifiche): Promise<number> {
  return (await programmaTutte(opzioni)).scadenze;
}

/**
 * Riprogramma tutto con quello che c'è sul telefono: risposte, passi fatti,
 * interruttori e scadenze dei documenti (per esempio dopo aver aggiornato il
 * cassetto, o uscendo dall'account).
 */
export function riprogrammaNotifiche(): Promise<EsitoNotifiche> {
  const salvate = analizzaRisposteSalvate(leggi(CHIAVE_RISPOSTE));
  return programmaTutte({
    percorso: salvate ? calcolaPercorso(salvate.risposte) : null,
    fatti: new Set(analizzaPassiFatti(leggi(CHIAVE_PASSI_FATTI))),
    scadenze: leggi(CHIAVE_PROMEMORIA) === "si",
    settimana: leggi(CHIAVE_SETTIMANA) === "si",
  });
}

/** Data e ora locali del telefono, AAAA-MM-GGTHH:MM. */
function adessoLocale(adesso: Date): string {
  return `${oggiLocale(adesso)}T${String(adesso.getHours()).padStart(2, "0")}:${String(adesso.getMinutes()).padStart(2, "0")}`;
}

/** I promemoria delle scadenze del percorso e delle votazioni da seguire. */
function promemoriaPercorso(scadenze: readonly Scadenza[], adesso: Date): Promemoria[] {
  const anno = annoScadenzario(adesso);
  const eventi = [
    ...eventiDaScadenze(scadenze, { anno: anno - 1 }),
    ...eventiDaScadenze(scadenze, { anno }),
    ...eventiDaScadenze(scadenze, { anno: anno + 1 }),
    ...eventiVotazioni(votazioniInArrivo(VOTAZIONI, oggiLocale(adesso))),
  ];
  return pianificaPromemoria(eventi, oggiLocale(adesso));
}

async function programmaUno(p: Promemoria): Promise<void> {
  const [giorno, ora] = p.quando.split("T");
  const [a, m, g] = giorno.split("-").map(Number);
  const [hh, mm] = ora.split(":").map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: p.id,
    content: { title: p.titolo, body: p.testo, data: { scadenza: p.scadenza } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(a, m - 1, g, hh, mm),
      ...(Platform.OS === "android" ? { channelId: CANALE } : {}),
    },
  });
}

export async function cancellaPromemoria(): Promise<void> {
  if (Platform.OS === "web") return;
  await inCoda(() => Notifications.cancelAllScheduledNotificationsAsync());
}
