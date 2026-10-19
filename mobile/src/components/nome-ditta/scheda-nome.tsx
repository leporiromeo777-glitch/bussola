/**
 * Un nome per la ditta, come sulla pagina del sito (src/app/strumenti/nome):
 * il nome grande con «Copia», il perché, i controlli sulle regole (per un
 * nome scritto da te) e il risultato del registro di commercio con le fonti.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { View } from "react-native";
import { REGOLE_NOME_DITTA } from "@/data/nome-ditta";
import { fontiPercorso, type Fonte } from "@/data/svizzera";
import type { ControlloNome } from "@/lib/nome-ditta/regole";
import { dettagliDitta } from "@/lib/nome-ditta/risposta";
import type { EsitoRegistro } from "@/lib/nome-ditta/zefix";
import { LinkFonte, PulsanteCopia } from "~/components/strumenti-comuni";
import { Pulsante, Scheda, Testo } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

type IdRegola = (typeof REGOLE_NOME_DITTA)[number]["id"];
const REGOLA = Object.fromEntries(REGOLE_NOME_DITTA.map((r) => [r.id, r])) as Record<IdRegola, (typeof REGOLE_NOME_DITTA)[number]>;

/** La prima fonte di una regola (art. 944, 945 o 946 CO). */
function fonteRegola(id: IdRegola): Fonte {
  return REGOLA[id].fonti[0];
}

export function SchedaNome({
  nome,
  perche,
  registro,
  children,
}: {
  nome: string;
  perche?: string;
  registro: EsitoRegistro;
  children?: ReactNode;
}) {
  return (
    <Scheda style={{ gap: SPAZIO.m }}>
      <Testo variante="titolo" selectable style={{ fontSize: 24, lineHeight: 30 }}>
        {nome}
      </Testo>
      {perche ? <Testo attenuato>{perche}</Testo> : null}
      {children}
      <Registro registro={registro} />
      <PulsanteCopia testo={nome} descrizione={`il nome ${nome}`} style={{ alignSelf: "flex-start" }} />
    </Scheda>
  );
}

function CercaSuZefix() {
  return (
    <Pulsante
      titolo="Cerca tu su Zefix"
      variante="testo"
      icona="open-outline"
      onPress={() => void apriLink(fontiPercorso.zefix.url)}
      suggerimento="Apre la ricerca nel registro di commercio"
      style={{ alignSelf: "flex-start" }}
    />
  );
}

/** Il risultato della ricerca su Zefix: solo indicativo. */
export function Registro({ registro }: { registro: EsitoRegistro }) {
  const c = useColori();
  if (registro.stato === "non_disponibile") {
    return (
      <View style={{ backgroundColor: c.sfondo, borderRadius: RAGGIO.m, padding: SPAZIO.m, gap: SPAZIO.xs }}>
        <Testo variante="piccolo">Ora non riesco a controllare il registro di commercio.</Testo>
        <CercaSuZefix />
      </View>
    );
  }
  if (registro.stato === "nessuno") {
    return (
      <View
        style={{ flexDirection: "row", gap: SPAZIO.s, backgroundColor: c.marchioTenue, borderRadius: RAGGIO.m, padding: SPAZIO.m }}
      >
        <Ionicons name="checkmark-circle" size={18} color={c.marchio} style={{ marginTop: 1 }} />
        <Testo variante="piccolo" style={{ flex: 1 }}>
          Nessun nome uguale trovato nel registro di commercio.
        </Testo>
      </View>
    );
  }
  return (
    <View
      style={{
        borderRadius: RAGGIO.m,
        padding: SPAZIO.m,
        gap: SPAZIO.xs,
        backgroundColor: registro.uguale ? c.scheda : c.sfondo,
        borderWidth: registro.uguale ? 1.5 : 0,
        borderColor: c.accento,
      }}
    >
      <Testo variante="forte" style={{ fontSize: 14, lineHeight: 20 }}>
        {registro.uguale ? "Esiste già una ditta attiva con questo nome:" : "Nomi simili già nel registro di commercio:"}
      </Testo>
      {registro.ditte.map((d) => (
        <View key={`${d.nome}-${d.sede}`} style={{ flexDirection: "row", gap: SPAZIO.s }}>
          <Testo variante="piccolo">•</Testo>
          <Testo variante="piccolo" style={{ flex: 1 }}>
            <Testo variante="piccolo" style={{ fontWeight: "600" }}>
              {d.nome}
            </Testo>
            {dettagliDitta(d) ? <Testo variante="piccolo" attenuato>{` ${dettagliDitta(d)}`}</Testo> : null}
          </Testo>
        </View>
      ))}
      {registro.altre ? (
        <Testo variante="piccolo" attenuato>
          E ce ne sono altre.
        </Testo>
      ) : null}
      {registro.uguale ? (
        <Testo variante="piccolo">
          {REGOLA["stesso-luogo"].testo} (<LinkFonte fonte={fonteRegola("stesso-luogo")} />)
        </Testo>
      ) : null}
      {registro.altre ? <CercaSuZefix /> : null}
    </View>
  );
}

function RigaControllo({ esito, children }: { esito: "ok" | "avviso" | "no"; children: ReactNode }) {
  const c = useColori();
  const icona = esito === "ok" ? "checkmark-circle" : esito === "avviso" ? "warning-outline" : "close-circle";
  const colore = esito === "ok" ? c.marchio : esito === "avviso" ? c.accento : c.pericolo;
  return (
    <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
      <Ionicons name={icona} size={18} color={colore} style={{ marginTop: 1 }} accessibilityElementsHidden />
      <Testo variante="piccolo" style={{ flex: 1 }}>
        {children}
      </Testo>
    </View>
  );
}

/** I controlli sulle regole per un nome scritto da te (art. 944 e 945 CO), con le fonti. */
export function ControlliRegole({ controllo, cognome }: { controllo: ControlloNome; cognome: string }) {
  return (
    <View style={{ gap: SPAZIO.s }}>
      {!cognome ? (
        <RigaControllo esito="avviso">
          Scrivi il tuo cognome qui sopra: così controllo se il nome lo contiene, come vuole la legge (
          <LinkFonte fonte={fonteRegola("cognome")} />
          ).
        </RigaControllo>
      ) : controllo.conCognome ? (
        <RigaControllo esito="ok">Contiene il tuo cognome «{cognome}».</RigaControllo>
      ) : (
        <RigaControllo esito="no">
          Non contiene il tuo cognome «{cognome}» come parola intera: per una ditta individuale è obbligatorio (
          <LinkFonte fonte={fonteRegola("cognome")} />
          ).
        </RigaControllo>
      )}
      {controllo.societa ? (
        <RigaControllo esito="no">
          «{controllo.societa}» fa pensare a una società: in una ditta individuale non è permesso (
          <LinkFonte fonte={fonteRegola("societa")} />
          ).
        </RigaControllo>
      ) : (
        <RigaControllo esito="ok">Nessuna parola che fa pensare a una società.</RigaControllo>
      )}
      {controllo.territorio ? (
        <RigaControllo esito="avviso">
          «{controllo.territorio}» è una parola nazionale o territoriale: valgono regole speciali, chiedi all&apos;Ufficio del
          registro di commercio (<LinkFonte fonte={fonteRegola("verita")} />
          ).
        </RigaControllo>
      ) : null}
    </View>
  );
}
