/**
 * «Crea la fattura» dalle ore: da un cliente e dalle sue voci a quello che
 * serve allo strumento fattura (indirizzo, oggetto, periodo, righe).
 *
 * Il passaggio avviene nell'indirizzo della pagina, dopo il «#»
 * (/strumenti/fattura#ore=…): il browser non manda quella parte al server,
 * quindi i dati del cliente vanno dritti allo strumento fattura, che li
 * salva solo nel browser come le altre fatture. Lo stesso link lo apre il
 * sito e lo apre l'app (nel browser). I tuoi dati (nome, IBAN, IVA) non
 * passano dal link: lo strumento usa quelli salvati nel browser.
 *
 * Logica pura, senza browser né Node.
 */
import { z } from "zod";
import { dataSvizzera } from "@/data/svizzera";
import { calcolaRiga, nuovoDocumento, type Contesto, type Documento, type Emittente } from "@/lib/strumenti/documenti";
import { daCentesimi, inCentesimi } from "@/lib/strumenti/numeri";
import { caratteriNonAmmessi, LUNGHEZZE_INDIRIZZO_QR, type IndirizzoStrutturato } from "@/lib/strumenti/qr";
import { RIGHE_MASSIME_FATTURA } from "./limiti";
import { nomeMese, prezzoTesto, quantitaOre, tariffaVoce } from "./ore";
import type { Cliente, DettaglioFattura, Mese, Precompilazione, RigaPrecompilata, VoceOre } from "./tipi";

/** Pagina dello strumento fattura e nome del parametro dopo il «#». */
export const PAGINA_FATTURA = "/strumenti/fattura";
export const PARAMETRO_ORE = "ore";

/** Una riga per voce si può solo fino a RIGHE_MASSIME_FATTURA voci. */
export function rigaPerVoceAmmessa(numeroVoci: number): boolean {
  return numeroVoci <= RIGHE_MASSIME_FATTURA;
}

function indirizzo(c: Cliente): IndirizzoStrutturato {
  return { nome: c.nome, via: c.via, numero: c.numero, npa: c.npa, localita: c.localita, paese: c.paese };
}

/** Dal più vecchio; a pari data, in ordine di descrizione (così il risultato non dipende dall'ordine ricevuto). */
function inOrdine(voci: readonly VoceOre[]): VoceOre[] {
  return [...voci].sort((a, b) => a.data.localeCompare(b.data) || a.descrizione.localeCompare(b.descrizione, "it"));
}

/** «15.10.2026» se è un giorno solo, altrimenti «02.10.2026 – 28.10.2026». */
export function periodo(voci: readonly Pick<VoceOre, "data">[]): string {
  if (voci.length === 0) return "";
  const date = voci.map((v) => v.data).sort();
  const [prima, ultima] = [date[0], date[date.length - 1]];
  return prima === ultima ? dataSvizzera(prima) : `${dataSvizzera(prima)} – ${dataSvizzera(ultima)}`;
}

function rigaOre(descrizione: string, minuti: number, tariffa: number | null): RigaPrecompilata {
  return { descrizione, quantita: quantitaOre(minuti), unita: "h", prezzo: prezzoTesto(tariffa) };
}

/**
 * Prepara la fattura delle voci di un cliente.
 * - "voci": una riga per voce, con data e descrizione;
 * - "riepilogo": una riga sola con il totale delle ore (una per tariffa, se
 *   le voci hanno tariffe diverse).
 * La tariffa di una voce è la sua, altrimenti quella del cliente; senza
 * tariffa il prezzo resta da scrivere nello strumento.
 */
export function precompilaFattura({
  id,
  cliente,
  voci,
  mese,
  dettaglio,
}: {
  id: string;
  cliente: Cliente;
  voci: readonly VoceOre[];
  mese: Mese;
  dettaglio: DettaglioFattura;
}): Precompilazione {
  const ordinate = inOrdine(voci);
  const quando = periodo(ordinate);
  let righe: RigaPrecompilata[];
  if (dettaglio === "voci") {
    righe = ordinate.map((v) =>
      rigaOre(`${dataSvizzera(v.data)} – ${v.descrizione.trim() || "Lavoro"}`, v.minuti, tariffaVoce(v, cliente)),
    );
  } else {
    const perTariffa = new Map<number | null, number>();
    for (const v of ordinate) {
      const tariffa = tariffaVoce(v, cliente);
      perTariffa.set(tariffa, (perTariffa.get(tariffa) ?? 0) + v.minuti);
    }
    const descrizione = ordinate.length > 0 && ordinate[0].data === ordinate[ordinate.length - 1].data
      ? `Lavoro del ${quando}`
      : `Lavoro dal ${quando.replace(" – ", " al ")}`;
    righe = [...perTariffa.entries()].map(([tariffa, minuti]) => rigaOre(descrizione, minuti, tariffa));
  }
  return {
    id,
    cliente: indirizzo(cliente),
    oggetto: `Ore di lavoro, ${nomeMese(mese)}`,
    periodoPrestazione: quando,
    righe,
  };
}

/** Totale delle righe come lo calcola lo strumento fattura (senza IVA). */
export function totalePrecompilazione(p: Pick<Precompilazione, "righe">): { importo: number; senzaPrezzo: number } {
  let centesimi = 0;
  let senzaPrezzo = 0;
  for (const r of p.righe) {
    if (!r.prezzo) {
      senzaPrezzo++;
      continue;
    }
    centesimi += inCentesimi(calcolaRiga({ id: "", aliquota: "normale" as const, ...r }).importo);
  }
  return { importo: daCentesimi(centesimi), senzaPrezzo };
}

/* ------------------------------------------------------------------ */
/* Link verso lo strumento fattura                                     */
/* ------------------------------------------------------------------ */

/** Percorso dello strumento fattura con i dati dopo il «#»: /strumenti/fattura#ore=… */
export function percorsoFatturaDaOre(p: Precompilazione): string {
  return `${PAGINA_FATTURA}#${PARAMETRO_ORE}=${encodeURIComponent(JSON.stringify(p))}`;
}

const campoIndirizzo = (campo: keyof IndirizzoStrutturato, minimo = 0) =>
  z
    .string()
    .min(minimo)
    .max(LUNGHEZZE_INDIRIZZO_QR[campo])
    .refine((v) => caratteriNonAmmessi(v).length === 0);

const testo = (massimo: number) => z.string().max(massimo);

/** Quello che arriva dal link: controllato come i dati di un altro, con gli stessi limiti dello strumento. */
export const schemaPrecompilazione = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9-]{8,60}$/),
    cliente: z
      .object({
        nome: campoIndirizzo("nome", 1),
        via: campoIndirizzo("via"),
        numero: campoIndirizzo("numero"),
        npa: campoIndirizzo("npa"),
        localita: campoIndirizzo("localita"),
        paese: z.string().regex(/^[A-Z]{2}$/),
      })
      .strict(),
    oggetto: testo(200),
    periodoPrestazione: testo(120),
    righe: z
      .array(
        z
          .object({ descrizione: testo(500), quantita: testo(30), unita: testo(30), prezzo: testo(30) })
          .strict(),
      )
      .min(1)
      .max(RIGHE_MASSIME_FATTURA),
  })
  .strict() satisfies z.ZodType<Precompilazione>;

export type LetturaLink = { ok: true; dati: Precompilazione } | { ok: false };

/**
 * Legge i dati dal «#» dell'indirizzo («#ore=…»). Null se il link non porta
 * ore; { ok: false } se i dati sono rovinati o non validi.
 */
export function leggiPrecompilazione(hash: string): LetturaLink | null {
  const parametri = new URLSearchParams(hash.replace(/^#/, ""));
  const grezzo = parametri.get(PARAMETRO_ORE);
  if (grezzo === null) return null;
  if (grezzo.length > 200_000) return { ok: false };
  try {
    const letto = schemaPrecompilazione.safeParse(JSON.parse(grezzo));
    return letto.success ? { ok: true, dati: letto.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * La fattura nuova nello strumento: i tuoi dati dal profilo salvato nel
 * browser, il cliente e le righe dalle ore, numero e date come una fattura
 * nuova. L'id è quello della precompilazione: lo stesso link non crea due
 * fatture.
 */
export function documentoDaPrecompilazione(
  p: Precompilazione,
  emittente: Emittente,
  documenti: readonly Documento[],
  c: Contesto,
): Documento {
  const base = nuovoDocumento("fattura", emittente, documenti, c);
  return {
    ...base,
    id: p.id,
    cliente: { ...p.cliente },
    oggetto: p.oggetto,
    periodoPrestazione: p.periodoPrestazione,
    righe: p.righe.map((r) => ({ id: c.idRiga(), ...r, aliquota: "normale" as const })),
  };
}
