import { useMemo, useState } from "react";
import {
  anniDisponibili,
  annoPredefinito,
  descrizioneCaso,
  notaAnniSupplementi,
  stimaContributi,
  type SituazioneAvs,
} from "@/lib/strumenti/avs";
import type { AnnoAvs } from "@/data/avs-tavola-scalare";
import { importo, leggiNumero } from "@/lib/strumenti/numeri";
import { percentuale } from "@/data/svizzera";
import { CampoNumero, RigaValore, Scelta } from "~/components/campi";
import { ElencoFonti, NotaInformazione, Schermata, Scheda, Testo } from "~/components/ui";
import { fontiContributi } from "~/lib/fonti-avs";
import { oggiLocale } from "~/lib/stato";
import { useColori } from "~/lib/tema";

export default function Contributi() {
  const c = useColori();
  const [utile, setUtile] = useState("40'000");
  const [anno, setAnno] = useState<AnnoAvs>(() => annoPredefinito(oggiLocale()));
  const [situazione, setSituazione] = useState<SituazioneAvs>("principale");
  const numero = leggiNumero(utile);
  const errore = numero === null || numero < 0 ? "Scrivi un importo, per esempio 40'000." : undefined;
  const stima = useMemo(
    () => (errore || numero === null ? null : stimaContributi(numero, anno, situazione)),
    [errore, numero, anno, situazione],
  );

  return (
    <Schermata>
      <Testo attenuato>
        Stima dei contributi sociali che paghi alla cassa AVS del Ticino come indipendente, sull&apos;utile
        dell&apos;anno.
      </Testo>
      <CampoNumero
        etichetta="Utile dell'anno prima dei contributi"
        prefisso="CHF"
        aiuto="Entrate meno spese dell'attività."
        valore={utile}
        onCambia={setUtile}
        errore={errore}
      />
      <Scelta
        etichetta="Anno"
        opzioni={[...anniDisponibili].sort().map((a) => ({ valore: a, etichetta: String(a) }))}
        valore={anno}
        onCambia={setAnno}
      />
      <Scelta
        etichetta="La tua attività indipendente è"
        opzioni={[
          { valore: "principale" as const, etichetta: "Principale" },
          { valore: "accessoria" as const, etichetta: "Accessoria" },
        ]}
        valore={situazione}
        onCambia={setSituazione}
      />

      {stima ? (
        <Scheda evidenziata>
          <Testo variante="etichetta" attenuato>
            CONTRIBUTI STIMATI {stima.anno}
          </Testo>
          <Testo colore={c.marchio} style={{ fontSize: 36, lineHeight: 42, fontWeight: "700" }}>
            {importo(stima.totale, 0)}
            <Testo attenuato> all&apos;anno</Testo>
          </Testo>
          <RigaValore etichetta="Reddito AVS (arrotondato)" valore={importo(stima.redditoAvs, 0)} />
          <RigaValore etichetta="AVS, AI e IPG" valore={importo(stima.avsAiIpg, 0)} />
          <RigaValore etichetta="Spese amministrative" valore={importo(stima.speseAmministrative, 0)} />
          <RigaValore etichetta="Assegni familiari" valore={importo(stima.assegniFamiliari, 0)} />
          <RigaValore etichetta="Assegno integrativo" valore={importo(stima.assegnoIntegrativo, 0)} />
          {stima.tassoEffettivo !== null ? (
            <RigaValore etichetta="In percentuale del reddito" valore={percentuale(stima.tassoEffettivo)} forte />
          ) : null}
          <Testo variante="piccolo" attenuato>
            {descrizioneCaso(stima)}
          </Testo>
          <Testo variante="piccolo" attenuato>
            {notaAnniSupplementi(stima.anno)}
          </Testo>
        </Scheda>
      ) : null}

      <ElencoFonti fonti={fontiContributi(anno)} />
      <NotaInformazione />
    </Schermata>
  );
}
