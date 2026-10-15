import { IconaSpunta } from "./icone";

type Passo = { titolo: string; dove: string; stato: "fatto" | "prossimo" | "da_fare" };

// Solo un esempio illustrativo: niente cifre né scadenze, i passi veri
// arrivano dal questionario e dalle regole in src/data con le fonti.
const PASSI: Passo[] = [
  { titolo: "Scegli la forma giuridica", dove: "Guida", stato: "fatto" },
  { titolo: "Annunciati come indipendente alla cassa di compensazione AVS", dove: "Modulo ufficiale", stato: "prossimo" },
  { titolo: "Decidi se iscriverti al registro di commercio", dove: "EasyGov", stato: "da_fare" },
  { titolo: "Calcola la tua tariffa oraria", dove: "Generatore", stato: "da_fare" },
  { titolo: "Manda la prima fattura con codice QR", dove: "Generatore", stato: "da_fare" },
];

const ETICHETTA_STATO: Record<Passo["stato"], string> = {
  fatto: "fatto",
  prossimo: "prossimo passo",
  da_fare: "da fare",
};

export function EsempioPercorso() {
  return (
    <figure className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">Il tuo percorso</p>
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">Esempio</span>
      </div>
      <ol className="mt-5 space-y-1">
        {PASSI.map((passo, i) => (
          <li
            key={passo.titolo}
            className={`flex items-start gap-3 rounded-lg p-2.5 ${passo.stato === "prossimo" ? "bg-brand-soft" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                passo.stato === "fatto"
                  ? "bg-brand text-background"
                  : passo.stato === "prossimo"
                    ? "border-2 border-brand text-brand"
                    : "border border-border text-muted"
              }`}
            >
              {passo.stato === "fatto" ? <IconaSpunta className="size-4" /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm ${passo.stato === "fatto" ? "text-muted" : "font-medium"}`}>
                {passo.titolo}
                <span className="sr-only"> ({ETICHETTA_STATO[passo.stato]})</span>
              </span>
              <span className="mt-0.5 block text-xs text-muted">{passo.dove}</span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 border-t border-border pt-4 text-xs text-muted">
        Esempio: i passi e il loro ordine cambiano in base alle tue risposte al questionario.
      </figcaption>
    </figure>
  );
}
