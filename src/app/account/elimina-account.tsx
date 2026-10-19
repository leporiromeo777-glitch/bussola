"use client";

import { useActionState, useState } from "react";
import { CHIAVE_LINK_CALENDARIO, dimenticaPercorsoLocale, scriviGrezzo } from "@/lib/percorso/archivio";
import { cancellaBozza } from "@/lib/percorso/bozza";
import { eliminaIlMioAccount, type StatoEliminazione } from "./azioni";

const STATO_INIZIALE: StatoEliminazione = { stato: "iniziale" };

/** "Elimina account", con un passo di conferma prima di cancellare tutto. */
export function EliminaAccount() {
  const [conferma, setConferma] = useState(false);
  const [stato, azione, inCorso] = useActionState(eliminaIlMioAccount, STATO_INIZIALE);

  return (
    <section aria-labelledby="elimina-account" className="mt-12 border-t border-border pt-6">
      <h2 id="elimina-account" className="text-lg font-semibold">
        Elimina account
      </h2>
      {conferma ? (
        <form
          action={azione}
          onSubmit={() => {
            // Anche la copia del percorso salvata in questo browser.
            dimenticaPercorsoLocale();
            cancellaBozza();
            scriviGrezzo(CHIAVE_LINK_CALENDARIO, null);
          }}
          className="mt-3"
        >
          <p>
            Sei sicuro? Cancelliamo il tuo account con il questionario, i passi fatti, le domande alla chat, «I tuoi conti» con tutte le ricevute salvate, il cassetto dei documenti con i suoi file e i tuoi preventivi e fatture. Se ti servono, scarica prima i conti dalla pagina «I tuoi conti» e tieni una copia dei documenti e delle fatture in PDF.{" "}
            <strong className="font-semibold">Non si può tornare indietro.</strong>
          </p>
          {stato.stato === "errore" ? (
            <p role="alert" className="mt-3 text-danger">
              {stato.messaggio}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={inCorso}
              className="rounded-lg border border-danger px-4 py-2 font-medium text-danger disabled:cursor-wait disabled:opacity-60"
            >
              {inCorso ? "Eliminazione…" : "Sì, elimina tutto"}
            </button>
            <button
              type="button"
              disabled={inCorso}
              onClick={() => setConferma(false)}
              className="rounded-lg border border-border px-4 py-2 hover:border-brand disabled:opacity-60"
            >
              Annulla
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="mt-2 text-muted">Cancella per sempre il tuo account e i dati salvati su Bleo.</p>
          <button
            type="button"
            onClick={() => setConferma(true)}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-danger hover:border-danger"
          >
            Elimina account
          </button>
        </>
      )}
    </section>
  );
}
