import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { datiLook } from "@/lib/mascotte/look";
import { RigaCassetto } from "~/components/cassetto/link-cassetto";
import { ImmagineMascotte } from "~/components/mascotte";
import { NotaInformazione, Pulsante, RigaMenu, Schermata, Scheda, Separatore, Testo } from "~/components/ui";
import { eliminaAccount } from "~/lib/api";
import { apriSito } from "~/lib/apri";
import { VERSIONE_APP } from "~/lib/config";
import { cancellaPromemoria } from "~/lib/notifiche";
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
            setAttesa(false);
            Alert.alert(esito.ok ? "Account eliminato" : "Non è stato possibile", esito.ok ? "Il tuo account non esiste più." : esito.messaggio);
          },
        },
      ],
    );
  }

  return (
    <Scheda>
      <Testo variante="sottotitolo">Account</Testo>
      {sessione ? (
        <View style={{ gap: SPAZIO.m }}>
          <Testo attenuato>Hai fatto l&apos;accesso come {sessione.user.email}.</Testo>
          <Pulsante
            titolo="Esci"
            variante="secondario"
            onPress={() => void supabase()?.auth.signOut({ scope: "local" })}
          />
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
            Con l&apos;accesso puoi fare domande alla chat, tenere i tuoi conti e preparare preventivi e fatture. Ti basta
            l&apos;email: niente password.
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
      "Togliamo risposte al questionario, passi fatti, look di Bleo, promemoria e le scadenze dei documenti salvate per i promemoria. Il tuo account, se ce l'hai, resta.",
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
        Risposte, passi fatti e calcoli degli strumenti restano solo su questo telefono, finché non li cancelli.
      </Testo>
      <Pulsante titolo="Cancella i dati da questo telefono" variante="secondario" onPress={conferma} />
    </Scheda>
  );
}
