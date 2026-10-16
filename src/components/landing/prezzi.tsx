import { IconaFreccia, IconaSpunta } from "./icone";
import { Sezione, classePulsantePrincipale } from "./sezione";

// Prezzi del piano (docs/piano.md): ipotesi da verificare nella beta.
const PIANI = [
  {
    nome: "Gratis",
    prezzo: "CHF 0",
    nota: null,
    alternativa: null,
    incluso: ["Questionario e percorso completo", "Scadenze da ricordare", "10 domande al mese alla chat"],
  },
  {
    nome: "Bleo Plus",
    prezzo: "CHF 12.90",
    nota: "al mese",
    alternativa: "oppure CHF 129 all'anno: circa 2 mesi gratis",
    incluso: [
      "Chat con le fonti ufficiali, fino a 100 domande al mese",
      "Promemoria delle scadenze",
      "Tutti gli strumenti: preventivi, fatture QR, budget, business plan",
      "Aggiornamenti quando cambiano le regole",
    ],
  },
];

export function Prezzi() {
  return (
    <Sezione
      id="prezzi"
      sopratitolo="Prezzi"
      titolo="Prezzi previsti"
      introduzione={
        <p>
          Sono i prezzi che pensiamo di proporre al lancio. Li stiamo verificando con le prime persone che apriranno
          la loro attività: possono ancora cambiare.
        </p>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {PIANI.map((piano) => (
          <article
            key={piano.nome}
            aria-labelledby={`piano-${piano.nome}`}
            className={`flex flex-col rounded-2xl p-6 sm:p-8 ${piano.alternativa ? "bordo-sfumato shadow-lg shadow-brand/10" : "border border-border bg-card"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id={`piano-${piano.nome}`} className="text-lg font-semibold">
                {piano.nome}
              </h3>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">Previsto</span>
            </div>
            <p className="mt-4">
              <span className="text-4xl font-semibold tracking-tight">{piano.prezzo}</span>
              {piano.nota ? <span className="ml-2 text-muted">{piano.nota}</span> : null}
            </p>
            {piano.alternativa ? <p className="mt-1 text-sm font-medium text-brand">{piano.alternativa}</p> : null}
            <ul className="mt-6 space-y-2">
              {piano.incluso.map((voce) => (
                <li key={voce} className="flex gap-2">
                  <IconaSpunta className="mt-0.5 size-5 shrink-0 text-brand" />
                  {voce}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-5 rounded-xl bg-brand-soft p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-xl">
          <p className="font-semibold">Accesso anticipato per chi è in lista</p>
          <p className="mt-2">
            Dalla lista d&apos;attesa invitiamo 30–50 persone alla beta chiusa, prevista per dicembre 2026, dando la
            precedenza a chi si è iscritto prima. Durante la beta Bleo è gratuito per chi partecipa.
          </p>
        </div>
        <a href="#lista-attesa" className={`${classePulsantePrincipale} shrink-0`}>
          Entra nella lista
          <IconaFreccia className="size-4" />
        </a>
      </div>
    </Sezione>
  );
}
