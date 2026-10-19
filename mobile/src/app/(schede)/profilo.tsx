import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { datiLook } from "@/lib/mascotte/look";
import { RigaCassetto } from "~/components/cassetto/link-cassetto";
import { ImmagineMascotte } from "~/components/mascotte";
import { StatoPercorsoAccount } from "~/components/percorso-account";
import { NotaInformazione, Pulsante, RigaMenu, Schermata, Scheda, Separatore, Testo } from "~/components/ui";
import { eliminaAccount } from "~/lib/api";
import { apriSito } from "~/lib/apri";
import { VERSIONE_APP } from "~/lib/config";
import { chiediConferma } from "~/lib/conferma";
import { cancellaPromemoria } from "~/lib/notifiche";
import { dimenticaPercorsoDelTelefono, esciDallAccount, prontoPerUscire } from "~/lib/percorso-account";
import { useSessione } from "~/lib/sessione";
import { cancellaDatiLocali, useLook } from "~/lib/stato";
import { supabase } from "~/lib/supabase";
import { SPAZIO, useColori } from "~/lib/tema";

export default function Profilo() {
  const look = datiLook(useLook());
  return (
    <Schermata>
      <Scheda style={{ alignItems: "center" }}>
        <ImmagineMascotte nome={look.immagine} larghezza={150} />
        <Pulsante titolo="Vesti Bleo" variante="secondario" icona="shirt-outline" onPress={() => router.push("/guardaroba")} />
      </Scheda>

      <Account />

      <Scheda style={{ paddingVertical: SPAZIO.xs }}>
        <RigaCassetto />
      </Scheda>

      <Testo variante="sottotitolo">Informazioni</Testo>
      <Scheda>
        <RigaMenu titolo="Informativa sulla privacy" icona="lock-closed-outline" esterno onPress={() => void apriSito("/privacy")} />
        <Separatore />
        <RigaMenu titolo="Impressum" icona="business-outline" esterno onPress={() => void apriSito("/impressum")} />
        <Separatore />
        <RigaMenu
          titolo="Cosa Bleo non è"
          sottotitolo="Informazioni generali, non consulenza"
          icona="information-circle-outline"
          esterno
          onPress={() => void apriSito("/#cosa-non-e")}
        />
      </Scheda>

      <DatiSulTelefono />
      <NotaInformazione />
      <Testo variante="piccolo" attenuato style={{ textAlign: "center" }}>
        Bleo (si dice «Blìo») · versione {VERSIONE_APP}
      </Testo>
    </Schermata>
  );
}

function Account() {
  const c = useColori();
  const { pronta, sessione } = useSessione();
  const [attesa, setAttesa] = useState(false);
  const [uscita, setUscita] = useState(false);

  if (!supabase()) {
    return (
      <Scheda>
        <Testo variante="sottotitolo">Account</Testo>
        <Testo attenuato>
          In questa versione di prova non serve un account: tutto resta su questo telefono.
        </Testo>
      </Scheda>
    );
  }
  if (!pronta) return null;

  function confermaEliminazione() {
    Alert.alert(
      "Eliminare l'account?",
      "Cancelliamo per sempre il tuo account con il questionario, i passi fatti, le domande alla chat, i tuoi conti, le ricevute salvate, il cassetto dei documenti con i suoi file e i tuoi preventivi e fatture. Se ti servono, prima scarica i conti per il fiduciario dalla pagina Conti e tieni una copia dei documenti e delle fatture in PDF. Non si può tornare indietro.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Sì, elimina tutto",
          style: "destructive",
          onPress: async () => {
            setAttesa(true);
            const esito = await eliminaAccount();
            // Come sul sito: via dal telefono anche la copia del percorso dell'account eliminato.
            if (esito.ok) dimenticaPercorsoDelTelefono();
            setAttesa(false);
            Alert.alert(esito.ok ? "Account eliminato" : "Non è stato possibile", esito.ok ? "Il tuo account non esiste più." : esito.messaggio);
          },
        },
      ],
    );
  }

  /** Prima di uscire prova a salvare il percorso; se qualcosa resterebbe solo sul telefono, chiede. */
  async function esci() {
    setUscita(true);
    const pronto = await prontoPerUscire();
    if (pronto) {
      await esciDallAccount();
      setUscita(false);
      return;
    }
    setUscita(false);
    chiediConferma({
      titolo: "Uscire lo stesso?",
      messaggio:
        "Una parte del percorso di questo telefono forse non è ancora nel tuo account (per esempio perché manca la connessione). Uscendo la togliamo da questo telefono e potresti perderla. Se puoi, riprova quando c'è la connessione.",
      conferma: "Esci lo stesso",
      pericolo: true,
      onConferma: () => void esciDallAccount(),
    });
  }

  return (
    <Scheda>
      <Testo variante="sottotitolo">Account</Testo>
      {sessione ? (
        <View style={{ gap: SPAZIO.m }}>
          <Testo attenuato>Hai fatto l&apos;accesso come {sessione.user.email}.</Testo>
          <View style={{ gap: SPAZIO.xs }}>
            <Testo variante="forte">Il tuo percorso</Testo>
            <StatoPercorsoAccount />
          </View>
          <Pulsante titolo="Esci" variante="secondario" caricamento={uscita} onPress={() => void esci()} />
          <Testo variante="piccolo" colore={c.attenuato}>
            Uscendo togliamo da questo telefono le risposte e i passi fatti, come sul sito: restano nel tuo account e
            tornano quando accedi di nuovo.
          </Testo>
          <Pulsante titolo="Elimina account" variante="testo" caricamento={attesa} onPress={confermaEliminazione} />
          <Testo variante="piccolo" colore={c.attenuato}>
            Eliminando l&apos;account cancelli i dati salvati su Bleo, compresi i tuoi conti, le foto delle ricevute, i
            documenti del cassetto e i tuoi preventivi e fatture. Se ti servono, prima scaricali per il fiduciario dalla pagina Conti. I dati su questo
            telefono li cancelli qui sotto.
          </Testo>
        </View>
      ) : (
        <View style={{ gap: SPAZIO.m }}>
          <Testo attenuato>
            Con l&apos;accesso ritrovi il percorso anche sul sito e su un altro telefono, puoi fare domande alla chat,
            tenere i tuoi conti e preparare preventivi e fatture. Ti basta l&apos;email: niente password.
          </Testo>
          <Pulsante titolo="Accedi" onPress={() => router.push("/accedi")} />
        </View>
      )}
    </Scheda>
  );
}

function DatiSulTelefono() {
  function conferma() {
    Alert.alert(
      "Cancellare i dati da questo telefono?",
      "Togliamo risposte al questionario, passi fatti, look di Bleo, promemoria, le scadenze dei documenti salvate per i promemoria e i dati degli strumenti (tariffa oraria, quanto mettere da parte, Fondare una Sagl). Il tuo account, se ce l'hai, resta.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Cancella",
          style: "destructive",
          onPress: async () => {
            await cancellaPromemoria().catch(() => {});
            cancellaDatiLocali();
          },
        },
      ],
    );
  }
  return (
    <Scheda>
      <Testo variante="sottotitolo">Dati su questo telefono</Testo>
      <Testo attenuato>
        Senza accesso, risposte e passi fatti restano solo su questo telefono, finché non li cancelli; con
        l&apos;accesso sono anche nel tuo account e tornano qui alla prossima apertura. I calcoli degli strumenti
        restano solo su questo telefono.
      </Testo>
      <Pulsante titolo="Cancella i dati da questo telefono" variante="secondario" onPress={conferma} />
    </Scheda>
  );
}
