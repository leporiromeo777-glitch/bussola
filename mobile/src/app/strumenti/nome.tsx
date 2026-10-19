/**
 * «Nome della ditta» nell'app, come sul sito (/strumenti/nome): le regole
 * per il nome con le fonti, le proposte di Bleo con il tuo cognome (se sono
 * attive) già cercate nel registro di commercio, e il controllo di un nome
 * che hai già in mente. Stesse API, stessi controlli e stessi limiti del
 * sito; niente si salva.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, View, type ScrollView } from "react-native";
import { NOTA_MARCHI, NOTA_REGISTRO, REGOLE_NOME_DITTA } from "@/data/nome-ditta";
import { dataSvizzera } from "@/data/svizzera";
import {
  ETICHETTE_STILI,
  LUNGHEZZA_MASSIMA_ATTIVITA,
  LUNGHEZZA_MASSIMA_COGNOME,
  LUNGHEZZA_MASSIMA_NOME_PERSONA,
  LUNGHEZZA_MASSIMA_PAROLE,
  MESSAGGI_NOME_DITTA,
  STILI,
  leggiRichiestaNomi,
  leggiRichiestaVerifica,
  type Stile,
} from "@/lib/nome-ditta/proposte";
import { LUNGHEZZA_MASSIMA_NOME_DITTA, controllaNome, type ControlloNome } from "@/lib/nome-ditta/regole";
import type { PropostaConRegistro } from "@/lib/nome-ditta/risposta";
import type { EsitoRegistro } from "@/lib/nome-ditta/zefix";
import { CampoTesto } from "~/components/campi";
import { ImmagineMascotte } from "~/components/mascotte";
import { ControlliRegole, SchedaNome } from "~/components/nome-ditta/scheda-nome";
import {
  MessaggioErrore,
  NotaConFonti,
  NotaNonConsulenza,
  SceltaSchede,
  SchermataScorrevole,
} from "~/components/strumenti-comuni";
import { ElencoFonti, Pulsante, Scheda, Testo } from "~/components/ui";
import { proponiNomi, propostePronte, verificaNome } from "~/lib/nome-ditta";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

type Campo = "cognome" | "nome" | "attivita" | "parole" | "generale";

const OPZIONI_STILE = STILI.map((s) => ({ valore: s, etichetta: ETICHETTE_STILI[s].etichetta, descrizione: ETICHETTE_STILI[s].aiuto }));
const VERIFICATO_IL = REGOLE_NOME_DITTA.map((r) => r.verificatoIl).sort()[0];

export default function NomeDitta() {
  const c = useColori();
  const scorri = useRef<ScrollView>(null);
  const posizioneModulo = useRef(0);
  const invio = useRef<AbortController | null>(null);

  // null = non si sa ancora (o rete assente): si mostra il modulo completo e decide il sito.
  const [attive, setAttive] = useState<boolean | null>(null);
  const [cognome, setCognome] = useState("");
  const [nomePersona, setNomePersona] = useState("");
  const [attivita, setAttivita] = useState("");
  const [parole, setParole] = useState("");
  const [stile, setStile] = useState<Stile>("semplice");
  const [errori, setErrori] = useState<Partial<Record<Campo, string>>>({});
  const [inCorso, setInCorso] = useState(false);
  const [proposte, setProposte] = useState<PropostaConRegistro[] | null>(null);

  useEffect(() => {
    let valido = true;
    void propostePronte().then((v) => {
      if (valido) setAttive(v);
    });
    return () => {
      valido = false;
      invio.current?.abort();
    };
  }, []);

  const vaiAlModulo = () => scorri.current?.scrollTo({ y: Math.max(0, posizioneModulo.current - SPAZIO.s), animated: true });

  async function proponi() {
    if (inCorso || attive === false) return;
    // Stessi controlli del server, per dire subito cosa manca.
    const controllo = leggiRichiestaNomi({ cognome, nome: nomePersona, attivita, parole, stile });
    if (!controllo.ok) {
      const campo = controllo.campo;
      setErrori(
        campo === "cognome" || campo === "nome" || campo === "attivita" || campo === "parole"
          ? { [campo]: controllo.messaggio }
          : { generale: controllo.messaggio },
      );
      // Il campo da correggere può essere sopra lo schermo: si torna all'inizio del modulo.
      vaiAlModulo();
      AccessibilityInfo.announceForAccessibility(controllo.messaggio);
      return;
    }
    setErrori({});
    setInCorso(true);
    const questo = new AbortController();
    invio.current = questo;
    const esito = await proponiNomi(controllo.dati, questo.signal);
    invio.current = null;
    if (questo.signal.aborted) return;
    setInCorso(false);
    if (esito.ok) {
      setProposte(esito.proposte);
      AccessibilityInfo.announceForAccessibility(
        esito.proposte.length ? `Ecco ${esito.proposte.length} idee per il nome.` : "Nessuna idea valida.",
      );
      vaiAlModulo();
      return;
    }
    if ("annullata" in esito) return;
    setErrori({ generale: esito.messaggio });
    // Il sito dice che le proposte sono spente: si passa al modulo «solo cognome».
    if (esito.messaggio === MESSAGGI_NOME_DITTA.nonAttivo) setAttive(false);
  }

  return (
    <SchermataScorrevole rif={scorri}>
      <Stack.Screen options={{ title: "Nome della ditta" }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="pensa" larghezza={88} />
        <Testo attenuato style={{ flex: 1 }}>
          Bleo ti propone nomi per la tua ditta individuale che rispettano la regola del cognome e cerca se nel registro di
          commercio esistono già nomi simili. Puoi anche controllare un nome che hai già in mente.
        </Testo>
      </View>

      <RegoleNome />

      <View onLayout={(e) => (posizioneModulo.current = e.nativeEvent.layout.y)} style={{ gap: SPAZIO.l }}>
        {proposte ? (
          <Risultati
            proposte={proposte}
            onCambia={() => {
              setProposte(null);
              vaiAlModulo();
            }}
          />
        ) : (
          <Scheda style={{ gap: SPAZIO.m }}>
            <Testo variante="sottotitolo">{attive === false ? "Il tuo cognome" : "Bleo ti propone dei nomi"}</Testo>
            <Testo attenuato>
              {attive === false
                ? "Scrivi il cognome come è sul tuo documento d'identità: serve per controllare il nome che hai in mente."
                : "Scrivi il cognome come è sul tuo documento d'identità e racconta in poche parole cosa fai."}
            </Testo>
            <CampoTesto
              etichetta="Cognome"
              valore={cognome}
              onCambia={setCognome}
              errore={errori.cognome}
              massimo={LUNGHEZZA_MASSIMA_COGNOME}
              segnaposto="Rossi"
              maiuscole="words"
            />
            <CampoTesto
              etichetta="Nome (se vuoi)"
              valore={nomePersona}
              onCambia={setNomePersona}
              errore={errori.nome}
              massimo={LUNGHEZZA_MASSIMA_NOME_PERSONA}
              segnaposto="Giulia"
              maiuscole="words"
            />
            {attive === false ? (
              <View
                style={{ flexDirection: "row", gap: SPAZIO.s, padding: SPAZIO.m, borderRadius: RAGGIO.m, backgroundColor: c.sfondo }}
              >
                <Ionicons name="information-circle-outline" size={20} color={c.marchio} style={{ marginTop: 1 }} />
                <Testo variante="piccolo" style={{ flex: 1 }}>
                  Le proposte di nomi di Bleo non sono ancora attive. Intanto puoi controllare qui sotto un nome che hai già in
                  mente.
                </Testo>
              </View>
            ) : (
              <>
                <CampoTesto
                  etichetta="Cosa fai?"
                  valore={attivita}
                  onCambia={setAttivita}
                  errore={errori.attivita}
                  aiuto="Per esempio: «faccio torte su ordinazione per feste e matrimoni»."
                  righe={3}
                  massimo={LUNGHEZZA_MASSIMA_ATTIVITA}
                />
                <CampoTesto
                  etichetta="Parole che ti piacciono (se vuoi)"
                  valore={parole}
                  onCambia={setParole}
                  errore={errori.parole}
                  massimo={LUNGHEZZA_MASSIMA_PAROLE}
                  segnaposto="dolce, casa, sole"
                />
                <SceltaSchede etichetta="Stile" opzioni={OPZIONI_STILE} valore={stile} onCambia={setStile} disabilitata={inCorso} />
                {errori.generale ? <MessaggioErrore testo={errori.generale} /> : null}
                <Pulsante
                  titolo={inCorso ? "Bleo sta pensando ai nomi…" : "Proponi nomi"}
                  icona="sparkles-outline"
                  caricamento={inCorso}
                  onPress={() => void proponi()}
                  style={{ minHeight: 56 }}
                />
                {inCorso ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s }} accessibilityLiveRegion="polite">
                    <ActivityIndicator color={c.marchio} />
                    <Testo variante="piccolo" attenuato style={{ flex: 1 }}>
                      Bleo sta pensando ai nomi e li cerca nel registro di commercio: non chiudere questa schermata.
                    </Testo>
                  </View>
                ) : null}
                <Testo variante="piccolo" attenuato>
                  Cognome, nome e quello che scrivi qui li legge l&apos;intelligenza artificiale che usa Bleo (Claude, di
                  Anthropic) solo per proporti i nomi; i nomi proposti li cerchiamo su Zefix. Noi non salviamo niente.
                </Testo>
              </>
            )}
          </Scheda>
        )}
      </View>

      <ControlloNomeProprio cognome={cognome} />

      <NotaConFonti testo={NOTA_REGISTRO.testo} fonti={NOTA_REGISTRO.fonti} />
      <NotaConFonti testo={NOTA_MARCHI.testo} fonti={NOTA_MARCHI.fonti} />
      <NotaNonConsulenza />
    </SchermataScorrevole>
  );
}

/** Le regole per il nome: la prima sempre visibile, le altre con le fonti a richiesta. */
function RegoleNome() {
  const [aperte, setAperte] = useState(false);
  const [prima, ...altre] = REGOLE_NOME_DITTA;
  return (
    <Scheda tenue style={{ gap: SPAZIO.m }}>
      <Testo variante="sottotitolo">Le regole per il nome</Testo>
      <View style={{ gap: SPAZIO.xs }}>
        <Testo>{prima.testo}</Testo>
        <ElencoFonti fonti={prima.fonti} />
      </View>
      {aperte
        ? altre.map((r) => (
            <View key={r.id} style={{ gap: SPAZIO.xs }}>
              <Testo>{r.testo}</Testo>
              <ElencoFonti fonti={r.fonti} />
            </View>
          ))
        : null}
      {aperte ? (
        <Testo variante="piccolo" attenuato>
          Fonti controllate il {dataSvizzera(VERIFICATO_IL)}.
        </Testo>
      ) : null}
      <Pulsante
        titolo={aperte ? "Mostra meno" : `Leggi le altre ${altre.length} regole`}
        variante="testo"
        icona={aperte ? "chevron-up" : "chevron-down"}
        onPress={() => setAperte((a) => !a)}
        style={{ alignSelf: "flex-start" }}
      />
    </Scheda>
  );
}

function Risultati({ proposte, onCambia }: { proposte: PropostaConRegistro[]; onCambia: () => void }) {
  return (
    <View style={{ gap: SPAZIO.m }}>
      <View style={{ gap: SPAZIO.xs }}>
        <Testo variante="titolo">{proposte.length ? `${proposte.length} idee per il nome` : "Nessuna idea valida"}</Testo>
        <Testo attenuato>
          Tutte contengono il tuo cognome. Prima di scegliere, cerca il nome anche su Google e controlla i marchi.
        </Testo>
      </View>
      {proposte.map((p) => (
        <SchedaNome key={p.nome} nome={p.nome} perche={p.perche} registro={p.registro} />
      ))}
      <Pulsante titolo="Cambia i dati e chiedi altri nomi" variante="secondario" icona="create-outline" onPress={onCambia} />
    </View>
  );
}

/** «Hai già un nome in mente? Controllalo»: regole sul telefono, registro dal sito. */
function ControlloNomeProprio({ cognome }: { cognome: string }) {
  const c = useColori();
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);
  const [esito, setEsito] = useState<{ nome: string; cognome: string; controllo: ControlloNome; registro: EsitoRegistro } | null>(
    null,
  );
  const invio = useRef<AbortController | null>(null);
  useEffect(() => () => invio.current?.abort(), []);

  async function controlla() {
    if (inCorso) return;
    const richiesta = leggiRichiestaVerifica({ nome });
    if (!richiesta.ok) {
      setErrore(richiesta.messaggio);
      return;
    }
    setErrore(null);
    setInCorso(true);
    const daControllare = richiesta.dati.nome;
    const questo = new AbortController();
    invio.current = questo;
    const risposta = await verificaNome(daControllare, questo.signal);
    invio.current = null;
    if ("annullata" in risposta) return;
    setInCorso(false);
    setErrore(risposta.messaggio);
    setEsito({ nome: daControllare, cognome: cognome.trim(), controllo: controllaNome(daControllare, cognome), registro: risposta.registro });
    AccessibilityInfo.announceForAccessibility(`Controllo di ${daControllare} pronto.`);
  }

  return (
    <View style={{ gap: SPAZIO.m }}>
      <Scheda style={{ gap: SPAZIO.m }}>
        <Testo variante="sottotitolo">Hai già un nome in mente? Controllalo</Testo>
        <CampoTesto
          etichetta="Il nome che hai in mente"
          valore={nome}
          onCambia={setNome}
          massimo={LUNGHEZZA_MASSIMA_NOME_DITTA}
          segnaposto="Torte di Giulia Rossi"
          maiuscole="words"
        />
        <Pulsante
          titolo={inCorso ? "Controllo…" : "Controlla"}
          variante="secondario"
          icona="search-outline"
          caricamento={inCorso}
          onPress={() => void controlla()}
        />
        {inCorso ? (
          <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
            Sto cercando il nome nel registro di commercio.
          </Testo>
        ) : null}
        {errore ? (
          <Testo variante="piccolo" colore={c.pericolo} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            {errore}
          </Testo>
        ) : null}
      </Scheda>
      {esito ? (
        <SchedaNome nome={esito.nome} registro={esito.registro}>
          <ControlliRegole controllo={esito.controllo} cognome={esito.cognome} />
        </SchedaNome>
      ) : null}
    </View>
  );
}
