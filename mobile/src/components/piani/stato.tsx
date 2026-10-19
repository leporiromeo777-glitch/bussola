import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NOMI_STRUMENTI, propostaCopia, riassuntoStrumento, type StrumentoSalvato } from "@/lib/strumenti/salvati";
import { Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { chiediConferma } from "~/lib/conferma";
import type { VistaPiano } from "~/lib/piani";
import { SPAZIO, useColori } from "~/lib/tema";

/*
 * Pezzi comuni di budget e business plan nell'app: dove stanno i dati
 * (telefono o account), lo stato del salvataggio, l'invito a copiare
 * nell'account quello che c'era sul telefono e «ricomincia da zero».
 */

export function AttesaPiano({ strumento }: { strumento: StrumentoSalvato }) {
  const c = useColori();
  return (
    <Schermata>
      <View style={{ paddingVertical: SPAZIO.xxl, alignItems: "center", gap: SPAZIO.m }}>
        <ActivityIndicator color={c.marchio} />
        <Testo attenuato>Apro il tuo {NOMI_STRUMENTI[strumento].nome}…</Testo>
      </View>
    </Schermata>
  );
}

/** L'account non risponde: si riprova o si lavora sul telefono. */
export function ErrorePiano<S extends StrumentoSalvato>({ strumento, v }: { strumento: S; v: Extract<VistaPiano<S>, { modo: "errore" }> }) {
  const c = useColori();
  const nome = NOMI_STRUMENTI[strumento].nome;
  const scaduto = v.errore.stato === 401;
  return (
    <Schermata>
      <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
        <Testo variante="forte">Non riesco ad aprire il {nome} del tuo account.</Testo>
        <Testo accessibilityLiveRegion="polite">{scaduto ? "L'accesso è scaduto: accedi di nuovo." : v.errore.messaggio}</Testo>
        {scaduto ? (
          <Pulsante titolo="Accedi di nuovo" onPress={() => router.push("/accedi")} />
        ) : (
          <Pulsante titolo="Riprova" variante="secondario" icona="refresh" onPress={v.riprova} />
        )}
        <Pulsante titolo="Usa i dati di questo telefono" variante="testo" icona="phone-portrait-outline" onPress={v.usaTelefono} />
        <Testo variante="piccolo" attenuato>
          Sul telefono il {nome} resta solo qui: quando l&apos;account torna a rispondere puoi copiarlo nell&apos;account.
        </Testo>
      </Scheda>
    </Schermata>
  );
}

/** In cima alla schermata: dove stanno i dati e, con l'accesso, la copia di quelli del telefono. */
export function NotaPiano<S extends StrumentoSalvato>({ strumento, v }: { strumento: S; v: VistaPiano<S> }) {
  const c = useColori();
  if (v.modo === "account") {
    return (
      <View style={{ gap: SPAZIO.m }}>
        <StatoSalvataggioPiano v={v} />
        <CopiaDalTelefono strumento={strumento} v={v} />
      </View>
    );
  }
  if (v.modo !== "telefono") return null;
  return (
    <Scheda tenue>
      <Testo variante="forte">Resta su questo telefono.</Testo>
      {v.motivo === "ospite" ? (
        <>
          <Testo variante="piccolo">
            Con l&apos;accesso lo salvi nel tuo account e lo ritrovi anche sul sito, su ogni dispositivo. Ti basta l&apos;email.
          </Testo>
          <Pulsante titolo="Accedi" variante="secondario" icona="arrow-forward" onPress={() => router.push("/accedi")} />
        </>
      ) : v.motivo === "scelta" ? (
        <Testo variante="piccolo" colore={c.accento}>
          L&apos;account non rispondeva: per ora lavori sul telefono. Riapri la schermata per riprovare con l&apos;account.
        </Testo>
      ) : (
        <Testo variante="piccolo">Bleo non lo riceve: lo salviamo solo nella memoria dell&apos;app.</Testo>
      )}
    </Scheda>
  );
}

/** «Salvato nel tuo account», letto anche da VoiceOver/TalkBack. */
function StatoSalvataggioPiano<S extends StrumentoSalvato>({ v }: { v: Extract<VistaPiano<S>, { modo: "account" }> }) {
  const c = useColori();
  const errore = v.stato.salvataggio === "errore" ? v.stato.erroreSalvataggio : null;
  if (errore) {
    return (
      <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
        <Testo accessibilityLiveRegion="polite" colore={c.pericolo}>
          {errore.stato === 401 ? "Accesso scaduto: le ultime modifiche non sono salvate." : `Non salvato: ${errore.messaggio}`}
        </Testo>
        {errore.stato === 401 ? (
          <Pulsante titolo="Accedi di nuovo" onPress={() => router.push("/accedi")} />
        ) : (
          <Pulsante titolo="Riprova adesso" variante="secondario" icona="refresh" onPress={() => void v.archivio.salva()} />
        )}
      </Scheda>
    );
  }
  return (
    <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
      {v.stato.salvataggio !== "salvato"
        ? "Salvo…"
        : v.stato.nellAccount
          ? "Salvato nel tuo account: lo ritrovi anche sul sito."
          : "Quello che scrivi si salva nel tuo account: lo ritrovi anche sul sito."}
    </Testo>
  );
}

/**
 * Prima volta con l'accesso: quello che c'è sul telefono (salvato senza
 * account) si copia nell'account se l'account non ha ancora questo
 * strumento; se ce l'ha ed è diverso, si sceglie quale tenere. Dopo la
 * scelta si toglie dal telefono, così non ci sono doppioni.
 */
function CopiaDalTelefono<S extends StrumentoSalvato>({ strumento, v }: { strumento: S; v: Extract<VistaPiano<S>, { modo: "account" }> }) {
  const c = useColori();
  const [nascosto, setNascosto] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [esito, setEsito] = useState<{ testo: string; errore: boolean } | null>(null);
  const [giaNellAccount, setGiaNellAccount] = useState(false);
  const nome = NOMI_STRUMENTI[strumento].nome;
  const proposta = propostaCopia(strumento, v.sulTelefono, v.stato);

  if (esito && !inCorso) {
    return (
      <Scheda style={{ borderColor: esito.errore ? c.pericolo : c.successo, borderWidth: 2 }}>
        <Testo accessibilityLiveRegion="polite" colore={esito.errore ? c.pericolo : undefined}>
          {esito.testo}
        </Testo>
      </Scheda>
    );
  }
  if (nascosto || !proposta || !v.sulTelefono) return null;
  const daCopiare = v.sulTelefono;

  async function copia() {
    setInCorso(true);
    const r = await v.archivio.importa(daCopiare);
    if (r.ok && r.importato) {
      v.togliDalTelefono();
      setEsito({ testo: `Fatto: il ${nome} ora è nel tuo account e non più solo sul telefono.`, errore: false });
    } else if (r.ok) {
      setGiaNellAccount(true);
    } else {
      setEsito({ testo: `Non sono riuscito a copiarlo: ${r.errore.messaggio} Resta sul telefono: riprova più tardi.`, errore: true });
    }
    setInCorso(false);
  }

  function sostituisci() {
    chiediConferma({
      titolo: `Usare il ${nome} del telefono?`,
      messaggio: `Sostituisce quello del tuo account, anche sul sito. Quello dell'account non si può recuperare.`,
      conferma: "Sostituisci",
      pericolo: true,
      onConferma: () => {
        void (async () => {
          setInCorso(true);
          const r = await v.archivio.sostituisci(daCopiare);
          if (r.ok) {
            v.togliDalTelefono();
            setEsito({ testo: `Fatto: nel tuo account ora c'è il ${nome} del telefono.`, errore: false });
          } else {
            setEsito({
              testo: `Non sono riuscito a salvarlo nell'account: ${r.errore.messaggio} Il ${nome} del telefono resta anche qui.`,
              errore: true,
            });
          }
          setInCorso(false);
        })();
      },
    });
  }

  function cancellaDalTelefono() {
    chiediConferma({
      titolo: `Cancellare il ${nome} dal telefono?`,
      messaggio: "Nel tuo account non cambia niente.",
      conferma: "Cancella",
      pericolo: true,
      onConferma: () => {
        v.togliDalTelefono();
        setEsito({ testo: "Cancellato da questo telefono.", errore: false });
      },
    });
  }

  return (
    <Scheda evidenziata>
      {proposta === "copia" ? (
        <>
          <Testo variante="sottotitolo">Copia nel tuo account il {nome} del telefono</Testo>
          <Testo>
            Prima dell&apos;accesso avevi preparato qui un {nome} ({riassuntoStrumento(strumento, daCopiare)}). Copialo
            nell&apos;account per ritrovarlo anche sul sito. Dopo la copia lo togliamo dalla memoria del telefono.
          </Testo>
          <Pulsante titolo="Copia nel mio account" icona="cloud-upload-outline" caricamento={inCorso} onPress={() => void copia()} />
          <Pulsante titolo="Non ora" variante="secondario" disabilitato={inCorso} onPress={() => setNascosto(true)} />
          <Pulsante titolo="Cancellalo dal telefono" variante="testo" disabilitato={inCorso} onPress={cancellaDalTelefono} />
        </>
      ) : (
        <>
          <Testo variante="sottotitolo">Sul telefono c&apos;è un altro {nome}</Testo>
          <Testo>
            {giaNellAccount ? `Nel frattempo nel tuo account c'era già un ${nome}. ` : ""}
            Prima dell&apos;accesso avevi preparato qui un {nome} diverso da quello del tuo account. Quale vuoi tenere? Quello
            che non scegli lo cancelliamo.
          </Testo>
          <View style={{ gap: SPAZIO.xs }}>
            <Testo variante="piccolo">
              <Testo variante="piccolo" style={{ fontWeight: "600" }}>
                Nel tuo account:{" "}
              </Testo>
              {riassuntoStrumento(strumento, v.dati)}
            </Testo>
            <Testo variante="piccolo">
              <Testo variante="piccolo" style={{ fontWeight: "600" }}>
                Sul telefono:{" "}
              </Testo>
              {riassuntoStrumento(strumento, daCopiare)}
            </Testo>
          </View>
          <Pulsante
            titolo="Tieni quello dell'account"
            disabilitato={inCorso}
            onPress={() => {
              v.togliDalTelefono();
              setEsito({ testo: `Tenuto quello dell'account: il ${nome} del telefono è cancellato.`, errore: false });
            }}
          />
          <Pulsante titolo="Usa quello del telefono" variante="secondario" caricamento={inCorso} onPress={sostituisci} />
          <Pulsante titolo="Non ora" variante="testo" disabilitato={inCorso} onPress={() => setNascosto(true)} />
        </>
      )}
    </Scheda>
  );
}

/** «Ricomincia da zero», con la conferma: sul telefono o nell'account. */
export function RicominciaPiano<S extends StrumentoSalvato>({
  strumento,
  v,
}: {
  strumento: S;
  v: Extract<VistaPiano<S>, { modo: "telefono" | "account" }>;
}) {
  const nome = NOMI_STRUMENTI[strumento].nome;
  return (
    <Pulsante
      titolo="Ricomincia da zero"
      variante="testo"
      icona="trash-outline"
      onPress={() =>
        chiediConferma({
          titolo: `Cancellare il ${nome}?`,
          messaggio:
            v.modo === "account"
              ? "Lo cancelliamo dal tuo account, anche sul sito, e ripartiamo da un foglio vuoto."
              : "Lo cancelliamo da questo telefono e ripartiamo da un foglio vuoto.",
          conferma: "Cancella",
          pericolo: true,
          onConferma: v.ricomincia,
        })
      }
    />
  );
}
