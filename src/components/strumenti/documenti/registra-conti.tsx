"use client";

import Link from "next/link";
import { useState } from "react";
import { fatturaPerConti, type Documento } from "@/lib/strumenti/documenti";
import { classeLink, classePulsanteSecondario } from "../ui";
import { IconaConti } from "../icone";

/** Chi usa lo strumento fattura: con l'accesso, senza, oppure «I tuoi conti» non attivo (null). */
export type AccessoConti = "collegato" | "ospite" | null;

/**
 * «Registra in I tuoi conti»: dopo che la fattura è pronta, con un clic la
 * fattura va nei conti (numero, cliente, date, totale e riferimento QR).
 * Si può ripetere dopo una correzione: lo stesso numero si aggiorna.
 */
export function RegistraNeiConti({ doc, pronta, accesso }: { doc: Documento; pronta: boolean; accesso: AccessoConti }) {
  const [stato, setStato] = useState<"pronto" | "invio" | "fatto">("pronto");
  const [errore, setErrore] = useState<string | null>(null);

  if (accesso === null) return null;
  if (accesso === "ospite") {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted print:hidden">
        <IconaConti className="mt-0.5 size-5 shrink-0 text-brand" />
        <span>
          Con un account le tue fatture vanno anche in «I tuoi conti», e quando il cliente paga diventano entrate.{" "}
          <Link href="/accedi?next=/strumenti/fattura" className={classeLink}>
            Accedi
          </Link>
        </span>
      </p>
    );
  }

  const valutaChf = doc.valuta === "CHF";
  async function registra() {
    setStato("invio");
    setErrore(null);
    try {
      const risposta = await fetch("/api/conti/fatture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fatturaPerConti(doc)),
      });
      if (!risposta.ok) {
        const corpo = (await risposta.json().catch(() => null)) as { messaggio?: unknown } | null;
        setErrore(typeof corpo?.messaggio === "string" ? corpo.messaggio : "Non sono riuscito a registrarla. Riprova tra poco.");
        setStato("pronto");
        return;
      }
      setStato("fatto");
    } catch {
      setErrore("Non riesco a raggiungere Bleo: controlla la connessione e riprova.");
      setStato("pronto");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm print:hidden">
      <p className="flex items-center gap-2 font-semibold">
        <IconaConti className="size-5 text-brand" />
        I tuoi conti
      </p>
      {!valutaChf ? (
        <p className="mt-1 text-muted">«I tuoi conti» per ora tiene solo le fatture in franchi (CHF).</p>
      ) : !pronta ? (
        <p className="mt-1 text-muted">Quando la fattura è completa puoi registrarla nei tuoi conti.</p>
      ) : stato === "fatto" ? (
        <p className="mt-1" role="status">
          Fatto: la fattura {doc.numero} è in{" "}
          <Link href="/conti#fatture" className={classeLink}>
            I tuoi conti
          </Link>
          . Quando il cliente paga, segnala come pagata.
        </p>
      ) : (
        <>
          <p className="mt-1 text-muted">
            Salva numero, cliente, date, totale e riferimento: così vedi cosa devi ancora incassare. Nei conti non
            vanno il tuo IBAN né le voci: restano nella fattura.
          </p>
          <button
            type="button"
            className={`${classePulsanteSecondario} mt-3`}
            onClick={registra}
            disabled={stato === "invio"}
          >
            {stato === "invio" ? "Registro…" : "Registra in I tuoi conti"}
          </button>
        </>
      )}
      {errore ? (
        <p role="alert" className="mt-2 font-medium text-danger">
          {errore}
        </p>
      ) : null}
    </div>
  );
}
