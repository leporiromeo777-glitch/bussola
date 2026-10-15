import { haContenuto, normalizzaSpazi, type Blocco } from "./blocchi";

/** "3 Quando inizia l'obbligo contributivo?": le domande numerate degli opuscoli AVS. */
const DOMANDA_NUMERATA = /^\d{1,2}\s+[A-ZÀ-ÖØ-Ý«"“].{4,160}$/u;
const PUNTO_ELENCO = /^[•▪●◦–-]\s+/u;
const NUMERO_PAGINA = /^\d{1,3}$/;

/**
 * Trasforma il testo di un PDF (una stringa per pagina, righe separate da
 * "\n", come lo restituisce unpdf) in blocchi. Riconosce le domande numerate
 * e i titoli che le precedono, unisce le righe di uno stesso paragrafo e le
 * parole spezzate con il trattino a fine riga.
 */
export function pagineInBlocchi(pagine: string[]): Blocco[] {
  const righe = pagine.flatMap((pagina) => {
    const linee = pagina.split("\n").map((r) => normalizzaSpazi(r));
    // La prima riga di molte pagine è solo il numero di pagina.
    if (linee.length && NUMERO_PAGINA.test(linee[0] ?? "")) linee.shift();
    return linee.filter((r) => r.length > 0);
  });

  const blocchi: Blocco[] = [];
  let paragrafo = "";
  let tipo: "paragrafo" | "punto" = "paragrafo";

  const chiudi = () => {
    const testo = normalizzaSpazi(paragrafo);
    if (haContenuto(testo)) blocchi.push({ tipo, testo });
    paragrafo = "";
    tipo = "paragrafo";
  };

  for (let i = 0; i < righe.length; i++) {
    const riga = righe[i] ?? "";
    const successiva = righe[i + 1] ?? "";

    if (eDomandaNumerata(riga)) {
      chiudi();
      // Una domanda lunga può continuare sulla riga dopo ("...per tutte" + "le categorie di reddito?").
      let domanda = riga;
      while (!domanda.endsWith("?") && /^\p{Ll}/u.test(righe[i + 1] ?? "") && domanda.length < 200) {
        domanda = unisciRighe(domanda, righe[i + 1] ?? "");
        i++;
      }
      blocchi.push({ tipo: "titolo", livello: 3, testo: domanda });
      continue;
    }
    if (eTitoloDiSezione(riga, successiva)) {
      chiudi();
      blocchi.push({ tipo: "titolo", livello: 2, testo: riga });
      continue;
    }
    if (PUNTO_ELENCO.test(riga)) {
      chiudi();
      tipo = "punto";
      paragrafo = riga.replace(PUNTO_ELENCO, "");
      continue;
    }
    paragrafo = unisciRighe(paragrafo, riga);
  }
  chiudi();
  return blocchi;
}

function eDomandaNumerata(riga: string): boolean {
  if (!DOMANDA_NUMERATA.test(riga)) return false;
  // Le domande finiscono con "?" o senza punteggiatura; le frasi normali con "." o ",".
  return !/[.,;:]$/.test(riga);
}

/** Riga breve senza punteggiatura finale, seguita da una domanda numerata: è il titolo della sezione. */
function eTitoloDiSezione(riga: string, successiva: string): boolean {
  if (riga.length > 70 || /[.,;:?!]$/.test(riga) || !/^\p{Lu}/u.test(riga)) return false;
  return eDomandaNumerata(successiva);
}

/** Unisce una riga al paragrafo, ricomponendo le parole divise a fine riga ("dipen-" + "denti"). */
function unisciRighe(paragrafo: string, riga: string): string {
  if (paragrafo === "") return riga;
  if (/\p{Ll}-$/u.test(paragrafo) && /^\p{Ll}/u.test(riga)) return paragrafo.slice(0, -1) + riga;
  return `${paragrafo} ${riga}`;
}
