"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { IconaFreccia } from "@/components/landing/icone";
import { BarraProgresso } from "@/components/percorso/barra-progresso";
import { IconaIndietro } from "@/components/percorso/icone";
import { classePulsantePrincipale, classePulsanteSecondario } from "@/components/percorso/stili";
import { useRisposteLocali } from "@/components/percorso/usa-archivio";
import { salvaRisposteLocali } from "@/lib/percorso/archivio";
import { DOMANDE } from "@/lib/percorso/domande";
import {
  leggiRisposte,
  LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO,
  VERSIONE_RISPOSTE,
  type Risposte,
} from "@/lib/percorso/risposte";
import { scegliRisposte, type DatiAccount } from "@/lib/percorso/sincronizza";
import { salvaRisposte } from "./azioni";

type Bozza = Partial<Omit<Risposte, "versione">>;

/** Il questionario: una domanda per schermata, con avanzamento, "Indietro" e il perché di ogni domanda. */
export function Questionario({ account }: { account: DatiAccount }) {
  const router = useRouter();
  const idBase = useId();
  const locali = useRisposteLocali();
  const precedenti = scegliRisposte(account, locali).risposte;
  const [bozza, setBozza] = useState<Bozza | null>(null);
  const valori: Bozza = bozza ?? precedenti ?? {};
  const [indice, setIndice] = useState(0);
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

  function vai(nuovo: number) {
    spostaFocus.current = true;
    setErrore(null);
    setIndice(Math.min(Math.max(nuovo, 0), DOMANDE.length - 1));
  }

  function aggiorna(modifica: Bozza) {
    setBozza({ ...valori, ...modifica });
    setErrore(null);
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
    salvaRisposteLocali(risposte);
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

      {precedenti && bozza === null && indice === 0 ? (
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
          <button type="button" onClick={() => vai(indice - 1)} disabled={inCorso} className={classePulsanteSecondario}>
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
