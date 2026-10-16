"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useProprietarioLocale, useRisposteLocali } from "@/components/percorso/usa-archivio";
import { analizzaBozza, leggiBozzaGrezza } from "@/lib/percorso/bozza";
import { scegliRisposte, type DatiAccount } from "@/lib/percorso/sincronizza";
import { Questionario } from "./questionario";
import { Racconto } from "./racconto";

const nessunaIscrizione = () => () => {};

/**
 * Prima schermata del questionario: «Racconta a Bleo» (se disponibile) oppure
 * le 10 domande. Chi ha già iniziato o ha già risposto va dritto alle domande.
 */
export function InizioQuestionario({
  account,
  raccontoDisponibile,
}: {
  account: DatiAccount;
  raccontoDisponibile: boolean;
}) {
  const grezzo = useSyncExternalStore(nessunaIscrizione, leggiBozzaGrezza, () => null);
  const bozza = useMemo(() => analizzaBozza(grezzo), [grezzo]);
  const precedenti = scegliRisposte(account, useRisposteLocali(), useProprietarioLocale()).risposte;
  const [scelta, setScelta] = useState<"racconto" | "domande" | null>(null);
  // Cambia dopo «Continua»: il questionario riparte e legge la bozza con le risposte capite.
  const [giro, setGiro] = useState(0);

  const modo = scelta ?? (raccontoDisponibile && !bozza && !precedenti ? "racconto" : "domande");
  if (modo === "racconto") {
    return (
      <Racconto
        onContinua={() => {
          setGiro((g) => g + 1);
          setScelta("domande");
        }}
        onDomande={() => setScelta("domande")}
      />
    );
  }
  return <Questionario key={giro} account={account} />;
}
