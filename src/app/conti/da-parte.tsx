"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DettaglioContributi } from "@/components/strumenti/dettaglio-contributi";
import { IconaAvviso, IconaDispositivo, IconaInfo } from "@/components/strumenti/icone";
import { OPZIONI_SITUAZIONE } from "@/components/strumenti/tariffa/calcolatore-tariffa";
import { CampoScelta, CampoTesto, EtichettaStima, FonteLink, Fonti, RigaValore } from "@/components/strumenti/ui";
import { useArchivio } from "@/components/strumenti/usa-archivio";
import { dataSvizzera, fonti, fontiPercorso, fontiStrumenti, percentuale, regolePercorso } from "@/data/svizzera";
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
} from "@/lib/conti/da-parte";
import type { Riepilogo } from "@/lib/conti/tipi";
import { CHIAVI_ARCHIVIO } from "@/lib/strumenti/archivio";
import { descrizioneCaso, notaAnniSupplementi } from "@/lib/strumenti/avs";
import { importo, numeroBreve } from "@/lib/strumenti/numeri";
import { classeLinkConti } from "./ui-conti";

/** In franchi interi: è una stima, i centesimi non servono. */
const chf = (n: number) => importo(n, 0);

/**
 * «Quanto mettere da parte»: dai conti confermati dell'anno, quanto tenere da
 * parte per i contributi AVS e per le imposte. Le scelte (percentuale per le
 * imposte, acconti, mese di inizio) restano nel browser.
 */
export function DaParte({ riepilogo, oggi }: { riepilogo: Riepilogo; oggi: string }) {
  const [impostazioni, aggiorna] = useArchivio(CHIAVI_ARCHIVIO.daParte, schemaImpostazioniDaParte, impostazioniIniziali);
  const esito = useMemo(
    () => (impostazioni ? calcolaDaParte(riepilogo, oggi, impostazioni) : null),
    [impostazioni, riepilogo, oggi],
  );
  if (!impostazioni || !esito) {
    return (
      <p className="text-sm text-muted" role="status">
        Apro le tue scelte…
      </p>
    );
  }

  const { stima: s, errori } = esito;
  const anno = s.anno;
  if (s.vuoto) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        Quando confermi le prime entrate e uscite del {anno}, qui vedi quanto mettere da parte per l&apos;AVS e per le
        imposte.
      </p>
    );
  }

  const imposta = aggiorna;
  const scelteAnno = impostazioni.anni[String(anno)];
  const senzaImposte = s.riservaPercento === null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-brand bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-muted">
            {s.annoInCorso ? "Questo mese metti da parte circa" : `Per il ${anno} servivano in tutto circa`}
          </p>
          <EtichettaStima />
        </div>
        <div aria-live="polite">
          <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight">
            {chf(s.annoInCorso ? s.alMese.totale : s.totaleAnno)}
          </p>
          <p className="mt-1 text-sm text-muted">{sottotitoloDaParte(s)}</p>
          {s.annoInCorso ? (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-soft p-3">
                <dt className="text-xs text-muted first-letter:uppercase">{periodo(s)}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{chf(s.finora.totale)}</dd>
              </div>
              <div className="rounded-xl bg-brand-soft p-3">
                <dt className="text-xs text-muted">In tutto il {anno}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{chf(s.totaleAnno)}</dd>
              </div>
            </dl>
          ) : null}
        </div>
        {s.pocoAffidabile ? (
          <p className="mt-3 text-sm text-muted">È una media su pochi mesi: nei prossimi la stima può cambiare molto.</p>
        ) : null}
        {senzaImposte ? (
          <p className="mt-3 flex gap-2 text-sm">
            <IconaInfo className="mt-0.5 size-5 shrink-0 text-brand" />
            <span>
              Per le imposte{" "}
              <button type="button" onClick={vaiAllaPercentuale} className={classeLinkConti}>
                scegli una percentuale
              </button>
              : Bleo non calcola le imposte, la decidi tu.
            </span>
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h3 className="font-semibold">Da dove arriva la cifra</h3>
        <p className="mt-1 text-sm text-muted">{spiegazioneUtile(s)}</p>
        <dl className="mt-3 divide-y divide-border text-sm">
          <RigaValore etichetta={`Utile stimato del ${anno}`} nota="Entrate meno uscite della ditta" valore={chf(s.utileAnno)} />
          <RigaValore
            etichetta={`Contributi AVS/AI/IPG e assegni familiari ${anno}`}
            nota={descrizioneCaso(s.contributi)}
            valore={chf(s.contributi.totale)}
          />
          {s.accontiAvs !== null ? (
            <RigaValore etichetta={`Acconti AVS del ${anno} che hai scritto`} valore={chf(-s.accontiAvs)} />
          ) : null}
          <RigaValore etichetta="Per l'AVS da mettere da parte" valore={chf(s.avsAnno)} forte />
          <RigaValore
            etichetta={
              senzaImposte
                ? "Imposte"
                : `Imposte: ${numeroBreve(s.riservaPercento ?? 0, 2)}% di ${chf(s.baseImposte)}`
            }
            nota={senzaImposte ? "Non incluse: scegli tu una percentuale qui sotto" : "Utile dopo i contributi × la percentuale scelta da te"}
            valore={senzaImposte ? "—" : chf(s.imposteAnno)}
            forte
          />
          <RigaValore etichetta={`Totale da mettere da parte nel ${anno}`} valore={chf(s.totaleAnno)} forte />
        </dl>
      </div>

      {s.avvisi.length > 0 ? (
        <ul className="space-y-3">
          {s.avvisi.map((a) => (
            <AvvisoRiquadro key={a.id} avviso={a} />
          ))}
        </ul>
      ) : null}

      <fieldset className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <legend className="float-left w-full font-semibold">I tuoi dati per la stima</legend>
        <div className="clear-left grid gap-4 pt-3 sm:grid-cols-2">
          <CampoScelta
            id="da-parte-situazione"
            etichetta="La tua attività indipendente"
            valore={impostazioni.situazione}
            onCambia={(v) => imposta((i) => ({ ...i, situazione: v }))}
            opzioni={OPZIONI_SITUAZIONE}
          />
          <CampoScelta
            id="da-parte-inizio"
            etichetta="Da quando lavori in proprio"
            valore={String(s.meseInizio)}
            onCambia={(v) => imposta((i) => conAnno(i, anno, { meseInizio: Number(v) }))}
            opzioni={Array.from({ length: s.meseFine }, (_, i) => ({
              valore: String(i + 1),
              etichetta: i === 0 ? `Da gennaio ${anno} o da prima` : `Da ${NOMI_MESI[i]} ${anno}`,
            }))}
            aiuto={
              s.meseInizioAutomatico && s.meseInizio > 1
                ? `Bleo parte da ${NOMI_MESI[s.meseInizio - 1]}, il mese della tua prima voce. Se hai iniziato prima, cambialo.`
                : "Contano solo i mesi in cui lavori in proprio."
            }
          />
          <CampoTesto
            id="da-parte-acconti"
            etichetta={`Acconti AVS del ${anno}, in tutto`}
            prefisso="CHF"
            numerico
            placeholder="vuoto"
            valore={scelteAnno?.accontiAvs ?? ""}
            onCambia={(v) => imposta((i) => conAnno(i, anno, { accontiAvs: v }))}
            errore={errori.accontiAvs}
            maxLength={40}
            aiuto="La somma delle fatture d'acconto della cassa per quest'anno, anche quelle ancora da pagare. Lascia vuoto se non paghi acconti: Bleo conta tutti i contributi."
          />
          <CampoTesto
            id="da-parte-imposte"
            etichetta="Riserva per le imposte"
            suffisso="%"
            numerico
            placeholder="vuoto"
            valore={impostazioni.riservaImpostePercento}
            onCambia={(v) => imposta((i) => ({ ...i, riservaImpostePercento: v }))}
            errore={errori.riservaImpostePercento}
            maxLength={40}
            aiuto={
              <>
                Percentuale dell&apos;utile dopo i contributi, scelta da te. Per farti un&apos;idea c&apos;è il{" "}
                <FonteLink fonte={fontiStrumenti.afcCalcolatoreImposte} /> dell&apos;AFC; per il tuo caso, un fiduciario
                autorizzato (<FonteLink fonte={fonti.albofiduciari} />).
              </>
            }
          />
        </div>
        <p className="mt-4 flex gap-2 text-sm text-muted">
          <IconaDispositivo className="mt-0.5 size-5 shrink-0 text-brand" />
          <span>Queste scelte restano solo in questo browser: Bleo non le riceve.</span>
        </p>
      </fieldset>

      <details className="rounded-2xl border border-border bg-card p-4 text-sm sm:p-5">
        <summary className="cursor-pointer font-medium text-brand">Come facciamo la stima</summary>
        <div className="mt-3 space-y-3 text-muted">
          <p>
            Partiamo dal risultato dei conti che hai confermato: entrate meno uscite della ditta, senza le voci private
            e senza quelle ancora da confermare. Lo dividiamo per i mesi passati, dal mese in cui lavori in proprio a
            oggi (il mese in corso conta), e aggiungiamo la stessa media per i mesi che mancano a dicembre. Se lavori
            da gennaio è come fare: utile finora ÷ mesi passati × 12.
          </p>
          <p>
            Se hai iniziato durante l&apos;anno contano solo i mesi di attività: per l&apos;AVS ogni anno è
            l&apos;anno civile e il reddito non è convertito in reddito annuo (
            <FonteLink fonte={fontiStrumenti.oavs22} />
            ).
          </p>
          <p>
            Durante l&apos;anno la cassa di compensazione chiede acconti trimestrali, calcolati sul reddito che
            prevedi. I contributi definitivi li fissa dopo, sulla tassazione fiscale: se gli acconti erano più bassi ti
            fattura la differenza, se erano più alti te la rimborsa. Per questo l&apos;importo vero lo decide la
            cassa, non questa stima.
          </p>
          <p>
            Se il tuo utile cambia di più o meno il {percentuale(regolePercorso.variazioneRedditoIas.valore, 0)}{" "}
            rispetto a quello su cui paghi gli acconti, l&apos;IAS chiede di segnalarlo. Nella{" "}
            <FonteLink fonte={fontiPercorso.iasAdeguamentoIndipendenti} /> chiede l&apos;utile presumibile
            dell&apos;anno (entrate meno spese): una stima come quella qui sopra.
          </p>
          <p>
            Per le imposte non facciamo calcoli: metti da parte la percentuale che scegli tu, sull&apos;utile dopo i
            contributi (come nel{" "}
            <Link href="/strumenti/budget" className={classeLinkConti}>
              Budget del primo anno
            </Link>
            ). Quanto pagherai dipende dal tuo reddito, dalla tua sostanza e dal tuo Comune.
          </p>
          {s.annoAvsApprossimato ? (
            <p>
              Per il {anno} non abbiamo la tavola dei contributi: usiamo quella del {s.annoAvs}, la più vicina.
            </p>
          ) : null}
          <p>{notaAnniSupplementi(s.annoAvs)}</p>
          <DettaglioContributi stima={s.contributi} titolo={`Contributi sociali stimati sull'utile del ${anno}`} />
        </div>
      </details>

      <div className="rounded-2xl border border-border bg-card p-4 text-sm sm:p-5">
        <p className="font-semibold">Nel corso di Bleo</p>
        <ul className="mt-2 space-y-1.5">
          {lezioniDaParte().map((l) => (
            <li key={l.passoId}>
              <Link href={`/corso#lezione-${l.passoId}`} className={classeLinkConti}>
                Lezione {l.numero}: {l.titolo}
              </Link>
            </li>
          ))}
        </ul>
        <Fonti fonti={fontiDaParte(s.annoAvs)} />
        <p className="mt-1 text-xs text-muted">Dati controllati il {dataSvizzera(verificatoDaParte(s.annoAvs))}.</p>
        <p className="mt-3 text-muted">
          È una stima con regole generali, non una consulenza: per il tuo caso rivolgiti a un fiduciario autorizzato.
        </p>
      </div>
    </div>
  );
}

/** Porta al campo della percentuale, al centro dello schermo (sopra c'è l'intestazione fissa). */
function vaiAllaPercentuale() {
  const campo = document.getElementById("da-parte-imposte");
  if (!campo) return;
  campo.scrollIntoView({ block: "center", behavior: "smooth" });
  campo.focus({ preventScroll: true });
}

function AvvisoRiquadro({ avviso }: { avviso: AvvisoDaParte }) {
  const attenzione = avviso.livello === "attenzione";
  return (
    <li className={`rounded-2xl border p-4 ${attenzione ? "border-accent bg-card" : "border-border bg-brand-soft"}`}>
      <p className="flex items-start gap-2 font-semibold">
        {attenzione ? (
          <IconaAvviso className="mt-0.5 size-5 shrink-0 text-accent" />
        ) : (
          <IconaInfo className="mt-0.5 size-5 shrink-0 text-brand" />
        )}
        {avviso.titolo}
      </p>
      <p className="mt-1 text-sm">{avviso.testo}</p>
      <Fonti fonti={avviso.fonti} />
    </li>
  );
}
