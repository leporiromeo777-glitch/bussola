/**
 * Promemoria delle scadenze come notifiche locali: niente server, niente
 * token push. Si riprogrammano tutti ogni volta che cambia il percorso.
 */
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { annoScadenzario, eventiDaScadenze } from "@/lib/percorso/calendario";
import { pianificaPromemoria } from "@/lib/percorso/promemoria";
import type { Percorso, Scadenza } from "@/lib/percorso/regole";
import { prossimiLunedi, riassuntoSettimana } from "@/lib/percorso/settimana";
import { oggiLocale } from "./stato";

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

/**
 * Cancella tutte le notifiche programmate e rifà quelle scelte: i promemoria
 * delle scadenze e il riassunto del lunedì alle 9. Restituisce quante
 * scadenze ha programmato.
 */
export async function programmaNotifiche(opzioni: {
  percorso: Percorso;
  fatti: ReadonlySet<string>;
  scadenze: boolean;
  settimana: boolean;
}): Promise<number> {
  if (Platform.OS === "web") return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const quante = opzioni.scadenze ? await programmaPromemoria(opzioni.percorso.scadenze) : 0;
  if (opzioni.settimana) {
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
  return quante;
}

/** Programma i promemoria delle scadenze (senza cancellare gli altri). Restituisce quanti. */
async function programmaPromemoria(scadenze: readonly Scadenza[]): Promise<number> {
  const adesso = new Date();
  const anno = annoScadenzario(adesso);
  const eventi = [
    ...eventiDaScadenze(scadenze, { anno: anno - 1 }),
    ...eventiDaScadenze(scadenze, { anno }),
    ...eventiDaScadenze(scadenze, { anno: anno + 1 }),
  ];
  const piano = pianificaPromemoria(eventi, oggiLocale(adesso));
  for (const p of piano) {
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
  return piano.length;
}

export async function cancellaPromemoria(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
