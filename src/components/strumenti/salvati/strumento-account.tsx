"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ArchivioStrumento, StatoStrumento } from "@/lib/strumenti/archivio-salvati";
import { dataIsoLocale } from "@/lib/strumenti/documenti";
import {
  CHIAVI_STRUMENTI,
  datiIniziali,
  NOMI_STRUMENTI,
  propostaCopia,
  riassuntoStrumento,
  SCHEMI_STRUMENTI,
  type DatiStrumento,
  type StrumentoSalvato,
} from "@/lib/strumenti/salvati";
import { NotaDatiLocali } from "../dati-locali";
import { NotaAccount } from "../documenti/account-documenti";
import { cancellaArchivio, useArchivio, useArchivioPresente } from "../usa-archivio";
import { classeLink, classePulsantePiccolo, classePulsantePrincipale, classePulsanteSecondario } from "../ui";
import { useStrumentoAccount } from "./usa-strumento-account";

/*
 * Budget e business plan con o senza account, sul sito. Con l'accesso i dati
 * stanno nell'account (si vedono anche nell'app), con lo stato del
 * salvataggio e l'invito a copiare quello che è rimasto nel browser; senza
 * accesso o in modalità demo restano nel browser, come prima.
 */

/**
 * «collegato»: i dati stanno nell'account; «ospite»: nel browser, con
 * l'invito ad accedere; null (account non attivi): nel browser.
 */
export type AccessoStrumento = "collegato" | "ospite" | null;

const PREDEFINITI: { [S in StrumentoSalvato]: () => DatiStrumento[S] } = {
  budget: () => datiIniziali("budget", dataIsoLocale(new Date())),
  "business-plan": () => datiIniziali("business-plan", dataIsoLocale(new Date())),
};

export type StrumentoSito<S extends StrumentoSalvato> = {
  strumento: S;
  accesso: AccessoStrumento;
  /** true se i dati vengono dall'account. */
  collegato: boolean;
  /** I dati da mostrare (null finché non letti). */
  dati: DatiStrumento[S] | null;
  aggiorna: (aggiornamento: (precedente: DatiStrumento[S]) => DatiStrumento[S]) => void;
  /** true se c'è qualcosa di salvato (nell'account o nel browser), per importarlo in un altro strumento. */
  presente: boolean;
  archivio: ArchivioStrumento<S> | null;
  /** Lo stato dell'account, se è pronto. */
  conto: StatoStrumento<DatiStrumento[S]> | null;
  /** Lo stato dell'account, se non si è riusciti a leggerlo. */
  errore: StatoStrumento<DatiStrumento[S]> | null;
  /** Quello che c'è nel browser (null se non c'è niente di salvato). */
  locali: DatiStrumento[S] | null;
  /** Se l'account non risponde: lavora nel browser, come senza accesso. */
  usaBrowser: () => void;
};

export function useStrumentoSalvato<S extends StrumentoSalvato>(strumento: S, accesso: AccessoStrumento): StrumentoSito<S> {
  const [soloBrowser, setSoloBrowser] = useState(false);
  const collegato = accesso === "collegato" && !soloBrowser;
  const chiave = CHIAVI_STRUMENTI[strumento];
  const [locali, aggiornaLocali] = useArchivio(chiave, SCHEMI_STRUMENTI[strumento], PREDEFINITI[strumento]);
  const presenteLocale = useArchivioPresente(chiave);
  const { stato, archivio } = useStrumentoAccount(strumento, collegato);
  const conto = collegato && stato?.caricamento === "pronto" && stato.dati !== null ? stato : null;
  const aggiorna = useMemo<StrumentoSito<S>["aggiorna"]>(
    () => (collegato ? (modifica) => archivio?.aggiorna(modifica) : (modifica) => aggiornaLocali(modifica)),
    [collegato, archivio, aggiornaLocali],
  );
  return {
    strumento,
    accesso,
    collegato,
    dati: collegato ? (conto?.dati ?? null) : locali,
    aggiorna,
    presente: collegato ? Boolean(conto?.nellAccount) : presenteLocale,
    archivio,
    conto,
    errore: collegato && stato?.caricamento === "errore" ? stato : null,
    locali: presenteLocale ? locali : null,
    usaBrowser: () => setSoloBrowser(true),
  };
}

export function CaricamentoStrumento({ strumento }: { strumento: StrumentoSalvato }) {
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-6 text-muted" role="status">
      Sto aprendo il {NOMI_STRUMENTI[strumento].nome} del tuo account…
      <noscript>
        <p className="mt-2 text-foreground">Per usare gli strumenti serve JavaScript attivo nel browser.</p>
      </noscript>
    </div>
  );
}

export function ErroreStrumento<S extends StrumentoSalvato>({ s }: { s: StrumentoSito<S> }) {
  const nomi = NOMI_STRUMENTI[s.strumento];
  const scaduto = s.errore?.errore?.stato === 401;
  return (
    <div role="alert" className="mt-8 rounded-xl border border-danger/40 bg-card p-5">
      <p className="font-semibold">Non riesco ad aprire il {nomi.nome} del tuo account.</p>
      <p className="mt-1 text-muted">{scaduto ? "L'accesso è scaduto: accedi di nuovo." : s.errore?.errore?.messaggio}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {scaduto ? (
          <Link href={`/accedi?next=${nomi.percorso}`} className={classePulsantePrincipale}>
            Accedi di nuovo
          </Link>
        ) : (
          <button type="button" className={classePulsanteSecondario} onClick={() => void s.archivio?.carica()}>
            Riprova
          </button>
        )}
        <button type="button" className={classePulsanteSecondario} onClick={s.usaBrowser}>
          Lavora in questo browser
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">
        In questo browser il {nomi.nome} resta solo qui: quando l&apos;account torna a rispondere puoi copiarlo
        nell&apos;account.
      </p>
    </div>
  );
}

/**
 * In cima allo strumento: «Salvato nel tuo account» con lo stato del
 * salvataggio e l'invito a copiare quello che c'è nel browser; senza accesso
 * «I tuoi dati restano su questo dispositivo».
 */
export function NotaStrumento<S extends StrumentoSalvato>({ s }: { s: StrumentoSito<S> }) {
  const nomi = NOMI_STRUMENTI[s.strumento];
  const { conto, archivio } = s;
  if (conto && archivio) {
    return (
      <div className="space-y-3 print:hidden">
        <NotaAccount
          stato={conto}
          onRiprova={() => void archivio.salva()}
          testo={
            <>
              <strong className="font-semibold">{conto.nellAccount ? "Salvato nel tuo account." : "Si salva nel tuo account."}</strong>{" "}
              Lo ritrovi su ogni dispositivo in cui accedi, anche nell&apos;app Bleo sul telefono.
            </>
          }
          azioni={conto.nellAccount ? <CancellaDallAccount nome={nomi.nome} onCancella={() => archivio.cancella()} /> : null}
        />
        <CopiaDalBrowser s={s} />
      </div>
    );
  }
  return (
    <div className="space-y-2 print:hidden">
      <NotaDatiLocali chiavi={[CHIAVI_STRUMENTI[s.strumento]]} />
      {s.accesso === "ospite" ? (
        <p className="text-sm text-muted">
          Con un account lo salvi nel tuo account e lo ritrovi anche nell&apos;app Bleo sul telefono.{" "}
          <Link href={`/accedi?next=${nomi.percorso}`} className={classeLink}>
            Accedi
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function CancellaDallAccount({ nome, onCancella }: { nome: string; onCancella: () => void }) {
  const [conferma, setConferma] = useState(false);
  if (!conferma) {
    return (
      <button type="button" className={classePulsantePiccolo} onClick={() => setConferma(true)}>
        Ricomincia da zero
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={`${classePulsantePiccolo} border-danger text-danger`}
        onClick={() => {
          setConferma(false);
          onCancella();
        }}
      >
        Sì, cancella il {nome} dall&apos;account
      </button>
      <button type="button" className={classePulsantePiccolo} onClick={() => setConferma(false)}>
        Annulla
      </button>
    </span>
  );
}

/**
 * Prima volta con l'accesso: quello che è rimasto nel browser (salvato senza
 * account) si copia nell'account, se l'account non ha ancora questo
 * strumento; se ce l'ha ed è diverso, si sceglie quale tenere. Dopo la scelta
 * si toglie dal browser, così non ci sono doppioni.
 */
function CopiaDalBrowser<S extends StrumentoSalvato>({ s }: { s: StrumentoSito<S> }) {
  const [nascosto, setNascosto] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [conferma, setConferma] = useState<"cancella" | "sostituisci" | null>(null);
  const [esito, setEsito] = useState<{ testo: string; errore: boolean } | null>(null);
  const [giaNellAccount, setGiaNellAccount] = useState(false);

  const { conto, archivio, locali, strumento } = s;
  const proposta = conto ? propostaCopia(strumento, locali, conto) : null;
  const nome = NOMI_STRUMENTI[strumento].nome;

  if (esito && !inCorso) {
    return (
      <p
        role={esito.errore ? "alert" : "status"}
        className={`rounded-xl border p-4 text-sm ${esito.errore ? "border-danger/40 bg-card text-danger" : "border-success bg-card"}`}
      >
        {esito.testo}
      </p>
    );
  }
  if (nascosto || !proposta || !locali || !conto || !archivio) return null;
  const daCopiare = locali;
  const togliDalBrowser = () => cancellaArchivio(CHIAVI_STRUMENTI[strumento]);

  async function copia() {
    if (!archivio) return;
    setInCorso(true);
    const r = await archivio.importa(daCopiare);
    if (r.ok && r.importato) {
      togliDalBrowser();
      setEsito({ testo: `Fatto: il ${nome} ora è nel tuo account e non più in questo browser.`, errore: false });
    } else if (r.ok) {
      // Nel frattempo l'account ha salvato il suo: si sceglie quale tenere.
      setGiaNellAccount(true);
    } else {
      setEsito({
        testo: `Non sono riuscito a copiarlo: ${r.errore.messaggio} Resta in questo browser: ricarica la pagina per riprovare.`,
        errore: true,
      });
    }
    setConferma(null);
    setInCorso(false);
  }

  async function sostituisci() {
    if (!archivio) return;
    setInCorso(true);
    const r = await archivio.sostituisci(daCopiare);
    if (r.ok) {
      togliDalBrowser();
      setEsito({ testo: `Fatto: nel tuo account ora c'è il ${nome} di questo browser, e qui non c'è più.`, errore: false });
    } else {
      setEsito({
        testo: `Non sono riuscito a salvarlo nell'account: ${r.errore.messaggio} Il ${nome} di questo browser resta anche qui.`,
        errore: true,
      });
    }
    setConferma(null);
    setInCorso(false);
  }

  const tieniAccount = () => {
    togliDalBrowser();
    setEsito({ testo: `Tenuto quello dell'account: il ${nome} di questo browser è cancellato.`, errore: false });
  };

  const titolo = proposta === "copia" ? `Copia nel tuo account il ${nome} di questo browser` : `In questo browser c'è un altro ${nome}`;
  return (
    <section aria-labelledby={`titolo-copia-${strumento}`} className="rounded-xl border-2 border-brand bg-card p-4">
      <h2 id={`titolo-copia-${strumento}`} className="font-semibold">
        {titolo}
      </h2>
      {proposta === "copia" ? (
        <p className="mt-1 text-sm text-muted">
          Prima dell&apos;accesso avevi preparato qui un {nome} ({riassuntoStrumento(strumento, daCopiare)}). Copialo
          nell&apos;account per ritrovarlo anche nell&apos;app e sugli altri dispositivi. Dopo la copia lo togliamo da
          questo browser, così non hai doppioni.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">
            {giaNellAccount ? `Nel frattempo nel tuo account c'era già un ${nome}. ` : ""}
            Prima dell&apos;accesso avevi preparato qui un {nome} diverso da quello del tuo account. Quale vuoi tenere?
            Quello che non scegli lo cancelliamo.
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <span className="font-medium">Nel tuo account:</span> {riassuntoStrumento(strumento, conto.dati ?? daCopiare)}
            </li>
            <li>
              <span className="font-medium">In questo browser:</span> {riassuntoStrumento(strumento, daCopiare)}
            </li>
          </ul>
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
        {conferma === "cancella" ? (
          <>
            <button
              type="button"
              className={`${classePulsantePiccolo} border-danger text-danger`}
              onClick={() => {
                togliDalBrowser();
                setEsito({ testo: "Cancellato da questo browser.", errore: false });
              }}
            >
              Sì, cancellalo da questo browser
            </button>
            <button type="button" className={classePulsantePiccolo} onClick={() => setConferma(null)}>
              Annulla
            </button>
          </>
        ) : conferma === "sostituisci" ? (
          <>
            <button
              type="button"
              className={`${classePulsantePiccolo} border-danger text-danger`}
              onClick={() => void sostituisci()}
              disabled={inCorso}
            >
              {inCorso ? "Salvo…" : "Sì, sostituisci quello dell'account"}
            </button>
            <button type="button" className={classePulsantePiccolo} onClick={() => setConferma(null)} disabled={inCorso}>
              Annulla
            </button>
          </>
        ) : proposta === "copia" ? (
          <>
            <button type="button" className={classePulsantePrincipale} onClick={() => void copia()} disabled={inCorso}>
              {inCorso ? "Copio…" : "Copia nel mio account"}
            </button>
            <button type="button" className={classePulsanteSecondario} onClick={() => setNascosto(true)} disabled={inCorso}>
              Non ora
            </button>
            <button type="button" className={classePulsantePiccolo} onClick={() => setConferma("cancella")} disabled={inCorso}>
              Cancellalo da questo browser
            </button>
          </>
        ) : (
          <>
            <button type="button" className={classePulsantePrincipale} onClick={tieniAccount}>
              Tieni quello dell&apos;account
            </button>
            <button type="button" className={classePulsanteSecondario} onClick={() => setConferma("sostituisci")}>
              Usa quello di questo browser
            </button>
            <button type="button" className={classePulsantePiccolo} onClick={() => setNascosto(true)}>
              Non ora
            </button>
          </>
        )}
      </div>
    </section>
  );
}
