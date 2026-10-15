"use client";

import { useEffect, useRef } from "react";
import { dataSvizzera, percentuale } from "@/data/svizzera";
import {
  calcolaTotali,
  dataIsoValida,
  NOMI_TIPO,
  normalizzaNumeroIva,
  tassoIva,
  type Documento,
} from "@/lib/strumenti/documenti";
import { pagineDelFoglio, type BloccoStampa } from "@/lib/strumenti/impaginazione";
import { importo, numeroSvizzero } from "@/lib/strumenti/numeri";
import { formattaIban, type IndirizzoStrutturato } from "@/lib/strumenti/qr";
import { SezionePagamento } from "./sezione-pagamento";

function righeIndirizzo(ind: IndirizzoStrutturato): string[] {
  const via = [ind.via.trim(), ind.numero.trim()].filter(Boolean).join(" ");
  const localita = [ind.npa.trim(), ind.localita.trim()].filter(Boolean).join(" ");
  const paese = ind.paese.trim().toUpperCase();
  return [via, localita, paese && paese !== "CH" ? paese : ""].filter(Boolean);
}

function data(iso: string) {
  return dataIsoValida(iso) ? dataSvizzera(iso) : "";
}

const PX_PER_MM = 96 / 25.4;

/**
 * Misura il foglio con gli stili di stampa (classe misura-stampa) e calcola
 * quante pagine A4 servono perché la sezione pagamento finisca in fondo
 * all'ultima. I pezzi che non si spezzano sono i figli del corpo e, nella
 * tabella, l'intestazione e ogni riga.
 */
function pagineStampa(articolo: HTMLElement, corpo: HTMLElement): number {
  if (!articolo.querySelector("[data-sezione-pagamento]")) return 1;
  const origine = articolo.getBoundingClientRect().top;
  const mm = (px: number) => px / PX_PER_MM;
  const blocco = (el: Element, inTabella: boolean): BloccoStampa => {
    const r = el.getBoundingClientRect();
    return { alto: mm(r.top - origine), altezza: mm(r.height), inTabella };
  };
  const blocchi: BloccoStampa[] = [];
  let altezzaIntestazioneTabella = 0;
  for (const figlio of Array.from(corpo.children)) {
    const tabella = figlio.querySelector("table");
    if (!tabella) {
      blocchi.push(blocco(figlio, false));
      continue;
    }
    if (tabella.tHead) {
      const intestazione = blocco(tabella.tHead, false);
      altezzaIntestazioneTabella = intestazione.altezza;
      blocchi.push(intestazione);
    }
    for (const corpoTabella of Array.from(tabella.tBodies)) {
      for (const riga of Array.from(corpoTabella.rows)) blocchi.push(blocco(riga, true));
    }
  }
  const stile = getComputedStyle(corpo);
  return pagineDelFoglio(blocchi, {
    margineSopra: mm(Number.parseFloat(stile.paddingTop) || 0),
    margineSotto: mm(Number.parseFloat(stile.paddingBottom) || 0),
    altezzaIntestazioneTabella,
  });
}

/**
 * Prima di stampare fissa l'altezza del foglio a un numero intero di pagine
 * A4 (variabile CSS --pagine): così la sezione pagamento della QR-fattura
 * finisce sul bordo inferiore dell'ultima pagina, come chiedono le linee
 * guida SIX, anche quando le voci occupano più pagine.
 */
function useImpaginazioneStampa() {
  const articoloRef = useRef<HTMLElement>(null);
  const corpoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prima = () => {
      const articolo = articoloRef.current;
      const corpo = corpoRef.current;
      if (!articolo || !corpo) return;
      // All'evento beforeprint valgono ancora gli stili dello schermo: la
      // classe attiva le varianti stampa: il tempo di misurare.
      articolo.classList.add("misura-stampa");
      try {
        articolo.style.setProperty("--pagine", String(pagineStampa(articolo, corpo)));
      } finally {
        articolo.classList.remove("misura-stampa");
      }
    };
    const dopo = () => articoloRef.current?.style.removeProperty("--pagine");
    window.addEventListener("beforeprint", prima);
    window.addEventListener("afterprint", dopo);
    return () => {
      window.removeEventListener("beforeprint", prima);
      window.removeEventListener("afterprint", dopo);
    };
  }, []);

  return { articoloRef, corpoRef };
}

/**
 * Il documento come foglio A4: colori fissi (è carta), font in px per lo
 * schermo e in pt per la stampa (variante stampa:, che vale anche mentre si
 * misura il foglio). La fattura ha in fondo la sezione pagamento: in stampa
 * il foglio è alto un numero intero di pagine e la sezione sta in fondo
 * all'ultima. Il corpo ripete i suoi margini su ogni pagina.
 */
export function AnteprimaDocumento({ doc }: { doc: Documento }) {
  const { articoloRef, corpoRef } = useImpaginazioneStampa();
  const totali = calcolaTotali(doc);
  const e = doc.emittente;
  const conIva = e.ivaIscritto;
  const numeroIva = conIva ? normalizzaNumeroIva(e.numeroIva) : null;
  const tipo = NOMI_TIPO[doc.tipo];
  const valuta = doc.valuta;
  const righe = doc.righe.filter((r, i) => r.descrizione.trim() || totali.righe[i].importo !== 0);

  return (
    <article
      ref={articoloRef}
      aria-label={`${tipo.singolare} ${doc.numero}`}
      className="pagina-foglio mx-auto flex w-full max-w-[210mm] flex-col overflow-hidden rounded-xl border border-border bg-white text-[13px] leading-snug text-[#1c1f24] shadow-sm stampa:min-h-[calc(var(--pagine,1)*297mm)] stampa:w-[210mm] stampa:max-w-none stampa:overflow-visible stampa:rounded-none stampa:border-0 stampa:text-[9.5pt] stampa:shadow-none"
    >
      <div ref={corpoRef} className="flex-1 p-6 sm:p-[14mm] stampa:p-[15mm_16mm_8mm] stampa:box-decoration-clone">
        <header className="flex flex-col gap-6 sm:flex-row sm:justify-between stampa:flex-row stampa:justify-between">
          <div>
            <p className="text-base font-semibold stampa:text-[12pt]">{e.nome || "Il tuo nome e cognome"}</p>
            {righeIndirizzo(e).map((r) => (
              <p key={r}>{r}</p>
            ))}
            {e.email ? <p>{e.email}</p> : null}
            {e.telefono ? <p>{e.telefono}</p> : null}
            {numeroIva ? <p className="mt-1">{numeroIva}</p> : null}
          </div>
          <div className="sm:text-right stampa:text-right">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f5e6b] stampa:text-[18pt]">{tipo.singolare}</h2>
            <dl className="mt-1 grid grid-cols-[auto_auto] justify-start gap-x-3 sm:justify-end stampa:justify-end">
              <dt className="text-[#4b515b]">Numero</dt>
              <dd className="font-medium">{doc.numero}</dd>
              <dt className="text-[#4b515b]">Data</dt>
              <dd>{data(doc.data)}</dd>
              {doc.scadenza ? (
                <>
                  <dt className="text-[#4b515b]">{tipo.scadenza}</dt>
                  <dd>{data(doc.scadenza)}</dd>
                </>
              ) : null}
              {doc.daPreventivo ? (
                <>
                  <dt className="text-[#4b515b]">Preventivo</dt>
                  <dd>{doc.daPreventivo}</dd>
                </>
              ) : null}
            </dl>
          </div>
        </header>

        <section aria-label="Cliente" className="mt-8 sm:ml-auto sm:w-[45%] stampa:ml-auto stampa:w-[45%]">
          <p className="text-[11px] uppercase tracking-wide text-[#4b515b]">Per</p>
          <p className="font-medium">{doc.cliente.nome || "Nome del cliente"}</p>
          {righeIndirizzo(doc.cliente).map((r) => (
            <p key={r}>{r}</p>
          ))}
        </section>

        {doc.oggetto.trim() ? <p className="mt-8 font-semibold">{doc.oggetto}</p> : null}
        {doc.periodoPrestazione.trim() ? (
          <p className={doc.oggetto.trim() ? "mt-1" : "mt-8"}>Prestazione: {doc.periodoPrestazione}</p>
        ) : null}

        <div className="mt-6 overflow-x-auto stampa:overflow-visible">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-[#1c1f24] text-[11px] uppercase tracking-wide text-[#4b515b]">
                <th scope="col" className="py-1.5 pr-2 font-medium">
                  Descrizione
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">
                  Quantità
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">
                  Prezzo
                </th>
                {conIva ? (
                  <th scope="col" className="px-2 py-1.5 text-right font-medium">
                    IVA
                  </th>
                ) : null}
                <th scope="col" className="py-1.5 pl-2 text-right font-medium">
                  Importo
                </th>
              </tr>
            </thead>
            <tbody>
              {righe.length === 0 ? (
                <tr>
                  <td colSpan={conIva ? 5 : 4} className="py-3 text-[#8a909a]">
                    Le voci appariranno qui.
                  </td>
                </tr>
              ) : (
                righe.map((r) => {
                  const c = totali.righe.find((x) => x.id === r.id);
                  return (
                    <tr key={r.id} className="border-b border-[#d6d2c9] align-top break-inside-avoid">
                      <td className="py-1.5 pr-2 whitespace-pre-line">{r.descrizione}</td>
                      <td className="px-2 py-1.5 text-right whitespace-nowrap tabular-nums">
                        {c ? numeroSvizzero(c.quantita, Number.isInteger(c.quantita) ? 0 : 2) : ""} {r.unita}
                      </td>
                      <td className="px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{c ? numeroSvizzero(c.prezzo, 2) : ""}</td>
                      {conIva ? (
                        <td className="px-2 py-1.5 text-right whitespace-nowrap tabular-nums">
                          {percentuale(tassoIva(r.aliquota))}
                        </td>
                      ) : null}
                      <td className="py-1.5 pl-2 text-right whitespace-nowrap tabular-nums">{c ? numeroSvizzero(c.importo, 2) : ""}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <dl className="mt-4 ml-auto w-full max-w-[19rem] text-right tabular-nums break-inside-avoid">
          {conIva ? (
            <>
              <div className="flex justify-between gap-4 py-0.5">
                <dt>Totale senza IVA</dt>
                <dd>{importo(totali.imponibile, 2, valuta)}</dd>
              </div>
              {totali.iva.map((v) => (
                <div key={v.aliquota} className="flex justify-between gap-4 py-0.5">
                  <dt>
                    IVA {percentuale(v.tasso)} su {numeroSvizzero(v.base, 2)}
                  </dt>
                  <dd>{importo(v.imposta, 2, valuta)}</dd>
                </div>
              ))}
            </>
          ) : null}
          {totali.arrotondamento !== 0 ? (
            <div className="flex justify-between gap-4 py-0.5">
              <dt>Arrotondamento</dt>
              <dd>{importo(totali.arrotondamento, 2, valuta)}</dd>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between gap-4 border-t-2 border-[#1c1f24] pt-1.5 text-base font-semibold stampa:text-[11pt]">
            <dt>Totale{conIva ? " IVA inclusa" : ""}</dt>
            <dd>{importo(totali.totale, 2, valuta)}</dd>
          </div>
        </dl>

        {doc.note.trim() ? <p className="mt-6 whitespace-pre-line">{doc.note}</p> : null}

        {doc.tipo === "fattura" ? (
          <p className="mt-6">
            {doc.scadenza ? `Da pagare entro il ${data(doc.scadenza)}` : "Da pagare"}
            {e.iban ? ` sul conto ${formattaIban(e.iban)}` : ""}
            {e.iban && e.nome ? `, intestato a ${e.nome}` : ""}.
          </p>
        ) : doc.scadenza ? (
          <p className="mt-6">Questo preventivo è valido fino al {data(doc.scadenza)}.</p>
        ) : null}
      </div>

      {doc.tipo === "fattura" ? <SezionePagamento doc={doc} /> : null}
    </article>
  );
}
