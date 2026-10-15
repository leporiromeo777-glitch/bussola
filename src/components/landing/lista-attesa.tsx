import { IconaSpunta } from "./icone";
import { ModuloListaAttesa } from "./modulo-lista-attesa";
import { Sezione } from "./sezione";

const RASSICURAZIONI = [
  "Solo l'email è obbligatoria.",
  "Al massimo due aggiornamenti al mese.",
  "Ti disiscrivi con un clic, da ogni email.",
];

export function ListaAttesa() {
  return (
    <Sezione
      id="lista-attesa"
      sopratitolo="Lista d'attesa"
      titolo="Entra nella lista d'attesa"
      sfondo="brand"
      introduzione={
        <p>
          Ti scriviamo quando apre la beta chiusa. Chi è in lista ha la precedenza per entrare tra le prime persone a
          provarla.
        </p>
      }
    >
      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-start">
        <ul className="space-y-3">
          {RASSICURAZIONI.map((testo) => (
            <li key={testo} className="flex gap-3">
              <IconaSpunta className="mt-0.5 size-5 shrink-0 text-brand" />
              {testo}
            </li>
          ))}
        </ul>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <ModuloListaAttesa />
        </div>
      </div>
    </Sezione>
  );
}
