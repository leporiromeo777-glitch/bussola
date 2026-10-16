/**
 * Il look di Bleo: una delle immagini 3D della mascotte (public/mascotte).
 * Sostituisce il vecchio vestito disegnato (cappello, occhiali e sciarpa
 * combinabili, in vestito.ts): le immagini sono intere, quindi si sceglie un
 * look solo. Logica pura, senza dipendenze: la usa anche l'app.
 */
import { analizzaVestito } from "./vestito";

export const LOOK = [
  { id: "classico", etichetta: "Classico", immagine: "coppia" },
  { id: "cappellino-nero", etichetta: "Cappellino nero", immagine: "outfit-cappellino-nero" },
  { id: "cappellino-beige", etichetta: "Cappellino beige", immagine: "outfit-cappellino-beige" },
  { id: "pescatore-verde", etichetta: "Cappello da pescatore", immagine: "outfit-pescatore-verde" },
  { id: "berretto-ruggine", etichetta: "Berretto ruggine", immagine: "outfit-berretto-ruggine" },
  { id: "occhiali-sole", etichetta: "Occhiali da sole", immagine: "outfit-occhiali-sole" },
  { id: "occhiali-tondi", etichetta: "Occhiali tondi", immagine: "outfit-occhiali-tondi" },
  { id: "occhiali-vista", etichetta: "Occhiali da vista", immagine: "outfit-occhiali-vista" },
  { id: "sciarpa-verde", etichetta: "Sciarpa verde", immagine: "outfit-sciarpa-verde" },
  { id: "inverno", etichetta: "Inverno", immagine: "outfit-inverno" },
] as const;

export type IdLook = (typeof LOOK)[number]["id"];
export type ImmagineLook = (typeof LOOK)[number]["immagine"];

export const LOOK_PREDEFINITO: IdLook = "classico";
export const CHIAVE_LOOK = "bleo:mascotte:look";

function eLook(valore: unknown): valore is IdLook {
  return typeof valore === "string" && LOOK.some((l) => l.id === valore);
}

/** Dal vecchio vestito al look più simile, così chi aveva già scelto non perde la scelta. */
export function lookDaVestito(grezzo: string | null): IdLook {
  if (!grezzo) return LOOK_PREDEFINITO;
  const v = analizzaVestito(grezzo);
  if (v.cappello === "berretto-blu") return "inverno";
  if (v.cappello === "cappellino-nero") return "cappellino-nero";
  if (v.cappello === "cappellino-beige") return "cappellino-beige";
  if (v.cappello === "pescatore") return "pescatore-verde";
  if (v.cappello === "berretto-ruggine") return "berretto-ruggine";
  if (v.occhiali === "sole") return "occhiali-sole";
  if (v.occhiali === "tondi") return "occhiali-tondi";
  if (v.occhiali === "vista") return "occhiali-vista";
  if (v.sciarpa !== "nessuna") return "sciarpa-verde";
  return LOOK_PREDEFINITO;
}

/** Il look salvato; senza, quello ricavato dal vecchio vestito; altrimenti il classico. */
export function analizzaLook(grezzo: string | null, vecchioVestito: string | null = null): IdLook {
  if (eLook(grezzo)) return grezzo;
  return lookDaVestito(vecchioVestito);
}

export function datiLook(id: IdLook) {
  return LOOK.find((l) => l.id === id) ?? LOOK[0];
}
