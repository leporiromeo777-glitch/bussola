/**
 * La spiegazione della lettera, con la stessa struttura del sito
 * (src/app/strumenti/lettera/risultato.tsx): cos'è, in breve, scadenze e
 * importi in evidenza, cosa fare, quando chiedere aiuto e la nota che è
 * un'informazione generale scritta da un'intelligenza artificiale.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import { fonti } from "@/data/svizzera";
import type { SpiegazioneLettera } from "@/lib/lettera/spiegazione";
import { Pulsante, RigaMenu, Scheda, Testo, type NomeIcona } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export function RisultatoLettera({ spiegazione: s, onAltra }: { spiegazione: SpiegazioneLettera; onAltra: () => void }) {
  const c = useColori();
  if (s.stato !== "ok") return <LetteraNonLetta spiegazione={s} onAltra={onAltra} />;
  return (
    <View style={{ gap: SPAZIO.l }}>
      <Scheda evidenziata style={{ gap: SPAZIO.m }}>
        {s.mittente ? (
          <Testo variante="forte" colore={c.marchio}>
            Da: {s.mittente}
          </Testo>
        ) : null}
        <View style={{ gap: SPAZIO.xs }}>
          <Testo variante="etichetta" attenuato>
            COS&apos;È
          </Testo>
          <Testo variante="sottotitolo">{s.cosE}</Testo>
        </View>
        <Sezione titolo="IN BREVE">
          <Testo style={{ fontSize: 17, lineHeight: 25 }}>{s.inBreve}</Testo>
        </Sezione>
      </Scheda>

      {s.scadenze.length > 0 ? (
        <Sezione titolo={s.scadenze.length === 1 ? "SCADENZA" : "SCADENZE"}>
          {s.scadenze.map((scadenza) => (
            <Riquadro key={`${scadenza.data}-${scadenza.cosa}`} icona="calendar-outline" tono="accento">
              <Testo variante="etichetta" attenuato>
                ENTRO
              </Testo>
              <Testo
                style={
                  scadenza.eData
                    ? { fontSize: 30, lineHeight: 36, fontWeight: "700", fontVariant: ["tabular-nums"] }
                    : { fontSize: 18, lineHeight: 24, fontWeight: "600" }
                }
              >
                {scadenza.data}
              </Testo>
              <Testo>{scadenza.cosa}</Testo>
            </Riquadro>
          ))}
        </Sezione>
      ) : null}

      {s.importi.length > 0 ? (
        <Sezione titolo={s.importi.length === 1 ? "IMPORTO" : "IMPORTI"}>
          {s.importi.map((importo) => (
            <Riquadro key={`${importo.importo}-${importo.cosa}`} icona="cash-outline" tono="marchio">
              <Testo style={{ fontSize: 24, lineHeight: 30, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                {importo.importo}
              </Testo>
              <Testo>{importo.cosa}</Testo>
            </Riquadro>
          ))}
        </Sezione>
      ) : null}

      {s.cosaFare.length > 0 ? (
        <Sezione titolo="COSA FARE">
          <Scheda style={{ gap: SPAZIO.m }}>
            {s.cosaFare.map((azione, i) => (
              <Passo key={azione} numero={i + 1} testo={azione} />
            ))}
          </Scheda>
        </Sezione>
      ) : null}

      <QuandoChiedereAiuto testo={s.quandoChiedereAiuto} />
      <NotaInformazioneGenerale />
      <Pulsanti onAltra={onAltra} />
    </View>
  );
}

function LetteraNonLetta({ spiegazione: s, onAltra }: { spiegazione: SpiegazioneLettera; onAltra: () => void }) {
  const c = useColori();
  return (
    <View style={{ gap: SPAZIO.l }}>
      <Scheda style={{ gap: SPAZIO.m }}>
        <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
          <Ionicons name="information-circle-outline" size={26} color={c.accento} />
          <View style={{ flex: 1, gap: SPAZIO.xs }}>
            <Testo variante="sottotitolo">
              {s.stato === "illeggibile" ? "Non riesco a leggere bene la lettera" : "Questa non sembra una lettera"}
            </Testo>
            <Testo>{s.cosE}</Testo>
            {s.inBreve ? <Testo attenuato>{s.inBreve}</Testo> : null}
          </View>
        </View>
        <View style={{ gap: SPAZIO.xs }}>
          {[
            "Appoggia il foglio su un tavolo, con buona luce e senza ombre.",
            "Inquadra tutta la pagina, dritta, e aspetta che sia a fuoco.",
            "Se la lettera ha più pagine, fotografa quella con importi e date, o carica il PDF.",
          ].map((consiglio) => (
            <Testo key={consiglio} variante="piccolo">
              • {consiglio}
            </Testo>
          ))}
        </View>
      </Scheda>
      <Pulsanti onAltra={onAltra} />
    </View>
  );
}

function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="etichetta" attenuato accessibilityRole="header">
        {titolo}
      </Testo>
      {children}
    </View>
  );
}

/** Un riquadro con l'icona a sinistra: scadenze (accento) e importi (marchio). */
function Riquadro({ icona, tono, children }: { icona: NomeIcona; tono: "accento" | "marchio"; children: ReactNode }) {
  const c = useColori();
  const colore = tono === "accento" ? c.accento : c.marchio;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: SPAZIO.m,
        padding: SPAZIO.l,
        borderRadius: RAGGIO.l,
        borderWidth: 1.5,
        borderColor: tono === "accento" ? c.accento : c.bordo,
        backgroundColor: tono === "accento" ? c.scheda : c.marchioTenue,
      }}
    >
      <Ionicons name={icona} size={24} color={colore} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>{children}</View>
    </View>
  );
}

function Passo({ numero, testo }: { numero: number; testo: string }) {
  const c = useColori();
  return (
    <View style={{ flexDirection: "row", gap: SPAZIO.m, alignItems: "flex-start" }}>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.marchio, alignItems: "center", justifyContent: "center" }}
      >
        <Testo variante="piccolo" colore={c.sulMarchio} style={{ fontWeight: "700" }}>
          {numero}
        </Testo>
      </View>
      <Testo style={{ flex: 1, paddingTop: 2 }} accessibilityLabel={`${numero}. ${testo}`}>
        {testo}
      </Testo>
    </View>
  );
}

function QuandoChiedereAiuto({ testo }: { testo: string | null }) {
  const c = useColori();
  return (
    <Scheda style={{ gap: SPAZIO.s }}>
      <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "center" }}>
        <Ionicons name="alert-circle-outline" size={22} color={c.accento} />
        <Testo variante="forte" accessibilityRole="header">
          Quando chiedere aiuto
        </Testo>
      </View>
      <Testo>
        {testo ?? "Se qualcosa non ti è chiaro, chiama l'ufficio che ha scritto la lettera: il numero è di solito in alto."}
      </Testo>
      <Testo variante="piccolo" attenuato>
        Per reclami, ricorsi o conti che non ti tornano puoi rivolgerti a un fiduciario autorizzato.
      </Testo>
      <RigaMenu
        titolo="Fiduciari autorizzati in Ticino"
        sottotitolo={fonti.albofiduciari.ente}
        icona="people-outline"
        esterno
        onPress={() => void apriLink(fonti.albofiduciari.url)}
      />
    </Scheda>
  );
}

/** Nota fissa: chi ha scritto la spiegazione e che non è una consulenza. */
function NotaInformazioneGenerale() {
  return (
    <Testo variante="piccolo" attenuato>
      Questa spiegazione l&apos;ha scritta un&apos;intelligenza artificiale leggendo la tua foto e può sbagliare:
      controlla sempre date e importi sulla lettera. È un&apos;informazione generale, non una consulenza fiscale o
      giuridica. Per il tuo caso rivolgiti all&apos;ufficio che ha scritto o a un fiduciario autorizzato.
    </Testo>
  );
}

function Pulsanti({ onAltra }: { onAltra: () => void }) {
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Pulsante titolo="Fotografa un'altra lettera" icona="camera-outline" onPress={onAltra} />
      <Pulsante titolo="Chiedi a Bleo" variante="secondario" icona="chatbubbles-outline" onPress={() => router.push("/chat")} />
    </View>
  );
}
