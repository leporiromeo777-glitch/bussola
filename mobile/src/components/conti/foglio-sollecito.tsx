import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Linking, Modal, ScrollView, Share, View } from "react-native";
import { dataSvizzera, fontiSolleciti, percentuale, regoleSolleciti, VERIFICATO_SOLLECITI } from "@/data/svizzera";
import { dataIsoValida } from "@/lib/conti/importi";
import {
  FIRMA_MASSIMA,
  GIORNI_NUOVO_TERMINE,
  NOMI_LIVELLO,
  leggiIbanSollecito,
  linkEmail,
  livelloConsigliato,
  nuovoTermineProposto,
  preparaSollecito,
  testoDaCopiare,
  testoSollecitoInviato,
} from "@/lib/conti/sollecito";
import { LIVELLI_SOLLECITO, type FatturaEmessa, type LivelloSollecito, type Sollecito } from "@/lib/conti/tipi";
import { normalizzaData } from "@/lib/lettera/spiegazione";
import { importo } from "@/lib/strumenti/numeri";
import { CampoTesto, Scelta } from "~/components/campi";
import { ElencoFonti, Pulsante, Scheda, Separatore, Testo } from "~/components/ui";
import { avvisa } from "~/lib/conferma";
import { oggiLocale } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

/** «19.10.2026» → «2026-10-19»; null se non è una data valida. */
function inIso(testo: string): string | null {
  const data = normalizzaData(testo);
  if (!data) return null;
  const [g, m, a] = data.split(".");
  const iso = `${a}-${m}-${g}`;
  return dataIsoValida(iso) ? iso : null;
}

/**
 * Foglio «Prepara il sollecito»: Bleo scrive oggetto e testo, l'utente li
 * controlla e li manda lui (Condividi, email o copia). Poi lo segna come
 * inviato, così la volta dopo Bleo propone il secondo sollecito.
 */
export function FoglioSollecito({
  fattura,
  onChiudi,
  onSegna,
}: {
  fattura: FatturaEmessa | null;
  onChiudi: () => void;
  /** Salva il sollecito inviato (o null per toglierlo); true se è andato a buon fine. */
  onSegna: (fattura: FatturaEmessa, sollecito: Sollecito | null) => Promise<boolean>;
}) {
  const c = useColori();
  return (
    <Modal visible={fattura !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onChiudi}>
      {fattura ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: c.sfondo }}
          contentContainerStyle={{ padding: SPAZIO.l, paddingBottom: SPAZIO.xxl * 2, gap: SPAZIO.l }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPAZIO.m }}>
            <Testo variante="titolo" style={{ flex: 1 }}>
              Sollecito
            </Testo>
            <Pulsante titolo="Chiudi" variante="testo" onPress={onChiudi} />
          </View>
          <ContenutoSollecito key={fattura.id} fattura={fattura} onChiudi={onChiudi} onSegna={onSegna} />
        </ScrollView>
      ) : null}
    </Modal>
  );
}

function ContenutoSollecito({
  fattura: f,
  onChiudi,
  onSegna,
}: {
  fattura: FatturaEmessa;
  onChiudi: () => void;
  onSegna: (fattura: FatturaEmessa, sollecito: Sollecito | null) => Promise<boolean>;
}) {
  const c = useColori();
  const oggi = oggiLocale();
  const [livello, setLivello] = useState<LivelloSollecito>(livelloConsigliato(f));
  const [termine, setTermine] = useState(dataSvizzera(nuovoTermineProposto(oggi)));
  const [iban, setIban] = useState("");
  const [firma, setFirma] = useState("");
  const [modificato, setModificato] = useState<{ oggetto: string; testo: string } | null>(null);
  const [stato, setStato] = useState("");
  const [inCorso, setInCorso] = useState(false);

  const termineIso = inIso(termine);
  const termineValido = termineIso !== null && termineIso >= oggi;
  const ibanLetto = leggiIbanSollecito(iban);
  const generato = preparaSollecito({
    livello,
    fattura: f,
    nuovoTermine: termineValido ? termineIso : nuovoTermineProposto(oggi),
    iban: ibanLetto.iban,
    firma: firma.slice(0, FIRMA_MASSIMA),
  });
  const attuale = modificato ?? generato;

  function scelta(cambia: () => void) {
    cambia();
    setModificato(null);
    setStato("");
  }

  async function condividi() {
    try {
      const esito = await Share.share(
        { title: attuale.oggetto, message: attuale.testo },
        { subject: attuale.oggetto, dialogTitle: "Manda il sollecito" },
      );
      if (esito.action === Share.sharedAction) setStato("Mandato? Tocca «Segna come inviato oggi».");
    } catch {
      avvisa("Non è stato possibile condividere", "Prova con «Copia il testo» e incollalo nell'email o nel messaggio.");
    }
  }

  async function email() {
    try {
      await Linking.openURL(linkEmail(attuale));
      setStato("Scegli il cliente come destinatario e manda. Poi tocca «Segna come inviato oggi».");
    } catch {
      avvisa("Nessuna app per l'email", "Usa «Condividi» oppure copia il testo e incollalo dove vuoi.");
    }
  }

  async function copia() {
    await Clipboard.setStringAsync(testoDaCopiare(attuale)).catch(() => {});
    setStato("Testo copiato con l'oggetto: incollalo nell'email o nel messaggio al cliente.");
  }

  async function segna(sollecito: Sollecito | null) {
    setInCorso(true);
    const ok = await onSegna(f, sollecito);
    setInCorso(false);
    if (ok && sollecito) onChiudi();
    else if (ok) setStato("Nota del sollecito tolta.");
  }

  const tasso = percentuale(regoleSolleciti.interesseMora.valore, 0);
  const { ufficio } = regoleSolleciti.esecuzione.valore;

  return (
    <View style={{ gap: SPAZIO.l }}>
      <View style={{ gap: SPAZIO.xs }}>
        <Testo variante="forte">
          Fattura {f.numero} · {f.cliente}
        </Testo>
        <Testo attenuato>
          {importo(f.importo)} del {dataSvizzera(f.data)}
          {f.scadenza ? `, da pagare entro il ${dataSvizzera(f.scadenza)}` : ""}
        </Testo>
        {f.sollecito ? (
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: SPAZIO.s }}>
            <Testo variante="piccolo" attenuato>
              {testoSollecitoInviato(f.sollecito)}
            </Testo>
            <Pulsante
              titolo="Togli questa nota"
              variante="testo"
              onPress={() => void segna(null)}
              disabilitato={inCorso}
              suggerimento={`Toglie la nota del sollecito per la fattura ${f.numero}`}
            />
          </View>
        ) : null}
        <Testo variante="piccolo" attenuato>
          Bleo ti prepara il testo: controllalo e mandalo tu al cliente.
        </Testo>
      </View>

      <Scelta
        etichetta="Che sollecito vuoi mandare?"
        opzioni={LIVELLI_SOLLECITO.map((l) => ({ valore: l, etichetta: NOMI_LIVELLO[l].titolo }))}
        valore={livello}
        onCambia={(l) => scelta(() => setLivello(l))}
      />
      <Testo variante="piccolo" attenuato style={{ marginTop: -SPAZIO.s }}>
        {NOMI_LIVELLO[livello].descrizione}
        {livello === livelloConsigliato(f) ? " È quello che ti consiglio adesso." : ""}
      </Testo>

      <CampoTesto
        etichetta="Nuovo termine per pagare"
        valore={termine}
        onCambia={(v) => scelta(() => setTermine(v))}
        tastiera="numbers-and-punctuation"
        errore={termineValido ? undefined : "Scrivi una data da oggi in poi, così: 28.10.2026."}
        aiuto={`Bleo propone ${GIORNI_NUOVO_TERMINE} giorni da oggi: puoi cambiare la data.`}
      />
      <CampoTesto
        etichetta="IBAN per il pagamento"
        valore={iban}
        onCambia={(v) => scelta(() => setIban(v))}
        segnaposto="Facoltativo"
        errore={ibanLetto.errore ?? undefined}
        aiuto="Facoltativo. Resta su questo telefono: Bleo non lo salva."
      />
      <CampoTesto
        etichetta="Il tuo nome o quello della ditta"
        valore={firma}
        onCambia={(v) => scelta(() => setFirma(v))}
        segnaposto="Per la firma"
      />

      <Separatore />

      <CampoTesto
        etichetta="Oggetto"
        valore={attuale.oggetto}
        onCambia={(v) => setModificato({ ...attuale, oggetto: v })}
      />
      <CampoTesto
        etichetta="Testo"
        valore={attuale.testo}
        onCambia={(v) => setModificato({ ...attuale, testo: v })}
        righe={14}
        aiuto="Puoi cambiarlo come vuoi. Se cambi le scelte qui sopra, Bleo lo riscrive."
      />

      <View style={{ gap: SPAZIO.s }}>
        <Pulsante titolo="Condividi" icona="share-outline" onPress={() => void condividi()} />
        <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
          <Pulsante
            titolo="Email"
            variante="secondario"
            icona="mail-outline"
            onPress={() => void email()}
            suggerimento="Apre la tua app dell'email con oggetto e testo"
            style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
          />
          <Pulsante
            titolo="Copia"
            variante="secondario"
            icona="copy-outline"
            onPress={() => void copia()}
            suggerimento="Copia oggetto e testo"
            style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
          />
        </View>
        {stato ? (
          <Testo variante="piccolo" colore={c.marchio} accessibilityLiveRegion="polite">
            {stato}
          </Testo>
        ) : null}
      </View>

      <Scheda>
        <Testo>L&apos;hai mandato? Segnalo qui: la prossima volta Bleo ti propone il passo successivo.</Testo>
        <Pulsante
          titolo="Segna come inviato oggi"
          icona="checkmark-done-outline"
          variante="secondario"
          onPress={() => void segna({ livello, inviatoIl: oggi })}
          caricamento={inCorso}
        />
      </Scheda>

      <Scheda tenue>
        <Testo variante="forte">Da sapere</Testo>
        <Testo variante="piccolo">
          Se in fattura c&apos;era una data di pagamento, quando passa il cliente è in mora (art. 102 CO): puoi chiedere gli
          interessi di mora previsti dalla legge, il {tasso} all&apos;anno, se nel contratto non ne avete pattuiti di più
          alti (art. 104 CO). Il secondo sollecito li ricorda.
        </Testo>
        <Testo variante="piccolo">
          Mandare un sollecito non è obbligatorio, ma si usa. Se il cliente non paga neanche dopo i solleciti, la via
          ufficiale è la domanda d&apos;esecuzione all&apos;{ufficio} del luogo di domicilio del cliente.
        </Testo>
        <Testo variante="piccolo">
          Sono informazioni generali, non una consulenza: se il cliente contesta la fattura o il tuo caso è complicato,
          chiedi a un fiduciario autorizzato o a un avvocato.
        </Testo>
        <ElencoFonti
          fonti={[fontiSolleciti.co102, fontiSolleciti.co104, fontiSolleciti.chEsecuzioni]}
          verificatoIl={VERIFICATO_SOLLECITI}
        />
      </Scheda>
    </View>
  );
}
