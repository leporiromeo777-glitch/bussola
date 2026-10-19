import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import type { DomandaSalvataggio } from "@/lib/percorso/sincronizza";
import type { StatoSincronizzazione } from "@/lib/percorso/sincronizzazione";
import { Pulsante, Scheda, Testo, tocco, type NomeIcona } from "~/components/ui";
import { sincronizzazionePercorso, useStatoPercorsoAccount } from "~/lib/percorso-account";
import { supabase } from "~/lib/supabase";
import { SPAZIO, useColori } from "~/lib/tema";

const INVITO_ACCESSO = "Accedi per ritrovare il percorso anche sul sito e su un altro telefono";

type Riga = { icona: NomeIcona; testo: string; attesa?: boolean; azione?: { titolo: string; onPress: () => void } };

function rigaDiStato(stato: StatoSincronizzazione): Riga {
  const accedi = { titolo: INVITO_ACCESSO, onPress: () => router.push("/accedi") };
  switch (stato.fase) {
    case "senza_accesso":
      return { icona: "phone-portrait-outline", testo: "Solo su questo telefono.", azione: supabase() ? accedi : undefined };
    case "controllo":
      return { icona: "sync-outline", testo: "Controllo il tuo account…", attesa: true };
    case "salvato":
      return { icona: "cloud-done-outline", testo: "Salvato nel tuo account." };
    case "da_mandare":
      return stato.errore
        ? {
            icona: "cloud-upload-outline",
            testo: "Salvato su questo telefono. Lo mando al tuo account appena c'è la connessione.",
          }
        : { icona: "cloud-upload-outline", testo: "Sto salvando nel tuo account…", attesa: true };
    case "non_raggiungibile":
      return {
        icona: "cloud-offline-outline",
        testo: "Non riesco a controllare il tuo account adesso. Riprovo da solo; intanto vedi il percorso di questo telefono.",
      };
    case "da_confermare":
      return { icona: "phone-portrait-outline", testo: "Solo su questo telefono, finché non scegli se salvarlo nel tuo account." };
    case "rifiutato":
      return {
        icona: "phone-portrait-outline",
        testo: "Solo su questo telefono: non l'ho salvato nel tuo account.",
        azione: { titolo: "Salvalo nell'account", onPress: () => void sincronizzazionePercorso.conferma() },
      };
    case "accesso_scaduto":
      return {
        icona: "alert-circle-outline",
        testo: "Salvato su questo telefono. Accedi di nuovo per salvarlo anche nel tuo account.",
        azione: { titolo: "Accedi di nuovo", onPress: () => router.push("/accedi") },
      };
    case "errore":
      return {
        icona: "alert-circle-outline",
        testo: `${stato.errore?.messaggio ?? "Non sono riuscito a salvare nel tuo account."} Intanto resta su questo telefono.`,
      };
  }
}

/**
 * Dove sta il percorso: «Salvato nel tuo account», «Solo su questo
 * telefono»… Senza accesso invita ad accedere (non nella versione di prova).
 */
export function StatoPercorsoAccount({ conAzione = true }: { conAzione?: boolean }) {
  const c = useColori();
  const stato = useStatoPercorsoAccount();
  const riga = rigaDiStato(stato);
  return (
    <View style={{ gap: SPAZIO.xs }}>
      <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "center" }}>
        {riga.attesa ? (
          <ActivityIndicator size="small" color={c.marchio} />
        ) : (
          <Ionicons name={riga.icona} size={18} color={c.marchio} />
        )}
        <Testo variante="piccolo" attenuato style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {riga.testo}
        </Testo>
      </View>
      {conAzione && riga.azione ? <Collegamento titolo={riga.azione.titolo} onPress={riga.azione.onPress} /> : null}
    </View>
  );
}

/** Un'azione scritta come link, allineata a sinistra anche su due righe (area da toccare di 44 punti). */
function Collegamento({ titolo, onPress }: { titolo: string; onPress: () => void }) {
  const c = useColori();
  return (
    <Pressable
      onPress={() => {
        tocco();
        onPress();
      }}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: SPAZIO.xs,
        paddingLeft: 26,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Testo variante="piccolo" colore={c.marchio} style={{ flexShrink: 1, fontWeight: "600" }}>
        {titolo}
      </Testo>
      <Ionicons name="chevron-forward" size={14} color={c.marchio} />
    </Pressable>
  );
}

function testiDomanda(domanda: DomandaSalvataggio, email: string | null) {
  const dove = email ? ` (${email})` : "";
  if (domanda.soloPassi) {
    const uno = domanda.passiNuovi === 1;
    return {
      titolo: "Vuoi salvare nel tuo account i passi fatti su questo telefono?",
      testo: uno
        ? `Su questo telefono hai segnato come fatto 1 passo senza accedere. Se lo salvi nel tuo account${dove}, lo ritrovi anche sul sito e su un altro telefono.`
        : `Su questo telefono hai segnato come fatti ${domanda.passiNuovi} passi senza accedere. Se li salvi nel tuo account${dove}, li ritrovi anche sul sito e su un altro telefono.`,
    };
  }
  return {
    titolo: "Vuoi salvare nel tuo account il percorso di questo telefono?",
    testo: `Hai risposto al questionario su questo telefono senza accedere. Se lo salvi nel tuo account${dove}, ritrovi le risposte e i passi fatti anche sul sito e su un altro telefono.${domanda.sostituisce ? " Le risposte salvate prima nell'account verranno sostituite." : ""}`,
  };
}

/**
 * La domanda prima di salvare nell'account il percorso fatto sul telefono
 * senza accesso (come sul sito): «Salva» o «No».
 */
export function DomandaPercorsoAccount() {
  const c = useColori();
  const stato = useStatoPercorsoAccount();
  const [attesa, setAttesa] = useState(false);
  if (stato.fase !== "da_confermare" || !stato.domanda) return null;
  const { titolo, testo } = testiDomanda(stato.domanda, stato.email);

  async function salva() {
    setAttesa(true);
    await sincronizzazionePercorso.conferma();
    setAttesa(false);
  }

  return (
    <Scheda evidenziata style={{ gap: SPAZIO.m }}>
      <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "flex-start" }}>
        <Ionicons name="cloud-upload-outline" size={22} color={c.marchio} />
        <Testo variante="sottotitolo" style={{ flex: 1 }}>
          {titolo}
        </Testo>
      </View>
      <Testo>{testo}</Testo>
      <Testo variante="piccolo" attenuato>
        Se non riconosci questo indirizzo email, scegli «No» ed esci dall&apos;account dal Profilo.
      </Testo>
      <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
        <Pulsante titolo="Salva" caricamento={attesa} style={{ flex: 1 }} onPress={() => void salva()} />
        <Pulsante
          titolo="No"
          variante="secondario"
          disabilitato={attesa}
          style={{ flex: 1 }}
          onPress={() => sincronizzazionePercorso.rifiuta()}
          suggerimento="Il percorso resta solo su questo telefono"
        />
      </View>
    </Scheda>
  );
}

/**
 * Nella schermata senza questionario: con l'accesso dice che sta cercando il
 * percorso nell'account; senza, invita ad accedere per ritrovare quello fatto sul sito.
 */
export function PercorsoDalSito() {
  const c = useColori();
  const stato = useStatoPercorsoAccount();
  if (!supabase()) return null;
  if (stato.fase === "senza_accesso") {
    return (
      <View style={{ gap: SPAZIO.s, alignItems: "center" }}>
        <Testo attenuato style={{ textAlign: "center" }}>
          Hai già risposto sul sito di Bleo?
        </Testo>
        <Pulsante titolo={INVITO_ACCESSO} variante="secondario" onPress={() => router.push("/accedi")} />
      </View>
    );
  }
  if (stato.fase === "controllo") {
    return (
      <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "center" }}>
        <ActivityIndicator size="small" color={c.marchio} />
        <Testo attenuato accessibilityLiveRegion="polite">
          Controllo se nel tuo account c&apos;è già un percorso…
        </Testo>
      </View>
    );
  }
  if (stato.fase === "non_raggiungibile" || stato.fase === "accesso_scaduto") {
    return <StatoPercorsoAccount />;
  }
  return null;
}

/** Sotto il questionario: dove finiscono le risposte. */
export function NotaSalvataggioQuestionario() {
  const { fase } = useStatoPercorsoAccount();
  return (
    <Testo variante="piccolo" attenuato>
      {fase === "senza_accesso"
        ? "Le risposte restano su questo telefono. Puoi chiudere e riprendere da dove eri."
        : "Quando finisci, salvo le risposte su questo telefono e nel tuo account. Puoi chiudere e riprendere da dove eri."}
    </Testo>
  );
}
