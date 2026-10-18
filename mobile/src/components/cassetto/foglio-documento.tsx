import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { LUNGHEZZE_CASSETTO } from "@/lib/cassetto/limiti";
import { isoDaDataScritta } from "@/lib/cassetto/scadenze";
import { TIPI_DOCUMENTO, etichettaTipoDocumento, type DocumentoCassetto, type TipoDocumento } from "@/lib/cassetto/tipi";
import { byteDaBase64, formatoMegabyte } from "@/lib/lettera/richiesta";
import { CampoTesto, Scelta } from "~/components/campi";
import { Pulsante, Scheda, Testo } from "~/components/ui";
import type { CampiDocumento, FileDocumento } from "~/lib/cassetto";
import { chiediConferma } from "~/lib/conferma";
import { SPAZIO, useColori } from "~/lib/tema";
import { NotaPermesso } from "./scheda-documento";

export type ContenutoFoglio =
  | { modo: "nuovo"; file: FileDocumento }
  | { modo: "modifica"; documento: DocumentoCassetto };

type Bozza = { titolo: string; tipo: TipoDocumento; scadenza: string; nota: string };
type Errori = Partial<Record<"titolo" | "scadenza", string>>;

const ETICHETTE = new Set<string>(TIPI_DOCUMENTO.map((t) => t.etichetta));

function bozzaDa(contenuto: ContenutoFoglio): Bozza {
  if (contenuto.modo === "nuovo") {
    return { titolo: etichettaTipoDocumento("decisione_avs"), tipo: "decisione_avs", scadenza: "", nota: "" };
  }
  const d = contenuto.documento;
  return { titolo: d.titolo, tipo: d.tipo, scadenza: d.scadeIl ? dataSvizzera(d.scadeIl) : "", nota: d.nota ?? "" };
}

function valida(bozza: Bozza): { errori: Errori; campi: CampiDocumento | null } {
  const errori: Errori = {};
  const titolo = bozza.titolo.trim();
  if (!titolo) errori.titolo = "Scrivi un nome per il documento, per esempio «Polizza RC».";
  const scritta = bozza.scadenza.trim();
  const scadeIl = scritta ? isoDaDataScritta(scritta) : null;
  if (scritta && !scadeIl) errori.scadenza = "Scrivi la data così: 19.10.2027. Lascia vuoto se il documento non scade.";
  if (Object.keys(errori).length > 0) return { errori, campi: null };
  return {
    errori,
    campi: {
      titolo: titolo.slice(0, LUNGHEZZE_CASSETTO.titolo),
      tipo: bozza.tipo,
      scadeIl,
      nota: bozza.nota.trim().slice(0, LUNGHEZZE_CASSETTO.nota) || null,
    },
  };
}

/** Foglio che sale dal basso: dati di un documento nuovo (dopo aver scelto il file) o da correggere. */
export function FoglioDocumento({
  contenuto,
  onChiudi,
  onSalva,
  onElimina,
}: {
  contenuto: ContenutoFoglio | null;
  onChiudi: () => void;
  /** Restituisce true se il salvataggio è andato a buon fine. */
  onSalva: (contenuto: ContenutoFoglio, campi: CampiDocumento) => Promise<boolean>;
  onElimina: (documento: DocumentoCassetto) => void;
}) {
  const c = useColori();
  return (
    <Modal visible={contenuto !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onChiudi}>
      {contenuto ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: c.sfondo }}
          contentContainerStyle={{ padding: SPAZIO.l, paddingBottom: SPAZIO.xxl * 2, gap: SPAZIO.l }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Testo variante="titolo">{contenuto.modo === "nuovo" ? "Nuovo documento" : "Modifica"}</Testo>
            <Pulsante titolo="Chiudi" variante="testo" onPress={onChiudi} />
          </View>
          <Modulo
            key={contenuto.modo === "nuovo" ? `nuovo-${contenuto.file.dati.length}` : contenuto.documento.id}
            contenuto={contenuto}
            onSalva={(campi) => onSalva(contenuto, campi)}
            onAnnulla={onChiudi}
          />
          {contenuto.modo === "modifica" ? (
            <Pulsante
              titolo="Elimina questo documento"
              variante="testo"
              onPress={() =>
                chiediConferma({
                  titolo: "Eliminare questo documento?",
                  messaggio: "Lo togliamo dal cassetto e cancelliamo anche il file, per sempre.",
                  conferma: "Elimina",
                  pericolo: true,
                  onConferma: () => {
                    onChiudi();
                    onElimina(contenuto.documento);
                  },
                })
              }
            />
          ) : null}
        </ScrollView>
      ) : null}
    </Modal>
  );
}

function Modulo({
  contenuto,
  onSalva,
  onAnnulla,
}: {
  contenuto: ContenutoFoglio;
  onSalva: (campi: CampiDocumento) => Promise<boolean>;
  onAnnulla: () => void;
}) {
  const c = useColori();
  const [bozza, setBozza] = useState<Bozza>(() => bozzaDa(contenuto));
  const [errori, setErrori] = useState<Errori>({});
  const [attesa, setAttesa] = useState(false);

  function cambiaTipo(tipo: TipoDocumento) {
    setBozza((b) => ({
      ...b,
      tipo,
      // Il nome segue il tipo finché non lo scrivi tu.
      titolo: !b.titolo.trim() || ETICHETTE.has(b.titolo.trim()) ? (tipo === "altro" ? "" : etichettaTipoDocumento(tipo)) : b.titolo,
    }));
  }

  async function salva() {
    const esito = valida(bozza);
    setErrori(esito.errori);
    if (!esito.campi) return;
    setAttesa(true);
    await onSalva(esito.campi);
    setAttesa(false);
  }

  return (
    <View style={{ gap: SPAZIO.l }}>
      {contenuto.modo === "nuovo" ? (
        <Scheda tenue style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
          <Ionicons
            name={contenuto.file.tipo === "application/pdf" ? "document-outline" : "image-outline"}
            size={22}
            color={c.marchio}
          />
          <View style={{ flex: 1 }}>
            <Testo variante="forte">{contenuto.file.tipo === "application/pdf" ? "PDF pronto" : "Foto pronta"}</Testo>
            <Testo variante="piccolo" attenuato>
              {[contenuto.file.tipo === "application/pdf" ? contenuto.file.nomeFile : null, formatoMegabyte(byteDaBase64(contenuto.file.dati) ?? 0)]
                .filter(Boolean)
                .join(" · ")}
            </Testo>
          </View>
        </Scheda>
      ) : (
        <Testo variante="piccolo" attenuato>
          Il file resta lo stesso. Per cambiarlo, elimina il documento e caricalo di nuovo.
        </Testo>
      )}
      <Scelta
        etichetta="Che documento è?"
        opzioni={TIPI_DOCUMENTO.map((t) => ({ valore: t.id as TipoDocumento, etichetta: t.etichetta }))}
        valore={bozza.tipo}
        onCambia={cambiaTipo}
      />
      {bozza.tipo === "permesso" ? <NotaPermesso /> : null}
      <CampoTesto
        etichetta="Nome"
        valore={bozza.titolo}
        onCambia={(titolo) => setBozza((b) => ({ ...b, titolo }))}
        segnaposto="Per esempio: Polizza RC aziendale"
        errore={errori.titolo}
      />
      <CampoTesto
        etichetta="Scade il (facoltativo)"
        valore={bozza.scadenza}
        onCambia={(scadenza) => setBozza((b) => ({ ...b, scadenza }))}
        segnaposto="19.10.2027"
        tastiera="numbers-and-punctuation"
        aiuto="Giorno.mese.anno. Lascia vuoto se il documento non scade."
        errore={errori.scadenza}
      />
      <CampoTesto
        etichetta="Nota (facoltativa)"
        valore={bozza.nota}
        onCambia={(nota) => setBozza((b) => ({ ...b, nota }))}
        segnaposto="Per esempio: numero di polizza, a chi chiedere il rinnovo"
        righe={3}
      />
      <Pulsante
        titolo={contenuto.modo === "nuovo" ? "Salva nel cassetto" : "Salva le modifiche"}
        onPress={() => void salva()}
        caricamento={attesa}
      />
      <Pulsante titolo="Annulla" variante="secondario" onPress={onAnnulla} disabilitato={attesa} />
    </View>
  );
}

