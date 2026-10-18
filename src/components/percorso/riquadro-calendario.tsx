"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { chiama } from "@/app/conti/api";
import { IconaCopia } from "@/components/strumenti/icone";
import { fontiCalendario, VERIFICATO_IL_CALENDARIO } from "@/data/calendario";
import { dataSvizzera } from "@/data/svizzera";
import {
  analizzaLinkSalvato,
  leggiLinkCreato,
  leggiStatoCalendario,
  linkCalendario,
  linkGoogleCalendar,
  linkWebcal,
  PERCORSO_CALENDARIO,
  serializzaLinkSalvato,
  type LinkSalvato,
  type StatoCalendario,
} from "@/lib/percorso/abbonamento";
import { CHIAVE_LINK_CALENDARIO, leggiGrezzo, scriviGrezzo } from "@/lib/percorso/archivio";
import { ElencoFonti } from "./elenco-fonti";
import { IconaAggiornamento, IconaCalendario, IconaLinkEsterno, IconaRicomincia } from "./icone";
import { classeLink, classePulsantePrincipale, classePulsanteSecondario } from "./stili";

/** Chi guarda la pagina: senza account, con l'account, o con il calendario non attivo (modalità demo o senza chiave segreta). */
export type AccessoCalendario = "non_attivo" | "ospite" | "collegato";

const MESSAGGIO_INATTESO = "Risposta inattesa da Bleo. Riprova tra poco.";

/** Data e ora ISO → «18.10.2026 alle 21:05», nel fuso del browser. */
function quando(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dataSvizzera(iso);
  const dueCifre = (n: number) => String(n).padStart(2, "0");
  const giorno = `${d.getFullYear()}-${dueCifre(d.getMonth() + 1)}-${dueCifre(d.getDate())}`;
  return `${dataSvizzera(giorno)} alle ${dueCifre(d.getHours())}:${dueCifre(d.getMinutes())}`;
}

/** Lo stato del link dal server; scarta la copia nel browser se non è più quella giusta. */
async function caricaStato(
  userId: string,
): Promise<{ ok: true; stato: StatoCalendario } | { ok: false; messaggio: string }> {
  const esito = await chiama<unknown>(PERCORSO_CALENDARIO);
  if (!esito.ok) return esito;
  const stato = leggiStatoCalendario(esito.dati);
  if (!stato) return { ok: false, messaggio: MESSAGGIO_INATTESO };
  const grezzo = leggiGrezzo(CHIAVE_LINK_CALENDARIO);
  if (grezzo && !analizzaLinkSalvato(grezzo, userId, stato.link?.id ?? null))
    scriviGrezzo(CHIAVE_LINK_CALENDARIO, null);
  return { ok: true, stato };
}

/**
 * «Calendario sempre aggiornato»: il link personale che Google Calendar o
 * Apple Calendario rileggono da soli. Serve l'account: il calendario nasce
 * dalle risposte salvate lì. Il link si vede per intero solo nel browser che
 * l'ha creato (il server ne tiene solo l'impronta).
 */
export function RiquadroCalendario({
  accesso,
  userId,
  percorsoNellAccount,
  conInizio,
}: {
  accesso: AccessoCalendario;
  userId: string | null;
  /** true se le risposte del questionario sono salvate nell'account. */
  percorsoNellAccount: boolean;
  /** true se tra le scadenze c'è il termine IVA che si conta dalla data di inizio. */
  conInizio: boolean;
}) {
  return (
    <section
      aria-labelledby="titolo-calendario-aggiornato"
      className="rounded-xl border border-border bg-card p-5 break-inside-avoid print:hidden"
    >
      <h2 id="titolo-calendario-aggiornato" className="flex items-center gap-2 text-lg font-semibold">
        <IconaAggiornamento className="size-5 text-brand" />
        Calendario sempre aggiornato
      </h2>
      <p className="mt-2 text-sm text-muted">
        Le tue scadenze e le votazioni da seguire nel calendario del telefono o del computer, con un link personale.
        Quando cambia qualcosa, il calendario si aggiorna da solo: non devi riscaricare il file.
      </p>
      {accesso === "collegato" && userId ? (
        <CalendarioCollegato userId={userId} percorsoNellAccount={percorsoNellAccount} conInizio={conInizio} />
      ) : accesso === "ospite" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            Il link è legato al tuo account: il calendario nasce dalle risposte che salvi lì, così si aggiorna anche
            quando le cambi da un altro dispositivo.
          </p>
          <Link href="/accedi?next=/percorso" className={`${classePulsanteSecondario} w-full text-sm`}>
            Accedi per avere il link
          </Link>
          <p className="text-xs text-muted">
            Senza account puoi scaricare il file .ics qui sopra: quando cambia qualcosa, lo riscarichi.
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-brand-soft p-3 text-sm">
          Il calendario sempre aggiornato non è ancora attivo in questa versione. Intanto puoi scaricare il file .ics
          qui sopra.
        </p>
      )}
    </section>
  );
}

type Caricamento =
  | { fase: "caricamento" }
  | { fase: "errore"; messaggio: string }
  | { fase: "pronto"; stato: StatoCalendario };

function CalendarioCollegato({
  userId,
  percorsoNellAccount,
  conInizio,
}: {
  userId: string;
  percorsoNellAccount: boolean;
  conInizio: boolean;
}) {
  const [carica, setCarica] = useState<Caricamento>({ fase: "caricamento" });
  const [tentativo, setTentativo] = useState(0);
  const [inCorso, setInCorso] = useState(false);
  const [conferma, setConferma] = useState<"rigenera" | "disattiva" | null>(null);
  // Copia in memoria del link appena creato, se il browser non lo salva (navigazione privata).
  const [creato, setCreato] = useState<LinkSalvato | null>(null);
  const [annuncio, setAnnuncio] = useState("");

  useEffect(() => {
    let attivo = true;
    void caricaStato(userId).then((esito) => {
      if (!attivo) return;
      setCarica(esito.ok ? { fase: "pronto", stato: esito.stato } : { fase: "errore", messaggio: esito.messaggio });
    });
    return () => {
      attivo = false;
    };
  }, [userId, tentativo]);

  if (carica.fase === "caricamento") {
    return (
      <p role="status" className="mt-4 text-sm text-muted">
        Controllo il tuo link…
      </p>
    );
  }
  if (carica.fase === "errore") {
    return (
      <div className="mt-4 space-y-3">
        <p role="alert" className="text-sm text-danger">
          {carica.messaggio}
        </p>
        <button
          type="button"
          className={`${classePulsanteSecondario} w-full text-sm`}
          onClick={() => {
            setCarica({ fase: "caricamento" });
            setTentativo((n) => n + 1);
          }}
        >
          Riprova
        </button>
      </div>
    );
  }

  const { stato } = carica;
  const attivo = stato.link;
  const locale = attivo
    ? creato?.id === attivo.id
      ? creato
      : analizzaLinkSalvato(leggiGrezzo(CHIAVE_LINK_CALENDARIO), userId, attivo.id)
    : null;
  const url = locale ? linkCalendario(window.location.origin, locale.percorso) : null;
  const conPercorso = percorsoNellAccount || stato.percorso !== null;

  function aggiornaLink(link: StatoCalendario["link"]) {
    setCarica((prima) => (prima.fase === "pronto" ? { fase: "pronto", stato: { ...prima.stato, link } } : prima));
  }

  async function nuovoLink() {
    const cera = attivo !== null;
    setInCorso(true);
    setAnnuncio("");
    const esito = await chiama<unknown>(PERCORSO_CALENDARIO, { metodo: "POST" });
    setInCorso(false);
    setConferma(null);
    if (!esito.ok) return setAnnuncio(esito.messaggio);
    const link = leggiLinkCreato(esito.dati);
    if (!link) return setAnnuncio(MESSAGGIO_INATTESO);
    const salvato = { userId, id: link.id, percorso: link.percorso };
    scriviGrezzo(CHIAVE_LINK_CALENDARIO, serializzaLinkSalvato(salvato));
    setCreato(salvato);
    aggiornaLink({ id: link.id, creatoIl: link.creatoIl, lettoIl: null });
    setAnnuncio(
      cera
        ? "Ecco il link nuovo: quello vecchio non funziona più. Aggiungi questo al calendario e togli quello vecchio."
        : "Ecco il tuo link: aggiungilo al calendario con i pulsanti qui sotto.",
    );
  }

  async function disattiva() {
    setInCorso(true);
    setAnnuncio("");
    const esito = await chiama<undefined>(PERCORSO_CALENDARIO, { metodo: "DELETE" });
    setInCorso(false);
    setConferma(null);
    if (!esito.ok) return setAnnuncio(esito.messaggio);
    scriviGrezzo(CHIAVE_LINK_CALENDARIO, null);
    setCreato(null);
    aggiornaLink(null);
    setAnnuncio("Link disattivato: i calendari che lo usavano non si aggiornano più. Toglilo anche dal calendario.");
  }

  async function copia(testo: string) {
    try {
      await navigator.clipboard.writeText(testo);
      setAnnuncio("Link copiato.");
    } catch {
      setAnnuncio("Non riesco a copiare: seleziona il link e copialo a mano.");
    }
  }

  return (
    <>
      <div className="mt-4 space-y-4">
        {!attivo ? (
          <>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>
                Le scadenze con una data di quest&apos;anno e del prossimo, con un promemoria una settimana prima.
              </li>
              <li>Le votazioni che possono cambiare qualcosa per la tua impresa.</li>
              <li>Ogni evento ha il link alla fonte ufficiale.</li>
            </ul>
            <button
              type="button"
              className={`${classePulsantePrincipale} w-full text-sm`}
              disabled={inCorso}
              onClick={() => void nuovoLink()}
            >
              <IconaAggiornamento className="size-4" />
              Crea il mio link
            </button>
          </>
        ) : url ? (
          <>
            <div>
              <label htmlFor="link-calendario" className="text-sm font-medium">
                Il tuo link personale
              </label>
              <input
                id="link-calendario"
                type="text"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                aria-describedby="link-calendario-aiuto"
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
              />
              <p id="link-calendario-aiuto" className="mt-1 text-xs text-muted">
                È solo tuo: chi lo ha vede le tue scadenze (non il tuo nome né la tua email). Non condividerlo; se
                finisce in giro, rigeneralo.
              </p>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                className={`${classePulsanteSecondario} w-full text-sm`}
                onClick={() => void copia(url)}
              >
                <IconaCopia className="size-4" />
                Copia il link
              </button>
              <a
                href={linkGoogleCalendar(url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${classePulsanteSecondario} w-full text-sm`}
              >
                <IconaLinkEsterno className="size-4" />
                Aggiungi a Google Calendar
                <span className="sr-only"> (si apre in una nuova scheda)</span>
              </a>
              <a href={linkWebcal(url)} className={`${classePulsanteSecondario} w-full text-sm`}>
                <IconaCalendario className="size-4" />
                Apri in Apple Calendario
              </a>
            </div>
          </>
        ) : (
          <p className="rounded-lg bg-brand-soft p-3 text-sm">
            Hai già un link attivo, ma non è salvato in questo browser: per sicurezza Bleo tiene solo un&apos;impronta
            del link, non il link. Se ti serve qui, rigeneralo: quello vecchio smette di funzionare e va sostituito nel
            calendario.
          </p>
        )}

        {attivo ? (
          <p className="text-xs text-muted">
            Link creato il {quando(attivo.creatoIl)}.{" "}
            {attivo.lettoIl
              ? `Ultima lettura da un calendario: ${quando(attivo.lettoIl)}.`
              : "Nessun calendario l'ha ancora letto."}
          </p>
        ) : null}

        <div className="space-y-2 text-xs text-muted">
          <p>
            {conPercorso
              ? "Le scadenze vengono dalle risposte salvate nel tuo account: se rifai il questionario, il calendario cambia da solo."
              : "Nel tuo account non c'è ancora un percorso salvato: per ora nel calendario ci sono solo le votazioni."}
          </p>
          {conInizio ? (
            <p>
              Il termine per annunciarti all&apos;IVA, che si conta dalla data di inizio dell&apos;attività, non
              c&apos;è: Bleo quella data non la salva. Mettilo nel calendario con il file .ics qui sopra.
            </p>
          ) : null}
          <p>
            Ogni calendario rilegge il link quando decide lui: una modifica può arrivare dopo qualche ora, con Google
            Calendar anche dopo di più.
          </p>
        </div>

        {attivo ? (
          <details className="rounded-lg border border-border p-3 text-sm">
            <summary className="cursor-pointer font-medium">Come si aggiunge al calendario</summary>
            <div className="mt-2 space-y-2">
              <p>
                <strong>Google Calendar</strong>: si aggiunge dal computer, nel browser (dall&apos;app del telefono non
                si può); poi lo vedi anche sul telefono. Se il pulsante non funziona, apri Google Calendar, accanto ad
                «Altri calendari» premi <strong>+</strong>, poi <strong>Da URL</strong>, incolla il link e premi{" "}
                <strong>Aggiungi calendario</strong>.
              </p>
              <p>
                <strong>iPhone, iPad e Mac</strong>: «Apri in Apple Calendario» e conferma l&apos;iscrizione. Oppure
                nell&apos;app Calendario scegli <strong>Aggiungi calendario con iscrizione</strong> e incolla il link.
              </p>
              <p>Se avevi già importato il file .ics, puoi cancellare quegli eventi: con il link non servono più.</p>
              <ElencoFonti
                fonti={[fontiCalendario.googleDaUrl, fontiCalendario.appleIphone]}
                verificatoIl={VERIFICATO_IL_CALENDARIO}
              />
            </div>
          </details>
        ) : null}

        {attivo ? (
          conferma ? (
            <div className="space-y-2 rounded-lg border border-danger p-3">
              <p className="text-sm">
                {conferma === "rigenera"
                  ? "Il link di adesso smette subito di funzionare: dovrai aggiungere quello nuovo al calendario e togliere il vecchio."
                  : "Il link smette subito di funzionare: il calendario che lo usa non si aggiorna più. Puoi crearne uno nuovo quando vuoi."}
              </p>
              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={inCorso}
                  className={`${classePulsanteSecondario} w-full border-danger text-sm text-danger`}
                  onClick={() => void (conferma === "rigenera" ? nuovoLink() : disattiva())}
                >
                  {conferma === "rigenera" ? "Sì, crea un link nuovo" : "Sì, disattiva il link"}
                </button>
                <button
                  type="button"
                  className={`${classePulsanteSecondario} w-full text-sm`}
                  onClick={() => setConferma(null)}
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <button
                type="button"
                className={`${classeLink} inline-flex min-h-11 items-center gap-1.5 text-sm`}
                onClick={() => setConferma("rigenera")}
              >
                <IconaRicomincia className="size-4" />
                Rigenera il link
              </button>
              <button
                type="button"
                className={`${classeLink} inline-flex min-h-11 items-center text-sm`}
                onClick={() => setConferma("disattiva")}
              >
                Disattiva il link
              </button>
            </div>
          )
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="mt-2 text-sm">
        {annuncio}
      </p>
    </>
  );
}
