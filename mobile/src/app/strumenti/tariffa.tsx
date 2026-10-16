import { useMemo, useState } from "react";
import { View } from "react-native";
import { anniDisponibili, descrizioneCaso, type SituazioneAvs } from "@/lib/strumenti/avs";
import { CHIAVI_ARCHIVIO, codifica, decodifica } from "@/lib/strumenti/archivio";
import { importo, leggiNumero, numeroBreve, numeroSvizzero } from "@/lib/strumenti/numeri";
import {
  calcolaTariffa,
  CATEGORIE_COSTI,
  datiTariffaIniziali,
  schemaDatiTariffa,
  type CampoTariffa,
  type DatiTariffa,
} from "@/lib/strumenti/tariffa";
import { CampoNumero, RigaValore, Scelta } from "~/components/campi";
import { ElencoFonti, NotaInformazione, Schermata, Scheda, Testo } from "~/components/ui";
import { fontiContributi } from "~/lib/fonti-avs";
import { leggi, scrivi } from "~/lib/memoria";
import { oggiLocale } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

const SITUAZIONI: { valore: SituazioneAvs; etichetta: string }[] = [
  { valore: "principale", etichetta: "Principale" },
  { valore: "accessoria", etichetta: "Accessoria" },
];

export default function Tariffa() {
  const c = useColori();
  const [dati, setDati] = useState<DatiTariffa>(() =>
    decodifica(leggi(CHIAVI_ARCHIVIO.tariffa), schemaDatiTariffa, () => datiTariffaIniziali(oggiLocale())),
  );
  const esito = useMemo(() => calcolaTariffa(dati), [dati]);
  const errori: Partial<Record<CampoTariffa, string>> = esito.ok ? {} : esito.errori;

  function cambia(nuovi: DatiTariffa) {
    setDati(nuovi);
    scrivi(CHIAVI_ARCHIVIO.tariffa, codifica(nuovi));
  }
  const campo = (chiave: Exclude<CampoTariffa, `costiFissi.${string}`>) => ({
    valore: dati[chiave],
    onCambia: (v: string) => cambia({ ...dati, [chiave]: v }),
    errore: errori[chiave],
  });
  const sommaCosti = Object.values(dati.costiFissi).reduce((s, v) => s + (leggiNumero(v) ?? 0), 0);

  return (
    <Schermata>
      <Testo attenuato>
        Scrivi i tuoi numeri: Bleo calcola la tariffa minima per coprire reddito, contributi AVS e costi. È una stima.
      </Testo>

      {esito.ok ? (
        <Scheda evidenziata>
          <Testo variante="etichetta" attenuato>
            LA TUA TARIFFA MINIMA
          </Testo>
          <CifraGrande grande={importo(esito.risultato.tariffaOrariaArrotondata, 0)} piccolo="all'ora" colore={c.marchio} />
          <RigaValore
            etichetta={`A giornata (${numeroBreve(esito.risultato.oreGiornata)} ore)`}
            valore={importo(esito.risultato.tariffaGiornaliera, 0)}
          />
          <RigaValore etichetta="Fatturato necessario all'anno" valore={importo(esito.risultato.fatturato, 0)} forte />
          <RigaValore etichetta="Ore fatturabili all'anno" valore={numeroSvizzero(esito.risultato.oreFatturabiliAnno)} />
          <RigaValore etichetta="Contributi AVS/AI/IPG stimati" valore={importo(esito.risultato.contributi.totale, 0)} />
          <RigaValore etichetta="Costi fissi" valore={importo(esito.risultato.costiFissi, 0)} />
          <Testo variante="piccolo" attenuato>
            Arrotondata per eccesso al franco, senza IVA. {descrizioneCaso(esito.risultato.contributi)}
          </Testo>
        </Scheda>
      ) : (
        <Scheda>
          <Testo colore={c.pericolo}>Controlla i campi segnati in rosso.</Testo>
        </Scheda>
      )}

      {esito.ok
        ? esito.risultato.avvisi.map((a) => (
            <Scheda key={a.id} style={a.livello === "attenzione" ? { borderColor: c.accento, borderWidth: 2 } : undefined}>
              <Testo variante="forte">{a.titolo}</Testo>
              <Testo>{a.testo}</Testo>
              <ElencoFonti fonti={a.fonti} />
            </Scheda>
          ))
        : null}

      <Testo variante="sottotitolo">1. Quanto vuoi guadagnare</Testo>
      <CampoNumero
        etichetta="Reddito annuo per te"
        prefisso="CHF"
        aiuto="Per esempio quanto ti serve per vivere in un anno."
        {...campo("redditoDesiderato")}
      />
      <Scelta
        etichetta="Anno dei contributi AVS"
        opzioni={[...anniDisponibili].sort().map((a) => ({ valore: a, etichetta: String(a) }))}
        valore={dati.anno}
        onCambia={(anno) => cambia({ ...dati, anno })}
      />
      <Scelta
        etichetta="La tua attività indipendente è"
        opzioni={SITUAZIONI}
        valore={dati.situazione}
        onCambia={(situazione) => cambia({ ...dati, situazione })}
      />

      <Testo variante="sottotitolo">2. Quanto lavori</Testo>
      <CampoNumero etichetta="Settimane di vacanza all'anno" {...campo("settimaneVacanza")} />
      <CampoNumero etichetta="Giorni di malattia e festivi all'anno" {...campo("giorniAssenza")} />
      <CampoNumero etichetta="Giorni di lavoro a settimana" {...campo("giorniLavorativiSettimana")} />
      <CampoNumero
        etichetta="Ore fatturabili a settimana"
        aiuto="Solo le ore che un cliente ti paga."
        {...campo("oreFatturabiliSettimana")}
      />
      <CampoNumero
        etichetta="Ore in una giornata fatturata"
        aiuto="Serve per la tariffa a giornata."
        {...campo("oreGiornata")}
      />

      <Testo variante="sottotitolo">3. Costi fissi, all&apos;anno</Testo>
      <Testo variante="piccolo" attenuato>
        Lascia vuoto quello che non hai. Per un costo mensile moltiplica per 12.
      </Testo>
      {CATEGORIE_COSTI.map((cat) => (
        <CampoNumero
          key={cat.id}
          etichetta={cat.etichetta}
          prefisso="CHF"
          aiuto={cat.esempio}
          valore={dati.costiFissi[cat.id]}
          errore={errori[`costiFissi.${cat.id}`]}
          onCambia={(v) => cambia({ ...dati, costiFissi: { ...dati.costiFissi, [cat.id]: v } })}
        />
      ))}
      <Testo variante="forte">Totale costi fissi: {importo(sommaCosti, 0)} all&apos;anno</Testo>

      <Testo variante="sottotitolo">4. Facoltativo</Testo>
      <CampoNumero etichetta="Versamento nel pilastro 3a, all'anno" prefisso="CHF" {...campo("pilastro3a")} />
      <CampoNumero
        etichetta="Riserva per le imposte (%)"
        aiuto="Una parte dell'utile da mettere da parte per le imposte."
        {...campo("riservaImpostePercento")}
      />

      <View style={{ gap: SPAZIO.s }}>
        <ElencoFonti fonti={fontiContributi(dati.anno)} />
      </View>
      <NotaInformazione />
    </Schermata>
  );
}

function CifraGrande({ grande, piccolo, colore }: { grande: string; piccolo: string; colore: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: SPAZIO.s }}>
      <Testo colore={colore} style={{ fontSize: 40, lineHeight: 46, fontWeight: "700" }}>
        {grande}
      </Testo>
      <Testo attenuato>{piccolo}</Testo>
    </View>
  );
}
