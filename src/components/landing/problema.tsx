import { Sezione } from "./sezione";

// Una frase per blocco, senza soglie in CHF: le cifre vanno mostrate solo con
// la fonte ufficiale (vedi AGENTS.md), e qui non servono.
const BLOCCHI = [
  {
    titolo: "Scegliere la forma giuridica",
    testo: "Ditta individuale, Sagl o SA: cambiano costi, rischi e pratiche, e all'inizio non è chiaro quale faccia per te.",
  },
  {
    titolo: "Capire gli obblighi",
    testo: "AVS da indipendente, assicurazioni, registro di commercio, IVA: cosa vale per te dipende dalla tua attività e da quanto fatturi.",
  },
  {
    titolo: "Fare i conti",
    testo: "Quanto chiedere all'ora, quanto mettere da parte per imposte e AVS, quando arrivi al pareggio.",
  },
  {
    titolo: "Partire davvero",
    testo: "Trovare i primi clienti, fare un preventivo, scrivere un contratto e mandare una fattura con codice QR.",
  },
];

export function Problema() {
  return (
    <Sezione
      id="problema"
      sopratitolo="Il problema"
      titolo="Le regole ci sono, ma sono sparse ovunque"
      sfondo="card"
      introduzione={
        <p>
          Aprire un&apos;attività in Svizzera è semplice sulla carta. Ma la prima volta non sai da dove partire né in
          che ordine muoverti: le informazioni giuste sono divise tra Confederazione, Cantone, AVS e assicurazioni.
        </p>
      }
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {BLOCCHI.map((b, i) => (
          <li key={b.titolo} className="rounded-xl border border-border bg-background p-6">
            <p aria-hidden="true" className="font-mono text-sm text-brand">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-lg font-semibold">{b.titolo}</h3>
            <p className="mt-2 text-muted">{b.testo}</p>
          </li>
        ))}
      </ul>
    </Sezione>
  );
}
