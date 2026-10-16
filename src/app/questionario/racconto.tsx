"use client";

import { useId, useState, type FormEvent } from "react";
import { PulsanteDettatura } from "@/components/dettatura";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { IconaFreccia, IconaSpunta } from "@/components/landing/icone";
import { classePulsantePrincipale, classeLink } from "@/components/percorso/stili";
import { aggiungiDettato } from "@/lib/dettatura/testo";
import { salvaBozza, type Bozza } from "@/lib/percorso/bozza";
import { DOMANDE, etichettaRisposta } from "@/lib/percorso/domande";
import type { IdDomanda } from "@/lib/percorso/risposte";

const ESEMPI = [
  "Voglio fare il fotografo a Lugano nel fine settimana. Ho già un lavoro al 60% e sono svizzero.",
  "Vorrei aprire un piccolo bar a Bellinzona con la mia ragazza.",
  "Faccio siti web per altre persone, da sola, e penso di fatturare circa 30'000 franchi il primo anno.",
];

type Esito = { bozza: Bozza; riassunto: string };

/**
 * «Racconta a Bleo cosa vuoi fare»: scrivi la tua idea con parole tue, Bleo
 * deduce le risposte del questionario e poi chiede solo quello che manca.
 */
export function Racconto({ onContinua, onDomande }: { onContinua: () => void; onDomande: () => void }) {
  const id = useId();
  const [testo, setTesto] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [esito, setEsito] = useState<Esito | null>(null);

  async function invia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const pulito = testo.trim();
    if (pulito.length < 10) {
      setErrore("Scrivi almeno una frase: cosa vuoi fare e dove.");
      return;
    }
    setErrore(null);
    setInCorso(true);
    try {
      const risposta = await fetch("/api/racconta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testo: pulito }),
      });
      const corpo = (await risposta.json().catch(() => null)) as
        | (Partial<Esito> & { messaggio?: unknown })
        | null;
      if (!risposta.ok || !corpo?.bozza || typeof corpo.riassunto !== "string") {
        setErrore(
          typeof corpo?.messaggio === "string"
            ? corpo.messaggio
            : "Non sono riuscito a capire. Rispondi alle domande: ci vogliono 5 minuti.",
        );
        return;
      }
      setEsito({ bozza: corpo.bozza, riassunto: corpo.riassunto });
    } catch {
      setErrore("Non riesco a raggiungere Bleo: controlla la connessione o rispondi alle domande.");
    } finally {
      setInCorso(false);
    }
  }

  if (esito) {
    const capite = DOMANDE.filter((d) => esito.bozza[d.id as IdDomanda]);
    const mancanti = DOMANDE.length - capite.length;
    function continua() {
      if (!esito) return;
      const prima = DOMANDE.findIndex((d) => !esito.bozza[d.id as IdDomanda]);
      salvaBozza({ indice: prima >= 0 ? prima : DOMANDE.length - 1, bozza: esito.bozza });
      onContinua();
    }
    return (
      <section aria-labelledby={`${id}-capito`} className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <ImmagineMascotte nome="checklist" sizes="80px" className="hidden h-auto w-20 shrink-0 sm:block" />
          <div>
            <h2 id={`${id}-capito`} className="text-xl font-extrabold tracking-tight">
              {esito.riassunto}
            </h2>
            <p className="mt-2 text-muted">
              {capite.length === 0
                ? "Non ho capito abbastanza dalla descrizione: rispondi alle domande, ci vogliono pochi minuti."
                : mancanti === 0
                  ? "Ho tutte le risposte. Controllale nell'ultima domanda e vedi il tuo percorso."
                  : `Ho dedotto ${capite.length} risposte: ti chiedo solo le ${mancanti} che mancano. Puoi sempre correggerle tornando indietro.`}
            </p>
          </div>
        </div>
        {capite.length > 0 ? (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {capite.map((d) => {
              const chiave = d.id as IdDomanda;
              const valore = esito.bozza[chiave];
              return (
                <li key={d.id} className="flex items-start gap-2 rounded-xl bg-brand-soft p-3 text-sm">
                  <IconaSpunta className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>
                    <span className="block text-muted">{d.breve}</span>
                    <span className="font-medium">
                      {chiave === "attivita" && esito.bozza.attivitaAltro
                        ? esito.bozza.attivitaAltro
                        : valore
                          ? etichettaRisposta(chiave, valore as never)
                          : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={continua} className={classePulsantePrincipale}>
            {mancanti === 0 ? "Controlla e vedi il percorso" : "Continua"}
            <IconaFreccia className="size-4" />
          </button>
          <button type="button" onClick={() => setEsito(null)} className={classeLink}>
            Riscrivi la descrizione
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={invia} noValidate className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <label htmlFor={`${id}-testo`} className="text-xl font-extrabold tracking-tight">
        Racconta a Bleo cosa vuoi fare
      </label>
      <p id={`${id}-aiuto`} className="mt-2 text-muted">
        Con parole tue, scritte o a voce: che lavoro, dove, se da solo o con altri, se hai già un impiego. Bleo
        capisce le risposte e ti chiede solo quello che manca.
      </p>
      <textarea
        id={`${id}-testo`}
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        aria-describedby={`${id}-aiuto`}
        rows={4}
        maxLength={1000}
        placeholder={ESEMPI[0]}
        className="mt-4 block w-full rounded-2xl border border-border bg-background p-4 text-base"
      />
      <div className="mt-3">
        <PulsanteDettatura onTesto={(dettato) => setTesto((t) => aggiungiDettato(t, dettato, 1000))} disabilitato={inCorso} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ESEMPI.slice(1).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setTesto(e)}
            className="rounded-full border border-border px-3 py-1.5 text-left text-sm text-muted hover:border-brand hover:text-foreground"
          >
            {e}
          </button>
        ))}
      </div>
      {errore ? (
        <p role="alert" className="mt-4 font-medium text-danger">
          {errore}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={inCorso} className={classePulsantePrincipale}>
          {inCorso ? "Bleo sta leggendo…" : "Fatto, prepara il mio percorso"}
          <IconaFreccia className="size-4" />
        </button>
        <button type="button" onClick={onDomande} className={classeLink}>
          Preferisco rispondere alle 10 domande
        </button>
      </div>
      <p className="mt-4 text-xs text-muted">
        Il testo lo legge l&apos;intelligenza artificiale che usa Bleo (Claude, di Anthropic) solo per capire le
        risposte: noi non lo salviamo. Scrivi solo quello che serve, senza dati come indirizzo o numero AVS.
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {inCorso ? "Bleo sta leggendo la tua descrizione." : ""}
      </p>
    </form>
  );
}
