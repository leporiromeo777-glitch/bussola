"use client";

import { useState } from "react";
import { IconaCopia } from "@/components/strumenti/icone";
import { RICERCA_FILTRO_GMAIL, fontiConti } from "@/data/conti";
import type { Casella } from "@/lib/conti/tipi";
import { chiama } from "./api";
import { Fonti, Messaggio, classeLinkConti, classePiccolo, dataOra } from "./ui-conti";

function Copia({ testo, etichetta }: { testo: string; etichetta: string }) {
  const [copiato, setCopiato] = useState(false);
  return (
    <button
      type="button"
      className={classePiccolo}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(testo);
          setCopiato(true);
          window.setTimeout(() => setCopiato(false), 2500);
        } catch {
          setCopiato(false);
        }
      }}
    >
      <IconaCopia className="size-4" />
      {copiato ? "Copiato" : "Copia"}
      <span className="sr-only"> {etichetta}</span>
    </button>
  );
}

export function RiceviFatture({ casella, onCambiata }: { casella: Casella; onCambiata: (c: Casella) => void }) {
  const [cambia, setCambia] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const indirizzo = casella.indirizzo;

  async function nuovoIndirizzo() {
    setInCorso(true);
    setMessaggio(null);
    const esito = await chiama<Casella>("/api/conti/casella", { metodo: "POST" });
    setInCorso(false);
    setCambia(false);
    if (!esito.ok) return setMessaggio(esito.messaggio);
    onCambiata(esito.dati);
  }

  if (!indirizzo) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        La ricezione delle fatture via email non è ancora attiva. Intanto puoi fotografarle o caricare il PDF.
      </p>
    );
  }

  const conferma = casella.confermaGmail;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm text-muted">Il tuo indirizzo personale</p>
        <p className="mt-1 font-mono text-sm font-semibold break-all sm:text-base">{indirizzo}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Copia testo={indirizzo} etichetta="l'indirizzo" />
          {cambia ? (
            <>
              <button type="button" className={`${classePiccolo} border-danger text-danger`} disabled={inCorso} onClick={nuovoIndirizzo}>
                Sì, cambia indirizzo
              </button>
              <button type="button" className={classePiccolo} onClick={() => setCambia(false)}>
                Annulla
              </button>
            </>
          ) : (
            <button type="button" className={classePiccolo} onClick={() => setCambia(true)}>
              Cambia indirizzo
            </button>
          )}
        </div>
        {cambia ? (
          <p className="mt-2 text-sm text-muted">
            Il vecchio indirizzo smette subito di funzionare: dovrai rifare l&apos;inoltro con quello nuovo. Fallo se
            l&apos;indirizzo è finito in mano ad altri.
          </p>
        ) : null}
        <p className="mt-3 text-sm text-muted">
          Ogni email con una ricevuta o una fattura che arriva qui la trovi in «Da confermare». Non scrivere
          l&apos;indirizzo in giro: è solo per te.
          {casella.ultimaEmail ? ` Ultima email arrivata: ${dataOra(casella.ultimaEmail)}.` : ""}
        </p>
        <Messaggio testo={messaggio} />
      </div>

      {conferma ? (
        <div className="rounded-2xl border-2 border-brand bg-brand-soft p-4 sm:p-5" role="status">
          <p className="font-semibold">Gmail ti ha mandato la conferma dell&apos;inoltro</p>
          {conferma.codice ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="font-mono text-3xl font-extrabold tracking-wider tabular-nums">{conferma.codice}</p>
              <Copia testo={conferma.codice} etichetta="il codice di conferma" />
            </div>
          ) : null}
          <p className="mt-2 text-sm">
            {conferma.codice
              ? "Scrivi questo codice in Gmail, nella finestra «Inoltro», e premi «Verifica»."
              : "Apri il link qui sotto per confermare."}
            {conferma.link ? (
              <>
                {" "}
                Oppure{" "}
                <a href={conferma.link} target="_blank" rel="noopener noreferrer" className={classeLinkConti}>
                  conferma con il link di Google
                  <span className="sr-only"> (si apre in una nuova scheda)</span>
                </a>
                .
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted">Arrivata il {dataOra(conferma.ricevutaIl)}.</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h3 className="font-semibold">Con Gmail, dal computer</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>
            Apri Gmail, in alto a destra premi l&apos;ingranaggio e poi <strong>Visualizza tutte le impostazioni</strong>.
          </li>
          <li>
            Apri la scheda <strong>Inoltro e POP/IMAP</strong> e premi <strong>Aggiungi un indirizzo di inoltro</strong>.
            Incolla il tuo indirizzo personale (qui sopra) e premi <strong>Avanti</strong>, <strong>Procedi</strong> e{" "}
            <strong>OK</strong>.
          </li>
          <li>
            Gmail manda un codice di conferma al tuo indirizzo personale: dopo qualche secondo lo vedi qui sopra, in
            grande. Ricarica questa pagina se non c&apos;è ancora. Scrivilo in Gmail e premi <strong>Verifica</strong>.
          </li>
          <li>
            Non attivare «Inoltra una copia della posta in arrivo»: manderesti a Bleo tutte le tue email. Crea invece un
            filtro: nella casella di ricerca di Gmail incolla
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded bg-background px-2 py-1 text-xs break-all">{RICERCA_FILTRO_GMAIL}</code>
              <Copia testo={RICERCA_FILTRO_GMAIL} etichetta="la ricerca per il filtro" />
            </span>
          </li>
          <li>
            Apri le opzioni di ricerca (l&apos;icona a destra nella casella), premi <strong>Crea filtro</strong>, spunta{" "}
            <strong>Inoltralo a</strong>, scegli il tuo indirizzo personale e premi di nuovo <strong>Crea filtro</strong>.
          </li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Da quel momento le email con fatture e ricevute arrivano anche a Bleo; restano comunque nella tua Gmail.
        </p>
        <Fonti fonti={[fontiConti.gmailInoltro, fontiConti.gmailRicerca]} />
      </div>

      <details className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <summary className="cursor-pointer font-semibold">Con Outlook o Hotmail</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>
            In Outlook sul web premi <strong>Impostazioni</strong> e poi <strong>Posta</strong> &gt;{" "}
            <strong>Regole</strong> &gt; <strong>Aggiungi nuova regola</strong>.
          </li>
          <li>
            Dai un nome alla regola, per esempio «Ricevute a Bleo». Come condizione scegli <strong>Ha un allegato</strong>
            , e se vuoi aggiungi «L&apos;oggetto include» con parole come fattura, ricevuta, invoice, Rechnung.
          </li>
          <li>
            Come azione scegli <strong>Reindirizza a</strong> e incolla il tuo indirizzo personale. Premi{" "}
            <strong>Salva</strong>.
          </li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Con «Reindirizza a» Bleo vede il mittente vero (il negozio o il fornitore). Alcuni account di lavoro non
          permettono l&apos;inoltro verso fuori: in quel caso chiedi a chi gestisce la tua email.
        </p>
        <Fonti fonti={[fontiConti.outlookRegole]} />
      </details>

      <p className="text-sm text-muted">
        Puoi anche inoltrare a mano una singola email: arriva allo stesso modo.
      </p>
    </div>
  );
}
