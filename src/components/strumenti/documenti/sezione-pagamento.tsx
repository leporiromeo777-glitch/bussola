"use client";

import { useMemo } from "react";
import type { Documento } from "@/lib/strumenti/documenti";
import { sezionePagamentoSvg } from "@/lib/strumenti/qr-svg";

/** La sezione pagamento in fondo alla fattura, oppure l'elenco di cosa manca. */
export function SezionePagamento({ doc }: { doc: Documento }) {
  const esito = useMemo(() => sezionePagamentoSvg(doc), [doc]);

  if (!esito.ok) {
    return (
      <div className="border-t-2 border-dashed border-[#d6d2c9] p-6 text-sm text-[#4b515b] print:hidden">
        <p className="font-semibold text-[#1c1f24]">Qui apparirà la sezione pagamento con il codice QR. Manca ancora:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {esito.errori.map((e) => (
            <li key={`${e.campo}-${e.messaggio}`}>{e.messaggio}</li>
          ))}
        </ul>
      </div>
    );
  }

  // L'SVG viene da swissqrbill, che fa l'escape dei testi inseriti.
  return (
    <div
      className="aspect-[2/1] w-full break-inside-avoid print:h-[105mm] print:w-[210mm]"
      dangerouslySetInnerHTML={{ __html: esito.svg }}
    />
  );
}
