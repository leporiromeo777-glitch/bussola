import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { eIdPasso, trovaPasso } from "@/data/passi";
import { ElencoFonti, NotaInformazione, Pillola, Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { segnaPasso, usePassiFatti, usePercorso } from "~/lib/stato";
import { SPAZIO } from "~/lib/tema";

export default function DettaglioPasso() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dati = usePercorso();
  const fatti = usePassiFatti();
  const voce = dati?.percorso.passi.find((p) => p.passo.id === id);
  const passo = voce?.passo ?? trovaPasso(id ?? "");

  if (!passo || !eIdPasso(passo.id)) {
    return (
      <Schermata>
        <Testo variante="titolo">Passo non trovato</Testo>
        <Pulsante titolo="Torna al percorso" onPress={() => router.back()} />
      </Schermata>
    );
  }
  const idPasso = passo.id;
  const fatto = fatti.has(idPasso);

  return (
    <Schermata>
      <Stack.Screen options={{ title: "" }} />
      <Testo variante="titolo">{passo.titolo}</Testo>
      {voce ? (
        <View style={{ gap: SPAZIO.s }}>
          <Pillola testo={voce.stato === "da_fare" ? "Da fare" : voce.stato === "facoltativo" ? "Facoltativo" : "Non ti riguarda"} tono={voce.stato === "da_fare" ? "marchio" : "neutro"} />
          <Testo attenuato>{voce.perche}</Testo>
        </View>
      ) : null}

      <Testo>{passo.descrizione}</Testo>

      {voce && voce.note.length > 0 ? (
        <Scheda tenue>
          <Testo variante="forte">Nella tua situazione</Testo>
          {voce.note.map((n) => (
            <Testo key={n}>• {n}</Testo>
          ))}
        </Scheda>
      ) : null}

      <Scheda>
        <Testo variante="sottotitolo">Cosa fare</Testo>
        {passo.cosaFare.map((c, i) => (
          <View key={c} style={{ flexDirection: "row", gap: SPAZIO.s }}>
            <Testo variante="forte" style={{ width: 22 }}>
              {i + 1}.
            </Testo>
            <Testo style={{ flex: 1 }}>{c}</Testo>
          </View>
        ))}
        {passo.tempoStimato ? (
          <Testo variante="piccolo" attenuato>
            Tempo indicativo: {passo.tempoStimato}
          </Testo>
        ) : null}
        {passo.costoNoto ? (
          <Testo variante="piccolo" attenuato>
            Costo: {passo.costoNoto.testo}
          </Testo>
        ) : null}
      </Scheda>

      <Pulsante titolo={passo.link.etichetta} icona="open-outline" onPress={() => void apriLink(passo.link.url)} />
      <Pulsante
        titolo="Chiedi a Bleo"
        variante="secondario"
        icona="chatbubbles-outline"
        onPress={() => router.push({ pathname: "/chat", params: { domanda: passo.domandaChat } })}
      />
      <Pulsante
        titolo={fatto ? "Segnato come fatto ✓" : "Segna come fatto"}
        variante={fatto ? "secondario" : "principale"}
        onPress={() => segnaPasso(idPasso, !fatto)}
        suggerimento={fatto ? "Tocca per togliere il segno" : undefined}
      />

      <ElencoFonti fonti={passo.fonti} verificatoIl={passo.verificatoIl} />
      <NotaInformazione />
    </Schermata>
  );
}
