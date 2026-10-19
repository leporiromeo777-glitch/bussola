"use client";

import Link from "next/link";
import { useState } from "react";
import { documentiDaImportare, emittenteCompilato } from "@/lib/strumenti/account";
import type { ArchivioAccount, StatoArchivio } from "@/lib/strumenti/archivio-account";
import { NOMI_TIPO, type Documento, type Emittente, type TipoDocumento } from "@/lib/strumenti/documenti";
import { IconaAvviso, IconaDispositivo, IconaSpunta } from "../icone";
import { nuovoId } from "../id";
import { classeLink, classePulsantePiccolo, classePulsantePrincipale, classePulsanteSecondario } from "../ui";

/*
 * Pezzi della pagina preventivo e fattura quando c'è l'accesso: i documenti
 * stanno nell'account (si vedono anche nell'app), con lo stato del
 * salvataggio e l'invito a copiare quelli rimasti nel browser.
 */

export function CaricamentoAccount() {
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-6 text-muted" role="status">
      Sto aprendo i preventivi e le fatture del tuo account…
      <noscript>
        <p className="mt-2 text-foreground">Per usare gli strumenti serve JavaScript attivo nel browser.</p>
      </noscript>
    </div>
  );
}

export function ErroreAccount({
  stato,
  tipo,
  onRiprova,
  onSoloBrowser,
}: {
  stato: StatoArchivio;
  tipo: TipoDocumento;
  onRiprova: () => void;
  /** Lavora nel browser, come senza accesso. */
  onSoloBrowser: () => void;
}) {
  const scaduto = stato.errore?.stato === 401;
  return (
    <div role="alert" className="mt-8 rounded-xl border border-danger/40 bg-card p-5">
      <p className="font-semibold">Non riesco ad aprire i preventivi e le fatture del tuo account.</p>
      <p className="mt-1 text-muted">{scaduto ? "L'accesso è scaduto: accedi di nuovo." : stato.errore?.messaggio}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {scaduto ? (
          <Link href={`/accedi?next=/strumenti/${tipo}`} className={classePulsantePrincipale}>
            Accedi di nuovo
          </Link>
        ) : (
          <button type="button" className={classePulsanteSecondario} onClick={onRiprova}>
            Riprova
          </button>
        )}
        <button type="button" className={classePulsanteSecondario} onClick={onSoloBrowser}>
          Lavora in questo browser
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">
        In questo browser i documenti restano solo qui: quando l&apos;account torna a rispondere puoi copiarli
        nell&apos;account.
      </p>
    </div>
  );
}

/** «I tuoi documenti sono nel tuo account», con lo stato dell'ultimo salvataggio. */
export function NotaAccount({ stato, onRiprova }: { stato: StatoArchivio; onRiprova: () => void }) {
  const errore = stato.salvataggio === "errore" ? stato.erroreSalvataggio : null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-brand-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
      <p className="flex items-start gap-2">
        <IconaDispositivo className="mt-0.5 size-5 shrink-0 text-brand" />
        <span>
          <strong className="font-semibold">Salvati nel tuo account.</strong> Li ritrovi su ogni dispositivo in cui accedi,
          anche nell&apos;app Bleo sul telefono.
        </span>
      </p>
      <div className="shrink-0" role="status" aria-live="polite">
        {errore ? (
          <span className="flex flex-col items-start gap-2 font-medium text-danger sm:items-end">
            <span className="flex items-start gap-1.5">
              <IconaAvviso className="mt-0.5 size-4 shrink-0" />
              <span>
                {errore.stato === 401 ? "Accesso scaduto: le ultime modifiche non sono salvate." : `Non salvato: ${errore.messaggio}`}
              </span>
            </span>
            {errore.stato === 401 ? (
              <Link href="/accedi" className={classeLink}>
                Accedi di nuovo
              </Link>
            ) : (
              <button type="button" className={classePulsantePiccolo} onClick={onRiprova}>
                Riprova
              </button>
            )}
          </span>
        ) : stato.salvataggio === "salvato" ? (
          <span className="flex items-center gap-1.5 text-success">
            <IconaSpunta className="size-4" />
            Tutto salvato
          </span>
        ) : (
          <span className="text-muted">Salvo…</span>
        )}
      </div>
    </div>
  );
}

/** «1 fattura», «2 preventivi e 3 fatture». */
function descrivi(documenti: readonly Pick<Documento, "tipo">[]): string {
  const parti = (["preventivo", "fattura"] as const).flatMap((tipo) => {
    const n = documenti.filter((d) => d.tipo === tipo).length;
    if (n === 0) return [];
    return [`${n} ${n === 1 ? NOMI_TIPO[tipo].minuscolo : NOMI_TIPO[tipo].plurale}`];
  });
  return parti.join(" e ");
}

/**
 * Prima volta con l'accesso: i preventivi e le fatture rimasti nel browser
 * (salvati senza account) si possono copiare nell'account. Lo stesso
 * documento non si copia due volte (stesso id); dopo la copia si tolgono
 * dal browser, così non ci sono doppioni.
 */
export function ImportaDalBrowser({
  stato,
  archivio,
  locali,
  profiloLocale,
  onTogliDalBrowser,
  onTogliProfilo,
}: {
  stato: StatoArchivio;
  archivio: ArchivioAccount;
  locali: readonly Documento[];
  profiloLocale: Emittente | null;
  /** Toglie dal browser i documenti con questi id. */
  onTogliDalBrowser: (ids: ReadonlySet<string>) => void;
  onTogliProfilo: () => void;
}) {
  const [nascosto, setNascosto] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [conferma, setConferma] = useState(false);
  const [esito, setEsito] = useState<{ testo: string; errore: boolean } | null>(null);

  const presenti = new Map((stato.documenti ?? []).map((d) => [d.id, d]));
  const nuovi = locali.filter((d) => !presenti.has(d.id));
  // Già nell'account e uguali: dopo la copia si tolgono anche questi dal browser.
  const uguali = locali.filter((d) => {
    const nelConto = presenti.get(d.id);
    return nelConto !== undefined && JSON.stringify(nelConto) === JSON.stringify(d);
  });
  const profilo = !stato.emittenteNellAccount && emittenteCompilato(profiloLocale) ? profiloLocale : null;

  if (esito && !inCorso) {
    return (
      <p
        role={esito.errore ? "alert" : "status"}
        className={`rounded-xl border p-4 text-sm print:hidden ${esito.errore ? "border-danger/40 bg-card text-danger" : "border-success bg-card"}`}
      >
        {esito.testo}
      </p>
    );
  }
  if (nascosto || (nuovi.length === 0 && !profilo)) return null;

  async function copia() {
    setInCorso(true);
    // Un id che l'account non accetta ne riceve uno nuovo: si ricorda quello del browser per toglierlo dopo.
    const daMandare = documentiDaImportare(nuovi, [], nuovoId);
    const originali = new Map(daMandare.map((d, i) => [d.id, nuovi[i].id]));
    const risultato = await archivio.importa(daMandare, profilo);
    const copiati = new Set(risultato.importati.map((id) => originali.get(id) ?? id));
    const daTogliere = new Set([...copiati, ...(risultato.ok ? uguali.map((d) => d.id) : [])]);
    if (daTogliere.size > 0) onTogliDalBrowser(daTogliere);
    const descrizione = descrivi(nuovi.filter((d) => copiati.has(d.id)));
    const fatti = descrizione
      ? `${descrizione} ${copiati.size === 1 ? "ora è" : "ora sono"} nel tuo account e non più in questo browser.`
      : "";
    if (risultato.ok) {
      if (profilo) onTogliProfilo();
      const restano = nuovi.length - copiati.size;
      setEsito({
        testo: [
          "Fatto:",
          fatti,
          profilo ? "Anche i tuoi dati sono nel tuo account." : "",
          restano > 0
            ? `${restano === 1 ? "1 documento non si può copiare: resta" : `${restano} documenti non si possono copiare: restano`} in questo browser.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        errore: false,
      });
    } else {
      setEsito({
        testo: [
          `Non sono riuscito a copiare tutto: ${risultato.errore.messaggio}`,
          fatti,
          "Quelli che mancano restano in questo browser: ricarica la pagina per riprovare.",
        ]
          .filter(Boolean)
          .join(" "),
        errore: true,
      });
    }
    setInCorso(false);
  }

  const cosa = [nuovi.length > 0 ? descrivi(nuovi) : null, profilo ? "i tuoi dati (nome, indirizzo, IBAN)" : null]
    .filter(Boolean)
    .join(" e ");

  return (
    <section aria-labelledby="titolo-importa" className="rounded-xl border-2 border-brand bg-card p-4 print:hidden">
      <h2 id="titolo-importa" className="font-semibold">
        Copia nel tuo account quello che hai in questo browser
      </h2>
      <p className="mt-1 text-sm text-muted">
        Prima dell&apos;accesso avevi salvato qui {cosa}. Copiali nell&apos;account per ritrovarli anche nell&apos;app e
        sugli altri dispositivi. Dopo la copia li togliamo da questo browser, così non hai doppioni.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
        {conferma ? (
          <>
            <button
              type="button"
              className={`${classePulsantePiccolo} border-danger text-danger`}
              onClick={() => {
                onTogliDalBrowser(new Set([...nuovi, ...uguali].map((d) => d.id)));
                if (profilo) onTogliProfilo();
                setEsito({ testo: "Cancellati da questo browser.", errore: false });
              }}
            >
              Sì, cancellali da questo browser
            </button>
            <button type="button" className={classePulsantePiccolo} onClick={() => setConferma(false)}>
              Annulla
            </button>
          </>
        ) : (
          <>
            <button type="button" className={classePulsantePrincipale} onClick={() => void copia()} disabled={inCorso}>
              {inCorso ? "Copio…" : "Copia nel mio account"}
            </button>
            <button type="button" className={classePulsanteSecondario} onClick={() => setNascosto(true)} disabled={inCorso}>
              Non ora
            </button>
            <button type="button" className={classePulsantePiccolo} onClick={() => setConferma(true)} disabled={inCorso}>
              Cancellali da questo browser
            </button>
          </>
        )}
      </div>
    </section>
  );
}
