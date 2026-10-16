import { formattaData } from "@/lib/chat/formato";
import type { QuotaPubblica } from "@/lib/chat/tipi";

/** Una riga che dice quante domande restano questo mese. */
export function TestoQuota({ quota, className = "text-sm" }: { quota: QuotaPubblica | null; className?: string }) {
  if (!quota) return null;
  let testo: string;
  if (quota.illimitata) {
    testo =
      quota.piano === "avvio" && quota.piano_scade_il
        ? `Domande illimitate con il piano Avvio fino al ${formattaData(quota.piano_scade_il)}.`
        : "Domande illimitate con il tuo piano.";
  } else if (quota.rimanenti === 0) {
    testo = `Hai usato tutte le ${quota.limite} domande gratuite di questo mese. Ricominciano il ${formattaData(quota.rinnovo_il)}.`;
  } else if (quota.rimanenti === 1) {
    testo = `Ti resta 1 domanda gratuita su ${quota.limite} questo mese.`;
  } else {
    testo = `Ti restano ${quota.rimanenti} domande gratuite su ${quota.limite} questo mese.`;
  }
  return (
    <p className={`${className} ${quota.rimanenti === 0 ? "text-danger" : "text-muted"}`}>
      {testo}
    </p>
  );
}
