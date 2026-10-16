"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type UIEvent } from "react";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { chiediABleo } from "@/lib/chat/cliente";
import type { ConversazioneBreve, RispostaChat } from "@/lib/chat/conversazioni";
import { LUNGHEZZA_MINIMA_DOMANDA } from "@/lib/chat/limiti";
import { MESSAGGI } from "@/lib/chat/messaggi";
import type { QuotaPubblica } from "@/lib/chat/tipi";
import { campoDomanda, Compositore } from "./compositore";
import { ElencoChat } from "./elenco-chat";
import { IconaChiudi, IconaGiu, IconaMenu, IconaNuova } from "./icone";
import { TestoQuota } from "./testo-quota";
import { cronologiaDaTurni, turniDaMessaggi, type AzioneErrore, type Turno } from "./turni";
import { VistaTurno } from "./turno";

type Caricamento = { stato: "pronta" } | { stato: "in_corso" } | { stato: "errore"; messaggio: string };

const urlChat = (id: string | null) => (id ? `/chat?c=${encodeURIComponent(id)}` : "/chat");

/** Solo da md in su il campo prende il fuoco da solo: su telefono aprirebbe la tastiera. */
const schermoGrande = () => window.matchMedia("(min-width: 768px)").matches;

/**
 * «Chiedi a Bleo» come ChatGPT: le chat salvate a sinistra (in un cassetto
 * su telefono), la conversazione al centro e il campo della domanda in basso.
 * La chat aperta sta nell'indirizzo (/chat?c=<id>), così il pulsante
 * «indietro» del browser funziona e una chat si può riaprire.
 */
export function Chat({
  quotaIniziale,
  esempi,
  domandaIniziale = "",
  elencoIniziale,
  linkAlbo,
}: {
  quotaIniziale: QuotaPubblica | null;
  esempi: readonly string[];
  domandaIniziale?: string;
  elencoIniziale: ConversazioneBreve[];
  /** Albo dei fiduciari autorizzati (fonte ufficiale). */
  linkAlbo: string;
}) {
  const cUrl = useSearchParams().get("c");
  const [elenco, setElenco] = useState(elencoIniziale);
  const [attiva, setAttiva] = useState<{ id: string; titolo: string } | null>(null);
  const [turni, setTurni] = useState<Turno[]>([]);
  const [caricamento, setCaricamento] = useState<Caricamento>(() => (cUrl ? { stato: "in_corso" } : { stato: "pronta" }));
  const [bozza, setBozza] = useState(domandaIniziale);
  const [inCorso, setInCorso] = useState(false);
  const [quota, setQuota] = useState(quotaIniziale);
  const [annuncio, setAnnuncio] = useState("");
  const [avvisoElenco, setAvvisoElenco] = useState("");
  const [cassetto, setCassetto] = useState(false);
  const [inFondo, setInFondo] = useState(true);

  // La chat aperta (anche prima che React aggiorni lo stato) e una «sessione»
  // che cambia a ogni cambio di chat: le risposte in arrivo per una chat
  // lasciata non toccano quella nuova.
  const idAttivo = useRef<string | null>(null);
  const sessione = useRef(0);
  const interruzione = useRef<AbortController | null>(null);
  const lettura = useRef<AbortController | null>(null);
  const scorrimento = useRef<HTMLDivElement>(null);
  const seguire = useRef(true);
  const finestraCassetto = useRef<HTMLDialogElement>(null);
  const contatore = useRef(0);

  const quotaEsaurita = quota?.rimanenti === 0;
  const vuota = attiva === null && turni.length === 0 && caricamento.stato === "pronta";

  useEffect(
    () => () => {
      interruzione.current?.abort();
      lettura.current?.abort();
    },
    [],
  );

  // Indirizzo cambiato da fuori (indietro/avanti, link): si apre quella chat.
  const seguiIndirizzo = useEffectEvent((id: string | null) => {
    if (id !== idAttivo.current) void apri(id, false);
  });
  useEffect(() => seguiIndirizzo(cUrl), [cUrl]);

  // Sul computer il campo è pronto per scrivere.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("c") && schermoGrande()) campoDomanda()?.focus();
  }, []);

  // Durante la risposta si scende con il testo, a meno che chi legge sia risalito.
  useLayoutEffect(() => {
    const el = scorrimento.current;
    if (el && seguire.current) el.scrollTop = el.scrollHeight;
  }, [turni]);

  // Cassetto delle chat su telefono: finestra modale (Esc chiude, il resto è inerte).
  useEffect(() => {
    const d = finestraCassetto.current;
    if (!d) return;
    if (cassetto && !d.open) d.showModal();
    if (!cassetto && d.open) d.close();
  }, [cassetto]);
  useEffect(() => {
    const grande = window.matchMedia("(min-width: 768px)");
    const chiudi = () => {
      if (grande.matches) setCassetto(false);
    };
    grande.addEventListener("change", chiudi);
    return () => grande.removeEventListener("change", chiudi);
  }, []);

  function scorri(evento: UIEvent<HTMLDivElement>) {
    const el = evento.currentTarget;
    const vicino = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    seguire.current = vicino;
    setInFondo(vicino);
  }

  function scendi() {
    const el = scorrimento.current;
    if (!el) return;
    seguire.current = true;
    const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: ridotto ? "auto" : "smooth" });
  }

  /** Apre una chat salvata (o una nuova con id null). */
  async function apri(id: string | null, aggiornaIndirizzo: boolean) {
    interruzione.current?.abort();
    lettura.current?.abort();
    sessione.current += 1;
    const s = sessione.current;
    idAttivo.current = id;
    setCassetto(false);
    setInCorso(false);
    setAvvisoElenco("");
    seguire.current = true;
    setInFondo(true);
    if (aggiornaIndirizzo && `${window.location.pathname}${window.location.search}` !== urlChat(id)) {
      window.history.pushState(null, "", urlChat(id));
    }

    if (!id) {
      setAttiva(null);
      setTurni([]);
      setCaricamento({ stato: "pronta" });
      setAnnuncio("Nuova chat.");
      requestAnimationFrame(() => {
        if (schermoGrande()) campoDomanda()?.focus();
      });
      return;
    }

    setAttiva({ id, titolo: elenco.find((c) => c.id === id)?.titolo ?? "" });
    setTurni([]);
    setCaricamento({ stato: "in_corso" });
    const controllo = new AbortController();
    lettura.current = controllo;
    let risposta: Response;
    try {
      risposta = await fetch(`/api/chat/conversazioni/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
        signal: controllo.signal,
      });
    } catch {
      if (s === sessione.current) setCaricamento({ stato: "errore", messaggio: MESSAGGI.rete });
      return;
    }
    const corpo = (await risposta.json().catch(() => null)) as (RispostaChat & { messaggio?: string }) | null;
    if (s !== sessione.current) return;
    if (!risposta.ok || !corpo?.conversazione) {
      const messaggio = typeof corpo?.messaggio === "string" ? corpo.messaggio : MESSAGGI.chatNonDisponibili;
      setCaricamento({ stato: "errore", messaggio });
      setAnnuncio(messaggio);
      if (risposta.status === 404) setElenco((l) => l.filter((c) => c.id !== id));
      return;
    }
    setAttiva({ id: corpo.conversazione.id, titolo: corpo.conversazione.titolo });
    setTurni(turniDaMessaggi(corpo.messaggi));
    setCaricamento({ stato: "pronta" });
    setAnnuncio(`Chat «${corpo.conversazione.titolo}» aperta.`);
  }

  const aggiorna = (chiave: string, modifica: Partial<Turno> | ((t: Turno) => Partial<Turno>)) =>
    setTurni((lista) =>
      lista.map((t) => (t.chiave === chiave ? { ...t, ...(typeof modifica === "function" ? modifica(t) : modifica) } : t)),
    );

  /** Il server ha salvato la domanda in una chat: in cima all'elenco e, se è nuova, nell'indirizzo. */
  function chatSalvata(chat: { id: string; titolo: string }, s: number) {
    const ora = new Date().toISOString();
    setElenco((l) => [{ id: chat.id, titolo: chat.titolo, aggiornataIl: ora }, ...l.filter((c) => c.id !== chat.id)]);
    if (s !== sessione.current) return;
    if (idAttivo.current !== chat.id) {
      idAttivo.current = chat.id;
      window.history.replaceState(null, "", urlChat(chat.id));
    }
    setAttiva({ id: chat.id, titolo: chat.titolo });
  }

  async function invia(testo: string, rifai?: Turno) {
    const domanda = testo.trim();
    if (inCorso || quotaEsaurita || domanda.length < LUNGHEZZA_MINIMA_DOMANDA) return;

    const s = sessione.current;
    const idChat = idAttivo.current;
    const precedenti = rifai ? turni.filter((t) => t.chiave !== rifai.chiave) : turni;
    // Con una chat salvata il contesto lo prende il server; senza, si manda come prima.
    const cronologia = idChat ? [] : cronologiaDaTurni(precedenti);
    const chiave = `n${++contatore.current}`;
    const campoAttivo = document.activeElement === campoDomanda();

    setTurni([
      ...precedenti,
      { chiave, domanda, stato: "in_attesa", testo: "", fine: null, errore: null, azione: "nessuna" },
    ]);
    if (!rifai) setBozza("");
    setInCorso(true);
    seguire.current = true;
    setAnnuncio("Bleo sta cercando nelle fonti ufficiali…");
    if (campoAttivo) requestAnimationFrame(() => campoDomanda()?.focus({ preventScroll: true }));

    const controllo = new AbortController();
    interruzione.current = controllo;
    const esito = await chiediABleo({
      domanda,
      cronologia,
      conversazioneId: idChat,
      segnale: controllo.signal,
      suTesto: (pezzo) => {
        if (s === sessione.current) aggiorna(chiave, (t) => ({ stato: "in_scrittura", testo: t.testo + pezzo }));
      },
      suConversazione: (chat) => chatSalvata(chat, s),
    });
    if (interruzione.current === controllo) interruzione.current = null;
    // Chat cambiata nel frattempo: questa risposta non si mostra più.
    if (s !== sessione.current) return;
    setInCorso(false);

    if (esito.tipo === "interrotta") {
      aggiorna(chiave, { stato: "interrotta", azione: "riprova" });
      setAnnuncio("Risposta fermata.");
      return;
    }
    if (esito.tipo === "fine") {
      const { risposta, fonti, senza_risposta, avviso } = esito.evento;
      aggiorna(chiave, {
        stato: "completo",
        fine: { risposta, fonti, senzaRisposta: senza_risposta, avviso: avviso ?? null },
      });
      if (esito.evento.quota) setQuota(esito.evento.quota);
      setAnnuncio(
        fonti.length > 0 ? `Risposta pronta, con ${fonti.length === 1 ? "1 fonte" : `${fonti.length} fonti`}.` : "Risposta pronta.",
      );
      return;
    }
    const azione: AzioneErrore =
      esito.stato === 401 ? "accedi" : esito.stato === 429 || esito.stato === 404 ? "nessuna" : "riprova";
    aggiorna(chiave, { stato: "errore", errore: esito.messaggio, azione });
    if (esito.quota) setQuota(esito.quota);
    setAnnuncio(esito.messaggio);
  }

  function ferma() {
    interruzione.current?.abort();
  }

  async function rinomina(id: string, titolo: string) {
    const vecchio = elenco.find((c) => c.id === id)?.titolo;
    const metti = (t: string) => {
      setElenco((l) => l.map((c) => (c.id === id ? { ...c, titolo: t } : c)));
      if (idAttivo.current === id) setAttiva((a) => (a && a.id === id ? { ...a, titolo: t } : a));
    };
    setAvvisoElenco("");
    metti(titolo);
    const risposta = await fetch(`/api/chat/conversazioni/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ titolo }),
    }).catch(() => null);
    const corpo = (await risposta?.json().catch(() => null)) as { conversazione?: ConversazioneBreve; messaggio?: string } | null;
    if (risposta?.ok && corpo?.conversazione) {
      metti(corpo.conversazione.titolo);
      setAnnuncio("Chat rinominata.");
      return;
    }
    if (vecchio !== undefined) metti(vecchio);
    setAvvisoElenco(corpo?.messaggio ?? "Non sono riuscito a rinominare la chat. Riprova.");
  }

  async function elimina(id: string) {
    setAvvisoElenco("");
    const risposta = await fetch(`/api/chat/conversazioni/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(
      () => null,
    );
    if (risposta && (risposta.ok || risposta.status === 404)) {
      setElenco((l) => l.filter((c) => c.id !== id));
      if (idAttivo.current === id) void apri(null, true);
      setAnnuncio("Chat eliminata.");
      return;
    }
    const corpo = (await risposta?.json().catch(() => null)) as { messaggio?: string } | null;
    setAvvisoElenco(corpo?.messaggio ?? "Non sono riuscito a eliminare la chat. Riprova.");
  }

  const barra = (
    <BarraChat
      elenco={elenco}
      idAttivo={attiva?.id ?? null}
      avviso={avvisoElenco}
      onNuova={() => void apri(null, true)}
      onApri={(id) => void apri(id, true)}
      onRinomina={(id, titolo) => void rinomina(id, titolo)}
      onElimina={(id) => void elimina(id)}
    />
  );

  const compositore = (
    <Compositore
      bozza={bozza}
      onBozza={setBozza}
      onInvia={() => void invia(bozza)}
      onFerma={ferma}
      inCorso={inCorso}
      bloccato={quotaEsaurita}
      grande={vuota}
    />
  );

  const nota = (
    <div id="nota-chat" className="mt-2 text-center text-xs text-muted">
      <p>Bleo dà informazioni generali con fonti ufficiali, non consulenza.</p>
      <TestoQuota quota={quota} className="text-xs" />
    </div>
  );

  return (
    <div className="pagina-chat flex min-h-0 flex-1 border-t border-border">
      <h1 className="sr-only">Chiedi a Bleo</h1>

      <aside aria-label="Le tue chat" className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        {barra}
      </aside>

      <dialog
        ref={finestraCassetto}
        aria-label="Le tue chat"
        onCancel={(e) => {
          e.preventDefault();
          setCassetto(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setCassetto(false);
        }}
        className="m-0 h-dvh max-h-none w-[85vw] max-w-80 border-r border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      >
        {cassetto ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border py-2 pl-4 pr-2">
              <p className="font-semibold" style={{ fontFamily: "var(--font-titoli)" }}>
                Le tue chat
              </p>
              <button
                type="button"
                onClick={() => setCassetto(false)}
                aria-label="Chiudi l'elenco delle chat"
                className="inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-brand-soft hover:text-foreground"
              >
                <IconaChiudi />
              </button>
            </div>
            {barra}
          </div>
        ) : null}
      </dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Su telefono: ☰ per l'elenco, il titolo, ✎ per una chat nuova. */}
        <div className="flex items-center gap-1 border-b border-border px-1.5 py-1 md:hidden">
          <button
            type="button"
            onClick={() => setCassetto(true)}
            aria-label="Apri l'elenco delle chat"
            aria-haspopup="dialog"
            aria-expanded={cassetto}
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-brand-soft"
          >
            <IconaMenu />
          </button>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold">
            {attiva ? attiva.titolo || "Chat" : "Nuova chat"}
          </p>
          <button
            type="button"
            onClick={() => void apri(null, true)}
            aria-label="Nuova chat"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-brand-soft"
          >
            <IconaNuova />
          </button>
        </div>

        <div ref={scorrimento} onScroll={scorri} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {vuota ? (
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-8">
              <ImmagineMascotte nome="coppia" priority sizes="112px" className="h-auto w-20 sm:w-24" />
              <h2 className="mt-3 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Cosa vuoi sapere?</h2>
              <p className="mt-2 max-w-md text-center text-muted">
                Chiedimi come avviare la tua attività: rispondo con le fonti ufficiali e ti mostro sempre il link.
              </p>
              <div className="mt-6 w-full">
                {compositore}
                {nota}
              </div>
              <section aria-labelledby="titolo-esempi" className="mt-6 w-full">
                <h3 id="titolo-esempi" className="sr-only">
                  Prova a chiedere
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {esempi.slice(0, 4).map((esempio) => (
                    <li key={esempio} className="flex">
                      <button
                        type="button"
                        onClick={() => void invia(esempio)}
                        disabled={inCorso || quotaEsaurita}
                        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm leading-snug text-muted transition-colors hover:border-brand hover:text-foreground disabled:opacity-60"
                      >
                        {esempio}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="mt-6 max-w-xl text-center text-xs leading-relaxed text-muted">
                Stai parlando con un&apos;intelligenza artificiale (Claude, di Anthropic), non con un fiduciario. Le
                tue chat restano salvate nel tuo account per riaprirle: puoi eliminarle quando vuoi e si cancellano
                da sole dopo 12 mesi senza nuove domande. Non le usiamo per addestrare modelli. Per il tuo caso
                personale trovi un professionista nell&apos;
                <a href={linkAlbo} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  albo dei fiduciari autorizzati
                </a>
                . Dettagli nell&apos;
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                  informativa privacy
                </Link>
                .
              </p>
            </div>
          ) : caricamento.stato === "in_corso" ? (
            <Scheletro />
          ) : caricamento.stato === "errore" ? (
            <div role="alert" className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-4 py-8 text-center">
              <ImmagineMascotte nome="pensa" sizes="96px" className="h-auto w-20" />
              <p className="mt-4">{caricamento.messaggio}</p>
              <button
                type="button"
                onClick={() => void apri(null, true)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 font-semibold text-background hover:opacity-85"
              >
                <IconaNuova />
                Nuova chat
              </button>
            </div>
          ) : (
            <section aria-label="Conversazione" className="mx-auto w-full max-w-3xl px-4 pb-6 pt-6">
              <ol className="space-y-10">
                {turni.map((t) => (
                  <li key={t.chiave}>
                    <VistaTurno turno={t} onRiprova={(turno) => void invia(turno.domanda, turno)} idAccesso={urlChat(attiva?.id ?? null)} />
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {vuota ? null : (
          <div className="relative mx-auto w-full max-w-3xl px-3 pb-3 pt-1 sm:px-4">
            {!inFondo && turni.length > 0 ? (
              <button
                type="button"
                onClick={scendi}
                aria-label="Scendi all'ultimo messaggio"
                className="absolute -top-12 left-1/2 inline-flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:border-brand"
              >
                <IconaGiu />
              </button>
            ) : null}
            {caricamento.stato === "pronta" ? compositore : null}
            {caricamento.stato === "pronta" ? nota : null}
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {annuncio}
      </p>
    </div>
  );
}

/** Barra delle chat: «Nuova chat», l'elenco per data e una nota sulla conservazione. */
function BarraChat({
  elenco,
  idAttivo,
  avviso,
  onNuova,
  onApri,
  onRinomina,
  onElimina,
}: {
  elenco: ConversazioneBreve[];
  idAttivo: string | null;
  avviso: string;
  onNuova: () => void;
  onApri: (id: string) => void;
  onRinomina: (id: string, titolo: string) => void;
  onElimina: (id: string) => void;
}) {
  return (
    <>
      <div className="p-3">
        <button
          type="button"
          onClick={onNuova}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold shadow-sm hover:border-brand"
        >
          <IconaNuova />
          Nuova chat
        </button>
      </div>
      {avviso ? (
        <p role="alert" className="mx-3 mb-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {avviso}
        </p>
      ) : null}
      <nav aria-label="Chat salvate" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ElencoChat elenco={elenco} idAttivo={idAttivo} onApri={onApri} onRinomina={onRinomina} onElimina={onElimina} />
      </nav>
      <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted">
        Le chat si cancellano da sole dopo 12 mesi senza nuove domande.{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy
        </Link>
      </p>
    </>
  );
}

function Scheletro() {
  return (
    <div aria-busy="true" aria-label="Carico la chat…" className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-6">
      {[0, 1].map((i) => (
        <div key={i} className="motion-safe:animate-pulse">
          <div className="ml-auto h-10 w-2/3 rounded-3xl bg-brand-soft" />
          <div className="mt-5 flex gap-3">
            <div className="size-8 shrink-0 rounded-full bg-border" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-full rounded bg-border" />
              <div className="h-3.5 w-11/12 rounded bg-border" />
              <div className="h-3.5 w-3/5 rounded bg-border" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
