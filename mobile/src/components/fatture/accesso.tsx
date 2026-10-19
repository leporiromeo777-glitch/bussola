import { router } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import type { StatoArchivio } from "@/lib/strumenti/archivio-account";
import { Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { apriSito } from "~/lib/apri";
import { archivioFatture } from "~/lib/fatture";
import { useSessione } from "~/lib/sessione";
import { supabase } from "~/lib/supabase";
import { SPAZIO, useColori } from "~/lib/tema";

/**
 * Preventivi e fatture stanno nell'account: senza Supabase (versione di
 * prova) o senza accesso si spiega perché e si propone il sito.
 */
export function ConAccesso({ children }: { children: ReactNode }) {
  const { pronta, sessione } = useSessione();
  if (!supabase()) {
    return (
      <Schermata>
        <Scheda tenue>
          <Testo>
            In questa versione di prova preventivi e fatture nell&apos;app non sono ancora attivi. Puoi prepararli sul sito:
            restano nel browser.
          </Testo>
        </Scheda>
        <Pulsante titolo="Apri sul sito" variante="secondario" icona="open-outline" onPress={() => void apriSito("/strumenti/fattura")} />
      </Schermata>
    );
  }
  if (!pronta) return <Schermata>{null}</Schermata>;
  if (!sessione) {
    return (
      <Schermata>
        <Testo variante="sottotitolo">Accedi per preparare preventivi e fatture</Testo>
        <Testo>
          Li salviamo nel tuo account, insieme ai tuoi dati (nome, indirizzo, IBAN): così li ritrovi sul telefono e sul sito,
          senza riscrivere niente. Ti basta l&apos;email: niente password.
        </Testo>
        <Pulsante titolo="Accedi" icona="arrow-forward" onPress={() => router.push("/accedi")} />
      </Schermata>
    );
  }
  return <>{children}</>;
}

/** Mentre si leggono i documenti, o se non si riesce. */
export function CaricamentoFatture({ stato }: { stato: StatoArchivio }) {
  const c = useColori();
  if (stato.caricamento === "errore" && stato.errore) {
    const scaduto = stato.errore.stato === 401;
    return (
      <Schermata>
        <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
          <Testo accessibilityLiveRegion="polite">{stato.errore.messaggio}</Testo>
          {scaduto ? (
            <Pulsante titolo="Accedi di nuovo" onPress={() => router.push("/accedi")} />
          ) : (
            <>
              <Pulsante titolo="Riprova" variante="secondario" icona="refresh" onPress={() => void archivioFatture.carica()} />
              <Pulsante
                titolo="Apri lo strumento sul sito"
                variante="testo"
                icona="open-outline"
                onPress={() => void apriSito("/strumenti/fattura")}
              />
            </>
          )}
        </Scheda>
      </Schermata>
    );
  }
  return (
    <Schermata>
      <View style={{ paddingVertical: SPAZIO.xxl, alignItems: "center", gap: SPAZIO.m }}>
        <ActivityIndicator color={c.marchio} />
        <Testo attenuato>Apro i tuoi preventivi e le tue fatture…</Testo>
      </View>
    </Schermata>
  );
}

/** Stato del salvataggio nell'account, letto anche da VoiceOver/TalkBack. */
export function StatoSalvataggio({ stato }: { stato: StatoArchivio }) {
  const c = useColori();
  const errore = stato.salvataggio === "errore" ? stato.erroreSalvataggio : null;
  if (errore) {
    return (
      <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
        <Testo accessibilityLiveRegion="polite" colore={c.pericolo}>
          {errore.stato === 401 ? "Accesso scaduto: le ultime modifiche non sono salvate." : `Non salvato: ${errore.messaggio}`}
        </Testo>
        {errore.stato === 401 ? (
          <Pulsante titolo="Accedi di nuovo" onPress={() => router.push("/accedi")} />
        ) : (
          <Pulsante titolo="Riprova adesso" variante="secondario" icona="refresh" onPress={() => void archivioFatture.salva()} />
        )}
      </Scheda>
    );
  }
  return (
    <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
      {stato.salvataggio === "salvato" ? "Salvato nel tuo account: lo ritrovi anche sul sito." : "Salvo…"}
    </Testo>
  );
}
