import type { MetadataRoute } from "next";
import { sito } from "@/lib/sito";

const PAGINE: { percorso: string; frequenza: "weekly" | "monthly" | "yearly"; priorita: number }[] = [
  { percorso: "/", frequenza: "weekly", priorita: 1 },
  { percorso: "/questionario", frequenza: "monthly", priorita: 0.8 },
  { percorso: "/percorso", frequenza: "monthly", priorita: 0.6 },
  { percorso: "/chat", frequenza: "monthly", priorita: 0.7 },
  { percorso: "/strumenti", frequenza: "monthly", priorita: 0.7 },
  { percorso: "/privacy", frequenza: "yearly", priorita: 0.3 },
  { percorso: "/impressum", frequenza: "yearly", priorita: 0.3 },
];

/** Ultima modifica dei contenuti pubblici: da aggiornare quando cambiano. */
const AGGIORNATO = new Date("2026-10-15");

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGINE.map(({ percorso, frequenza, priorita }) => ({
    url: new URL(percorso, sito.url).toString(),
    lastModified: AGGIORNATO,
    changeFrequency: frequenza,
    priority: priorita,
  }));
}
