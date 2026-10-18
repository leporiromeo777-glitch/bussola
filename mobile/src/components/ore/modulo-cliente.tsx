import { useState } from "react";
import { View } from "react-native";
import type { Cliente } from "@/lib/clienti/tipi";
import { arrotonda, leggiNumero, numeroSvizzero } from "@/lib/strumenti/numeri";
import { CampoTesto } from "~/components/campi";
import { Pulsante, Testo } from "~/components/ui";
import type { DatiCliente } from "~/lib/ore";
import { SPAZIO } from "~/lib/tema";

type Bozza = Record<"nome" | "via" | "numero" | "npa" | "localita" | "paese" | "email" | "tariffa", string>;

export function bozzaCliente(c?: Cliente | null): Bozza {
  return {
    nome: c?.nome ?? "",
    via: c?.via ?? "",
    numero: c?.numero ?? "",
    npa: c?.npa ?? "",
    localita: c?.localita ?? "",
    paese: c?.paese ?? "CH",
    email: c?.email ?? "",
    tariffa: c?.tariffa === null || c?.tariffa === undefined ? "" : numeroSvizzero(c.tariffa, 2).replace(/'/g, ""),
  };
}

/** Il modulo di un cliente: indirizzo strutturato come nella QR-fattura, email e tariffa facoltative. */
export function ModuloCliente({
  iniziale,
  titoloSalva,
  onSalva,
  onAnnulla,
}: {
  iniziale: Bozza;
  titoloSalva: string;
  onSalva: (dati: DatiCliente) => Promise<boolean>;
  onAnnulla?: () => void;
}) {
  const [bozza, setBozza] = useState(iniziale);
  const [errori, setErrori] = useState<Partial<Record<"nome" | "tariffa", string>>>({});
  const [attesa, setAttesa] = useState(false);
  const cambia = <K extends keyof Bozza>(chiave: K, valore: Bozza[K]) => setBozza((b) => ({ ...b, [chiave]: valore }));

  async function salva() {
    const nuovi: typeof errori = {};
    if (!bozza.nome.trim()) nuovi.nome = "Scrivi il nome del cliente.";
    const tariffa = bozza.tariffa.trim() ? leggiNumero(bozza.tariffa) : null;
    if (bozza.tariffa.trim() && (tariffa === null || tariffa < 0)) nuovi.tariffa = "Scrivi la tariffa in franchi, per esempio 80 o 92.50.";
    setErrori(nuovi);
    if (Object.keys(nuovi).length > 0) return;
    setAttesa(true);
    const ok = await onSalva({
      nome: bozza.nome.trim(),
      via: bozza.via.trim(),
      numero: bozza.numero.trim(),
      npa: bozza.npa.trim(),
      localita: bozza.localita.trim(),
      paese: bozza.paese.trim().toUpperCase() || "CH",
      email: bozza.email.trim() || null,
      tariffa: tariffa === null ? null : arrotonda(tariffa, 2),
    });
    setAttesa(false);
    if (ok && !onAnnulla) setBozza(bozzaCliente());
  }

  return (
    <View style={{ gap: SPAZIO.l }}>
      <CampoTesto
        etichetta="Nome del cliente"
        valore={bozza.nome}
        onCambia={(v) => cambia("nome", v)}
        aiuto="Persona o ditta, come va scritto in fattura."
        errore={errori.nome}
      />
      <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
        <View style={{ flex: 3 }}>
          <CampoTesto etichetta="Via" valore={bozza.via} onCambia={(v) => cambia("via", v)} />
        </View>
        <View style={{ flex: 1 }}>
          <CampoTesto etichetta="Numero" valore={bozza.numero} onCambia={(v) => cambia("numero", v)} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
        <View style={{ flex: 1 }}>
          <CampoTesto etichetta="NPA" valore={bozza.npa} onCambia={(v) => cambia("npa", v)} tastiera="numbers-and-punctuation" />
        </View>
        <View style={{ flex: 2 }}>
          <CampoTesto etichetta="Località" valore={bozza.localita} onCambia={(v) => cambia("localita", v)} />
        </View>
      </View>
      <CampoTesto
        etichetta="Paese"
        valore={bozza.paese}
        onCambia={(v) => cambia("paese", v.toUpperCase().slice(0, 2))}
        aiuto="Il codice di 2 lettere: CH, IT…"
      />
      <Testo variante="piccolo" attenuato>
        Perché l&apos;indirizzo del cliente vada nella QR-fattura servono almeno NPA, località e paese.
      </Testo>
      <CampoTesto etichetta="Email (se vuoi)" valore={bozza.email} onCambia={(v) => cambia("email", v)} />
      <CampoTesto
        etichetta="Tariffa oraria in CHF (se vuoi)"
        valore={bozza.tariffa}
        onCambia={(v) => cambia("tariffa", v)}
        segnaposto="0.00"
        tastiera="decimal-pad"
        aiuto="La proponiamo quando segni le ore."
        errore={errori.tariffa}
      />
      <Pulsante titolo={titoloSalva} onPress={() => void salva()} caricamento={attesa} />
      {onAnnulla ? <Pulsante titolo="Annulla" variante="secondario" onPress={onAnnulla} disabilitato={attesa} /> : null}
    </View>
  );
}
