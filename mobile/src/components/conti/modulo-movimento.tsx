import { useState } from "react";
import { View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import type { CategoriaId, Movimento, TipoMovimento } from "@/lib/conti/tipi";
import { normalizzaData } from "@/lib/lettera/spiegazione";
import { arrotonda, leggiNumero, numeroSvizzero } from "@/lib/strumenti/numeri";
import { CampoTesto, Scelta } from "~/components/campi";
import { Pulsante } from "~/components/ui";
import { categoriePerTipo, type NuovoMovimento } from "~/lib/conti";
import { SPAZIO } from "~/lib/tema";

const TIPI = [
  { valore: "uscita", etichetta: "Uscita" },
  { valore: "entrata", etichetta: "Entrata" },
] as const;

type Bozza = { tipo: TipoMovimento; importo: string; data: string; categoria: CategoriaId; descrizione: string; controparte: string };
type Errori = Partial<Record<"importo" | "data" | "descrizione", string>>;

export function bozzaDa(movimento: Movimento | null, oggi: string): Bozza {
  if (!movimento) {
    return { tipo: "uscita", importo: "", data: dataSvizzera(oggi), categoria: "materiale", descrizione: "", controparte: "" };
  }
  return {
    tipo: movimento.tipo,
    importo: numeroSvizzero(movimento.importo, 2),
    data: dataSvizzera(movimento.data),
    categoria: movimento.categoria,
    descrizione: movimento.descrizione,
    controparte: movimento.controparte ?? "",
  };
}

/** «19.10.2026» → «2026-10-19»; null se non è una data valida. */
function inIso(testo: string): string | null {
  const data = normalizzaData(testo);
  if (!data) return null;
  const [g, m, a] = data.split(".");
  return `${a}-${m}-${g}`;
}

function valida(bozza: Bozza): { errori: Errori; movimento: NuovoMovimento | null } {
  const errori: Errori = {};
  const importo = leggiNumero(bozza.importo);
  if (importo === null || importo <= 0) errori.importo = "Scrivi l'importo in franchi, per esempio 48.50.";
  else if (importo >= 10_000_000) errori.importo = "L'importo sembra troppo alto: controllalo.";
  const data = inIso(bozza.data);
  if (!data) errori.data = "Scrivi la data così: 19.10.2026.";
  const descrizione = bozza.descrizione.trim();
  if (!descrizione) errori.descrizione = "Scrivi in poche parole di cosa si tratta.";
  if (Object.keys(errori).length > 0 || importo === null || !data) return { errori, movimento: null };
  return {
    errori,
    movimento: {
      tipo: bozza.tipo,
      importo: arrotonda(importo, 2),
      data,
      categoria: bozza.categoria,
      descrizione: descrizione.slice(0, 200),
      controparte: bozza.controparte.trim() || null,
    },
  };
}

/** Il modulo per aggiungere o correggere un movimento. */
export function ModuloMovimento({
  iniziale,
  titoloSalva,
  onSalva,
  onAnnulla,
}: {
  iniziale: Bozza;
  titoloSalva: string;
  /** Restituisce true se il salvataggio è andato a buon fine. */
  onSalva: (movimento: NuovoMovimento) => Promise<boolean>;
  onAnnulla?: () => void;
}) {
  const [bozza, setBozza] = useState(iniziale);
  const [errori, setErrori] = useState<Errori>({});
  const [attesa, setAttesa] = useState(false);
  const categorie = categoriePerTipo(bozza.tipo);

  function cambia<K extends keyof Bozza>(chiave: K, valore: Bozza[K]) {
    setBozza((b) => ({ ...b, [chiave]: valore }));
  }

  async function salva() {
    const esito = valida(bozza);
    setErrori(esito.errori);
    if (!esito.movimento) return;
    setAttesa(true);
    const ok = await onSalva(esito.movimento);
    setAttesa(false);
    if (ok && !onAnnulla) {
      setBozza((b) => ({ ...iniziale, tipo: b.tipo, categoria: b.categoria }));
    }
  }

  return (
    <View style={{ gap: SPAZIO.l }}>
      <Scelta
        etichetta="È un'entrata o un'uscita?"
        opzioni={TIPI}
        valore={bozza.tipo}
        onCambia={(tipo) =>
          setBozza((b) => ({
            ...b,
            tipo,
            categoria: categoriePerTipo(tipo).some((c) => c.id === b.categoria) ? b.categoria : categoriePerTipo(tipo)[0].id,
          }))
        }
      />
      <CampoTesto
        etichetta="Importo in CHF"
        valore={bozza.importo}
        onCambia={(v) => cambia("importo", v)}
        segnaposto="48.50"
        tastiera="decimal-pad"
        errore={errori.importo}
      />
      <CampoTesto
        etichetta="Data"
        valore={bozza.data}
        onCambia={(v) => cambia("data", v)}
        segnaposto="19.10.2026"
        tastiera="numbers-and-punctuation"
        aiuto="Giorno.mese.anno"
        errore={errori.data}
      />
      <CampoTesto
        etichetta="Descrizione"
        valore={bozza.descrizione}
        onCambia={(v) => cambia("descrizione", v)}
        segnaposto={bozza.tipo === "uscita" ? "Per esempio: carta per la stampante" : "Per esempio: lavoro di giardinaggio"}
        errore={errori.descrizione}
      />
      <CampoTesto
        etichetta={bozza.tipo === "uscita" ? "Fornitore (se vuoi)" : "Cliente (se vuoi)"}
        valore={bozza.controparte}
        onCambia={(v) => cambia("controparte", v)}
      />
      <Scelta
        etichetta="Categoria"
        opzioni={categorie.map((c) => ({ valore: c.id as CategoriaId, etichetta: c.etichetta }))}
        valore={bozza.categoria}
        onCambia={(v) => cambia("categoria", v)}
      />
      <Pulsante titolo={titoloSalva} onPress={() => void salva()} caricamento={attesa} />
      {onAnnulla ? <Pulsante titolo="Annulla" variante="secondario" onPress={onAnnulla} disabilitato={attesa} /> : null}
    </View>
  );
}
