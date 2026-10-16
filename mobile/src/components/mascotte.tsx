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
