/**
 * Promemoria delle scadenze come notifiche locali: niente server, niente
 * token push. Si riprogrammano tutti ogni volta che cambia il percorso.
 */
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { annoScadenzario, eventiDaScadenze } from "@/lib/percorso/calendario";
import { pianificaPromemoria } from "@/lib/percorso/promemoria";
import type { Scadenza } from "@/lib/percorso/regole";
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

/**
 * Cancella i promemoria vecchi e programma quelli delle scadenze di
 * quest'anno e del prossimo. Restituisce quanti ne ha programmati.
 */
export async function programmaPromemoria(scadenze: readonly Scadenza[]): Promise<number> {
  if (Platform.OS === "web") return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
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
