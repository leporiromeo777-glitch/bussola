import type { Metadata } from "next";
import { CalcolatoreTariffa } from "@/components/strumenti/tariffa/calcolatore-tariffa";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";

export const metadata: Metadata = {
  title: "Tariffa oraria",
  description:
    "Calcola la tariffa oraria minima per la tua ditta individuale: reddito che vuoi, ore fatturabili, costi fissi e contributi AVS con la tavola scalare ufficiale.",
};

export default function PaginaTariffa() {
  return (
    <>
      <IntestazioneStrumento
        titolo="Tariffa oraria"
        introduzione={
          <p>
            Quanto chiedere all&apos;ora per avere il reddito che vuoi, dopo costi e contributi AVS? Inserisci i
            tuoi numeri: il calcolo si aggiorna mentre scrivi.
          </p>
        }
      />
      <h1 className="hidden text-2xl font-semibold print:block">Tariffa oraria: stima indicativa</h1>
      <CalcolatoreTariffa />
    </>
  );
}
