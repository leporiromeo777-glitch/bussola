"use client";

import { useEffect, useState } from "react";
import { IconaScarica } from "@/components/strumenti/icone";
import type { Casella, RispostaConti } from "@/lib/conti/tipi";
import { CaricaRicevuta, NuovaVoce } from "./aggiungi";
import { chiama } from "./api";
import { RiceviFatture } from "./casella";
import { DaConfermare } from "./da-confermare";
import { FattureEmesse } from "./fatture";
import { RiepilogoAnno } from "./riepilogo";
import { Messaggio, Sezione, classeNo, classePiccolo } from "./ui-conti";

type Stato =
  | { tipo: "caricamento" }
  | { tipo: "errore"; messaggio: string }
  | { tipo: "pronto"; dati: RispostaConti };

/** «I tuoi conti» per chi ha fatto l'accesso: legge /api/conti e ricarica dopo ogni modifica. */
export function Conti({ oggi }: { oggi: string }) {
  const annoCorrente = Number(oggi.slice(0, 4));
  const [anno, setAnno] = useState(annoCorrente);
  const [versione, setVersione] = useState(0);
  const [stato, setStato] = useState<Stato>({ tipo: "caricamento" });
  const [casella, setCasella] = useState<Casella | null>(null);
  const [annuncio, setAnnuncio] = useState("");

  useEffect(() => {
    let attivo = true;
    chiama<RispostaConti>(`/api/conti?anno=${anno}`).then((esito) => {
      if (!attivo) return;
      setStato(esito.ok ? { tipo: "pronto", dati: esito.dati } : { tipo: "errore", messaggio: esito.messaggio });
    });
    return () => {
      attivo = false;
    };
  }, [anno, versione]);

  const emailAttiva = stato.tipo === "pronto" && stato.dati.funzioni.email;
  useEffect(() => {
    if (!emailAttiva) return;
    let attivo = true;
    chiama<Casella>("/api/conti/casella").then((esito) => {
      if (attivo && esito.ok) setCasella(esito.dati);
    });
    return () => {
      attivo = false;
    };
  }, [emailAttiva, versione]);

  function cambiato(testo: string) {
    setAnnuncio(testo);
    setVersione((v) => v + 1);
  }

  const selettoreAnno = (
    <div className="flex items-center gap-1" role="group" aria-label="Anno">
      <button type="button" className={classePiccolo} onClick={() => setAnno((a) => a - 1)} aria-label="Anno prima">
        ‹
      </button>
      <span className="min-w-14 text-center font-semibold tabular-nums">{anno}</span>
      <button
        type="button"
        className={classePiccolo}
        onClick={() => setAnno((a) => a + 1)}
        disabled={anno >= annoCorrente}
        aria-label="Anno dopo"
      >
        ›
      </button>
    </div>
  );

  if (stato.tipo === "caricamento") {
    return (
      <p className="mt-8 rounded-2xl border border-border bg-card p-5 text-muted" role="status">
        Apro i tuoi conti…
      </p>
    );
  }
  if (stato.tipo === "errore") {
    return (
      <div className="mt-8">
        <Messaggio testo={stato.messaggio} />
        <button type="button" className={`${classeNo} mt-3`} onClick={() => setVersione((v) => v + 1)}>
          Riprova
        </button>
      </div>
    );
  }

  const { dati } = stato;
  const daConfermare = dati.movimenti.filter((m) => m.stato === "da_confermare");

  return (
    <div className="mt-8 space-y-12">
      <p className="sr-only" role="status" aria-live="polite">
        {annuncio}
      </p>

      <Sezione
        id="da-confermare"
        titolo={
          <>
            Da confermare
            {daConfermare.length > 0 ? (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-sm font-bold text-background">
                {daConfermare.length}
              </span>
            ) : null}
          </>
        }
        descrizione="Quello che Bleo ha letto da foto ed email. Conta nei conti solo dopo il tuo sì."
      >
        <DaConfermare movimenti={daConfermare} onCambiato={cambiato} />
      </Sezione>

      <Sezione id="riepilogo" titolo={`Riepilogo ${anno}`} azioni={selettoreAnno}>
        <RiepilogoAnno riepilogo={dati.riepilogo} />
      </Sezione>

      <Sezione
        id="fatture"
        titolo="Fatture emesse"
        descrizione="Quando il cliente paga, segnala come pagata: diventa un'entrata."
      >
        <FattureEmesse fatture={dati.fatture} oggi={oggi} onCambiato={cambiato} />
      </Sezione>

      <Sezione id="aggiungi" titolo="Aggiungi">
        <div className="space-y-4">
          <CaricaRicevuta lettura={dati.funzioni.lettura} onAggiunto={cambiato} />
          <NuovaVoce oggi={oggi} onAggiunto={cambiato} />
        </div>
      </Sezione>

      <Sezione
        id="ricevi"
        titolo="Ricevi le fatture in automatico"
        descrizione="Inoltra a Bleo le email con fatture e ricevute: le trovi qui, pronte da confermare."
      >
        {dati.funzioni.email ? (
          casella ? (
            <RiceviFatture casella={casella} onCambiata={setCasella} />
          ) : (
            <p className="text-sm text-muted" role="status">
              Preparo il tuo indirizzo…
            </p>
          )
        ) : (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
            La ricezione delle fatture via email non è ancora attiva. Intanto puoi fotografarle o caricare il PDF.
          </p>
        )}
      </Sezione>

      <Sezione id="scarica" titolo="Scarica per il fiduciario">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <p className="text-sm text-muted">
            Un file con tutte le voci del {anno}, che si apre con Excel o Numbers: prima quelle confermate, poi quelle
            ancora da confermare (segnate nella colonna «stato»). Le voci private non ci sono.
          </p>
          <a href={`/api/conti/esporta?anno=${anno}`} download className={`${classeNo} mt-4 w-full sm:w-auto`}>
            <IconaScarica className="size-5" />
            Scarica i conti {anno} (CSV)
          </a>
        </div>
      </Sezione>
    </div>
  );
}
