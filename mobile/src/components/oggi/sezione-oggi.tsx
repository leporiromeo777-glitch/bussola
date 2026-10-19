/**
 * «Oggi» in cima a Inizio: le schede del giorno, dalla più urgente, ognuna
 * con un'azione che apre la schermata giusta. Quali schede, in che ordine e
 * con quali testi lo decide src/lib/oggi/carte.ts; i dati dell'account li
 * legge useOggi (src/lib/oggi.ts). Senza accesso restano le scadenze del
 * percorso e le votazioni.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { VOTAZIONI } from "@/data/votazioni";
import { impostazioniIniziali, schemaImpostazioniDaParte, type ImpostazioniDaParte } from "@/lib/conti/da-parte";
import {
  carteOggi,
  giornoDiOggi,
  rigaTranquilla,
  TESTI_OGGI,
  testoAttesa,
  testoErrori,
  type CartaOggi,
  type DestinazioneOggi,
  type GenereCarta,
} from "@/lib/oggi/carte";
import type { Percorso } from "@/lib/percorso/regole";
import { CHIAVI_ARCHIVIO, decodifica } from "@/lib/strumenti/archivio";
import { Pillola, Pulsante, Scheda, Testo, type NomeIcona } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { leggi } from "~/lib/memoria";
import { riassuntoLetture, type StatoOggi } from "~/lib/oggi";
import { oggiLocale } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

const ICONE: Record<GenereCarta, NomeIcona> = {
  "fattura-scaduta": "receipt-outline",
  "altre-fatture-scadute": "receipt-outline",
  "fatture-in-scadenza": "time-outline",
  scadenza: "calendar-outline",
  documenti: "file-tray-full-outline",
  "ore-passate": "timer-outline",
  "ore-mese": "timer-outline",
  votazione: "megaphone-outline",
  "da-parte": "wallet-outline",
};

/** Le scelte di «Quanto mettere da parte» salvate sul telefono (le stesse della scheda Conti). */
function impostazioniDaParte(): ImpostazioniDaParte {
  return decodifica(leggi(CHIAVI_ARCHIVIO.daParte), schemaImpostazioniDaParte, impostazioniIniziali);
}

/** Apre la schermata giusta per l'azione di una scheda. */
function apri(destinazione: DestinazioneOggi) {
  switch (destinazione.schermata) {
    case "sollecito":
      router.navigate({ pathname: "/conti", params: { sollecito: destinazione.fatturaId } });
      return;
    case "conti":
      router.navigate("/conti");
      return;
    case "documenti":
      router.push("/documenti");
      return;
    case "ore":
      router.push({ pathname: "/clienti-ore", params: { mese: destinazione.mese } });
      return;
    case "percorso":
      router.navigate("/percorso");
      return;
    case "fonte":
      void apriLink(destinazione.url);
      return;
  }
}

export function SezioneOggi({ stato, percorso }: { stato: StatoOggi; percorso: Percorso | null }) {
  const c = useColori();
  const oggi = oggiLocale();
  const { account, conti, ore, documenti } = stato;

  const carte = useMemo(
    () =>
      carteOggi({
        oggi,
        scadenze: percorso?.scadenze ?? null,
        votazioni: VOTAZIONI,
        fatture: conti.stato === "pronta" ? conti.dati.fatture : undefined,
        documenti: documenti.stato === "pronta" ? documenti.dati : undefined,
        oreDaFatturare: ore.stato === "pronta" ? ore.dati.daFatturare : undefined,
        daParte: conti.stato === "pronta" ? { conti: conti.dati.riepilogo, impostazioni: impostazioniDaParte() } : undefined,
      }),
    [oggi, percorso, conti, ore, documenti],
  );
  const { inAttesa, errori, accessoScaduto } = riassuntoLetture(stato);

  // Chi non ha ancora fatto il questionario né l'accesso parte da «Da dove parto?», qui sotto.
  if (!percorso && account !== "dentro" && carte.length === 0) return null;

  const riga = inAttesa.length === 0 ? rigaTranquilla(carte, errori.length > 0 || accessoScaduto) : null;

  return (
    <View style={{ gap: SPAZIO.m }}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${TESTI_OGGI.titolo}, ${giornoDiOggi(oggi)}`}
        style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: SPAZIO.s, flexWrap: "wrap" }}
      >
        <Testo variante="sottotitolo">{TESTI_OGGI.titolo}</Testo>
        <Testo variante="piccolo" attenuato>
          {giornoDiOggi(oggi)}
        </Testo>
      </View>

      {riga ? (
        <Scheda tenue style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
          <Ionicons name="checkmark-circle-outline" size={24} color={c.successo} />
          <Testo variante="forte" style={{ flex: 1 }} accessibilityLiveRegion="polite">
            {riga}
          </Testo>
        </Scheda>
      ) : null}

      {carte.map((carta) => (
        <SchedaOggi key={carta.id} carta={carta} />
      ))}

      {inAttesa.length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s, minHeight: 44 }} accessibilityLiveRegion="polite">
          <ActivityIndicator color={c.marchio} />
          <Testo attenuato style={{ flex: 1 }}>
            {testoAttesa(inAttesa)}
          </Testo>
        </View>
      ) : null}

      {errori.length > 0 ? (
        <View style={{ gap: SPAZIO.xs }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPAZIO.s }}>
            <Ionicons name="cloud-offline-outline" size={20} color={c.accento} style={{ marginTop: 1 }} />
            <Testo variante="piccolo" style={{ flex: 1 }} accessibilityLiveRegion="polite">
              {testoErrori(errori)}
            </Testo>
          </View>
          <Pulsante titolo="Riprova" variante="testo" icona="refresh" onPress={stato.aggiorna} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}

      {accessoScaduto ? (
        <View style={{ gap: SPAZIO.xs }}>
          <Testo variante="piccolo" accessibilityLiveRegion="polite">
            {TESTI_OGGI.accediDiNuovo}
          </Testo>
          <Pulsante titolo="Accedi di nuovo" variante="secondario" onPress={() => router.push("/accedi")} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}

      {account === "fuori" ? (
        <View style={{ gap: SPAZIO.xs }}>
          <Testo variante="piccolo" attenuato>
            {TESTI_OGGI.accedi}
          </Testo>
          <Pulsante
            titolo="Accedi"
            variante="testo"
            icona="arrow-forward"
            onPress={() => router.push("/accedi")}
            suggerimento="Ti basta l'email: ti mando un codice, senza password"
            style={{ alignSelf: "flex-start" }}
          />
        </View>
      ) : null}

      {account === "demo" ? (
        <Testo variante="piccolo" attenuato>
          {TESTI_OGGI.demo}
        </Testo>
      ) : null}
    </View>
  );
}

/** Una scheda: che cosa (etichetta e titolo), perché (testo), la fonte se c'è e un'azione sola. */
function SchedaOggi({ carta }: { carta: CartaOggi }) {
  const c = useColori();
  const alta = carta.urgenza === "alta";
  const tinta = alta ? c.accento : c.marchio;
  return (
    <Scheda tenue={carta.urgenza === "info"} style={alta ? { borderColor: c.accento, borderWidth: 2 } : undefined}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s }}>
        <Ionicons name={ICONE[carta.genere]} size={18} color={tinta} />
        <Testo variante="etichetta" colore={tinta} style={{ flex: 1, textTransform: "uppercase" }}>
          {carta.etichetta}
        </Testo>
        {alta ? <Pillola testo="Urgente" tono="accento" /> : null}
      </View>
      <Testo variante="forte" accessibilityRole="header">
        {carta.titolo}
      </Testo>
      <Testo>{carta.testo}</Testo>
      {carta.righe.length > 0 ? (
        <View style={{ gap: 2 }}>
          {carta.righe.map((riga) => (
            <View key={riga} style={{ flexDirection: "row", alignItems: "flex-start", gap: SPAZIO.s }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.attenuato, marginTop: 8 }} />
              <Testo variante="piccolo" style={{ flex: 1 }}>
                {riga}
              </Testo>
            </View>
          ))}
        </View>
      ) : null}
      {carta.fonte ? <LinkFonte fonte={carta.fonte} /> : null}
      <Pulsante
        titolo={carta.azione.titolo}
        variante={alta ? "principale" : "secondario"}
        icona="arrow-forward"
        suggerimento={carta.azione.suggerimento}
        onPress={() => apri(carta.azione.destinazione)}
        style={{ alignSelf: "flex-start", marginTop: SPAZIO.xs }}
      />
    </Scheda>
  );
}

/** La fonte ufficiale della data, in una riga da toccare (almeno 44 punti). */
function LinkFonte({ fonte }: { fonte: NonNullable<CartaOggi["fonte"]> }) {
  const c = useColori();
  const controllata = fonte.verificatoIl ? `, controllata il ${dataSvizzera(fonte.verificatoIl)}` : "";
  return (
    <Pressable
      onPress={() => void apriLink(fonte.url)}
      accessibilityRole="link"
      accessibilityLabel={`Fonte ufficiale: ${fonte.titolo} (${fonte.ente})${controllata}`}
      accessibilityHint="Apre la pagina ufficiale"
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, opacity: pressed ? 0.6 : 1 })}
    >
      <Ionicons name="open-outline" size={16} color={c.marchio} />
      <Testo variante="piccolo" colore={c.marchio} style={{ flex: 1 }} numberOfLines={2}>
        Fonte: {fonte.ente}
        {controllata ? <Testo variante="piccolo" attenuato>{controllata}</Testo> : null}
      </Testo>
    </Pressable>
  );
}
