import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, Switch, View } from "react-native";
import { DOCUMENTI_MASSIMI, GIORNI_AVVISO_DOCUMENTI } from "@/lib/cassetto/limiti";
import { raggruppaDocumenti } from "@/lib/cassetto/scadenze";
import type { DocumentoCassetto } from "@/lib/cassetto/tipi";
import { FoglioDocumento, type ContenutoFoglio } from "~/components/cassetto/foglio-documento";
import { SchedaDocumento } from "~/components/cassetto/scheda-documento";
import { ImmagineMascotte } from "~/components/mascotte";
import { NotaInformazione, Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import {
  aggiornaDocumento,
  caricaDocumenti,
  creaDocumento,
  eliminaDocumento,
  linkFile,
  salvaScadenzeDocumenti,
  type CampiDocumento,
} from "~/lib/cassetto";
import { avvisa } from "~/lib/conferma";
import { chiediPermesso, riprogrammaNotifiche } from "~/lib/notifiche";
import { scattaFoto, scegliFoto, scegliPdf, type SceltaFile } from "~/lib/ricevute";
import { useSessione } from "~/lib/sessione";
import { impostaPromemoria, oggiLocale, usePromemoriaAttivi } from "~/lib/stato";
import { supabase } from "~/lib/supabase";
import { SPAZIO, useColori } from "~/lib/tema";

const [PRIMO_AVVISO, SECONDO_AVVISO] = GIORNI_AVVISO_DOCUMENTI;

export default function Documenti() {
  const { pronta, sessione } = useSessione();

  if (!supabase()) {
    return (
      <Schermata>
        <Presentazione />
        <Scheda tenue>
          <Testo variante="forte">Serve un account</Testo>
          <Testo>
            In questa versione di prova non c&apos;è l&apos;accesso, quindi il cassetto non può salvare documenti. Documenti
            come il permesso sono personali: Bleo li tiene solo in un account protetto.
          </Testo>
        </Scheda>
        <NotaCassetto />
      </Schermata>
    );
  }
  if (!pronta) return <Schermata>{null}</Schermata>;
  if (!sessione) {
    return (
      <Schermata>
        <Presentazione />
        <Testo attenuato>
          Serve un account: i documenti restano privati, li vedi solo tu e li ritrovi anche sul sito.
        </Testo>
        <Pulsante titolo="Accedi" icona="arrow-forward" onPress={() => router.push("/accedi")} />
        <Testo variante="piccolo" attenuato>
          Ti basta l&apos;email: ti mando un codice, senza password.
        </Testo>
        <NotaCassetto />
      </Schermata>
    );
  }
  return <CassettoUtente />;
}

function Presentazione() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
      <ImmagineMascotte nome="checklist" larghezza={96} />
      <View style={{ flex: 1, gap: SPAZIO.xs }}>
        <Testo variante="sottotitolo">I documenti della tua attività</Testo>
        <Testo attenuato>
          Decisione della cassa AVS, numero IVA, polizze, permesso, contratti: in un posto solo. Ti avviso prima che
          scadano.
        </Testo>
      </View>
    </View>
  );
}

function NotaCassetto() {
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="piccolo" attenuato>
        Il cassetto è una copia comoda: tieni sempre gli originali. I file si aprono solo con un link che vale pochi
        secondi. Se elimini l&apos;account cancelliamo anche il cassetto, file compresi.
      </Testo>
      <NotaInformazione />
    </View>
  );
}

type Errore = { messaggio: string; stato: number | null };

function CassettoUtente() {
  const c = useColori();
  const [documenti, setDocumenti] = useState<DocumentoCassetto[] | null>(null);
  const [errore, setErrore] = useState<Errore | null>(null);
  const [aggiornando, setAggiornando] = useState(false);
  const [foglio, setFoglio] = useState<ContenutoFoglio | null>(null);
  const [invio, setInvio] = useState(false);
  const [inApertura, setInApertura] = useState<string | null>(null);
  const [avviso, setAvviso] = useState("");
  const richiesta = useRef(0);
  const oggi = oggiLocale();

  /** Nuovo elenco: lo mostra, salva le scadenze sul telefono e, se sono cambiate, riprogramma i promemoria. */
  const aggiorna = useCallback((nuovi: DocumentoCassetto[]) => {
    setDocumenti(nuovi);
    if (salvaScadenzeDocumenti(nuovi)) void riprogrammaNotifiche().catch(() => {});
  }, []);

  const carica = useCallback(
    async (modo: "silenzioso" | "tirato" = "silenzioso") => {
      const numero = ++richiesta.current;
      if (modo === "tirato") setAggiornando(true);
      const esito = await caricaDocumenti();
      if (numero !== richiesta.current) return;
      setAggiornando(false);
      if (esito.ok) {
        aggiorna(esito.dati);
        setErrore(null);
      } else {
        setErrore({ messaggio: esito.messaggio, stato: esito.stato });
      }
    },
    [aggiorna],
  );

  // Aggiorna ogni volta che la schermata torna in primo piano.
  useFocusEffect(
    useCallback(() => {
      void carica();
    }, [carica]),
  );

  async function scegli(prendi: () => Promise<SceltaFile>) {
    setAvviso("");
    const scelta = await prendi();
    if (!scelta.ok) {
      if (!scelta.annullato) avvisa("Documento non caricato", scelta.messaggio);
      return;
    }
    setFoglio({ modo: "nuovo", file: scelta.file });
  }

  async function salva(contenuto: ContenutoFoglio, campi: CampiDocumento): Promise<boolean> {
    if (contenuto.modo === "nuovo") {
      setInvio(true);
      richiesta.current++;
      const esito = await creaDocumento(campi, contenuto.file);
      setInvio(false);
      if (!esito.ok) {
        avvisa("Documento non salvato", esito.messaggio);
        return false;
      }
      setFoglio(null);
      aggiorna([esito.dati, ...(documenti ?? []).filter((d) => d.id !== esito.dati.id)]);
      setAvviso(`Fatto: «${esito.dati.titolo}» è nel cassetto.`);
      return true;
    }
    richiesta.current++;
    const esito = await aggiornaDocumento(contenuto.documento.id, campi);
    if (!esito.ok) {
      avvisa("Non è stato possibile salvare", esito.messaggio);
      return false;
    }
    setFoglio(null);
    aggiorna((documenti ?? []).map((d) => (d.id === esito.dati.id ? esito.dati : d)));
    setAvviso(`«${esito.dati.titolo}» aggiornato.`);
    return true;
  }

  async function elimina(documento: DocumentoCassetto) {
    richiesta.current++;
    const prima = documenti ?? [];
    setDocumenti(prima.filter((d) => d.id !== documento.id));
    const esito = await eliminaDocumento(documento.id);
    if (!esito.ok && esito.stato !== 404) {
      setDocumenti(prima);
      avvisa("Non è stato possibile eliminare", esito.messaggio);
      return;
    }
    aggiorna(prima.filter((d) => d.id !== documento.id));
    setAvviso(`«${documento.titolo}» eliminato dal cassetto.`);
  }

  async function apri(documento: DocumentoCassetto) {
    setInApertura(documento.id);
    const esito = await linkFile(documento.id);
    setInApertura(null);
    if (!esito.ok) {
      avvisa("Non riesco ad aprire il documento", esito.messaggio);
      return;
    }
    await apriLink(esito.dati);
  }

  const tirato = <RefreshControl refreshing={aggiornando} onRefresh={() => void carica("tirato")} tintColor={c.marchio} />;
  const pieno = (documenti?.length ?? 0) >= DOCUMENTI_MASSIMI;
  const gruppi = documenti ? raggruppaDocumenti(documenti, oggi) : null;

  return (
    <Schermata refreshControl={tirato}>
      <Scheda evidenziata style={{ gap: SPAZIO.m }}>
        <Testo variante="sottotitolo">Aggiungi un documento</Testo>
        {pieno ? (
          <Testo attenuato>
            Nel cassetto ci sono già {DOCUMENTI_MASSIMI} documenti, il massimo. Elimina quelli che non ti servono più.
          </Testo>
        ) : (
          <>
            <Pulsante
              titolo="Fotografa un documento"
              icona="camera-outline"
              onPress={() => void scegli(() => scattaFoto("documento.jpg"))}
              disabilitato={invio}
              style={{ minHeight: 60 }}
            />
            <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
              <Pulsante
                titolo="Dalla galleria"
                variante="secondario"
                icona="images-outline"
                onPress={() => void scegli(() => scegliFoto("documento.jpg"))}
                disabilitato={invio}
                style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
              />
              <Pulsante
                titolo="Un PDF"
                variante="secondario"
                icona="document-outline"
                onPress={() => void scegli(scegliPdf)}
                disabilitato={invio}
                style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
              />
            </View>
            <Testo variante="piccolo" attenuato>
              Poi scegli che documento è e, se c&apos;è, la data di scadenza.
            </Testo>
          </>
        )}
        {avviso ? (
          <Testo variante="forte" colore={c.marchio} accessibilityLiveRegion="polite">
            {avviso}
          </Testo>
        ) : null}
      </Scheda>

      <InterruttorePromemoria />

      {errore ? <ErroreCassetto errore={errore} onRiprova={() => void carica("tirato")} /> : null}

      {!gruppi ? (
        errore ? null : (
          <View style={{ paddingVertical: SPAZIO.xxl, alignItems: "center", gap: SPAZIO.m }}>
            <ActivityIndicator color={c.marchio} />
            <Testo attenuato>Apro il cassetto…</Testo>
          </View>
        )
      ) : documenti && documenti.length === 0 ? (
        <Scheda tenue>
          <Testo>
            Il cassetto è vuoto. Inizia dai documenti che ti servono più spesso: la decisione della cassa AVS, il numero IVA,
            la polizza dell&apos;assicurazione.
          </Testo>
        </Scheda>
      ) : (
        <>
          {gruppi.daGuardare.length > 0 ? (
            <View style={{ gap: SPAZIO.s }}>
              <Testo variante="sottotitolo">Da guardare ({gruppi.daGuardare.length})</Testo>
              <Testo variante="piccolo" attenuato>
                Scaduti o in scadenza nei prossimi {PRIMO_AVVISO} giorni: controlla se devi rinnovarli.
              </Testo>
              {gruppi.daGuardare.map((d) => (
                <SchedaDocumento
                  key={d.id}
                  documento={d}
                  oggi={oggi}
                  inApertura={inApertura === d.id}
                  onApri={(x) => void apri(x)}
                  onModifica={(x) => setFoglio({ modo: "modifica", documento: x })}
                />
              ))}
            </View>
          ) : null}
          {gruppi.altri.length > 0 ? (
            <View style={{ gap: SPAZIO.s }}>
              <Testo variante="sottotitolo">{gruppi.daGuardare.length > 0 ? "Gli altri documenti" : "I tuoi documenti"}</Testo>
              {gruppi.altri.map((d) => (
                <SchedaDocumento
                  key={d.id}
                  documento={d}
                  oggi={oggi}
                  inApertura={inApertura === d.id}
                  onApri={(x) => void apri(x)}
                  onModifica={(x) => setFoglio({ modo: "modifica", documento: x })}
                />
              ))}
            </View>
          ) : null}
        </>
      )}

      <NotaCassetto />

      <FoglioDocumento
        contenuto={foglio}
        onChiudi={() => setFoglio(null)}
        onSalva={salva}
        onElimina={(d) => void elimina(d)}
      />
    </Schermata>
  );
}

/** Lo stesso interruttore dei promemoria delle scadenze nel Percorso. */
function InterruttorePromemoria() {
  const c = useColori();
  const attivi = usePromemoriaAttivi();
  const [stato, setStato] = useState("");

  async function cambia(valore: boolean) {
    if (valore && !(await chiediPermesso())) {
      Alert.alert("Notifiche spente", "Per ricevere i promemoria, attiva le notifiche di Bleo nelle impostazioni del telefono.");
      return;
    }
    impostaPromemoria(valore);
    const esito = await riprogrammaNotifiche().catch(() => null);
    if (!valore) setStato("Promemoria tolti, anche quelli delle scadenze nel Percorso.");
    else if (!esito || esito.documenti === 0) setStato("Promemoria attivi. Quando un documento ha una scadenza, ti avviso.");
    else setStato(`Promemoria attivi: ${esito.documenti === 1 ? "1 avviso programmato" : `${esito.documenti} avvisi programmati`} per i documenti.`);
  }

  return (
    <View style={{ gap: SPAZIO.s }}>
      <Scheda tenue style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <Ionicons name="notifications-outline" size={22} color={c.marchio} />
        <View style={{ flex: 1 }}>
          <Testo variante="forte">Promemoria sul telefono</Testo>
          <Testo variante="piccolo" attenuato>
            Una notifica alle 9, {PRIMO_AVVISO} e {SECONDO_AVVISO} giorni prima che un documento scada. È lo stesso
            interruttore delle scadenze nel Percorso.
          </Testo>
        </View>
        <Switch
          value={attivi}
          onValueChange={(v) => void cambia(v)}
          accessibilityLabel="Promemoria delle scadenze"
          trackColor={{ true: c.marchio }}
        />
      </Scheda>
      {stato ? (
        <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
          {stato}
        </Testo>
      ) : null}
    </View>
  );
}

function ErroreCassetto({ errore, onRiprova }: { errore: Errore; onRiprova: () => void }) {
  const c = useColori();
  if (errore.stato === 503) {
    return (
      <Scheda tenue>
        <Testo>Il cassetto dei documenti non è ancora attivo. Torna a trovarci presto.</Testo>
      </Scheda>
    );
  }
  return (
    <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
      <Testo accessibilityLiveRegion="polite">{errore.messaggio}</Testo>
      {errore.stato === 401 ? (
        <Pulsante titolo="Accedi di nuovo" onPress={() => router.push("/accedi")} />
      ) : (
        <Pulsante titolo="Riprova" variante="secondario" icona="refresh" onPress={onRiprova} />
      )}
    </Scheda>
  );
}
