"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { raggruppaChat, TITOLO_MASSIMO, type ConversazioneBreve } from "@/lib/chat/conversazioni";
import { IconaCestino, IconaMatita, IconaPuntini } from "./icone";
import { dataLocale } from "./turni";

const nessunaIscrizione = () => () => {};

/**
 * Le chat salvate, raggruppate per data come in ChatGPT (Oggi, Ieri, …).
 * Ogni chat ha un menu «…» per rinominarla o eliminarla. Serve sia nella
 * barra laterale (da md in su) sia nel cassetto su telefono.
 */
export function ElencoChat({
  elenco,
  idAttivo,
  onApri,
  onRinomina,
  onElimina,
}: {
  elenco: ConversazioneBreve[];
  idAttivo: string | null;
  onApri: (id: string) => void;
  onRinomina: (id: string, titolo: string) => void;
  onElimina: (id: string) => void;
}) {
  // Il giorno di chi guarda si conosce solo nel browser: sul server un elenco unico.
  const oggi = useSyncExternalStore(nessunaIscrizione, () => dataLocale(new Date()), () => null);
  const [inModifica, setInModifica] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [daEliminare, setDaEliminare] = useState<ConversazioneBreve | null>(null);

  if (elenco.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted">
        Qui trovi le tue chat. Fai la prima domanda: la chat si salva da sola.
      </p>
    );
  }

  const gruppi = oggi ? raggruppaChat(elenco, oggi) : [{ gruppo: "Recenti", chat: elenco }];
  const chatMenu = menu ? elenco.find((c) => c.id === menu.id) : undefined;

  return (
    <>
      {gruppi.map((g) => (
        <section key={g.gruppo} aria-label={g.gruppo} className="mb-4">
          <h3 className="px-3 pb-1 pt-2 text-xs font-semibold text-muted">{g.gruppo}</h3>
          <ul className="space-y-0.5">
            {g.chat.map((c) => (
              <li key={c.id} className="group relative">
                {inModifica === c.id ? (
                  <CampoTitolo
                    titolo={c.titolo}
                    onFine={(nuovo) => {
                      setInModifica(null);
                      if (nuovo && nuovo !== c.titolo) onRinomina(c.id, nuovo);
                    }}
                  />
                ) : (
                  <>
                    <a
                      href={`/chat?c=${c.id}`}
                      aria-current={c.id === idAttivo ? "page" : undefined}
                      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                        // Clic normale: si apre qui senza ricaricare; con Ctrl/⌘ in una nuova scheda.
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        onApri(c.id);
                      }}
                      className="block min-h-10 truncate rounded-xl py-2.5 pl-3 pr-10 text-sm hover:bg-brand-soft/70 aria-[current=page]:bg-brand-soft aria-[current=page]:font-semibold"
                    >
                      {c.titolo}
                    </a>
                    <button
                      type="button"
                      aria-label={`Opzioni della chat «${c.titolo}»`}
                      aria-haspopup="menu"
                      aria-expanded={menu?.id === c.id}
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setMenu(menu?.id === c.id ? null : { id: c.id, x: r.right, y: r.bottom });
                      }}
                      className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted opacity-0 hover:bg-card hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100 group-has-[[aria-current=page]]:opacity-100 [@media(hover:none)]:opacity-100"
                    >
                      <IconaPuntini />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {menu && chatMenu ? (
        <MenuChat
          x={menu.x}
          y={menu.y}
          onChiudi={() => setMenu(null)}
          onRinomina={() => {
            setMenu(null);
            setInModifica(chatMenu.id);
          }}
          onElimina={() => {
            setMenu(null);
            setDaEliminare(chatMenu);
          }}
        />
      ) : null}

      <ConfermaElimina
        chat={daEliminare}
        onAnnulla={() => setDaEliminare(null)}
        onConferma={(id) => {
          setDaEliminare(null);
          onElimina(id);
        }}
      />
    </>
  );
}

/** Rinomina sul posto: Invio salva, Esc annulla, uscendo dal campo si salva. */
function CampoTitolo({ titolo, onFine }: { titolo: string; onFine: (nuovo: string | null) => void }) {
  const [valore, setValore] = useState(titolo);
  const finito = useRef(false);
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    campo.current?.focus();
    campo.current?.select();
  }, []);

  const chiudi = (nuovo: string | null) => {
    if (finito.current) return;
    finito.current = true;
    onFine(nuovo === null ? null : nuovo.replace(/\s+/g, " ").trim() || null);
  };

  return (
    <input
      ref={campo}
      value={valore}
      maxLength={TITOLO_MASSIMO}
      aria-label="Nuovo titolo della chat"
      onChange={(e) => setValore(e.target.value)}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          chiudi(valore);
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          chiudi(null);
        }
      }}
      onBlur={() => chiudi(valore)}
      className="block min-h-10 w-full rounded-xl border border-brand bg-card px-3 py-2 text-sm focus-visible:outline-none"
    />
  );
}

/** Menu «…» di una chat, sotto il pulsante. Esc o un clic fuori lo chiudono; frecce per spostarsi. */
function MenuChat({
  x,
  y,
  onChiudi,
  onRinomina,
  onElimina,
}: {
  x: number;
  y: number;
  onChiudi: () => void;
  onRinomina: () => void;
  onElimina: () => void;
}) {
  const contenitore = useRef<HTMLDivElement>(null);
  const chiudi = useRef(onChiudi);
  useEffect(() => {
    chiudi.current = onChiudi;
  }, [onChiudi]);

  useEffect(() => {
    const voci = () => [...(contenitore.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    voci()[0]?.focus();
    const fuori = (e: PointerEvent) => {
      if (!contenitore.current?.contains(e.target as Node)) chiudi.current();
    };
    const altrove = () => chiudi.current();
    // Solo se scorre l'elenco che contiene il menu (non i messaggi che arrivano).
    const scorre = (e: Event) => {
      const menu = contenitore.current;
      if (menu && e.target instanceof Node && e.target !== menu && e.target.contains(menu)) chiudi.current();
    };
    document.addEventListener("pointerdown", fuori, true);
    window.addEventListener("resize", altrove);
    document.addEventListener("scroll", scorre, true);
    return () => {
      document.removeEventListener("pointerdown", fuori, true);
      window.removeEventListener("resize", altrove);
      document.removeEventListener("scroll", scorre, true);
    };
  }, []);

  function tasti(e: KeyboardEvent<HTMLDivElement>) {
    const voci = [...(contenitore.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    const i = voci.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      onChiudi();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      voci[(i + 1) % voci.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      voci[(i - 1 + voci.length) % voci.length]?.focus();
    }
  }

  // Il menu resta dentro lo schermo: allineato a destra del pulsante.
  const larghezza = 176;
  const left = Math.max(8, Math.min(x - larghezza, (typeof window === "undefined" ? 1000 : window.innerWidth) - larghezza - 8));
  const top = Math.min(y + 4, (typeof window === "undefined" ? 1000 : window.innerHeight) - 104);

  return (
    <div
      ref={contenitore}
      role="menu"
      aria-label="Opzioni della chat"
      onKeyDown={tasti}
      style={{ left, top, width: larghezza }}
      className="fixed z-50 rounded-xl border border-border bg-card p-1 shadow-lg"
    >
      <button
        type="button"
        role="menuitem"
        onClick={onRinomina}
        className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-brand-soft focus-visible:bg-brand-soft focus-visible:outline-none"
      >
        <IconaMatita />
        Rinomina
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onElimina}
        className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-danger hover:bg-danger/10 focus-visible:bg-danger/10 focus-visible:outline-none"
      >
        <IconaCestino />
        Elimina
      </button>
    </div>
  );
}

/** Conferma prima di eliminare (finestra modale: Esc annulla). */
function ConfermaElimina({
  chat,
  onAnnulla,
  onConferma,
}: {
  chat: ConversazioneBreve | null;
  onAnnulla: () => void;
  onConferma: (id: string) => void;
}) {
  const finestra = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = finestra.current;
    if (!d) return;
    if (chat && !d.open) d.showModal();
    if (!chat && d.open) d.close();
  }, [chat]);

  return (
    <dialog
      ref={finestra}
      aria-labelledby="titolo-elimina"
      onCancel={(e) => {
        e.preventDefault();
        onAnnulla();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onAnnulla();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      {chat ? (
        <div className="p-5">
          <h2 id="titolo-elimina" className="text-lg font-bold">
            Eliminare la chat?
          </h2>
          <p className="mt-2 text-muted">
            «{chat.titolo}» e tutte le sue domande e risposte vengono cancellate per sempre.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={onAnnulla}
              className="min-h-11 rounded-full border border-border px-5 font-semibold hover:border-brand"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={() => onConferma(chat.id)}
              className="min-h-11 rounded-full bg-danger px-5 font-semibold text-background hover:opacity-90"
            >
              Elimina
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
