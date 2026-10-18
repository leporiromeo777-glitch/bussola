import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Switch, View } from "react-native";
import { FASI, TITOLI_FASI, VERIFICATO_IL, type IdPasso } from "@/data/passi";
import { dataSvizzera } from "@/data/svizzera";
import { VOTAZIONI } from "@/data/votazioni";
import {
  annoScadenzario,
  dateFisseDaOggi,
  dateScadenza,
  prefissoDate,
  testoDateFisse,
} from "@/lib/percorso/calendario";
import { DOMANDE, etichettaRisposta } from "@/lib/percorso/domande";
import { avanzamento, prossimoPasso, type Avviso, type PassoPercorso, type Percorso } from "@/lib/percorso/regole";
import type { IdDomanda, Risposte } from "@/lib/percorso/risposte";
import { etichettaLivello, votazioniInArrivo } from "@/lib/votazioni";
import { ImmagineMascotte } from "~/components/mascotte";
import {
  BarraProgresso,
  Casella,
  ElencoFonti,
  NotaInformazione,
  Pillola,
  Pulsante,
  Schermata,
  Scheda,
  Testo,
} from "~/components/ui";
import { chiediPermesso, programmaNotifiche } from "~/lib/notifiche";
import {
  impostaPromemoria,
  impostaSettimana,
  oggiLocale,
  segnaPasso,
  usePassiFatti,
  usePercorso,
  usePromemoriaAttivi,
  useSettimanaAttiva,
} from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

export default function SchermataPercorso() {
  const dati = usePercorso();
  const fatti = usePassiFatti();

  if (!dati) return <SenzaRisposte />;
  const { percorso, risposte } = dati;
  const { fatti: n, totale } = avanzamento(percorso, fatti);
  const prossimo = prossimoPasso(percorso, fatti);

  return (
    <Schermata>
      <Scheda>
        <Testo variante="sottotitolo">I tuoi passi</Testo>
        <BarraProgresso fatti={n} totale={totale} />
        <Testo attenuato>
          {n} fatti su {totale}. Tocca la casella quando hai finito un passo.
        </Testo>
      </Scheda>

      {percorso.avvisi.length > 0 ? <ElencoAvvisi avvisi={percorso.avvisi} /> : null}

      {FASI.map((fase) => {
        const passi = percorso.passi.filter((p) => p.passo.fase === fase && p.stato !== "non_serve");
        if (passi.length === 0) return null;
        return (
          <View key={fase} style={{ gap: SPAZIO.s }}>
            <Testo variante="sottotitolo">{TITOLI_FASI[fase]}</Testo>
            {passi.map((voce) => (
              <RigaPasso
                key={voce.passo.id}
                voce={voce}
                fatto={fatti.has(voce.passo.id)}
                prossimo={prossimo?.passo.id === voce.passo.id}
              />
            ))}
          </View>
        );
      })}

      <NonServono percorso={percorso} />
      <Scadenze percorso={percorso} fatti={fatti} />
      <Votazioni />
      <RiepilogoRisposte risposte={risposte} />
      <Testo variante="piccolo" attenuato>
        Testi controllati sulle fonti ufficiali il {dataSvizzera(VERIFICATO_IL)}.
      </Testo>
      <NotaInformazione />
    </Schermata>
  );
}

function SenzaRisposte() {
  return (
    <Schermata style={{ alignItems: "center", paddingTop: SPAZIO.xxl }}>
      <ImmagineMascotte nome="checklist" larghezza={200} />
      <Testo variante="titolo" style={{ textAlign: "center" }}>
        Prima rispondi a 10 domande
      </Testo>
      <Testo attenuato style={{ textAlign: "center" }}>
        In circa 5 minuti costruiamo i tuoi passi per aprire la ditta individuale, nell&apos;ordine giusto e con i link
        ufficiali.
      </Testo>
      <Pulsante titolo="Inizia il questionario" icona="arrow-forward" onPress={() => router.push("/questionario")} />
    </Schermata>
  );
}

const ETICHETTE_STATO = { da_fare: "Da fare", facoltativo: "Facoltativo", non_serve: "Non ti riguarda" } as const;

function RigaPasso({ voce, fatto, prossimo }: { voce: PassoPercorso; fatto: boolean; prossimo: boolean }) {
  const c = useColori();
  const id = voce.passo.id as IdPasso;
  return (
    <Scheda evidenziata={prossimo} style={{ flexDirection: "row", gap: SPAZIO.m, alignItems: "flex-start" }}>
      <Casella spuntata={fatto} onCambia={(v) => segnaPasso(id, v)} etichetta={`Fatto: ${voce.passo.titolo}`} />
      <Pressable
        style={{ flex: 1, gap: SPAZIO.xs }}
        onPress={() => router.push({ pathname: "/passo/[id]", params: { id } })}
        accessibilityRole="button"
        accessibilityHint="Apre i dettagli del passo"
      >
        <Testo
          variante="forte"
          style={fatto ? { textDecorationLine: "line-through", color: c.attenuato } : undefined}
        >
          {voce.passo.titolo}
        </Testo>
        <View style={{ flexDirection: "row", gap: SPAZIO.s, flexWrap: "wrap" }}>
          <Pillola testo={ETICHETTE_STATO[voce.stato]} tono={voce.stato === "da_fare" ? "marchio" : "neutro"} />
          {prossimo ? <Pillola testo="Prossimo passo" tono="accento" /> : null}
        </View>
        <Testo variante="piccolo" attenuato numberOfLines={3}>
          {voce.perche}
        </Testo>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Testo variante="piccolo" colore={c.marchio} style={{ fontWeight: "600" }}>
            Cosa fare
          </Testo>
          <Ionicons name="chevron-forward" size={14} color={c.marchio} />
        </View>
      </Pressable>
    </Scheda>
  );
}

function ElencoAvvisi({ avvisi }: { avvisi: readonly Avviso[] }) {
  const c = useColori();
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Da sapere nella tua situazione</Testo>
      {avvisi.map((a) => (
        <Scheda key={a.id} style={a.livello === "importante" ? { borderColor: c.accento, borderWidth: 2 } : undefined}>
          <Testo variante="forte">{a.titolo}</Testo>
          <Testo>{a.testo}</Testo>
          <ElencoFonti fonti={a.fonti} />
        </Scheda>
      ))}
    </View>
  );
}

function NonServono({ percorso }: { percorso: Percorso }) {
  const [aperto, setAperto] = useState(false);
  const voci = percorso.passi.filter((p) => p.stato === "non_serve");
  if (voci.length === 0) return null;
  return (
    <Scheda>
      <Pulsante
        titolo={aperto ? "Nascondi i passi che non ti riguardano" : `Passi che non ti riguardano (${voci.length})`}
        variante="testo"
        onPress={() => setAperto((a) => !a)}
      />
      {aperto
        ? voci.map((v) => (
            <View key={v.passo.id} style={{ gap: 2, paddingVertical: SPAZIO.xs }}>
              <Testo variante="forte">{v.passo.titolo}</Testo>
              <Testo variante="piccolo" attenuato>
                {v.perche}
              </Testo>
            </View>
          ))
        : null}
    </Scheda>
  );
}

function Scadenze({ percorso, fatti }: { percorso: Percorso; fatti: ReadonlySet<string> }) {
  const c = useColori();
  const attivi = usePromemoriaAttivi();
  const settimana = useSettimanaAttiva();
  const [stato, setStato] = useState("");
  const anno = annoScadenzario(new Date());
  const oggi = oggiLocale();

  // Ogni cambio del percorso o dei passi fatti riprogramma le notifiche scelte.
  useEffect(() => {
    if (!attivi && !settimana) return;
    void programmaNotifiche({ percorso, fatti, scadenze: attivi, settimana }).catch(() => {});
  }, [attivi, settimana, percorso, fatti]);

  async function cambia(tipo: "scadenze" | "settimana", valore: boolean) {
    if (valore && !(await chiediPermesso())) {
      Alert.alert(
        "Notifiche spente",
        "Per ricevere i promemoria, attiva le notifiche di Bleo nelle impostazioni del telefono.",
      );
      return;
    }
    const nuoviScadenze = tipo === "scadenze" ? valore : attivi;
    const nuoviSettimana = tipo === "settimana" ? valore : settimana;
    if (tipo === "scadenze") impostaPromemoria(valore);
    else impostaSettimana(valore);
    const quanti = await programmaNotifiche({ percorso, fatti, scadenze: nuoviScadenze, settimana: nuoviSettimana });
    if (tipo === "settimana") {
      setStato(valore ? "Ogni lunedì alle 9 ti mando cosa fare nella settimana." : "Riassunto del lunedì tolto.");
    } else if (!valore) {
      setStato("Promemoria delle scadenze tolti.");
    } else {
      setStato(
        quanti === 0
          ? "Nessuna scadenza con data nei prossimi mesi: ti avviso quando ce ne saranno."
          : `Ti avviso una settimana prima di ${quanti === 1 ? "1 scadenza" : `${quanti} scadenze`}.`,
      );
    }
  }

  if (percorso.scadenze.length === 0) return null;
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Scadenze da ricordare</Testo>
      <Scheda tenue style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <Ionicons name="notifications-outline" size={22} color={c.marchio} />
        <View style={{ flex: 1 }}>
          <Testo variante="forte">Promemoria sul telefono</Testo>
          <Testo variante="piccolo" attenuato>
            Una notifica alle 9, una settimana prima di ogni scadenza e di ogni votazione da seguire.
          </Testo>
        </View>
        <Switch
          value={attivi}
          onValueChange={(v) => void cambia("scadenze", v)}
          accessibilityLabel="Promemoria delle scadenze"
          trackColor={{ true: c.marchio }}
        />
      </Scheda>
      <Scheda tenue style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <Ionicons name="calendar-outline" size={22} color={c.marchio} />
        <View style={{ flex: 1 }}>
          <Testo variante="forte">La tua settimana</Testo>
          <Testo variante="piccolo" attenuato>
            Ogni lunedì alle 9: il prossimo passo e le scadenze vicine.
          </Testo>
        </View>
        <Switch
          value={settimana}
          onValueChange={(v) => void cambia("settimana", v)}
          accessibilityLabel="Riassunto del lunedì"
          trackColor={{ true: c.marchio }}
        />
      </Scheda>
      {stato ? (
        <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
          {stato}
        </Testo>
      ) : null}
      {percorso.scadenze.map((s) => {
        const date = dateScadenza(s, anno);
        const fisse = s.calendario.tipo === "fisse" ? dateFisseDaOggi(s.calendario.date, oggi) : null;
        return (
          <Scheda key={s.id}>
            <Testo variante="forte">{s.titolo}</Testo>
            <Testo>{s.quando}</Testo>
            {fisse ? (
              <Testo variante="piccolo" attenuato>
                {testoDateFisse(fisse)}
              </Testo>
            ) : s.calendario.tipo !== "fisse" && date.length > 0 ? (
              <Testo variante="piccolo" attenuato>
                {prefissoDate(s, anno)}
                {date.map((d) => dataSvizzera(d.data)).join(" · ")}
              </Testo>
            ) : null}
            {s.dettaglio ? (
              <Testo variante="piccolo" attenuato>
                {s.dettaglio}
              </Testo>
            ) : null}
            <ElencoFonti fonti={s.fonti} />
          </Scheda>
        );
      })}
    </View>
  );
}

/** Gli oggetti in votazione che possono cambiare qualcosa per un'impresa (src/data/votazioni.ts). */
function Votazioni() {
  const c = useColori();
  const votazioni = votazioniInArrivo(VOTAZIONI, oggiLocale());
  if (votazioni.length === 0) return null;
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Votazioni da seguire</Testo>
      <Testo variante="piccolo" attenuato>
        Oggetti in votazione che possono cambiare qualcosa per la tua impresa. Bleo ti informa con le fonti
        ufficiali: come votare lo decidi tu.
      </Testo>
      {votazioni.map((v) => (
        <Scheda key={v.id}>
          <Testo variante="etichetta" colore={c.marchio}>
            {etichettaLivello(v.livello)} · {dataSvizzera(v.data)}
          </Testo>
          <Testo variante="forte">{v.oggetto}</Testo>
          <Testo>{v.cosaCambia}</Testo>
          <Testo variante="piccolo" attenuato>
            {v.chiRiguarda}
          </Testo>
          <ElencoFonti fonti={v.fonti} verificatoIl={v.verificatoIl} />
        </Scheda>
      ))}
    </View>
  );
}

function RiepilogoRisposte({ risposte }: { risposte: Risposte }) {
  return (
    <Scheda>
      <Testo variante="sottotitolo">Le tue risposte</Testo>
      {DOMANDE.map((d) => (
        <View key={d.id} style={{ flexDirection: "row", gap: SPAZIO.s }}>
          <Testo variante="piccolo" attenuato style={{ flex: 1 }}>
            {d.breve}
          </Testo>
          <Testo variante="piccolo" style={{ flex: 1.3 }}>
            {d.id === "attivita" && risposte.attivitaAltro
              ? risposte.attivitaAltro
              : etichettaRisposta(d.id as IdDomanda, risposte[d.id as IdDomanda])}
          </Testo>
        </View>
      ))}
      <Pulsante titolo="Rifai il questionario" variante="secondario" onPress={() => router.push("/questionario")} />
    </Scheda>
  );
}
