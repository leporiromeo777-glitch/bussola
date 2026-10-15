export const FUSO_ORARIO = "Europe/Zurich";

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Data in formato svizzero: "2026-10-19" → "19.10.2026".
 * Un istante (Date o stringa ISO completa) si legge nell'ora di Zurigo.
 */
export function formattaData(valore: string | Date): string {
  if (typeof valore === "string") {
    const iso = DATA_ISO.exec(valore);
    if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  }
  const data = typeof valore === "string" ? new Date(valore) : valore;
  if (Number.isNaN(data.getTime())) return "";
  const parti = new Intl.DateTimeFormat("de-CH", {
    timeZone: FUSO_ORARIO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(data);
  const parte = (tipo: string) => parti.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("day")}.${parte("month")}.${parte("year")}`;
}
