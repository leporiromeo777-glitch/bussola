import type { Metadata } from "next";
import { GestioneDocumenti } from "@/components/strumenti/documenti/gestione-documenti";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";

export const metadata: Metadata = {
  title: "Fattura con QR-fattura",
  description:
    "Prepara una fattura con la sezione pagamento QR svizzera: IBAN o QR-IBAN, riferimento, indirizzi strutturati e IVA solo se sei iscritto.",
};

export default async function PaginaFattura({ searchParams }: PageProps<"/strumenti/fattura">) {
  const { doc } = await searchParams;
  return (
    <>
      <IntestazioneStrumento
        titolo="Fattura con QR-fattura"
        introduzione={
          <p>
            Compila i tuoi dati, il cliente e le voci: la sezione pagamento con il codice QR si crea da sola. Stampala o
            salvala in PDF e mandala al cliente.
          </p>
        }
      />
      <GestioneDocumenti tipo="fattura" idIniziale={typeof doc === "string" ? doc : null} />
    </>
  );
}
