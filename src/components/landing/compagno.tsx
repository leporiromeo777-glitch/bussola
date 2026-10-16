import Link from "next/link";
import { ImmagineMascotte, OUTFIT } from "@/components/mascotte/immagine";
import { classePulsanteSecondario, Sezione } from "./sezione";

/** Presenta la mascotte e i suoi vestiti: nel percorso l'utente la veste come vuole. */
export function Compagno() {
  return (
    <Sezione
      id="compagno"
      sopratitolo="Il tuo compagno di viaggio"
      titolo="Un compagno che ti accompagna passo per passo"
      sfondo="brand"
      introduzione={
        <p>
          Nel percorso ti segue un piccolo compagno, con la bussolina che indica il prossimo passo. Vestilo come vuoi:
          cappellino, berretto, occhiali, sciarpa.
        </p>
      }
      illustrazione={<ImmagineMascotte nome="coppia" sizes="176px" className="h-auto w-full" />}
    >
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-9">
        {OUTFIT.map((nome) => (
          <li key={nome} className="w-28 shrink-0 snap-start rounded-xl bg-background p-2 sm:w-auto">
            <ImmagineMascotte nome={nome} descrivi sizes="(min-width: 1024px) 110px, 112px" className="h-auto w-full" />
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/percorso#titolo-guardaroba" className={classePulsanteSecondario}>
          Vestilo nel tuo percorso
        </Link>
      </p>
    </Sezione>
  );
}
