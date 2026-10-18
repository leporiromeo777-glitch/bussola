"use client";

import { useEffect, useState } from "react";
import { clientiInOrdine, meseDi, nomeMese, riepilogoMese, spostaMese } from "@/lib/clienti/ore";
import type { Mese, RispostaOre } from "@/lib/clienti/tipi";
import { chiama } from "../api";
import { Messaggio, Sezione, classeNo, classePiccolo, data } from "../ui-conti";
import { ElencoMese } from "./elenco-mese";
import { ModuloOre } from "./modulo-ore";
import { ModuloCliente, Rubrica } from "./rubrica";

type Stato =
  | { tipo: "caricamento" }
  | { tipo: "errore"; messaggio: string }
  | { tipo: "pronto"; dati: RispostaOre };

/** «Clienti e ore» per chi ha fatto l'accesso: legge /api/conti/ore e ricarica dopo ogni modifica. */
export function ClientiEOre({ oggi }: { oggi: string }) {
  const meseCorrente = meseDi(oggi);
  const [mese, setMese] = useState<Mese>(meseCorrente);
  const [versione, setVersione] = useState(0);
  const [stato, setStato] = useState<Stato>({ tipo: "caricamento" });
  const [annuncio, setAnnuncio] = useState("");
  const [salvato, setSalvato] = useState<string | null>(null);

  useEffect(() => {
    let attivo = true;
    chiama<RispostaOre>(`/api/conti/ore?mese=${mese}`).then((esito) => {
      if (!attivo) return;
      setStato(esito.ok ? { tipo: "pronto", dati: esito.dati } : { tipo: "errore", messaggio: esito.messaggio });
    });
    return () => {
      attivo = false;
    };
  }, [mese, versione]);

  function cambiato(testo: string) {
    setAnnuncio(testo);
    setVersione((v) => v + 1);
  }

  if (stato.tipo === "caricamento") {
    return (
      <p className="mt-8 rounded-2xl border border-border bg-card p-5 text-muted" role="status">
        Apro clienti e ore…
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
  const clienti = clientiInOrdine(dati.clienti);
  const riepilogo = riepilogoMese(dati.voci, dati.clienti);
  const altriMesi = dati.daFatturare.filter((m) => m.mese !== mese);

  const selettoreMese = (
    <div className="flex items-center gap-1" role="group" aria-label="Mese">
      <button type="button" className={classePiccolo} onClick={() => setMese((m) => spostaMese(m, -1))} aria-label="Mese prima">
        ‹
      </button>
      <span className="min-w-32 text-center font-semibold">{nomeMese(mese)}</span>
      <button
        type="button"
        className={classePiccolo}
        onClick={() => setMese((m) => spostaMese(m, 1))}
        disabled={mese >= meseCorrente}
        aria-label="Mese dopo"
      >
        ›
      </button>
    </div>
  );

  return (
    <div className="mt-8 space-y-12">
      <p className="sr-only" role="status" aria-live="polite">
        {annuncio}
      </p>

      <Sezione id="segna" titolo="Segna le ore">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          {clienti.length === 0 ? (
            <>
              <p className="mb-4 text-sm text-muted">Per iniziare aggiungi il tuo primo cliente.</p>
              <ModuloCliente id="primo-cliente" onSalvato={(c) => cambiato(`${c.nome} aggiunto ai tuoi clienti.`)} />
            </>
          ) : (
            <>
              <ModuloOre
                id="nuova-voce-ore"
                clienti={clienti}
                oggi={oggi}
                onSalvato={(v) => {
                  const cliente = clienti.find((c) => c.id === v.clienteId)?.nome ?? "il cliente";
                  const testo = `Segnato: ${cliente}, ${data(v.data)}.`;
                  setSalvato(testo);
                  if (meseDi(v.data) !== mese) setMese(meseDi(v.data));
                  cambiato(testo);
                }}
              />
              <Messaggio testo={salvato} tipo="ok" />
            </>
          )}
        </div>
      </Sezione>

      <Sezione
        id="mese"
        titolo="Ore del mese"
        azioni={selettoreMese}
        descrizione="Per cliente, con l'importo se c'è la tariffa. Da qui crei la fattura delle ore non ancora fatturate."
      >
        <ElencoMese
          mese={mese}
          riepilogo={riepilogo}
          clienti={clienti}
          altriMesi={altriMesi}
          oggi={oggi}
          onCambiaMese={setMese}
          onCambiato={cambiato}
        />
      </Sezione>

      <Sezione
        id="clienti"
        titolo={`I tuoi clienti${clienti.length > 0 ? ` (${clienti.length})` : ""}`}
        descrizione="Nome e indirizzo come servono nella QR-fattura. La tariffa oraria è facoltativa."
      >
        <Rubrica clienti={clienti} onCambiato={cambiato} />
      </Sezione>
    </div>
  );
}
