/**
 * «Il corso di Bleo»: tutte le lezioni video nell'ordine del percorso, come
 * sul sito (/corso). Chiuse, mostrano numero, titolo e durata; toccandone una
 * compaiono il video (si scarica solo quando lo avvii), i video facoltativi,
 * le fonti e il link al passo. Le lezioni dei passi già fatti hanno il segno.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { durataBreve } from "@/data/corso";
import { corsoPerFasi, riepilogoCorso, type VoceCorso } from "@/lib/corso/elenco";
import { LettoreVideo, VideoFacoltativi } from "~/components/lezione-video";
import { ImmagineMascotte } from "~/components/mascotte";
import { ElencoFonti, Pillola, Pulsante, Schermata, Scheda, Separatore, Testo, tocco } from "~/components/ui";
import { usePassiFatti } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

export default function Corso() {
  const fatti = usePassiFatti();
  const fasi = useMemo(() => corsoPerFasi(fatti), [fatti]);
  const riepilogo = riepilogoCorso(fasi);
  const [aperte, setAperte] = useState<ReadonlySet<string>>(() => new Set());

  function cambia(id: string) {
    setAperte((attuali) => {
      const nuove = new Set(attuali);
      if (nuove.has(id)) nuove.delete(id);
      else nuove.add(id);
      return nuove;
    });
  }

  return (
    <Schermata>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="checklist" larghezza={96} />
        <View style={{ flex: 1, gap: SPAZIO.xs }}>
          <Testo variante="sottotitolo">Un video breve per ogni passo</Testo>
          <Testo attenuato>
            Bleo ti spiega ogni passo del percorso in pochi minuti, con i sottotitoli e il link alla fonte ufficiale.
          </Testo>
        </View>
      </View>
      <Testo variante="piccolo" attenuato>
        {riepilogo.lezioni === 1 ? "1 lezione" : `${riepilogo.lezioni} lezioni`}
        {riepilogo.videoFacoltativi > 0
          ? ` e ${riepilogo.videoFacoltativi === 1 ? "1 video facoltativo" : `${riepilogo.videoFacoltativi} video facoltativi`}`
          : ""}
        . Tocca una lezione per vedere il video.
        {riepilogo.fatte > 0
          ? ` In verde le lezioni dei passi che hai già fatto (${riepilogo.fatte} su ${riepilogo.lezioni}).`
          : ""}
      </Testo>

      {fasi.map((fase) => (
        <View key={fase.fase} style={{ gap: SPAZIO.s }}>
          <Testo variante="sottotitolo">{fase.titolo}</Testo>
          <Scheda style={{ paddingVertical: SPAZIO.xs, gap: 0 }}>
            {fase.voci.map((voce, i) => (
              <View key={voce.passo.id}>
                {i > 0 ? <Separatore /> : null}
                <Lezione voce={voce} aperta={aperte.has(voce.passo.id)} onCambia={() => cambia(voce.passo.id)} />
              </View>
            ))}
          </Scheda>
        </View>
      ))}

      <Testo variante="piccolo" attenuato>
        Le lezioni danno informazioni generali con le fonti ufficiali, non una consulenza personale. Per il tuo caso
        rivolgiti a un fiduciario autorizzato.
      </Testo>
    </Schermata>
  );
}

function vaiAlPasso(id: string) {
  router.push({ pathname: "/passo/[id]", params: { id } });
}

function Lezione({ voce, aperta, onCambia }: { voce: VoceCorso; aperta: boolean; onCambia: () => void }) {
  const c = useColori();
  const { lezione, passo, numero, fatto } = voce;
  const facoltativi = lezione?.approfondimenti?.length ?? 0;

  if (!lezione) {
    return (
      <Pressable
        onPress={() => vaiAlPasso(passo.id)}
        accessibilityRole="button"
        accessibilityLabel={`Lezione ${numero}: ${passo.titolo}. In arrivo`}
        accessibilityHint="Apre il passo"
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: SPAZIO.m,
          minHeight: 56,
          paddingVertical: SPAZIO.m,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Numero numero={numero} fatto={fatto} spento />
        <Testo attenuato style={{ flex: 1 }}>
          {passo.titolo}
        </Testo>
        <Pillola testo="In arrivo" />
      </Pressable>
    );
  }

  const dettagli = [durataBreve(lezione.durataSecondi), facoltativi === 1 ? "1 video facoltativo" : facoltativi > 1 ? `${facoltativi} video facoltativi` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <View>
      <Pressable
        onPress={() => {
          tocco();
          onCambia();
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: aperta }}
        accessibilityLabel={`Lezione ${lezione.numero}: ${lezione.titolo}. ${dettagli}${fatto ? ". Passo già fatto" : ""}`}
        accessibilityHint={aperta ? "Chiude la lezione" : "Mostra il video della lezione"}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: SPAZIO.m,
          minHeight: 56,
          paddingVertical: SPAZIO.m,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Numero numero={lezione.numero} fatto={fatto} />
        <View style={{ flex: 1, gap: 2 }}>
          <Testo variante="forte">{lezione.titolo}</Testo>
          <Testo variante="piccolo" attenuato>
            {dettagli}
            {fatto ? (
              <Testo variante="piccolo" colore={c.successo} style={{ fontWeight: "600" }}>
                {" "}
                · ✓ passo fatto
              </Testo>
            ) : null}
          </Testo>
        </View>
        <Ionicons name={aperta ? "chevron-up" : "chevron-down"} size={20} color={c.attenuato} />
      </Pressable>
      {aperta ? (
        <View style={{ gap: SPAZIO.m, paddingBottom: SPAZIO.l }}>
          <LettoreVideo video={lezione} etichetta={`Lezione ${lezione.numero}: ${lezione.titolo}`} />
          <Testo attenuato>{passo.descrizione}</Testo>
          {lezione.approfondimenti?.length ? <VideoFacoltativi approfondimenti={lezione.approfondimenti} /> : null}
          <ElencoFonti fonti={lezione.fonti} verificatoIl={lezione.verificatoIl} />
          <Pulsante
            titolo="Vai al passo"
            variante="secondario"
            icona="arrow-forward"
            onPress={() => vaiAlPasso(passo.id)}
            suggerimento={`Apre il passo «${passo.titolo}»`}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Il numero della lezione in un cerchio, verde se il passo è fatto. */
function Numero({ numero, fatto, spento }: { numero: number; fatto: boolean; spento?: boolean }) {
  const c = useColori();
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: fatto ? c.successo : spento ? "transparent" : c.marchioTenue,
        borderWidth: spento && !fatto ? 1 : 0,
        borderColor: c.bordo,
      }}
    >
      <Testo variante="piccolo" colore={fatto ? c.sulMarchio : spento ? c.attenuato : c.marchio} style={{ fontWeight: "700" }}>
        {numero}
      </Testo>
    </View>
  );
}
