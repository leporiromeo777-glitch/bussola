/**
 * «Fondare una Sagl» nell'app, a passi, come la pagina del sito
 * (/strumenti/sagl): società, capitale e quote, soci, chi dirige, banca e
 * revisione, e alla fine i controlli con i due PDF da portare al notaio e
 * al fiduciario (scheda di preparazione e bozza dello statuto). Stessi
 * controlli, testi e fonti del sito (src/lib/fondazione-sagl). I dati
 * restano sul telefono, come sul sito restano nel browser.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { AccessibilityInfo, View, type ScrollView } from "react-native";
import { PASSI_SAGL, controlliPerPasso, type ControlliPasso, type IdPassoSagl } from "@/lib/fondazione-sagl/passi";
import { ImmagineMascotte } from "~/components/mascotte";
import {
  ControlliDelPasso,
  DatiSulTelefono,
  ElencoControlli,
  IndicePassi,
  Navigazione,
  PassoBanca,
  PassoCapitale,
  PassoDirezione,
  PassoSocieta,
  PassoSoci,
  type Aggiorna,
} from "~/components/sagl/passi";
import { NotaNonConsulenza, SchermataScorrevole } from "~/components/strumenti-comuni";
import { Pulsante, Scheda, Testo } from "~/components/ui";
import { avvisa, chiediConferma } from "~/lib/conferma";
import { PDF_SAGL_DISPONIBILE, cancellaDatiSagl, condividiPdfSagl, stampaPdfSagl, useDatiSagl, type QualePdf } from "~/lib/sagl";
import { oggiLocale } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

export default function FondareSagl() {
  const scorri = useRef<ScrollView>(null);
  const [dati, aggiorna] = useDatiSagl();
  const [passo, setPasso] = useState(0);
  const [visitati, setVisitati] = useState<ReadonlySet<number>>(() => new Set([0]));
  const controlli = useMemo(() => controlliPerPasso(dati), [dati]);
  const id = PASSI_SAGL[passo].id;

  function vai(indice: number) {
    setPasso(indice);
    setVisitati((v) => new Set([...v, passo, indice]));
    scorri.current?.scrollTo({ y: 0, animated: false });
    AccessibilityInfo.announceForAccessibility(`Passo ${indice + 1} di ${PASSI_SAGL.length}: ${PASSI_SAGL[indice].titolo}`);
  }

  function cancella() {
    chiediConferma({
      titolo: "Cancellare i dati della Sagl?",
      messaggio: "Società, quote, soci e gerenti scritti qui spariscono da questo telefono.",
      conferma: "Sì, cancella",
      pericolo: true,
      onConferma: () => {
        cancellaDatiSagl();
        setVisitati(new Set([0]));
        vai(0);
      },
    });
  }

  return (
    <SchermataScorrevole rif={scorri}>
      <Stack.Screen options={{ title: "Fondare una Sagl" }} />
      {passo === 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
          <ImmagineMascotte nome="coppia" larghezza={88} />
          <Testo attenuato style={{ flex: 1 }}>
            Scrivi i dati della società e dei soci. Bleo controlla le regole della legge e prepara due PDF da portare al
            notaio e al fiduciario: la scheda di preparazione e una bozza dello statuto.
          </Testo>
        </View>
      ) : null}

      <IndicePassi passo={passo} visitati={visitati} controlli={controlli} onVai={vai} />
      <Testo variante="titolo">{PASSI_SAGL[passo].titolo}</Testo>

      <Passo id={id} dati={dati} aggiorna={aggiorna} controlli={controlli} onVai={vai} />
      {id !== "documenti" ? <ControlliDelPasso controlli={controlli[id]} /> : null}
      <Navigazione passo={passo} onVai={vai} />

      {passo === 0 || id === "documenti" ? <DatiSulTelefono onCancella={cancella} /> : null}
      <NotaNonConsulenza />
    </SchermataScorrevole>
  );
}

function Passo({
  id,
  dati,
  aggiorna,
  controlli,
  onVai,
}: {
  id: IdPassoSagl;
  dati: ReturnType<typeof useDatiSagl>[0];
  aggiorna: Aggiorna;
  controlli: Record<IdPassoSagl, ControlliPasso>;
  onVai: (indice: number) => void;
}) {
  switch (id) {
    case "societa":
      return <PassoSocieta dati={dati} aggiorna={aggiorna} />;
    case "capitale":
      return <PassoCapitale dati={dati} aggiorna={aggiorna} />;
    case "soci":
      return <PassoSoci dati={dati} aggiorna={aggiorna} />;
    case "direzione":
      return <PassoDirezione dati={dati} aggiorna={aggiorna} />;
    case "banca":
      return <PassoBanca dati={dati} aggiorna={aggiorna} />;
    case "documenti":
      return <PassoDocumenti dati={dati} controlli={controlli} onVai={onVai} />;
  }
}

/** L'ultimo passo: tutti i controlli, raggruppati per passo, e i due PDF. */
function PassoDocumenti({
  dati,
  controlli,
  onVai,
}: {
  dati: ReturnType<typeof useDatiSagl>[0];
  controlli: Record<IdPassoSagl, ControlliPasso>;
  onVai: (indice: number) => void;
}) {
  const c = useColori();
  const [attesa, setAttesa] = useState<`${QualePdf}-${"condividi" | "stampa"}` | null>(null);
  const [stato, setStato] = useState("");
  const { errori, avvisi } = controlli.documenti;

  async function pdf(quale: QualePdf, azione: "condividi" | "stampa") {
    setAttesa(`${quale}-${azione}`);
    setStato("Preparo il PDF…");
    try {
      if (azione === "condividi") await condividiPdfSagl(quale, dati, oggiLocale());
      else await stampaPdfSagl(quale, dati, oggiLocale());
      setStato(quale === "scheda" ? "Scheda pronta." : "Bozza dello statuto pronta.");
    } catch {
      setStato("");
      // Chiudere la stampa senza stampare non è un errore da mostrare.
      if (azione === "condividi") avvisa("PDF non creato", "Non sono riuscito a creare il PDF. Riprova.");
    } finally {
      setAttesa(null);
    }
  }

  return (
    <View style={{ gap: SPAZIO.l }}>
      <Scheda style={{ gap: SPAZIO.m }}>
        <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "center" }}>
          <Ionicons
            name={errori.length ? "alert-circle-outline" : "checkmark-circle"}
            size={24}
            color={errori.length ? c.accento : c.marchio}
          />
          <Testo variante="sottotitolo" style={{ flex: 1 }}>
            {errori.length === 0 ? "I dati tornano con la legge" : `Da completare (${errori.length})`}
          </Testo>
        </View>
        {errori.length + avvisi.length === 0 ? (
          <Testo attenuato>Nessun problema trovato. Fate comunque controllare tutto al notaio.</Testo>
        ) : (
          PASSI_SAGL.map((p, i) => {
            if (p.id === "documenti") return null;
            const delPasso = controlli[p.id];
            if (delPasso.errori.length + delPasso.avvisi.length === 0) return null;
            return (
              <View key={p.id} style={{ gap: SPAZIO.xs }}>
                <Testo variante="forte">
                  {i + 1}. {p.titolo}
                </Testo>
                <ElencoControlli controlli={delPasso} />
                <Pulsante
                  titolo={`Vai al passo ${i + 1}`}
                  variante="testo"
                  icona="arrow-forward"
                  onPress={() => onVai(i)}
                  style={{ alignSelf: "flex-start" }}
                />
              </View>
            );
          })
        )}
      </Scheda>

      <DocumentoPdf
        titolo="Scheda di preparazione"
        descrizione="I dati da portare al notaio e al fiduciario, cosa manca e i prossimi passi della check list del Portale PMI. Si può creare anche incompleta: segna cosa manca."
        quale="scheda"
        attesa={attesa}
        onPdf={(azione) => void pdf("scheda", azione)}
      />
      <DocumentoPdf
        titolo="Bozza dello statuto"
        descrizione={
          errori.length > 0
            ? "Si crea quando i dati tornano: prima sistema quello che manca qui sopra."
            : "Solo quello che la legge chiede in ogni statuto e chi dirige, con l'articolo di legge accanto. Da far controllare al notaio: non è un documento ufficiale."
        }
        quale="statuto"
        bloccato={errori.length > 0}
        attesa={attesa}
        onPdf={(azione) => void pdf("statuto", azione)}
      />
      <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
        {stato}
      </Testo>
      <Scheda tenue>
        <Testo>
          L&apos;atto di fondazione è un atto pubblico: lo prepara il notaio. Portagli la scheda e la bozza, e per il vostro caso
          chiedete a un fiduciario autorizzato.
        </Testo>
      </Scheda>
    </View>
  );
}

function DocumentoPdf({
  titolo,
  descrizione,
  quale,
  bloccato,
  attesa,
  onPdf,
}: {
  titolo: string;
  descrizione: string;
  quale: QualePdf;
  bloccato?: boolean;
  attesa: string | null;
  onPdf: (azione: "condividi" | "stampa") => void;
}) {
  return (
    <Scheda style={{ gap: SPAZIO.m }}>
      <View style={{ gap: SPAZIO.xs }}>
        <Testo variante="sottotitolo">{titolo}</Testo>
        <Testo attenuato>{descrizione}</Testo>
      </View>
      {PDF_SAGL_DISPONIBILE ? (
        <>
          <Pulsante
            titolo="Condividi il PDF"
            icona="share-outline"
            caricamento={attesa === `${quale}-condividi`}
            disabilitato={bloccato || attesa !== null}
            onPress={() => onPdf("condividi")}
            suggerimento={`Crea il PDF «${titolo}» e lo manda a un'altra app`}
          />
          <Pulsante
            titolo="Guarda o stampa"
            variante="secondario"
            icona="print-outline"
            caricamento={attesa === `${quale}-stampa`}
            disabilitato={bloccato || attesa !== null}
            onPress={() => onPdf("stampa")}
          />
        </>
      ) : (
        <Testo variante="piccolo" attenuato>
          Il PDF si crea nell&apos;app sul telefono.
        </Testo>
      )}
    </Scheda>
  );
}
