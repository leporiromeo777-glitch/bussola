import type { ReactNode } from "react";
import { IconaDivieto } from "./icone";
import { Sezione } from "./sezione";

export function CosaNonE() {
  return (
    <Sezione
      id="cosa-non-e"
      sopratitolo="Chiaro fin da subito"
      titolo="Cosa Bleo non è"
      sfondo="card"
      introduzione={<p>Ti diciamo subito cosa aspettarti, e cosa no.</p>}
    >
      <ul className="grid gap-4 md:grid-cols-3">
        <Punto titolo="Non è un fiduciario">
          Non compila la tua dichiarazione d&apos;imposta e non tiene la contabilità per te. Ti dà informazioni
          generali con la fonte e, per i casi personali, ti indirizza a un professionista autorizzato.
        </Punto>
        <Punto titolo="Non sostituisce EasyGov">
          <a
            href="https://www.easygov.swiss"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-2 hover:text-brand-strong"
          >
            EasyGov
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>{" "}
          è lo sportello online pubblico per le pratiche d&apos;impresa. Bleo non lo sostituisce: ti ci porta al
          passo giusto, sapendo già cosa compilare.
        </Punto>
        <Punto titolo="Non inventa le risposte">
          Se un&apos;informazione non è nelle fonti ufficiali verificate, te lo dice invece di tirare a indovinare, e
          ti suggerisce a chi chiedere.
        </Punto>
      </ul>
    </Sezione>
  );
}

function Punto({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <li className="rounded-xl border border-border bg-background p-6">
      <span className="flex size-10 items-center justify-center rounded-lg border border-border text-muted">
        <IconaDivieto className="size-5" />
      </span>
      <h3 className="mt-5 font-semibold">{titolo}</h3>
      <p className="mt-2 text-muted">{children}</p>
    </li>
  );
}
