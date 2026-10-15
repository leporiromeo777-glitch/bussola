"use client";

import type { ReactNode } from "react";
import type { CampoIndirizzo, IndirizzoStrutturato } from "@/lib/strumenti/qr";
import { CampoTesto } from "../ui";

/** Indirizzo strutturato (come lo vuole la QR-fattura): via e numero separati, NPA, località, paese. */
export function CampiIndirizzo({
  prefissoId,
  valore,
  onCambia,
  errori = {},
  etichettaNome,
  aiutoNome,
  autoCompleta = false,
}: {
  prefissoId: string;
  valore: IndirizzoStrutturato;
  onCambia: (modifica: Partial<IndirizzoStrutturato>) => void;
  errori?: Partial<Record<CampoIndirizzo, string>>;
  etichettaNome: string;
  aiutoNome?: ReactNode;
  /** Suggerimenti del browser (solo per i propri dati). */
  autoCompleta?: boolean;
}) {
  const ac = (valore: string) => (autoCompleta ? valore : "off");
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <CampoTesto
        id={`${prefissoId}-nome`}
        etichetta={etichettaNome}
        valore={valore.nome}
        onCambia={(v) => onCambia({ nome: v })}
        errore={errori.nome}
        aiuto={aiutoNome}
        autoComplete={ac("name")}
        maxLength={140}
        obbligatorio
        className="sm:col-span-6"
      />
      <CampoTesto
        id={`${prefissoId}-via`}
        etichetta="Via"
        valore={valore.via}
        onCambia={(v) => onCambia({ via: v })}
        errore={errori.via}
        autoComplete={ac("address-line1")}
        maxLength={140}
        className="sm:col-span-4"
      />
      <CampoTesto
        id={`${prefissoId}-numero`}
        etichetta="Numero"
        valore={valore.numero}
        onCambia={(v) => onCambia({ numero: v })}
        errore={errori.numero}
        maxLength={32}
        className="sm:col-span-2"
      />
      <CampoTesto
        id={`${prefissoId}-npa`}
        etichetta="NPA"
        valore={valore.npa}
        onCambia={(v) => onCambia({ npa: v })}
        errore={errori.npa}
        autoComplete={ac("postal-code")}
        maxLength={32}
        obbligatorio
        className="sm:col-span-2"
      />
      <CampoTesto
        id={`${prefissoId}-localita`}
        etichetta="Località"
        valore={valore.localita}
        onCambia={(v) => onCambia({ localita: v })}
        errore={errori.localita}
        autoComplete={ac("address-level2")}
        maxLength={70}
        obbligatorio
        className="sm:col-span-3"
      />
      <CampoTesto
        id={`${prefissoId}-paese`}
        etichetta="Paese"
        valore={valore.paese}
        onCambia={(v) => onCambia({ paese: v.toUpperCase().slice(0, 2) })}
        errore={errori.paese}
        aiuto="2 lettere: CH, IT…"
        autoComplete={ac("country")}
        maxLength={2}
        className="sm:col-span-1"
      />
    </div>
  );
}
