import { tavoleScalari } from "@/data/avs-tavola-scalare";
import { datiStrumenti, fonti, fontiStrumenti, percentuale, supplementiTicino, uffici } from "@/data/svizzera";
import { descrizioneCaso, notaAnniSupplementi, type StimaContributi } from "@/lib/strumenti/avs";
import { articoloNumero, importo, numeroSvizzero } from "@/lib/strumenti/numeri";
import { EtichettaStima, FonteLink, Fonti, RigaValore } from "./ui";

/** "Circa l'11,2% del reddito", con l'articolo giusto davanti al numero. */
function notaTassoEffettivo(tasso: number): string {
  const testo = percentuale(tasso, 1);
  return `Circa ${articoloNumero(testo)}${testo} del reddito`;
}

/** Dettaglio dei contributi sociali stimati, con le fonti di ogni percentuale. */
export function DettaglioContributi({ stima, titolo }: { stima: StimaContributi; titolo?: string }) {
  const tavola = tavoleScalari[stima.anno];
  const tassoAvs =
    stima.caso === "minimo"
      ? "contributo minimo"
      : stima.caso === "suRichiesta"
        ? "solo su richiesta"
        : stima.tasso !== null
          ? percentuale(stima.tasso, stima.caso === "massimo" ? 1 : 3)
          : "";

  return (
    <section aria-labelledby="titolo-contributi" className="break-inside-avoid rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="titolo-contributi" className="font-semibold">
          {titolo ?? `Contributi sociali ${stima.anno}`}
        </h3>
        <EtichettaStima />
      </div>
      <p className="mt-1 text-sm text-muted">{descrizioneCaso(stima)}</p>
      <dl className="mt-3 divide-y divide-border text-sm">
        <RigaValore
          etichetta="Reddito su cui si calcolano"
          nota="Utile dell'attività prima dei contributi sociali, arrotondato ai 100 franchi inferiori"
          valore={importo(stima.redditoAvs, 0)}
        />
        <RigaValore
          etichetta={`AVS/AI/IPG (${tassoAvs})`}
          nota={stima.fascia ? `Fascia da ${importo(stima.fascia.da, 0)} a meno di ${importo(stima.fascia.a, 0)}` : undefined}
          valore={importo(stima.avsAiIpg)}
        />
        <RigaValore
          etichetta={`Spese amministrative (${percentuale(supplementiTicino.speseAmministrative.valore)} dei contributi)`}
          valore={importo(stima.speseAmministrative)}
        />
        <RigaValore
          etichetta={`Assegni familiari (${percentuale(supplementiTicino.assegniFamiliari.valore, 2)} del reddito)`}
          nota={
            stima.redditoAvs > datiStrumenti.guadagnoMassimoAssegniFamiliari.valore
              ? `Solo sui primi ${importo(datiStrumenti.guadagnoMassimoAssegniFamiliari.valore, 0)} di reddito`
              : undefined
          }
          valore={importo(stima.assegniFamiliari)}
        />
        <RigaValore
          etichetta={`Assegno integrativo AFI (${percentuale(supplementiTicino.assegnoIntegrativo.valore, 2)} del reddito)`}
          valore={importo(stima.assegnoIntegrativo)}
        />
        <RigaValore
          etichetta="Totale all'anno"
          nota={stima.tassoEffettivo !== null ? notaTassoEffettivo(stima.tassoEffettivo) : undefined}
          valore={importo(stima.totale)}
          forte
        />
      </dl>

      <details className="mt-3 text-sm print:hidden">
        <summary className="cursor-pointer font-medium text-brand">Come lo calcoliamo</summary>
        <div className="mt-2 space-y-2 text-muted">
          <p>
            La cassa di compensazione calcola i contributi sul reddito netto dell&apos;attività stabilito dalla
            tassazione, al quale riaggiunge i contributi AVS/AI/IPG dedotti. Per questo partiamo dall&apos;utile
            prima dei contributi sociali. Non togliamo l&apos;interesse sul capitale proprio investito, che la cassa
            deduce: la stima è quindi un po&apos; prudente. Per legge il reddito si arrotonda ai{" "}
            {numeroSvizzero(datiStrumenti.arrotondamentoRedditoAvs.valore)} franchi inferiori (
            <FonteLink fonte={datiStrumenti.arrotondamentoRedditoAvs.fonte} />).
          </p>
          <p>
            Durante l&apos;anno paghi acconti trimestrali calcolati dalla cassa sul reddito che prevedi; i contributi
            definitivi arrivano dopo la tassazione.
          </p>
          <p>
            Tavola scalare {stima.anno}: {tavola.nota}
          </p>
          <p>
            I supplementi sono quelli della cassa cantonale ticinese ({uffici.cassaCompensazioneTicino.valore.nome}).
            Con una cassa professionale o nel Grigioni italiano ({uffici.cassaCompensazioneGrigioni.valore.nome}) le
            aliquote possono essere diverse: da verificare con la tua cassa.
          </p>
          <p>{notaAnniSupplementi(stima.anno)}</p>
          <p>
            Per un controllo c&apos;è il <FonteLink fonte={fontiStrumenti.ufasContributi} /> dell&apos;UFAS.
          </p>
        </div>
      </details>
      <Fonti
        fonti={[
          tavola.fonte,
          fonti.avsPromemoria202,
          datiStrumenti.arrotondamentoRedditoAvs.fonte,
          supplementiTicino.speseAmministrative.fonte,
          supplementiTicino.assegniFamiliari.fonte,
          supplementiTicino.assegnoIntegrativo.fonte,
        ]}
      />
    </section>
  );
}
