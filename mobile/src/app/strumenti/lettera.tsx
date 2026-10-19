/**
 * «Fotografa la lettera»: scatti la foto (o scegli una foto o un PDF) di una
 * lettera di un ufficio e Bleo te la spiega in parole semplici, come sul sito
 * (/strumenti/lettera). Le foto si preparano come le ricevute dei conti
 * (src/lib/ricevute.ts); il sito controlla di nuovo file e limiti. Niente si
 * salva: lettera e spiegazione restano in questa schermata.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Image, View } from "react-native";
import { MESSAGGI_LETTERA, PAGINE_MASSIME_PDF, PESO_MASSIMO_PDF, byteDaBase64, formatoMegabyte } from "@/lib/lettera/richiesta";
import type { SpiegazioneLettera } from "@/lib/lettera/spiegazione";
import { RisultatoLettera } from "~/components/lettera/risultato";
import { ImmagineMascotte } from "~/components/mascotte";
import { Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { apriSito } from "~/lib/apri";
import type { FileRicevuta } from "~/lib/conti";
import { letteraAttiva, spiegaLettera } from "~/lib/lettera";
import { scattaFoto, scegliFoto, scegliPdf, type SceltaFile } from "~/lib/ricevute";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

type Origine = "fotocamera" | "galleria" | "pdf";

const SCEGLI: Record<Origine, () => Promise<SceltaFile>> = {
  fotocamera: () => scattaFoto("lettera.jpg"),
  galleria: () => scegliFoto("lettera.jpg"),
  pdf: scegliPdf,
};

export default function FotografaLettera() {
  const [attiva, setAttiva] = useState<boolean | null>(null);
  const [file, setFile] = useState<{ file: FileRicevuta; origine: Origine } | null>(null);
  const [preparazione, setPreparazione] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [spiegazione, setSpiegazione] = useState<SpiegazioneLettera | null>(null);
  const invio = useRef<AbortController | null>(null);

  useEffect(() => {
    let valido = true;
    void letteraAttiva().then((v) => {
      if (valido) setAttiva(v);
    });
    return () => {
      valido = false;
      // Chiudendo la schermata si interrompe anche la lettura in corso.
      invio.current?.abort();
    };
  }, []);

  async function scegli(origine: Origine) {
    setErrore(null);
    setPreparazione(true);
    const scelta = await SCEGLI[origine]();
    setPreparazione(false);
    if (scelta.ok) setFile({ file: scelta.file, origine });
    else if (!scelta.annullato) setErrore(scelta.messaggio);
  }

  async function invia() {
    if (!file || inCorso) return;
    setErrore(null);
    setInCorso(true);
    const controllo = new AbortController();
    invio.current = controllo;
    const esito = await spiegaLettera(file.file, controllo.signal);
    invio.current = null;
    if (controllo.signal.aborted) return;
    setInCorso(false);
    if (esito.ok) {
      setSpiegazione(esito.spiegazione);
      setFile(null);
      AccessibilityInfo.announceForAccessibility("Ecco la spiegazione della lettera.");
      return;
    }
    if ("annullata" in esito) return;
    setErrore(esito.messaggio);
    // Il sito dice che la funzione è spenta: si mostra il riquadro «non ancora attiva».
    if (esito.messaggio === MESSAGGI_LETTERA.nonAttivo) setAttiva(false);
  }

  function ricomincia() {
    setSpiegazione(null);
    setFile(null);
    setErrore(null);
  }

  if (spiegazione) {
    return (
      <Schermata>
        <RisultatoLettera spiegazione={spiegazione} onAltra={ricomincia} />
      </Schermata>
    );
  }

  return (
    <Schermata>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="pensa" larghezza={88} />
        <Testo attenuato style={{ flex: 1 }}>
          Ti è arrivata una lettera dalla cassa AVS, dalle contribuzioni, dal Comune o da un&apos;assicurazione e non capisci
          cosa vuole? Fotografala: Bleo ti spiega cos&apos;è, cosa ti chiedono, entro quando e cosa fare.
        </Testo>
      </View>

      {attiva === false ? (
        <NonAttiva />
      ) : file ? (
        <FilePronto
          file={file.file}
          origine={file.origine}
          inCorso={inCorso}
          onInvia={() => void invia()}
          onRifai={() => void scegli(file.origine)}
        />
      ) : (
        <SceltaLettera preparazione={preparazione} onScegli={(o) => void scegli(o)} />
      )}

      {errore ? <MessaggioErrore testo={errore} /> : null}
      <TuoiDati />
    </Schermata>
  );
}

function SceltaLettera({ preparazione, onScegli }: { preparazione: boolean; onScegli: (origine: Origine) => void }) {
  const c = useColori();
  return (
    <Scheda evidenziata style={{ gap: SPAZIO.m }}>
      <View style={{ alignItems: "center", gap: SPAZIO.s }}>
        <View
          style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.marchioTenue, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="camera-outline" size={32} color={c.marchio} />
        </View>
        <Testo variante="sottotitolo" style={{ textAlign: "center" }}>
          Fotografa la lettera o carica il PDF
        </Testo>
        <Testo attenuato style={{ textAlign: "center" }}>
          Metti il foglio su un tavolo, con buona luce, e inquadra tutta la pagina.
        </Testo>
      </View>
      <Pulsante
        titolo={preparazione ? "Preparo la foto…" : "Scatta una foto"}
        icona="camera-outline"
        onPress={() => onScegli("fotocamera")}
        disabilitato={preparazione}
        style={{ minHeight: 60 }}
      />
      <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
        <Pulsante
          titolo="Dalla galleria"
          variante="secondario"
          icona="images-outline"
          onPress={() => onScegli("galleria")}
          disabilitato={preparazione}
          style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
        />
        <Pulsante
          titolo="Un PDF"
          variante="secondario"
          icona="document-outline"
          onPress={() => onScegli("pdf")}
          disabilitato={preparazione}
          style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
        />
      </View>
      <Testo variante="piccolo" attenuato style={{ textAlign: "center" }}>
        PDF fino a {formatoMegabyte(PESO_MASSIMO_PDF)} e {PAGINE_MASSIME_PDF} pagine.
      </Testo>
      {preparazione ? (
        <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite" style={{ textAlign: "center" }}>
          Preparo il file…
        </Testo>
      ) : null}
    </Scheda>
  );
}

function FilePronto({
  file,
  origine,
  inCorso,
  onInvia,
  onRifai,
}: {
  file: FileRicevuta;
  origine: Origine;
  inCorso: boolean;
  onInvia: () => void;
  onRifai: () => void;
}) {
  const c = useColori();
  const foto = file.tipo !== "application/pdf";
  const peso = formatoMegabyte(byteDaBase64(file.dati) ?? 0);
  return (
    <Scheda evidenziata style={{ gap: SPAZIO.m }}>
      {foto ? (
        <Image
          source={{ uri: `data:${file.tipo};base64,${file.dati}` }}
          accessibilityLabel="Anteprima della lettera fotografata"
          resizeMode="contain"
          style={{ width: "100%", height: 280, borderRadius: RAGGIO.m, backgroundColor: c.sfondo }}
        />
      ) : (
        <View
          style={{
            alignSelf: "center",
            width: 112,
            height: 112,
            borderRadius: RAGGIO.m,
            backgroundColor: c.marchioTenue,
            alignItems: "center",
            justifyContent: "center",
            gap: SPAZIO.xs,
          }}
        >
          <Ionicons name="document-text-outline" size={40} color={c.marchio} />
          <Testo variante="etichetta" colore={c.marchio}>
            PDF
          </Testo>
        </View>
      )}
      <View style={{ gap: SPAZIO.xs }}>
        <Testo variante="forte">{foto ? "Foto pronta" : "PDF pronto"}</Testo>
        <Testo variante="piccolo" attenuato numberOfLines={1}>
          {foto ? `Ridotta a ${peso}` : `${peso}${file.nomeFile ? ` · ${file.nomeFile}` : ""}`}
        </Testo>
        <Testo variante="piccolo" attenuato>
          Si legge bene? Deve vedersi tutta la pagina, dritta e a fuoco, soprattutto date e importi.
        </Testo>
      </View>
      <Pulsante
        titolo={inCorso ? "Bleo sta leggendo…" : "Spiegami la lettera"}
        icona="arrow-forward"
        caricamento={inCorso}
        onPress={onInvia}
        style={{ minHeight: 60 }}
      />
      <Pulsante
        titolo={origine === "fotocamera" ? "Rifai la foto" : origine === "galleria" ? "Scegli un'altra foto" : "Scegli un altro PDF"}
        variante="secondario"
        onPress={onRifai}
        disabilitato={inCorso}
      />
      {inCorso ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s }} accessibilityLiveRegion="polite">
          <ActivityIndicator color={c.marchio} />
          <Testo variante="piccolo" attenuato style={{ flex: 1 }}>
            Bleo sta leggendo la lettera. Ci vogliono di solito 10–20 secondi: non chiudere questa schermata.
          </Testo>
        </View>
      ) : null}
    </Scheda>
  );
}

function NonAttiva() {
  return (
    <Scheda style={{ alignItems: "center", gap: SPAZIO.m }}>
      <ImmagineMascotte nome="pensa" larghezza={96} />
      <Testo variante="sottotitolo" style={{ textAlign: "center" }}>
        Questa funzione non è ancora attiva
      </Testo>
      <Testo attenuato style={{ textAlign: "center" }}>
        Presto potrai fotografare le lettere degli uffici e farle spiegare da Bleo. Nel frattempo, se una lettera ti
        preoccupa, chiama l&apos;ufficio che l&apos;ha scritta: il numero di telefono è di solito in alto.
      </Testo>
    </Scheda>
  );
}

function MessaggioErrore({ testo }: { testo: string }) {
  const c = useColori();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={{
        flexDirection: "row",
        gap: SPAZIO.s,
        padding: SPAZIO.m,
        borderRadius: RAGGIO.m,
        borderWidth: 1.5,
        borderColor: c.pericolo,
        backgroundColor: c.scheda,
      }}
    >
      <Ionicons name="alert-circle-outline" size={20} color={c.pericolo} style={{ marginTop: 1 }} />
      <Testo variante="forte" colore={c.pericolo} style={{ flex: 1 }}>
        {testo}
      </Testo>
    </View>
  );
}

function TuoiDati() {
  return (
    <Scheda tenue>
      <Testo variante="forte">I tuoi dati</Testo>
      <Testo>
        La foto o il PDF li legge solo l&apos;intelligenza artificiale che usa Bleo (Claude, di Anthropic) per spiegarti la
        lettera. Bleo non li salva: lettera e spiegazione restano in questa schermata finché non la chiudi.
      </Testo>
      <Testo variante="piccolo" attenuato>
        Se vuoi, prima di scattare copri con un foglio il numero AVS e le coordinate bancarie (IBAN): per capire la lettera
        non servono.
      </Testo>
      <Pulsante
        titolo="Informativa sulla privacy"
        variante="testo"
        icona="open-outline"
        onPress={() => void apriSito("/privacy")}
        style={{ alignSelf: "flex-start" }}
      />
    </Scheda>
  );
}
