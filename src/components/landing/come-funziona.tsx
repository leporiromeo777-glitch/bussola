import { ImmagineMascotte, type NomeImmagine } from "@/components/mascotte/immagine";
import { Sezione } from "./sezione";

const PASSI: { titolo: string; testo: string; immagine: NomeImmagine }[] = [
  {
    titolo: "Rispondi a 10 domande",
    testo: "Ci racconti l'attività, il Cantone, quanto pensi di fatturare e se hai soci. In circa 5 minuti nasce il tuo percorso.",
    immagine: "pensa",
  },
  {
    titolo: "Segui i passi nell'ordine giusto",
    testo: "Ogni passo ha il link al modulo ufficiale: EasyGov, la tua cassa AVS, il Cantone. Spunti quello che hai fatto e vedi cosa viene dopo.",
    immagine: "checklist",
  },
  {
    titolo: "Chiedi a Bleo",
    testo: "La chat risponde solo da fonti ufficiali verificate e ti mostra sempre il link. Se non lo sa, te lo dice e ti suggerisce a chi chiedere.",
    immagine: "coppia",
  },
  {
    titolo: "Prepara i documenti",
    testo: "Business plan di una pagina, tariffa oraria, budget del primo anno, preventivo e fattura con codice QR.",
    immagine: "scrivania",
  },
];

/** Quattro passi in fila, con i numeri grandi e una linea sfumata che li unisce (come su tryholo.ai). */
export function ComeFunziona() {
  return (
    <Sezione
      id="come-funziona"
      sopratitolo="Come funziona"
      titolo="Dall'idea alla prima fattura, un passo alla volta"
      introduzione={<p>Bleo mette in fila quello che serve e ti porta al modulo giusto al momento giusto.</p>}
    >
      <ol className="relative mx-auto max-w-3xl">
        <span
          aria-hidden="true"
          className="absolute bottom-6 left-[1.35rem] top-6 w-0.5 rounded-full sm:left-[1.85rem]"
          style={{ backgroundImage: "var(--sfumatura)" }}
        />
        {PASSI.map((passo, i) => (
          <li key={passo.titolo} className="relative grid grid-cols-[auto_1fr] gap-x-5 pb-12 last:pb-0 sm:gap-x-8">
            <span
              aria-hidden="true"
              className="relative z-10 flex size-11 items-center justify-center rounded-full border border-border bg-background text-base font-extrabold text-brand sm:size-15 sm:text-xl"
              style={{ fontFamily: "var(--font-titoli)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--font-titoli)" }}>
                  <span className="sr-only">Passo {i + 1}: </span>
                  {passo.titolo}
                </h3>
                <p className="mt-2 text-muted">{passo.testo}</p>
              </div>
              <div className="w-36 rounded-2xl border border-border bg-card p-3 shadow-sm sm:w-44">
                <ImmagineMascotte nome={passo.immagine} sizes="176px" className="h-auto w-full" />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Sezione>
  );
}
