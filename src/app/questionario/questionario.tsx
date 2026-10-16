"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";
import { IconaFreccia } from "@/components/landing/icone";
import { BarraProgresso } from "@/components/percorso/barra-progresso";
import { IconaIndietro } from "@/components/percorso/icone";
import { classePulsantePrincipale, classePulsanteSecondario } from "@/components/percorso/stili";
import { useProprietarioLocale, useRisposteLocali } from "@/components/percorso/usa-archivio";
import { salvaRisposteLocali, scartaDatiDiAltri } from "@/lib/percorso/archivio";
import {
  analizzaBozza,
  cancellaBozza,
  indiceDiRipresa,
  leggiBozzaGrezza,
  salvaBozza,
  type Bozza,
} from "@/lib/percorso/bozza";
import { DOMANDE } from "@/lib/percorso/domande";
import { leggiRisposte, LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO, VERSIONE_RISPOSTE } from "@/lib/percorso/risposte";
import { scegliRisposte, type DatiAccount } from "@/lib/percorso/sincronizza";
import { salvaRisposte } from "./azioni";

const nessunaIscrizione = () => () => {};

/** La bozza di questa scheda (null sul server e durante l'idratazione, poi quella salvata). */
function useBozzaSalvata() {
  const grezzo = useSyncExternalStore(nessunaIscrizione, leggiBozzaGrezza, () => null);
  return useMemo(() => analizzaBozza(grezzo), [grezzo]);
}

/**
 * Stato di una voce della cronologia del browser: la domanda mostrata e se la
 * voce l'ha aggiunta "Avanti" (allora la voce prima è la domanda precedente).
 */
type VoceCronologia = { domanda: number; spinta: boolean };

function voceAttuale(): Partial<VoceCronologia> | null {
  try {
    const stato: unknown = window.history.state;
    return stato && typeof stato === "object" ? (stato as Partial<VoceCronologia>) : null;
  } catch {
    return null;
  }
}

/** Il questionario: una domanda per schermata, con avanzamento, "Indietro" e il perché di ogni domanda. */
export function Questionario({ account, daRacconto = false }: { account: DatiAccount; daRacconto?: boolean }) {
  const router = useRouter();
  const idBase = useId();
  const locali = useRisposteLocali();
  // Le risposte copiate da un altro account non vengono riprese.
  const precedenti = scegliRisposte(account, locali, useProprietarioLocale()).risposte;
  const salvata = useBozzaSalvata();
  // null finché non si tocca nulla in questa pagina: valgono la bozza ripresa o le risposte precedenti.
  const [bozza, setBozza] = useState<Bozza | null>(null);
  const [indiceScelto, setIndiceScelto] = useState<number | null>(null);
  const valori: Bozza = bozza ?? salvata?.bozza ?? precedenti ?? {};
  const indice = indiceScelto ?? (salvata ? indiceDiRipresa(salvata.indice, valori) : 0);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, avvia] = useTransition();
  const titolo = useRef<HTMLHeadingElement>(null);
  const spostaFocus = useRef(false);

  // Dopo "Avanti" o "Indietro" il focus va sulla nuova domanda (non al primo caricamento).
  useEffect(() => {
    if (!spostaFocus.current) return;
    spostaFocus.current = false;
    titolo.current?.focus();
  }, [indice]);

  const domanda = DOMANDE[indice];
  const ultima = indice === DOMANDE.length - 1;
  const scelta = valori[domanda.id];
  const idPerche = `${idBase}-perche`;
  const idErrore = `${idBase}-errore`;
  const idAltro = `${idBase}-altro`;

  function mostra(destinazione: number) {
    spostaFocus.current = true;
    setErrore(null);
    setIndiceScelto(destinazione);
    salvaBozza({ indice: destinazione, bozza: valori });
  }

  function vai(nuovo: number) {
    const destinazione = Math.min(Math.max(nuovo, 0), DOMANDE.length - 1);
    try {
      const url = `?domanda=${destinazione + 1}`;
      if (destinazione > indice) {
        // Ogni "Avanti" aggiunge una voce alla cronologia: il tasto Indietro del browser (o di Android) torna
        // alla domanda prima invece di uscire dal questionario. La voce attuale ricorda la sua domanda.
        const attuale = voceAttuale();
        const spinta = attuale?.domanda === indice && attuale.spinta === true;
        window.history.replaceState({ domanda: indice, spinta } satisfies VoceCronologia, "");
        window.history.pushState({ domanda: destinazione, spinta: true } satisfies VoceCronologia, "", url);
      } else {
        window.history.replaceState({ domanda: destinazione, spinta: false } satisfies VoceCronologia, "", url);
      }
    } catch {
      // Senza cronologia il questionario funziona lo stesso.
    }
    mostra(destinazione);
  }

  /** "Indietro" della pagina: come il tasto del browser se la voce prima è la domanda precedente. */
  function indietro() {
    const voce = voceAttuale();
    if (voce?.spinta === true && voce.domanda === indice) window.history.back();
    else vai(indice - 1);
  }

  // Tasto Indietro o Avanti del browser tra le domande.
  const suCronologia = useEffectEvent((domanda: number) => {
    const destinazione = indiceDiRipresa(domanda, valori);
    if (destinazione !== indice) mostra(destinazione);
  });
  useEffect(() => {
    function suPopstate(evento: PopStateEvent) {
      const domanda = (evento.state as Partial<VoceCronologia> | null)?.domanda;
      if (typeof domanda === "number") suCronologia(domanda);
    }
    window.addEventListener("popstate", suPopstate);
    return () => window.removeEventListener("popstate", suPopstate);
  }, []);

  function aggiorna(modifica: Bozza) {
    const nuova = { ...valori, ...modifica };
    setBozza(nuova);
    setErrore(null);
    salvaBozza({ indice, bozza: nuova });
  }

  function avanti(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (inCorso) return;
    if (!scelta) {
      setErrore("Scegli una risposta per continuare.");
      return;
    }
    if (!ultima) {
      vai(indice + 1);
      return;
    }
    const risposte = leggiRisposte({ ...valori, versione: VERSIONE_RISPOSTE });
    if (!risposte) {
      const mancante = DOMANDE.findIndex((d) => !valori[d.id]);
      if (mancante >= 0) {
        vai(mancante);
        setErrore("Manca ancora questa risposta.");
      } else {
        setErrore("Qualcosa non torna nelle risposte: controlla la descrizione dell'attività e riprova.");
      }
      return;
    }
    // Se nel browser c'è la copia di un altro account, i suoi passi fatti non restano accanto a queste risposte.
    scartaDatiDiAltri(account.collegato ? account.userId : null);
    salvaRisposteLocali(risposte);
    cancellaBozza();
    avvia(async () => {
      if (account.collegato) {
        try {
          // Se non riesce, la pagina del percorso riprova a salvare le risposte del browser.
          await salvaRisposte(risposte);
        } catch {
          // Nessun blocco: il percorso funziona con i dati del browser.
        }
      }
      router.push("/percorso");
    });
  }

  return (
    <form onSubmit={avanti} noValidate className="mt-8">
      <BarraProgresso
        valore={indice + 1}
        massimo={DOMANDE.length}
        etichetta="Avanzamento"
        testo={`Domanda ${indice + 1} di ${DOMANDE.length}`}
      />

      {salvata && bozza === null && indiceScelto === null ? (
        <p className="mt-4 rounded-lg bg-brand-soft p-3 text-sm">
          {daRacconto
            ? "Ho già compilato quello che ho capito dal tuo racconto: rispondi solo a quello che manca. Con «Indietro» puoi controllare e correggere."
            : "Abbiamo ripreso le risposte che stavi dando: continua da qui."}
        </p>
      ) : precedenti && bozza === null && indice === 0 ? (
        <p className="mt-4 rounded-lg bg-brand-soft p-3 text-sm">
          Abbiamo ripreso le tue risposte precedenti: cambia solo quello che serve.
        </p>
      ) : null}

      <fieldset key={domanda.id} className="mt-6" aria-describedby={errore ? `${idPerche} ${idErrore}` : idPerche}>
        <legend className="w-full">
          <h2 ref={titolo} tabIndex={-1} className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {domanda.titolo}
          </h2>
        </legend>
        <p id={idPerche} className="mt-2 text-sm text-muted">
          <span className="font-medium text-foreground">Perché te lo chiediamo: </span>
          {domanda.perche}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {domanda.opzioni.map((opzione) => {
            const idOpzione = `${idBase}-${domanda.id}-${opzione.valore}`;
            return (
              <label
                key={opzione.valore}
                htmlFor={idOpzione}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
              >
                <input
                  id={idOpzione}
                  type="radio"
                  name={domanda.id}
                  value={opzione.valore}
                  checked={scelta === opzione.valore}
                  onChange={() => aggiorna({ [domanda.id]: opzione.valore })}
                  className="mt-1 size-4 shrink-0 accent-brand"
                />
                <span>
                  <span className="font-medium">{opzione.etichetta}</span>
                  {opzione.aiuto ? <span className="mt-0.5 block text-sm text-muted">{opzione.aiuto}</span> : null}
                </span>
              </label>
            );
          })}
        </div>

        {domanda.id === "attivita" && valori.attivita === "altro" ? (
          <div className="mt-4">
            <label htmlFor={idAltro} className="text-sm font-medium">
              Descrivi la tua attività in poche parole (facoltativo)
            </label>
            <input
              id={idAltro}
              type="text"
              maxLength={LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO}
              value={valori.attivitaAltro ?? ""}
              onChange={(e) => aggiorna({ attivitaAltro: e.target.value })}
              autoComplete="off"
              placeholder="Per esempio: toelettatura per cani"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>
        ) : null}
      </fieldset>

      {errore ? (
        <p id={idErrore} role="alert" className="mt-4 font-medium text-danger">
          {errore}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {indice > 0 ? (
          <button type="button" onClick={indietro} disabled={inCorso} className={classePulsanteSecondario}>
            <IconaIndietro className="size-4" />
            Indietro
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
        <button type="submit" disabled={inCorso} className={classePulsantePrincipale}>
          {ultima ? (inCorso ? "Preparo il tuo percorso…" : "Vedi il tuo percorso") : "Avanti"}
          <IconaFreccia className="size-4" />
        </button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {inCorso ? "Sto preparando il tuo percorso." : ""}
      </p>
    </form>
  );
}
