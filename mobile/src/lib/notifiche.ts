/**
 * Promemoria come notifiche locali: niente server, niente token push.
 * - Scadenze e votazioni: si riprogrammano tutti ogni volta che cambia il
 *   percorso.
 * - Documenti del cassetto (src/lib/cassetto/promemoria.ts): 30 e 7 giorni
 *   prima della scadenza, alle 9; insieme a scadenze e votazioni restano
 *   entro MASSIMO_PROMEMORIA (i più vicini). Le scadenze dei documenti sono
 *   salvate sul telefono (mobile/src/lib/cassetto.ts).
 * - Fatture emesse non pagate (src/lib/conti/promemoria.ts): un avviso il
 *   mattino dopo la scadenza (al massimo MASSIMO_PROMEMORIA_FATTURE); si
 *   riprogrammano ogni volta che l'app legge i conti.
 * Tutti valgono con lo stesso interruttore dei promemoria delle scadenze.
 * Con il riassunto del lunedì si resta sotto le 64 notifiche che iOS tiene.
 * Un lavoro alla volta (inFila) e id stabili: niente notifiche doppie.
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
import { PREFISSO_PROMEMORIA_FATTURA, pianificaPromemoriaFatture } from "@/lib/conti/promemoria";
import type { FatturaEmessa } from "@/lib/conti/tipi";
import { annoScadenzario, eventiDaScadenze } from "@/lib/percorso/calendario";
import { pianificaPromemoria, type Promemoria } from "@/lib/percorso/promemoria";
import type { Percorso, Scadenza } from "@/lib/percorso/regole";
import { prossimiLunedi, riassuntoSettimana } from "@/lib/percorso/settimana";
import { eventiVotazioni, votazioniInArrivo } from "@/lib/votazioni";
import { leggiScadenzeDocumenti } from "./cassetto";
import { leggiStatoNotifiche, oggiLocale, promemoriaAttivi } from "./stato";

const CANALE = "scadenze";

type FatturaDaRicordare = Pick<FatturaEmessa, "id" | "numero" | "cliente" | "scadenza" | "pagataIl">;

/**
 * Le fatture dell'ultima lettura dei conti. null = non ancora lette da
 * quando l'app è aperta: allora i promemoria delle fatture già programmati
 * restano come sono.
 */
let fattureDaRicordare: readonly FatturaDaRicordare[] | null = null;

/** Un lavoro sulle notifiche alla volta: cancellare e riprogrammare non si accavallano. */
let coda: Promise<unknown> = Promise.resolve();
function inFila<T>(lavoro: () => Promise<T>): Promise<T> {
  const risultato = coda.then(lavoro, lavoro);
  coda = risultato.catch(() => undefined);
  return risultato;
}

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

/** «AAAA-MM-GGTHH:MM» (ora locale) → trigger a quella data. */
function allaData(quando: string): Notifications.NotificationTriggerInput {
  const [giorno, ora = "09:00"] = quando.split("T");
  const [a, m, g] = giorno.split("-").map(Number);
  const [hh, mm] = ora.split(":").map(Number);
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(a, m - 1, g, hh, mm),
    ...(Platform.OS === "android" ? { channelId: CANALE } : {}),
  };
}

/** Data e ora locali del telefono, AAAA-MM-GGTHH:MM. */
function adessoLocale(adesso = new Date()): string {
  return `${oggiLocale(adesso)}T${String(adesso.getHours()).padStart(2, "0")}:${String(adesso.getMinutes()).padStart(2, "0")}`;
}

const eFattura = (id: string) => id.startsWith(PREFISSO_PROMEMORIA_FATTURA);

/** Cancella le notifiche programmate scelte (gli altri restano). */
async function cancellaProgrammate(scegli: (id: string) => boolean): Promise<void> {
  const programmate = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of programmate) {
    if (scegli(n.identifier)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export type OpzioniNotifiche = {
  /** null se il questionario non è fatto: niente scadenze del percorso né riassunto del lunedì. */
  percorso: Percorso | null;
  fatti: ReadonlySet<string>;
  /** Promemoria delle scadenze: percorso, votazioni, documenti del cassetto e fatture (un solo interruttore). */
  scadenze: boolean;
  settimana: boolean;
  /** Scadenze dei documenti; se mancano, quelle salvate sul telefono. */
  documenti?: readonly ScadenzaDocumento[];
};

/** Quanti promemoria sono stati programmati: scadenze del percorso (con le votazioni) e documenti. */
export type EsitoNotifiche = { scadenze: number; documenti: number };

/**
 * Cancella le notifiche programmate e rifà quelle scelte: con `scadenze` i
 * promemoria delle scadenze, delle votazioni e dei documenti (i più vicini,
 * entro il massimo) e quelli delle fatture; con `settimana` il riassunto del
 * lunedì alle 9.
 */
export function programmaTutte(opzioni: OpzioniNotifiche): Promise<EsitoNotifiche> {
  if (Platform.OS === "web") return Promise.resolve({ scadenze: 0, documenti: 0 });
  return inFila(async () => {
    // Fatture non ancora lette: i loro promemoria restano, gli altri si rifanno.
    if (opzioni.scadenze && fattureDaRicordare === null) await cancellaProgrammate((id) => !eFattura(id));
    else await Notifications.cancelAllScheduledNotificationsAsync();
    const adesso = new Date();
    const piano = opzioni.scadenze
      ? unisciPromemoria([
          promemoriaPercorso(opzioni.percorso?.scadenze ?? [], adesso),
          pianificaPromemoriaDocumenti(opzioni.documenti ?? leggiScadenzeDocumenti(), adessoLocale(adesso)),
        ])
      : [];
    for (const p of piano) {
      await Notifications.scheduleNotificationAsync({
        identifier: p.id,
        content: { title: p.titolo, body: p.testo, data: { scadenza: p.scadenza } },
        trigger: allaData(p.quando),
      });
    }
    if (opzioni.settimana && opzioni.percorso) {
      for (const lunedi of prossimiLunedi(oggiLocale(), LUNEDI_IN_ANTICIPO)) {
        const { testo } = riassuntoSettimana(opzioni.percorso, opzioni.fatti, lunedi);
        await Notifications.scheduleNotificationAsync({
          identifier: `settimana-${lunedi}`,
          content: { title: "La tua settimana con Bleo", body: testo, data: { settimana: lunedi } },
          trigger: allaData(`${lunedi}T09:00`),
        });
      }
    }
    if (opzioni.scadenze && fattureDaRicordare) await programmaFatture(fattureDaRicordare);
    const documenti = piano.filter((p) => p.id.startsWith(PREFISSO_PROMEMORIA_DOCUMENTO)).length;
    return { scadenze: piano.length - documenti, documenti };
  });
}

/** Come programmaTutte; restituisce quante scadenze del percorso (e votazioni) ha programmato. */
export async function programmaNotifiche(opzioni: OpzioniNotifiche): Promise<number> {
  return (await programmaTutte(opzioni)).scadenze;
}

/**
 * Riprogramma tutto con quello che è salvato sul telefono: risposte, passi
 * fatti, interruttori e scadenze dei documenti (per esempio dopo
 * l'interruttore nei conti o nel cassetto, o uscendo dall'account).
 */
export function riprogrammaNotifiche(): Promise<EsitoNotifiche> {
  return programmaTutte(leggiStatoNotifiche());
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

/** Programma i promemoria delle fatture (senza cancellare gli altri). */
async function programmaFatture(fatture: readonly FatturaDaRicordare[]): Promise<void> {
  for (const p of pianificaPromemoriaFatture(fatture, adessoLocale())) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: p.titolo, body: p.testo, data: { fattura: p.id.slice(PREFISSO_PROMEMORIA_FATTURA.length) } },
      trigger: allaData(p.quando),
    });
  }
}

/**
 * Le fatture appena lette dai conti: rifà i loro promemoria (solo quelli
 * delle fatture) se l'interruttore dei promemoria è acceso e il permesso c'è.
 */
export function aggiornaPromemoriaFatture(fatture: readonly FatturaEmessa[]): Promise<void> {
  fattureDaRicordare = fatture.map(({ id, numero, cliente, scadenza, pagataIl }) => ({ id, numero, cliente, scadenza, pagataIl }));
  if (Platform.OS === "web") return Promise.resolve();
  return inFila(async () => {
    await cancellaProgrammate(eFattura);
    if (!promemoriaAttivi() || !fattureDaRicordare) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await programmaFatture(fattureDaRicordare);
  });
}

/** Uscendo dall'account: via i promemoria delle fatture. */
export function togliPromemoriaFatture(): Promise<void> {
  fattureDaRicordare = [];
  if (Platform.OS === "web") return Promise.resolve();
  return inFila(() => cancellaProgrammate(eFattura));
}

export function cancellaPromemoria(): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  return inFila(() => Notifications.cancelAllScheduledNotificationsAsync());
}
