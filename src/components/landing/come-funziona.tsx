import { ImmagineMascotte } from "@/components/mascotte/immagine";
import type { ComponentType } from "react";
import { IconaChat, IconaChecklist, IconaDocumento, IconaQuestionario } from "./icone";
import { Sezione } from "./sezione";

const PASSI: { titolo: string; testo: string; Icona: ComponentType<{ className?: string }> }[] = [
  {
    titolo: "Un questionario di 5 minuti",
    testo: "Ci racconti l'attività, il Cantone, quanto pensi di fatturare e se hai soci. Da lì nasce il tuo percorso.",
    Icona: IconaQuestionario,
  },
  {
    titolo: "La checklist nell'ordine giusto",
    testo: "Ogni passo ha il link al modulo ufficiale: EasyGov, la tua cassa AVS, il Cantone. Spunti quello che hai fatto e vedi cosa viene dopo.",
    Icona: IconaChecklist,
  },
  {
    titolo: "Una chat che cita le fonti",
    testo: "Risponde solo da fonti ufficiali verificate e ti mostra sempre il link. Se non lo sa, te lo dice e ti suggerisce un professionista.",
    Icona: IconaChat,
  },
  {
    titolo: "I generatori di documenti",
    testo: "Business plan di una pagina, tariffa oraria, budget del primo anno, preventivo e fattura con codice QR.",
    Icona: IconaDocumento,
  },
];

export function ComeFunziona() {
  return (
    <Sezione
      id="come-funziona"
      sopratitolo="Come funziona"
      titolo="Dall'idea alla prima fattura, un passo alla volta"
      introduzione={<p>Bussola mette in fila quello che serve e ti porta al modulo giusto al momento giusto.</p>}
      illustrazione={<ImmagineMascotte nome="checklist" sizes="176px" className="h-auto w-full" />}
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PASSI.map(({ titolo, testo, Icona }, i) => (
          <li key={titolo} className="flex flex-col rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icona className="size-5" />
              </span>
              <span aria-hidden="true" className="font-mono text-sm text-muted">
                {i + 1}/{PASSI.length}
              </span>
            </div>
            <h3 className="mt-5 font-semibold">{titolo}</h3>
            <p className="mt-2 text-sm text-muted">{testo}</p>
          </li>
        ))}
      </ol>
    </Sezione>
  );
}
