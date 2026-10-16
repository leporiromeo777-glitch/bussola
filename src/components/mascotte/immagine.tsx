import Image from "next/image";
import { sito } from "@/lib/sito";

const M = sito.mascotte;

/** Immagini 3D della mascotte in public/mascotte (WebP con sfondo trasparente). */
const IMMAGINI = {
  coppia: { w: 720, h: 715, alt: `${M} che saluta, con la bussolina accanto` },
  bussolina: { w: 540, h: 720, alt: `La bussolina, la piccola amica di ${M}` },
  checklist: { w: 718, h: 720, alt: `${M} con una checklist e la bussolina che indica il prossimo passo` },
  pensa: { w: 720, h: 703, alt: `${M} che riflette, e la bussolina con un punto di domanda` },
  festa: { w: 720, h: 654, alt: `${M} che festeggia la prima fattura con la bussolina` },
  scrivania: { w: 635, h: 720, alt: `${M} al computer con la bussolina sulla scrivania` },
  "outfit-cappellino-nero": { w: 573, h: 720, alt: `${M} con il cappellino nero al contrario` },
  "outfit-cappellino-beige": { w: 528, h: 720, alt: `${M} con il cappellino beige` },
  "outfit-pescatore-verde": { w: 555, h: 720, alt: `${M} con il cappello da pescatore verde` },
  "outfit-berretto-ruggine": { w: 537, h: 720, alt: `${M} con il berretto color ruggine` },
  "outfit-occhiali-sole": { w: 554, h: 720, alt: `${M} con gli occhiali da sole` },
  "outfit-occhiali-tondi": { w: 557, h: 720, alt: `${M} con gli occhiali tondi colorati` },
  "outfit-occhiali-vista": { w: 549, h: 720, alt: `${M} con gli occhiali da vista` },
  "outfit-sciarpa-verde": { w: 539, h: 720, alt: `${M} con la sciarpa verde` },
  "outfit-inverno": { w: 537, h: 720, alt: `${M} con berretto blu, occhiali da sole e sciarpa` },
} as const;

export type NomeImmagine = keyof typeof IMMAGINI;

/**
 * Un'immagine della mascotte. Decorativa per default (alt vuoto): quasi sempre
 * accompagna un testo che dice già tutto. Con `descrivi` usa il testo alternativo.
 */
export function ImmagineMascotte({
  nome,
  className,
  sizes = "(min-width: 768px) 320px, 60vw",
  priority = false,
  descrivi = false,
}: {
  nome: NomeImmagine;
  className?: string;
  sizes?: string;
  priority?: boolean;
  descrivi?: boolean;
}) {
  const { w, h, alt } = IMMAGINI[nome];
  return (
    <Image
      src={`/mascotte/${nome}.webp`}
      width={w}
      height={h}
      alt={descrivi ? alt : ""}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
