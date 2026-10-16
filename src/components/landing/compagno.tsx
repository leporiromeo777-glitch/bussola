import Link from "next/link";
import { Configuratore } from "@/components/mascotte/configuratore";
import { sito } from "@/lib/sito";
import { classePulsanteSecondario, Sezione } from "./sezione";

/** Presenta la mascotte in 3D: si gira sul piedistallo e si veste combinando gli accessori. */
export function Compagno() {
  return (
    <Sezione
      id="compagno"
      sopratitolo="Il tuo compagno di viaggio"
      titolo={`Ti presento ${sito.mascotte}, che ti accompagna passo per passo`}
      sfondo="brand"
      introduzione={
        <p>
          Si scrive {sito.mascotte}, si dice «{sito.pronuncia}». Nel percorso è sempre con te, insieme alla bussolina
          che indica il prossimo passo. Giralo sul piedistallo e vestilo come vuoi: cappello, occhiali e sciarpa si
          possono combinare.
        </p>
      }
    >
      <Configuratore />
      <p className="mt-8">
        <Link href="/percorso#titolo-guardaroba" className={classePulsanteSecondario}>
          Ritrovalo vestito così nel tuo percorso
        </Link>
      </p>
    </Sezione>
  );
}
