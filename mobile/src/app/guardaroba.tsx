import { View } from "react-native";
import { CAPPELLI, descriviVestito, OCCHIALI, SCIARPE, VESTITO_PREDEFINITO } from "@/lib/mascotte/vestito";
import { Scelta } from "~/components/campi";
import { MascotteSvg } from "~/components/mascotte-svg";
import { Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { salvaVestito, useVestito } from "~/lib/stato";
import { SPAZIO } from "~/lib/tema";

function opzioni<T extends string>(valori: Record<T, string>) {
  return (Object.keys(valori) as T[]).map((valore) => ({ valore, etichetta: valori[valore] }));
}

/** Vesti Bleo: cappello, occhiali e sciarpa si combinano. */
export default function Guardaroba() {
  const vestito = useVestito();
  return (
    <Schermata>
      <Scheda tenue style={{ alignItems: "center" }}>
        <MascotteSvg vestito={vestito} larghezza={220} />
        <Testo attenuato accessibilityLiveRegion="polite">
          Bleo {descriviVestito(vestito)}
        </Testo>
      </Scheda>
      <View style={{ gap: SPAZIO.l }}>
        <Scelta
          etichetta="Cappello"
          opzioni={opzioni(CAPPELLI)}
          valore={vestito.cappello}
          onCambia={(cappello) => salvaVestito({ ...vestito, cappello })}
        />
        <Scelta
          etichetta="Occhiali"
          opzioni={opzioni(OCCHIALI)}
          valore={vestito.occhiali}
          onCambia={(occhiali) => salvaVestito({ ...vestito, occhiali })}
        />
        <Scelta
          etichetta="Sciarpa"
          opzioni={opzioni(SCIARPE)}
          valore={vestito.sciarpa}
          onCambia={(sciarpa) => salvaVestito({ ...vestito, sciarpa })}
        />
      </View>
      <Pulsante titolo="Togli tutto" variante="testo" onPress={() => salvaVestito(VESTITO_PREDEFINITO)} />
    </Schermata>
  );
}
