import { emittenteVuoto, type Emittente } from "@/lib/strumenti/documenti";
import { CaricamentoFatture, ConAccesso, StatoSalvataggio } from "~/components/fatture/accesso";
import { ModuloEmittente } from "~/components/fatture/modulo-emittente";
import { Schermata, Testo } from "~/components/ui";
import { archivioFatture, useArchivioFatture } from "~/lib/fatture";

/** I tuoi dati per preventivi e fatture, salvati nell'account (gli stessi del sito). */
export default function ProfiloEmittente() {
  return (
    <ConAccesso>
      <Modulo />
    </ConAccesso>
  );
}

function Modulo() {
  const stato = useArchivioFatture();
  if (stato.caricamento !== "pronto") return <CaricamentoFatture stato={stato} />;
  const valore = stato.emittente ?? emittenteVuoto();
  const cambia = (modifica: Partial<Emittente>) => archivioFatture.aggiornaEmittente((p) => ({ ...(p ?? emittenteVuoto()), ...modifica }));
  return (
    <Schermata>
      <Testo attenuato>
        Li usiamo per i prossimi preventivi e fatture, sul telefono e sul sito. I documenti già fatti tengono i dati di quando
        li hai creati: li cambi da ogni documento.
      </Testo>
      <ModuloEmittente valore={valore} onCambia={cambia} />
      <StatoSalvataggio stato={stato} />
    </Schermata>
  );
}
