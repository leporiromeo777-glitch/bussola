"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { chiediABussola, type EventoFine } from "@/lib/chat/cliente";
import { LUNGHEZZA_MASSIMA_DOMANDA, LUNGHEZZA_MINIMA_DOMANDA, SCAMBI_PRECEDENTI_MASSIMI } from "@/lib/chat/limiti";
import { testoSemplice } from "@/lib/chat/testo-risposta";
import type { QuotaPubblica, ScambioPrecedente } from "@/lib/chat/tipi";
import { ElencoFonti, TestoRisposta } from "./risposta";
import { TestoQuota } from "./testo-quota";

type Messaggio = {
  id: string;
  domanda: string;
  stato: "in_attesa" | "in_scrittura" | "completo" | "errore";
  testo: string;
  fine: EventoFine | null;
  errore: string | null;
  serveAccesso: boolean;
};

const LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA = 2_000;

export function Chat({ quotaIniziale, esempi }: { quotaIniziale: QuotaPubblica | null; esempi: readonly string[] }) {
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [bozza, setBozza] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [quota, setQuota] = useState(quotaIniziale);
  const [annuncio, setAnnuncio] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const ultimo = useRef<HTMLLIElement>(null);
  const contatore = useRef(0);
  const interruzione = useRef<AbortController | null>(null);

  const quotaEsaurita = quota?.rimanenti === 0;

  useEffect(() => () => interruzione.current?.abort(), []);

  // Quando arriva una nuova domanda la si porta in vista (senza animazione se l'utente la evita).
  useEffect(() => {
    if (messaggi.length === 0) return;
    const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ultimo.current?.scrollIntoView({ behavior: ridotto ? "auto" : "smooth", block: "nearest" });
  }, [messaggi.length]);

  const aggiorna = (id: string, modifica: Partial<Messaggio> | ((m: Messaggio) => Partial<Messaggio>)) =>
    setMessaggi((lista) =>
      lista.map((m) => (m.id === id ? { ...m, ...(typeof modifica === "function" ? modifica(m) : modifica) } : m)),
    );

  async function invia(testo: string) {
    const domanda = testo.trim();
    if (inCorso || quotaEsaurita || domanda.length < LUNGHEZZA_MINIMA_DOMANDA) return;

    const cronologia: ScambioPrecedente[] = messaggi
      .filter((m) => m.stato === "completo" && m.fine)
      .slice(-SCAMBI_PRECEDENTI_MASSIMI)
      .map((m) => ({
        domanda: m.domanda,
        risposta: testoSemplice(m.fine?.risposta ?? []).slice(0, LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA),
      }));

    const id = `m${++contatore.current}`;
    setMessaggi((lista) => [
      ...lista,
      { id, domanda, stato: "in_attesa", testo: "", fine: null, errore: null, serveAccesso: false },
    ]);
    setBozza("");
    setInCorso(true);
    setAnnuncio("Bussola sta cercando nelle fonti ufficiali…");

    const controllo = new AbortController();
    interruzione.current = controllo;
    const esito = await chiediABussola({
      domanda,
      cronologia,
      segnale: controllo.signal,
      suTesto: (pezzo) => aggiorna(id, (m) => ({ stato: "in_scrittura", testo: m.testo + pezzo })),
    });
    if (esito.tipo === "interrotta") return;

    if (esito.tipo === "fine") {
      aggiorna(id, { stato: "completo", fine: esito.evento });
      if (esito.evento.quota) setQuota(esito.evento.quota);
      setAnnuncio(
        esito.evento.fonti.length > 0
          ? `Risposta pronta, con ${esito.evento.fonti.length === 1 ? "1 fonte" : `${esito.evento.fonti.length} fonti`}.`
          : "Risposta pronta.",
      );
    } else {
      aggiorna(id, { stato: "errore", errore: esito.messaggio, serveAccesso: esito.stato === 401 });
      if (esito.quota) setQuota(esito.quota);
      setAnnuncio(esito.messaggio);
    }
    setInCorso(false);
    interruzione.current = null;
    // Il campo era disattivato durante la risposta: se il focus si è perso, torna lì.
    requestAnimationFrame(() => {
      if (!document.activeElement || document.activeElement === document.body) campo.current?.focus();
    });
  }

  function alloInvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void invia(bozza);
  }

  function tasti(evento: KeyboardEvent<HTMLTextAreaElement>) {
    // Invio manda la domanda, Maiusc+Invio va a capo.
    if (evento.key === "Enter" && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault();
      void invia(bozza);
    }
  }

  return (
    <div className="mt-6">
      <TestoQuota quota={quota} />

      {messaggi.length === 0 ? (
        <section aria-labelledby="titolo-esempi" className="mt-6">
          <h2 id="titolo-esempi" className="text-sm font-semibold text-muted">
            Prova a chiedere
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {esempi.map((esempio) => (
              <li key={esempio}>
                <button
                  type="button"
                  onClick={() => void invia(esempio)}
                  disabled={inCorso || quotaEsaurita}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-sm hover:border-brand disabled:opacity-60"
                >
                  {esempio}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="titolo-conversazione" className="mt-6">
          <h2 id="titolo-conversazione" className="sr-only">
            Conversazione
          </h2>
          <ol className="space-y-6">
            {messaggi.map((m, i) => (
              <li key={m.id} ref={i === messaggi.length - 1 ? ultimo : undefined} className="scroll-mt-24">
                <Scambio messaggio={m} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {annuncio}
      </p>

      <form onSubmit={alloInvio} className="mt-8 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <label htmlFor="domanda" className="text-sm font-medium">
          La tua domanda
        </label>
        <textarea
          id="domanda"
          ref={campo}
          name="domanda"
          rows={2}
          required
          minLength={LUNGHEZZA_MINIMA_DOMANDA}
          maxLength={LUNGHEZZA_MASSIMA_DOMANDA}
          value={bozza}
          onChange={(e) => setBozza(e.target.value)}
          onKeyDown={tasti}
          disabled={inCorso || quotaEsaurita}
          aria-describedby="aiuto-domanda"
          placeholder="Per esempio: devo iscrivermi al registro di commercio?"
          className="mt-1 block w-full resize-y rounded-lg border border-border bg-background px-3 py-2 disabled:opacity-60"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p id="aiuto-domanda" className="text-xs text-muted">
            Invio per mandare, Maiusc+Invio per andare a capo.
          </p>
          <button
            type="submit"
            disabled={inCorso || quotaEsaurita || bozza.trim().length < LUNGHEZZA_MINIMA_DOMANDA}
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong disabled:opacity-60 dark:text-background"
          >
            {inCorso ? "Sto rispondendo…" : "Chiedi"}
          </button>
        </div>
      </form>
      <p className="mt-3 text-xs text-muted">
        Bussola può sbagliare: apri sempre la fonte per controllare. Per il tuo caso personale rivolgiti a un
        fiduciario autorizzato.
      </p>
    </div>
  );
}

function Scambio({ messaggio: m }: { messaggio: Messaggio }) {
  return (
    <>
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-soft px-4 py-2">
          <span className="sr-only">Tu: </span>
          {m.domanda}
        </p>
      </div>
      <div
        className="mt-3 rounded-2xl rounded-bl-sm border border-border bg-card p-4"
        aria-busy={m.stato === "in_attesa" || m.stato === "in_scrittura"}
      >
        <p className="sr-only">Bussola:</p>
        {m.stato === "in_attesa" ? (
          <p className="text-muted motion-safe:animate-pulse">Cerco nelle fonti ufficiali…</p>
        ) : null}
        {m.stato === "in_scrittura" ? (
          <>
            <TestoRisposta blocchi={[{ testo: m.testo, citazioni: [] }]} idMessaggio={m.id} />
            <p className="mt-2 text-xs text-muted motion-safe:animate-pulse">Sto scrivendo…</p>
          </>
        ) : null}
        {m.stato === "completo" && m.fine ? (
          <>
            <TestoRisposta blocchi={m.fine.risposta} idMessaggio={m.id} />
            {m.fine.avviso ? <p className="mt-3 text-sm text-accent">{m.fine.avviso}</p> : null}
            <ElencoFonti fonti={m.fine.fonti} idMessaggio={m.id} />
          </>
        ) : null}
        {m.stato === "errore" ? (
          <div>
            {m.testo ? (
              <div className="mb-3 opacity-70">
                <TestoRisposta blocchi={[{ testo: m.testo, citazioni: [] }]} idMessaggio={m.id} />
              </div>
            ) : null}
            <p className="text-danger">{m.errore}</p>
            {m.serveAccesso ? (
              <Link href="/accedi?next=/chat" className="mt-2 inline-block font-medium text-brand underline">
                Accedi di nuovo
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
