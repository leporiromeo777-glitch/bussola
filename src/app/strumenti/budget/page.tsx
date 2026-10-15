import type { Metadata } from "next";
import { BudgetAnno } from "@/components/strumenti/budget/budget-anno";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";

export const metadata: Metadata = {
  title: "Budget del primo anno",
  description:
    "Budget mese per mese per il primo anno della tua ditta individuale: ricavi, costi, saldo cumulato, mese di pareggio e accantonamenti per AVS e imposte.",
};

export default function PaginaBudget() {
  return (
    <>
      <IntestazioneStrumento
        titolo="Budget del primo anno"
        introduzione={
          <p>
            Dodici mesi di ricavi e costi, per vedere quando l&apos;attività si ripaga e quanta riserva ti serve per i
            mesi difficili.
          </p>
        }
      />
      <h1 className="hidden text-2xl font-semibold print:block">Budget del primo anno: stima indicativa</h1>
      <BudgetAnno />
    </>
  );
}
