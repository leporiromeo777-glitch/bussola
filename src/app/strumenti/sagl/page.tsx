import type { Metadata } from "next";
import { ModuloSagl } from "@/components/strumenti/fondazione-sagl/modulo-sagl";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";

export const metadata: Metadata = {
  title: "Fondare una Sagl",
  description:
    "Prepara i dati per fondare una Sagl con i soci (capitale, quote, chi dirige, banca) e scarica in PDF la scheda per il notaio e una bozza dello statuto, con le fonti di legge.",
};

export default function PaginaSagl() {
  return (
    <>
      <IntestazioneStrumento
        titolo="Fondare una Sagl"
        introduzione={
          <p>
            Scrivi i dati della società e dei soci. Bleo controlla le regole della legge e prepara due PDF da portare al
            notaio e al fiduciario: la scheda di preparazione e una bozza dello statuto.
          </p>
        }
      />
      <ModuloSagl />
    </>
  );
}
