import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Share, View } from "react-native";
import { fontiCalendario, VERIFICATO_IL_CALENDARIO } from "@/data/calendario";
import { dataSvizzera } from "@/data/svizzera";
import { linkWebcal, type LinkSalvato, type StatoCalendario } from "@/lib/percorso/abbonamento";
import type { Risposte } from "@/lib/percorso/risposte";
import { stesseRisposte } from "@/lib/percorso/sincronizza";
import { ElencoFonti, Pulsante, Scheda, Testo } from "~/components/ui";
import {
  creaLinkCalendario,
  disattivaLinkCalendario,
  leggiCalendario,
  leggiLinkLocale,
  linkCompleto,
  salvaLinkLocale,
  usaRisposteDelTelefono,
} from "~/lib/calendario";
import { avvisa, chiediConferma } from "~/lib/conferma";
import { useStatoPercorsoAccount } from "~/lib/percorso-account";
import { useSessione } from "~/lib/sessione";
import { oggiLocale } from "~/lib/stato";
import { supabase } from "~/lib/supabase";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** Data e ora ISO → «18.10.2026 alle 21:05», nel fuso del telefono. */
function quando(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dataSvizzera(iso);
  const dueCifre = (n: number) => String(n).padStart(2, "0");
  return `${dataSvizzera(oggiLocale(d))} alle ${dueCifre(d.getHours())}:${dueCifre(d.getMinutes())}`;
}

const SPIEGAZIONE =
  "Le tue scadenze e le votazioni da seguire nel calendario del telefono o del computer, con un link personale. Quando cambia qualcosa, il calendario si aggiorna da solo.";

function Intestazione() {
  return (
    <>
      <Testo variante="sottotitolo">Calendario sempre aggiornato</Testo>
      <Testo variante="piccolo" attenuato>
        {SPIEGAZIONE}
      </Testo>
    </>
  );
}

/**
 * «Calendario sempre aggiornato» nella scheda del percorso: il link personale
 * che il calendario rilegge da solo (Apple Calendario con webcal://, Google
 * Calendar dal computer). Serve l'account: il calendario nasce dalle risposte
 * salvate lì, e da qui si possono salvare quelle di questo telefono.
 */
export function CalendarioAggiornato({ risposte, conInizio }: { risposte: Risposte; conInizio: boolean }) {
  const { pronta, sessione } = useSessione();

  if (!supabase()) {
    return (
      <View style={{ gap: SPAZIO.s }}>
        <Intestazione />
        <Scheda tenue>
          <Testo>Non è ancora attivo in questa versione di prova. Intanto puoi attivare i promemoria qui sopra.</Testo>
        </Scheda>
      </View>
    );
  }
  if (!pronta) return null;
  if (!sessione) {
    return (
      <View style={{ gap: SPAZIO.s }}>
        <Intestazione />
        <Scheda style={{ gap: SPAZIO.m }}>
          <Testo>
            Il link è legato al tuo account: il calendario nasce dalle risposte che salvi lì, così resta aggiornato
            anche quando le cambi.
          </Testo>
          <Pulsante titolo="Accedi per avere il link" icona="arrow-forward" onPress={() => router.push("/accedi")} />
        </Scheda>
      </View>
    );
  }
  return <CalendarioUtente userId={sessione.user.id} risposte={risposte} conInizio={conInizio} />;
}

type Caricamento =
  | { fase: "caricamento" }
  | { fase: "errore"; messaggio: string }
  | { fase: "pronto"; stato: StatoCalendario };

function CalendarioUtente({ userId, risposte, conInizio }: { userId: string; risposte: Risposte; conInizio: boolean }) {
  const c = useColori();
  const [carica, setCarica] = useState<Caricamento>({ fase: "caricamento" });
  const [tentativo, setTentativo] = useState(0);
  const [attesa, setAttesa] = useState(false);
  const [creato, setCreato] = useState<LinkSalvato | null>(null);
  const [annuncio, setAnnuncio] = useState("");
  // Dopo ogni salvataggio del percorso nell'account si rileggono le risposte che usa il calendario.
  const { scritture } = useStatoPercorsoAccount();

  useEffect(() => {
    let attivo = true;
    void leggiCalendario().then((esito) => {
      if (!attivo) return;
      if (!esito.ok) {
        setCarica({ fase: "errore", messaggio: esito.messaggio });
        return;
      }
      // La copia sul telefono vale solo per il link attivo: dopo «Rigenera» altrove si toglie.
      if (!leggiLinkLocale(userId, esito.dati.link?.id ?? null)) salvaLinkLocale(null);
      setCarica({ fase: "pronto", stato: esito.dati });
    });
    return () => {
      attivo = false;
    };
  }, [userId, tentativo, scritture]);

  if (carica.fase === "caricamento") {
    return (
      <View style={{ gap: SPAZIO.s }}>
        <Intestazione />
        <Scheda style={{ alignItems: "center" }}>
          <ActivityIndicator color={c.marchio} accessibilityLabel="Controllo il tuo link" />
        </Scheda>
      </View>
    );
  }
  if (carica.fase === "errore") {
    return (
      <View style={{ gap: SPAZIO.s }}>
        <Intestazione />
        <Scheda style={{ gap: SPAZIO.m }}>
          <Testo accessibilityLiveRegion="polite">{carica.messaggio}</Testo>
          <Pulsante
            titolo="Riprova"
            variante="secondario"
            onPress={() => {
              setCarica({ fase: "caricamento" });
              setTentativo((n) => n + 1);
            }}
          />
        </Scheda>
      </View>
    );
  }

  const { stato } = carica;
  const attivo = stato.link;
  const locale = attivo ? (creato?.id === attivo.id ? creato : leggiLinkLocale(userId, attivo.id)) : null;
  const url = locale ? linkCompleto(locale.percorso) : null;
  const risposteDiverse = !stato.percorso || !stesseRisposte(stato.percorso.risposte, risposte);

  function aggiorna(nuovo: Partial<StatoCalendario>) {
    setCarica((prima) => (prima.fase === "pronto" ? { fase: "pronto", stato: { ...prima.stato, ...nuovo } } : prima));
  }

  async function nuovoLink() {
    const cera = attivo !== null;
    setAttesa(true);
    setAnnuncio("");
    const esito = await creaLinkCalendario();
    setAttesa(false);
    if (!esito.ok) return setAnnuncio(esito.messaggio);
    const salvato = { userId, id: esito.dati.id, percorso: esito.dati.percorso };
    salvaLinkLocale(salvato);
    setCreato(salvato);
    aggiorna({ link: { id: esito.dati.id, creatoIl: esito.dati.creatoIl, lettoIl: null } });
    setAnnuncio(
      cera
        ? "Ecco il link nuovo: quello vecchio non funziona più. Aggiungi questo al calendario e togli quello vecchio."
        : "Ecco il tuo link: aggiungilo al calendario con i pulsanti qui sotto.",
    );
  }

  async function disattiva() {
    setAttesa(true);
    setAnnuncio("");
    const esito = await disattivaLinkCalendario();
    setAttesa(false);
    if (!esito.ok) return setAnnuncio(esito.messaggio);
    salvaLinkLocale(null);
    setCreato(null);
    aggiorna({ link: null });
    setAnnuncio("Link disattivato: i calendari che lo usavano non si aggiornano più. Toglilo anche dal calendario.");
  }

  async function usaTelefono() {
    setAttesa(true);
    setAnnuncio("");
    const esito = await usaRisposteDelTelefono(risposte);
    setAttesa(false);
    if (!esito.ok) return setAnnuncio(esito.messaggio);
    aggiorna({ percorso: esito.dati.percorso });
    setAnnuncio("Fatto: le scadenze del calendario vengono dalle risposte di questo telefono.");
  }

  async function apriNelCalendario(link: string) {
    try {
      await Linking.openURL(linkWebcal(link));
    } catch {
      avvisa(
        "Nessun calendario ha aperto il link",
        "Copia il link e aggiungilo a mano. Su iPhone: app Calendario, «Aggiungi calendario con iscrizione». Con Google Calendar: dal computer, «Altri calendari», «+», «Da URL».",
      );
    }
  }

  async function copia(link: string) {
    await Clipboard.setStringAsync(link).catch(() => {});
    setAnnuncio("Link copiato.");
  }

  async function condividi(link: string) {
    try {
      await Share.share({ message: link });
    } catch {
      setAnnuncio("Non riesco a condividere il link: copialo e incollalo dove ti serve.");
    }
  }

  return (
    <View style={{ gap: SPAZIO.s }}>
      <Intestazione />
      <Scheda style={{ gap: SPAZIO.m }}>
        {!attivo ? (
          <>
            <Testo>
              Nel calendario: le scadenze con una data di quest&apos;anno e del prossimo, con un promemoria una
              settimana prima, e le votazioni da seguire. Ogni evento ha il link alla fonte ufficiale.
            </Testo>
            <Pulsante
              titolo="Crea il mio link"
              icona="sync-outline"
              caricamento={attesa}
              onPress={() => void nuovoLink()}
            />
          </>
        ) : url ? (
          <>
            <View style={{ backgroundColor: c.marchioTenue, borderRadius: RAGGIO.m, padding: SPAZIO.m }}>
              <Testo selectable variante="piccolo" accessibilityLabel={`Il tuo link personale: ${url}`}>
                {url}
              </Testo>
            </View>
            <Testo variante="piccolo" attenuato>
              È solo tuo: chi lo ha vede le tue scadenze (non il tuo nome né la tua email). Non condividerlo con altri;
              se finisce in giro, rigeneralo.
            </Testo>
            <Pulsante
              titolo={Platform.OS === "ios" ? "Apri in Apple Calendario" : "Apri in un'app calendario"}
              icona="calendar-outline"
              onPress={() => void apriNelCalendario(url)}
              suggerimento="Apre il link come calendario con iscrizione"
            />
            <Pulsante
              titolo="Copia il link"
              variante="secondario"
              icona="copy-outline"
              onPress={() => void copia(url)}
            />
            <Pulsante
              titolo="Condividi il link"
              variante="secondario"
              icona="share-outline"
              onPress={() => void condividi(url)}
              suggerimento="Per esempio per mandarlo al tuo computer e aggiungerlo a Google Calendar"
            />
          </>
        ) : (
          <Testo>
            Hai già un link attivo, ma non è salvato su questo telefono: per sicurezza Bleo tiene solo un&apos;impronta
            del link, non il link. Se ti serve qui, rigeneralo: quello vecchio smette di funzionare e va sostituito nel
            calendario.
          </Testo>
        )}

        {attivo ? (
          <Testo variante="piccolo" attenuato>
            Link creato il {quando(attivo.creatoIl)}.{" "}
            {attivo.lettoIl
              ? `Ultima lettura da un calendario: ${quando(attivo.lettoIl)}.`
              : "Nessun calendario l'ha ancora letto."}
          </Testo>
        ) : null}

        {risposteDiverse ? (
          <Scheda tenue style={{ gap: SPAZIO.s }}>
            <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "flex-start" }}>
              <Ionicons name="information-circle-outline" size={20} color={c.marchio} />
              <Testo variante="piccolo" style={{ flex: 1 }}>
                {stato.percorso
                  ? `Il calendario usa le risposte salvate nel tuo account il ${quando(stato.percorso.aggiornatoIl)}, diverse da quelle di questo telefono.`
                  : "Nel tuo account non ci sono ancora le risposte al questionario: senza, nel calendario ci sono solo le votazioni."}
              </Testo>
            </View>
            <Pulsante
              titolo="Usa le risposte di questo telefono"
              variante="secondario"
              caricamento={attesa}
              onPress={() => void usaTelefono()}
              suggerimento="Salva nel tuo account le risposte al questionario di questo telefono"
            />
          </Scheda>
        ) : (
          <Testo variante="piccolo" attenuato>
            Le scadenze vengono dalle risposte salvate nel tuo account, le stesse di questo telefono.
          </Testo>
        )}

        {conInizio ? (
          <Testo variante="piccolo" attenuato>
            Il termine per annunciarti all&apos;IVA, che si conta dalla data di inizio dell&apos;attività, non c&apos;è:
            Bleo quella data non la salva.
          </Testo>
        ) : null}
        <Testo variante="piccolo" attenuato>
          Ogni calendario rilegge il link quando decide lui: una modifica può arrivare dopo qualche ora, con Google
          Calendar anche dopo di più. Google Calendar si iscrive solo dal computer, nel browser: mandati il link con
          «Condividi», poi in Google Calendar scegli «Altri calendari», «+», «Da URL». Lo vedrai anche nell&apos;app del
          telefono.
        </Testo>
        <ElencoFonti
          fonti={[fontiCalendario.googleDaUrl, fontiCalendario.appleIphone]}
          verificatoIl={VERIFICATO_IL_CALENDARIO}
        />

        {attivo ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPAZIO.s }}>
            <Pulsante
              titolo="Rigenera il link"
              variante="testo"
              icona="refresh-outline"
              caricamento={attesa}
              suggerimento="Crea un link nuovo: quello vecchio smette di funzionare"
              onPress={() =>
                chiediConferma({
                  titolo: "Rigenerare il link?",
                  messaggio:
                    "Il link di adesso smette subito di funzionare: dovrai aggiungere quello nuovo al calendario e togliere il vecchio.",
                  conferma: "Crea un link nuovo",
                  onConferma: () => void nuovoLink(),
                })
              }
            />
            <Pulsante
              titolo="Disattiva il link"
              variante="testo"
              caricamento={attesa}
              onPress={() =>
                chiediConferma({
                  titolo: "Disattivare il link?",
                  messaggio:
                    "Il link smette subito di funzionare: il calendario che lo usa non si aggiorna più. Puoi crearne uno nuovo quando vuoi.",
                  conferma: "Disattiva",
                  pericolo: true,
                  onConferma: () => void disattiva(),
                })
              }
            />
          </View>
        ) : null}

        <Testo variante="piccolo" accessibilityLiveRegion="polite">
          {annuncio}
        </Testo>
      </Scheda>
    </View>
  );
}
