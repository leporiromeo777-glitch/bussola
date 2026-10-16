import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";

/** Le immagini 3D della mascotte (le stesse del sito, public/mascotte). */
const IMMAGINI = {
  coppia: { sorgente: require("../../assets/mascotte/coppia.webp"), rapporto: 720 / 715 },
  bussolina: { sorgente: require("../../assets/mascotte/bussolina.webp"), rapporto: 540 / 720 },
  checklist: { sorgente: require("../../assets/mascotte/checklist.webp"), rapporto: 718 / 720 },
  pensa: { sorgente: require("../../assets/mascotte/pensa.webp"), rapporto: 720 / 703 },
  festa: { sorgente: require("../../assets/mascotte/festa.webp"), rapporto: 720 / 654 },
  scrivania: { sorgente: require("../../assets/mascotte/scrivania.webp"), rapporto: 635 / 720 },
  "outfit-cappellino-nero": { sorgente: require("../../assets/mascotte/outfit-cappellino-nero.webp"), rapporto: 573 / 720 },
  "outfit-cappellino-beige": { sorgente: require("../../assets/mascotte/outfit-cappellino-beige.webp"), rapporto: 528 / 720 },
  "outfit-pescatore-verde": { sorgente: require("../../assets/mascotte/outfit-pescatore-verde.webp"), rapporto: 555 / 720 },
  "outfit-berretto-ruggine": { sorgente: require("../../assets/mascotte/outfit-berretto-ruggine.webp"), rapporto: 537 / 720 },
  "outfit-occhiali-sole": { sorgente: require("../../assets/mascotte/outfit-occhiali-sole.webp"), rapporto: 554 / 720 },
  "outfit-occhiali-tondi": { sorgente: require("../../assets/mascotte/outfit-occhiali-tondi.webp"), rapporto: 557 / 720 },
  "outfit-occhiali-vista": { sorgente: require("../../assets/mascotte/outfit-occhiali-vista.webp"), rapporto: 549 / 720 },
  "outfit-sciarpa-verde": { sorgente: require("../../assets/mascotte/outfit-sciarpa-verde.webp"), rapporto: 539 / 720 },
  "outfit-inverno": { sorgente: require("../../assets/mascotte/outfit-inverno.webp"), rapporto: 537 / 720 },
} as const;

export type NomeImmagine = keyof typeof IMMAGINI;

/** Immagine decorativa della mascotte (il testo accanto dice già tutto). */
export function ImmagineMascotte({
  nome,
  larghezza,
  style,
}: {
  nome: NomeImmagine;
  larghezza: number;
  style?: StyleProp<ImageStyle>;
}) {
  const { sorgente, rapporto } = IMMAGINI[nome];
  return (
    <Image
      source={sorgente}
      style={[{ width: larghezza, height: larghezza / rapporto }, style]}
      contentFit="contain"
      accessible={false}
      transition={150}
    />
  );
}
