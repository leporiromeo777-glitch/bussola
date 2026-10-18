import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { regolePermessi } from "@/data/svizzera";
import { badgeScadenza, testoDataScadenza } from "@/lib/cassetto/scadenze";
import { etichettaTipoDocumento, type DocumentoCassetto } from "@/lib/cassetto/tipi";
import { formatoMegabyte } from "@/lib/lettera/richiesta";
import { ElencoFonti, Pulsante, Scheda, Testo } from "~/components/ui";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** «Scaduto» (rosso), «Scade tra 12 giorni» (arancio); niente per le scadenze lontane. */
export function BadgeScadenza({ scadeIl, oggi }: { scadeIl: string | null; oggi: string }) {
  const c = useColori();
  const badge = badgeScadenza(scadeIl, oggi);
  if (!badge || badge.tono === "neutro") return null;
  const colore = badge.tono === "pericolo" ? c.pericolo : c.accento;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: RAGGIO.pillola,
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: colore,
      }}
    >
      <Ionicons name={badge.tono === "pericolo" ? "alert-circle" : "time-outline"} size={14} color={c.sulMarchio} />
      <Text style={{ color: c.sulMarchio, fontSize: 13, fontWeight: "700" }}>{badge.testo}</Text>
    </View>
  );
}

/** Il termine per il rinnovo del permesso, con la fonte ufficiale. */
export function NotaPermesso() {
  const rinnovo = regolePermessi.rinnovoPrimaDellaScadenzaGiorni;
  return (
    <Scheda tenue style={{ padding: SPAZIO.m }}>
      <Testo variante="piccolo">
        In Ticino il rinnovo del permesso va chiesto all&apos;Ufficio della migrazione almeno {rinnovo.valore} giorni prima
        della scadenza.
      </Testo>
      <ElencoFonti fonti={[rinnovo.fonte]} verificatoIl={rinnovo.verificatoIl} />
    </Scheda>
  );
}

function descrizioneFile(file: DocumentoCassetto["file"]): string {
  return [file.tipo === "application/pdf" ? "PDF" : "Foto", formatoMegabyte(file.byte)].join(" · ");
}

/** Un documento del cassetto: nome, tipo, scadenza con il badge, nota e i pulsanti. */
export function SchedaDocumento({
  documento: d,
  oggi,
  inApertura,
  onApri,
  onModifica,
}: {
  documento: DocumentoCassetto;
  oggi: string;
  inApertura: boolean;
  onApri: (documento: DocumentoCassetto) => void;
  onModifica: (documento: DocumentoCassetto) => void;
}) {
  return (
    <Scheda>
      <View style={{ gap: SPAZIO.xs }}>
        <BadgeScadenza scadeIl={d.scadeIl} oggi={oggi} />
        <Testo variante="forte">{d.titolo}</Testo>
        <Testo variante="piccolo" attenuato>
          {[d.titolo.trim() === etichettaTipoDocumento(d.tipo) ? null : etichettaTipoDocumento(d.tipo), testoDataScadenza(d.scadeIl, oggi)]
            .filter(Boolean)
            .join(" · ")}
        </Testo>
      </View>
      {d.nota ? <Testo variante="piccolo">{d.nota}</Testo> : null}
      <Testo variante="piccolo" attenuato>
        {descrizioneFile(d.file)}
      </Testo>
      {d.tipo === "permesso" ? <NotaPermesso /> : null}
      <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
        <Pulsante
          titolo="Apri"
          variante="secondario"
          icona="open-outline"
          caricamento={inApertura}
          onPress={() => onApri(d)}
          suggerimento={`Apre ${d.titolo}`}
          style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
        />
        <Pulsante
          titolo="Modifica"
          variante="secondario"
          icona="create-outline"
          onPress={() => onModifica(d)}
          suggerimento={`Cambia nome, tipo, scadenza o nota di ${d.titolo}, oppure eliminalo`}
          style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
        />
      </View>
    </Scheda>
  );
}

