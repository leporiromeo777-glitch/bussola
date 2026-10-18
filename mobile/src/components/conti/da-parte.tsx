/**
 * «Quanto mettere da parte» nella scheda Conti: dai conti confermati
 * dell'anno, quanto tenere da parte per i contributi AVS e per le imposte.
 * Il calcolo è quello del sito (src/lib/conti/da-parte.ts); le scelte
 * (percentuale per le imposte, acconti, mese di inizio) restano sul telefono,
 * con la stessa chiave del sito.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { fonti, fontiStrumenti, percentuale, regolePercorso } from "@/data/svizzera";
import {
  calcolaDaParte,
  conAnno,
  fontiDaParte,
  impostazioniIniziali,
  lezioniDaParte,
  NOMI_MESI,
  periodo,
  schemaImpostazioniDaParte,
  sottotitoloDaParte,
  spiegazioneUtile,
  verificatoDaParte,
  type AvvisoDaParte,
  type ImpostazioniDaParte,
  type StimaDaParte,
} from "@/lib/conti/da-parte";
import type { Riepilogo } from "@/lib/conti/tipi";
import { CHIAVI_ARCHIVIO, codifica, decodifica } from "@/lib/strumenti/archivio";
import { descrizioneCaso, notaAnniSupplementi } from "@/lib/strumenti/avs";
import { importo, numeroBreve } from "@/lib/strumenti/numeri";
import { CampoNumero, RigaValore, Scelta } from "~/components/campi";
import { ElencoFonti, Pillola, RigaMenu, Scheda, Testo, tocco } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { leggi, scrivi } from "~/lib/memoria";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** In franchi interi: è una stima, i centesimi non servono. */
const chf = (n: number) => importo(n, 0);

export function SezioneDaParte({ riepilogo, oggi }: { riepilogo: Riepilogo; oggi: string }) {
  const c = useColori();
  const [impostazioni, setImpostazioni] = useState<ImpostazioniDaParte>(() =>
    decodifica(leggi(CHIAVI_ARCHIVIO.daParte), schemaImpostazioniDaParte, impostazioniIniziali),
  );
  const [dettagli, setDettagli] = useState(false);
  const { stima: s, errori } = useMemo(() => calcolaDaParte(riepilogo, oggi, impostazioni), [riepilogo, oggi, impostazioni]);
  const anno = s.anno;

  function cambia(nuove: ImpostazioniDaParte) {
    setImpostazioni(nuove);
    scrivi(CHIAVI_ARCHIVIO.daParte, codifica(nuove));
  }

  if (s.vuoto) {
    return (
      <View style={{ gap: SPAZIO.s }}>
        <Testo variante="sottotitolo">Quanto mettere da parte</Testo>
        <Scheda tenue>
          <Testo>
            Quando confermi le prime entrate e uscite del {anno}, qui vedi quanto mettere da parte per l&apos;AVS e per le
            imposte.
          </Testo>
        </Scheda>
      </View>
    );
  }

  const senzaImposte = s.riservaPercento === null;

  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Quanto mettere da parte</Testo>
      <Testo variante="piccolo" attenuato>
        Per i contributi AVS e le imposte del {anno}, che paghi dopo: una stima dai conti che hai confermato.
      </Testo>

      <Scheda evidenziata>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPAZIO.s }}>
          <Testo variante="etichetta" attenuato style={{ flex: 1 }}>
            {s.annoInCorso ? "QUESTO MESE METTI DA PARTE CIRCA" : `PER IL ${anno} SERVIVANO IN TUTTO CIRCA`}
          </Testo>
          <Pillola testo="Stima" tono="accento" />
        </View>
        <View accessibilityLiveRegion="polite">
          <Testo colore={c.marchio} style={{ fontSize: 36, lineHeight: 42, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
            {chf(s.annoInCorso ? s.alMese.totale : s.totaleAnno)}
          </Testo>
          <Testo variante="piccolo" attenuato>
            {sottotitoloDaParte(s)}
          </Testo>
        </View>
        {s.annoInCorso ? (
          <View>
            <RigaValore etichetta={maiuscola(periodo(s))} valore={chf(s.finora.totale)} />
            <RigaValore etichetta={`In tutto il ${anno}`} valore={chf(s.totaleAnno)} forte />
          </View>
        ) : null}
        {s.pocoAffidabile ? (
          <Testo variante="piccolo" attenuato>
            È una media su pochi mesi: nei prossimi la stima può cambiare molto.
          </Testo>
        ) : null}
        {senzaImposte ? (
          <Testo variante="piccolo">Per le imposte scegli tu una percentuale qui sotto: Bleo non calcola le imposte.</Testo>
        ) : null}
      </Scheda>

      <Scheda>
        <Testo variante="forte">Da dove arriva la cifra</Testo>
        <Testo variante="piccolo" attenuato>
          {spiegazioneUtile(s)}
        </Testo>
        <View>
          <RigaValore etichetta={`Utile stimato del ${anno}`} valore={chf(s.utileAnno)} />
          <RigaValore etichetta="Contributi AVS/AI/IPG e assegni familiari" valore={chf(s.contributi.totale)} />
          {s.accontiAvs !== null ? <RigaValore etichetta="Acconti AVS che hai scritto" valore={chf(-s.accontiAvs)} /> : null}
          <RigaValore etichetta="Per l'AVS da mettere da parte" valore={chf(s.avsAnno)} forte />
          <RigaValore
            etichetta={senzaImposte ? "Imposte (non incluse)" : `Imposte: ${numeroBreve(s.riservaPercento ?? 0, 2)}% di ${chf(s.baseImposte)}`}
            valore={senzaImposte ? "—" : chf(s.imposteAnno)}
            forte
          />
          <RigaValore etichetta={`Totale nel ${anno}`} valore={chf(s.totaleAnno)} forte />
        </View>
        <Testo variante="piccolo" attenuato>
          {descrizioneCaso(s.contributi)}
        </Testo>
      </Scheda>

      {s.avvisi.map((a) => (
        <Avviso key={a.id} avviso={a} />
      ))}

      <Scheda style={{ gap: SPAZIO.l }}>
        <Testo variante="forte">I tuoi dati per la stima</Testo>
        <Scelta
          etichetta="La tua attività indipendente è"
          opzioni={[
            { valore: "principale" as const, etichetta: "Principale" },
            { valore: "accessoria" as const, etichetta: "Accessoria" },
          ]}
          valore={impostazioni.situazione}
          onCambia={(situazione) => cambia({ ...impostazioni, situazione })}
        />
        <Testo variante="piccolo" attenuato style={{ marginTop: -SPAZIO.s }}>
          Accessoria: lavori anche come dipendente e sul salario paghi già il contributo AVS minimo.
        </Testo>
        <SceltaMeseInizio
          stima={s}
          onCambia={(meseInizio) => cambia(conAnno(impostazioni, anno, { meseInizio }))}
        />
        <CampoNumero
          etichetta={`Acconti AVS del ${anno}, in tutto`}
          prefisso="CHF"
          valore={impostazioni.anni[String(anno)]?.accontiAvs ?? ""}
          onCambia={(accontiAvs) => cambia(conAnno(impostazioni, anno, { accontiAvs }))}
          errore={errori.accontiAvs}
          aiuto="La somma delle fatture d'acconto della cassa per quest'anno, anche quelle da pagare. Vuoto se non paghi acconti: Bleo conta tutti i contributi."
        />
        <CampoNumero
          etichetta="Riserva per le imposte (%)"
          valore={impostazioni.riservaImpostePercento}
          onCambia={(riservaImpostePercento) => cambia({ ...impostazioni, riservaImpostePercento })}
          errore={errori.riservaImpostePercento}
          aiuto="Percentuale dell'utile dopo i contributi, scelta da te. Per farti un'idea c'è il calcolatore d'imposta dell'AFC; per il tuo caso, un fiduciario autorizzato."
        />
        <View>
          <RigaMenu
            titolo="Calcolatore d'imposta (AFC)"
            icona="calculator-outline"
            esterno
            onPress={() => void apriLink(fontiStrumenti.afcCalcolatoreImposte.url)}
          />
          <RigaMenu
            titolo="Fiduciari autorizzati in Ticino"
            sottotitolo="Albo online"
            icona="people-outline"
            esterno
            onPress={() => void apriLink(fonti.albofiduciari.url)}
          />
        </View>
        <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
          <Ionicons name="phone-portrait-outline" size={18} color={c.marchio} style={{ marginTop: 1 }} />
          <Testo variante="piccolo" attenuato style={{ flex: 1 }}>
            Queste scelte restano solo su questo telefono: Bleo non le riceve.
          </Testo>
        </View>
      </Scheda>

      <Scheda>
        <Pressable
          onPress={() => {
            tocco();
            setDettagli((d) => !d);
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded: dettagli }}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: SPAZIO.s }}
        >
          <Testo variante="forte" colore={c.marchio}>
            Come facciamo la stima
          </Testo>
          <Ionicons name={dettagli ? "chevron-up" : "chevron-down"} size={18} color={c.attenuato} />
        </Pressable>
        {dettagli ? <Dettagli stima={s} /> : null}
      </Scheda>

      <Scheda>
        <Testo variante="forte">Nel corso di Bleo</Testo>
        {lezioniDaParte().map((l) => (
          <RigaMenu
            key={l.passoId}
            titolo={`Lezione ${l.numero}: ${l.titolo}`}
            icona="play-circle-outline"
            onPress={() => router.push({ pathname: "/passo/[id]", params: { id: l.passoId } })}
          />
        ))}
        <ElencoFonti fonti={fontiDaParte(s.annoAvs)} verificatoIl={verificatoDaParte(s.annoAvs)} />
        <Testo variante="piccolo" attenuato>
          È una stima con regole generali, non una consulenza: per il tuo caso rivolgiti a un fiduciario autorizzato.
        </Testo>
      </Scheda>
    </View>
  );
}

function maiuscola(testo: string): string {
  return `${testo.charAt(0).toUpperCase()}${testo.slice(1)}`;
}

/** Il mese da cui lavori in proprio nell'anno, con le frecce (e i gesti di VoiceOver/TalkBack). */
function SceltaMeseInizio({ stima: s, onCambia }: { stima: StimaDaParte; onCambia: (mese: number) => void }) {
  const c = useColori();
  const etichetta = (mese: number) => (mese === 1 ? `Da gennaio ${s.anno} o da prima` : `Da ${NOMI_MESI[mese - 1]} ${s.anno}`);
  const vai = (mese: number) => {
    if (mese < 1 || mese > s.meseFine) return;
    tocco();
    onCambia(mese);
  };
  const freccia = (verso: -1 | 1) => {
    const nuovo = s.meseInizio + verso;
    const spenta = nuovo < 1 || nuovo > s.meseFine;
    return (
      <Pressable
        onPress={() => vai(nuovo)}
        disabled={spenta}
        accessibilityRole="button"
        accessibilityLabel={verso < 0 ? "Mese prima" : "Mese dopo"}
        accessibilityState={{ disabled: spenta }}
        style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", opacity: spenta ? 0.3 : 1 }}
      >
        <Ionicons name={verso < 0 ? "chevron-back" : "chevron-forward"} size={22} color={c.marchio} />
      </Pressable>
    );
  };
  return (
    <View style={{ gap: SPAZIO.xs }}>
      <Testo variante="forte">Da quando lavori in proprio</Testo>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: c.bordo,
          borderRadius: RAGGIO.m,
          backgroundColor: c.scheda,
        }}
      >
        {freccia(-1)}
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Da quando lavori in proprio"
          accessibilityValue={{ text: etichetta(s.meseInizio) }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => vai(s.meseInizio + (e.nativeEvent.actionName === "increment" ? 1 : -1))}
          style={{ flex: 1, alignItems: "center" }}
        >
          <Testo variante="forte">{etichetta(s.meseInizio)}</Testo>
        </View>
        {freccia(1)}
      </View>
      <Testo variante="piccolo" attenuato>
        {s.meseInizioAutomatico && s.meseInizio > 1
          ? `Bleo parte da ${NOMI_MESI[s.meseInizio - 1]}, il mese della tua prima voce. Se hai iniziato prima, cambialo.`
          : "Contano solo i mesi in cui lavori in proprio."}
      </Testo>
    </View>
  );
}

function Dettagli({ stima: s }: { stima: StimaDaParte }) {
  const k = s.contributi;
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="piccolo" attenuato>
        Partiamo dal risultato dei conti che hai confermato: entrate meno uscite della ditta, senza le voci private e senza
        quelle da confermare. Lo dividiamo per i mesi passati, dal mese in cui lavori in proprio a oggi (il mese in corso
        conta), e aggiungiamo la stessa media per i mesi che mancano a dicembre. Se lavori da gennaio è come fare: utile
        finora ÷ mesi passati × 12.
      </Testo>
      <Testo variante="piccolo" attenuato>
        Se hai iniziato durante l&apos;anno contano solo i mesi di attività: per l&apos;AVS ogni anno è l&apos;anno civile e il
        reddito non è convertito in reddito annuo (art. 22 OAVS).
      </Testo>
      <Testo variante="piccolo" attenuato>
        Durante l&apos;anno la cassa chiede acconti trimestrali, calcolati sul reddito che prevedi. I contributi definitivi li
        fissa dopo, sulla tassazione fiscale: se gli acconti erano più bassi ti fattura la differenza, se erano più alti te la
        rimborsa. L&apos;importo vero lo decide la cassa.
      </Testo>
      <Testo variante="piccolo" attenuato>
        Se il tuo utile cambia di più o meno il {percentuale(regolePercorso.variazioneRedditoIas.valore, 0)} rispetto a quello
        su cui paghi gli acconti, l&apos;IAS chiede di segnalarlo. Nella richiesta online di adeguamento chiede l&apos;utile
        presumibile dell&apos;anno (entrate meno spese): una stima come quella qui sopra.
      </Testo>
      <Testo variante="piccolo" attenuato>
        Per le imposte non facciamo calcoli: metti da parte la percentuale che scegli tu, sull&apos;utile dopo i contributi.
        Quanto pagherai dipende dal tuo reddito, dalla tua sostanza e dal tuo Comune.
      </Testo>
      {s.annoAvsApprossimato ? (
        <Testo variante="piccolo" attenuato>
          Per il {s.anno} non abbiamo la tavola dei contributi: usiamo quella del {s.annoAvs}, la più vicina.
        </Testo>
      ) : null}
      <View>
        <RigaValore etichetta="Reddito AVS (arrotondato)" valore={chf(k.redditoAvs)} />
        <RigaValore etichetta="AVS, AI e IPG" valore={chf(k.avsAiIpg)} />
        <RigaValore etichetta="Spese amministrative" valore={chf(k.speseAmministrative)} />
        <RigaValore etichetta="Assegni familiari" valore={chf(k.assegniFamiliari)} />
        <RigaValore etichetta="Assegno integrativo" valore={chf(k.assegnoIntegrativo)} />
        <RigaValore etichetta="Contributi all'anno" valore={chf(k.totale)} forte />
      </View>
      <Testo variante="piccolo" attenuato>
        {notaAnniSupplementi(s.annoAvs)}
      </Testo>
    </View>
  );
}

/** Un avviso con le fonti ufficiali (come quelli del riepilogo). */
function Avviso({ avviso }: { avviso: AvvisoDaParte }) {
  const c = useColori();
  const attenzione = avviso.livello === "attenzione";
  return (
    <Scheda tenue={!attenzione} style={attenzione ? { borderColor: c.accento, borderWidth: 2 } : undefined}>
      <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
        <Ionicons
          name={attenzione ? "warning-outline" : "information-circle-outline"}
          size={20}
          color={attenzione ? c.accento : c.marchio}
          style={{ marginTop: 2 }}
        />
        <Testo variante="forte" style={{ flex: 1 }}>
          {avviso.titolo}
        </Testo>
      </View>
      <Testo>{avviso.testo}</Testo>
      <ElencoFonti fonti={avviso.fonti} />
    </Scheda>
  );
}
