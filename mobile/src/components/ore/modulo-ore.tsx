import { useState } from "react";
import { View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { LUNGHEZZE_ORE, MINUTI_MASSIMI } from "@/lib/clienti/limiti";
import { inMinuti, oreEMinuti } from "@/lib/clienti/ore";
import type { Cliente, VoceOre } from "@/lib/clienti/tipi";
import { normalizzaData } from "@/lib/lettera/spiegazione";
import { arrotonda, leggiNumero, numeroSvizzero } from "@/lib/strumenti/numeri";
import { CampoTesto, Scelta } from "~/components/campi";
import { Pulsante, Testo } from "~/components/ui";
import type { DatiVoce } from "~/lib/ore";
import { SPAZIO, useColori } from "~/lib/tema";
import { RigaChip } from "./chip";

const DURATE = [
  { chiave: "15", testo: "15 min" },
  { chiave: "30", testo: "30 min" },
  { chiave: "60", testo: "1 h" },
  { chiave: "120", testo: "2 h" },
  { chiave: "240", testo: "4 h" },
  { chiave: "480", testo: "8 h" },
] as const;

type Bozza = { clienteId: string; data: string; ore: string; minuti: string; descrizione: string; tariffa: string };
type Errori = Partial<Record<"durata" | "data" | "tariffa", string>>;

const testoTariffa = (t: number | null | undefined) => (t === null || t === undefined ? "" : numeroSvizzero(t, 2).replace(/'/g, ""));

/** Il giorno prima, ISO (ora locale). */
function ieri(oggi: string): string {
  const d = new Date(`${oggi}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** «19.10.2026» → «2026-10-19»; null se non è una data valida. */
function inIso(testo: string): string | null {
  const data = normalizzaData(testo);
  if (!data) return null;
  const [g, m, a] = data.split(".");
  return `${a}-${m}-${g}`;
}

export function bozzaOre(clienti: readonly Cliente[], oggi: string, voce?: VoceOre | null, clienteId?: string): Bozza {
  if (voce) {
    const { ore, minuti } = oreEMinuti(voce.minuti);
    return {
      clienteId: voce.clienteId,
      data: dataSvizzera(voce.data),
      ore: String(ore),
      minuti: String(minuti),
      descrizione: voce.descrizione,
      tariffa: testoTariffa(voce.tariffa),
    };
  }
  const cliente = clienti.find((c) => c.id === clienteId) ?? clienti[0];
  return { clienteId: cliente?.id ?? "", data: dataSvizzera(oggi), ore: "", minuti: "", descrizione: "", tariffa: testoTariffa(cliente?.tariffa) };
}

function intero(testo: string): number | null {
  const t = testo.trim();
  if (t === "") return 0;
  return /^\d{1,4}$/.test(t) ? Number(t) : null;
}

function valida(b: Bozza): { errori: Errori; voce: DatiVoce | null } {
  const errori: Errori = {};
  const ore = intero(b.ore);
  const minuti = intero(b.minuti);
  const totale = ore === null || minuti === null ? null : inMinuti(ore, minuti);
  if (totale === null || totale < 1 || totale > MINUTI_MASSIMI) {
    errori.durata = "Scrivi quanto hai lavorato: ore (0-24) e minuti (0-59), oppure tocca una durata.";
  }
  const data = inIso(b.data);
  if (!data) errori.data = "Scrivi la data così: 19.10.2026.";
  const tariffa = b.tariffa.trim() ? leggiNumero(b.tariffa) : null;
  if (b.tariffa.trim() && (tariffa === null || tariffa < 0)) errori.tariffa = "Scrivi la tariffa in franchi, per esempio 80 o 92.50.";
  if (Object.keys(errori).length > 0 || totale === null || !data) return { errori, voce: null };
  return {
    errori,
    voce: {
      clienteId: b.clienteId,
      data,
      minuti: totale,
      descrizione: b.descrizione.trim().slice(0, LUNGHEZZE_ORE.descrizione),
      tariffa: tariffa === null ? null : arrotonda(tariffa, 2),
    },
  };
}

/** Segna le ore in pochi tocchi: cliente, giorno, durata. Serve anche per correggere una voce. */
export function ModuloOre({
  clienti,
  oggi,
  iniziale,
  titoloSalva,
  onSalva,
  onAnnulla,
}: {
  clienti: readonly Cliente[];
  oggi: string;
  iniziale: Bozza;
  titoloSalva: string;
  /** Restituisce true se il salvataggio è andato a buon fine. */
  onSalva: (voce: DatiVoce) => Promise<boolean>;
  onAnnulla?: () => void;
}) {
  const c = useColori();
  const [bozza, setBozza] = useState(iniziale);
  const [errori, setErrori] = useState<Errori>({});
  const [attesa, setAttesa] = useState(false);
  const cambia = <K extends keyof Bozza>(chiave: K, valore: Bozza[K]) => setBozza((b) => ({ ...b, [chiave]: valore }));

  const giorni = [
    { chiave: dataSvizzera(oggi), testo: "Oggi" },
    { chiave: dataSvizzera(ieri(oggi)), testo: "Ieri" },
  ];
  const ore = intero(bozza.ore);
  const minuti = intero(bozza.minuti);
  const durataAttiva = ore !== null && minuti !== null ? String(ore * 60 + minuti) : null;

  async function salva() {
    const esito = valida(bozza);
    setErrori(esito.errori);
    if (!esito.voce) return;
    setAttesa(true);
    const ok = await onSalva(esito.voce);
    setAttesa(false);
    if (ok && !onAnnulla) setBozza((b) => ({ ...b, ore: "", minuti: "", descrizione: "" }));
  }

  return (
    <View style={{ gap: SPAZIO.l }}>
      <Scelta
        etichetta="Cliente"
        opzioni={clienti.map((x) => ({ valore: x.id, etichetta: x.nome }))}
        valore={bozza.clienteId}
        onCambia={(clienteId) =>
          setBozza((b) => ({ ...b, clienteId, tariffa: testoTariffa(clienti.find((x) => x.id === clienteId)?.tariffa) }))
        }
      />
      <View style={{ gap: SPAZIO.s }}>
        <Testo variante="forte">Giorno</Testo>
        <RigaChip etichetta="Giorno" opzioni={giorni} attiva={bozza.data} onScegli={(d) => cambia("data", d)} />
        <CampoTesto
          etichetta="Data"
          valore={bozza.data}
          onCambia={(v) => cambia("data", v)}
          segnaposto="19.10.2026"
          tastiera="numbers-and-punctuation"
          aiuto="Giorno.mese.anno"
          errore={errori.data}
        />
      </View>
      <View style={{ gap: SPAZIO.s }}>
        <Testo variante="forte">Quanto hai lavorato</Testo>
        <RigaChip
          etichetta="Durata"
          opzioni={DURATE}
          attiva={durataAttiva}
          onScegli={(m) => {
            const { ore: h, minuti: min } = oreEMinuti(Number(m));
            setBozza((b) => ({ ...b, ore: String(h), minuti: String(min) }));
          }}
        />
        <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
          <View style={{ flex: 1 }}>
            <CampoTesto etichetta="Ore" valore={bozza.ore} onCambia={(v) => cambia("ore", v)} segnaposto="0" tastiera="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <CampoTesto
              etichetta="Minuti"
              valore={bozza.minuti}
              onCambia={(v) => cambia("minuti", v)}
              segnaposto="0"
              tastiera="decimal-pad"
            />
          </View>
        </View>
        {errori.durata ? (
          <Testo variante="piccolo" colore={c.pericolo} accessibilityLiveRegion="polite">
            {errori.durata}
          </Testo>
        ) : null}
      </View>
      <CampoTesto
        etichetta="Cosa hai fatto (se vuoi)"
        valore={bozza.descrizione}
        onCambia={(v) => cambia("descrizione", v)}
        segnaposto="Per esempio: sviluppo del sito"
      />
      <CampoTesto
        etichetta="Tariffa oraria in CHF"
        valore={bozza.tariffa}
        onCambia={(v) => cambia("tariffa", v)}
        segnaposto="0.00"
        tastiera="decimal-pad"
        aiuto="Quella del cliente: cambiala se per questo lavoro è diversa. Se sei iscritto all'IVA, senza IVA."
        errore={errori.tariffa}
      />
      <Pulsante titolo={titoloSalva} onPress={() => void salva()} caricamento={attesa} />
      {onAnnulla ? <Pulsante titolo="Annulla" variante="secondario" onPress={onAnnulla} disabilitato={attesa} /> : null}
    </View>
  );
}
