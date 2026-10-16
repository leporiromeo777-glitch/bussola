/**
 * «I tuoi conti»: riepilogo dell'anno e avvisi con le fonti.
 * Logica pura: la usano la route GET /api/conti, la pagina e l'app.
 *
 * Regole:
 * - contano nei totali solo i movimenti confermati con la data nell'anno;
 * - «daConfermare» conta tutte le voci da confermare ricevute, anche con la
 *   data di un altro anno (finché non le confermi non contano);
 * - una fattura non pagata è «scaduta» dal giorno dopo la scadenza; fatture
 *   aperte e scadute contano anche se sono di un anno precedente;
 * - gli avvisi citano soglie e fonti da src/data/svizzera.ts.
 */
import { chf, regole, fonti as fontiSvizzera, type Fonte as FonteDato } from "@/data/svizzera";
import { daCentesimi, inCentesimi } from "./importi";
import type { AvvisoConti, CategoriaId, FatturaEmessa, Fonte, Movimento, Riepilogo, StatoFattura } from "./tipi";

/**
 * Da quale frazione della soglia IVA avvisare che le entrate «si avvicinano».
 * Non è un valore di legge: è solo quando Bleo comincia ad avvisarti.
 */
export const QUOTA_AVVICINAMENTO_IVA = 0.8;

const fonte = (f: FonteDato): Fonte => ({ titolo: f.titolo, url: f.url });

/** Stato di una fattura oggi: pagata, scaduta (non pagata e scadenza passata) o aperta. */
export function statoFattura(f: { pagataIl: string | null; scadenza: string | null }, oggi: string): StatoFattura {
  if (f.pagataIl) return "pagata";
  if (f.scadenza && f.scadenza < oggi) return "scaduta";
  return "aperta";
}

function nellAnno(data: string, anno: number): boolean {
  return data.startsWith(`${anno}-`);
}

/** Avvisi sulle soglie, con le fonti. `entrate` in franchi. */
export function avvisiSoglie(entrate: number, anno: number): AvvisoConti[] {
  const avvisi: AvvisoConti[] = [];
  const iva = regole.sogliaIva;
  const contabilita = regole.sogliaContabilitaSemplificata;
  const fontiIva = [fonte(iva.fonte), fonte(fontiSvizzera.afcAssoggettamento)];

  if (entrate >= iva.valore) {
    avvisi.push({
      id: "iva-superata",
      testo: `Le entrate che hai registrato nel ${anno} (${chf(entrate)}) raggiungono ${chf(iva.valore)}: è la soglia di cifra d'affari annua oltre la quale una ditta è assoggettata all'IVA. Conta la cifra d'affari vera, non solo quello che hai segnato qui: controlla le regole dell'AFC e parlane con un fiduciario autorizzato.`,
      fonti: fontiIva,
    });
  } else if (entrate >= iva.valore * QUOTA_AVVICINAMENTO_IVA) {
    avvisi.push({
      id: "iva-vicina",
      testo: `Le entrate che hai registrato nel ${anno} (${chf(entrate)}) si avvicinano a ${chf(iva.valore)}, la soglia di cifra d'affari annua oltre la quale una ditta è assoggettata all'IVA. Tienila d'occhio e leggi le regole dell'AFC.`,
      fonti: fontiIva,
    });
  }

  if (entrate >= contabilita.valore) {
    avvisi.push({
      id: "contabilita-completa",
      testo: `Le entrate che hai registrato nel ${anno} raggiungono ${chf(contabilita.valore)}. Con una cifra d'affari di almeno questo importo nell'ultimo esercizio, una ditta individuale non può più tenere solo entrate, uscite e patrimonio: serve la contabilità completa. Rivolgiti a un fiduciario autorizzato.`,
      fonti: [fonte(contabilita.fonte)],
    });
  }
  return avvisi;
}

/** Riepilogo dell'anno. `oggi` è la data di oggi (AAAA-MM-GG) per le fatture scadute. */
export function riepilogo(movimenti: readonly Movimento[], fatture: readonly FatturaEmessa[], anno: number, oggi: string): Riepilogo {
  let entrate = 0;
  let uscite = 0;
  let daConfermare = 0;
  const mesi = Array.from({ length: 12 }, () => ({ entrate: 0, uscite: 0 }));
  const categorie = new Map<CategoriaId, number>();

  for (const m of movimenti) {
    if (m.stato === "da_confermare") daConfermare++;
    if (m.stato !== "confermato" || !nellAnno(m.data, anno)) continue;
    const centesimi = inCentesimi(m.importo);
    const mese = Number(m.data.slice(5, 7)) - 1;
    if (m.tipo === "entrata") {
      entrate += centesimi;
      mesi[mese].entrate += centesimi;
    } else {
      uscite += centesimi;
      mesi[mese].uscite += centesimi;
    }
    categorie.set(m.categoria, (categorie.get(m.categoria) ?? 0) + centesimi);
  }

  const aperte = { numero: 0, centesimi: 0 };
  const scadute = { numero: 0, centesimi: 0 };
  for (const f of fatture) {
    const stato = statoFattura(f, oggi);
    if (stato === "pagata") continue;
    const gruppo = stato === "scaduta" ? scadute : aperte;
    gruppo.numero++;
    gruppo.centesimi += inCentesimi(f.importo);
  }

  return {
    anno,
    entrate: daCentesimi(entrate),
    uscite: daCentesimi(uscite),
    risultato: daCentesimi(entrate - uscite),
    daConfermare,
    fattureAperte: { numero: aperte.numero, importo: daCentesimi(aperte.centesimi) },
    fattureScadute: { numero: scadute.numero, importo: daCentesimi(scadute.centesimi) },
    perMese: mesi.map((m, i) => ({ mese: i + 1, entrate: daCentesimi(m.entrate), uscite: daCentesimi(m.uscite) })),
    perCategoria: [...categorie.entries()]
      .filter(([, centesimi]) => centesimi > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, centesimi]) => ({ categoria, importo: daCentesimi(centesimi) })),
    avvisi: avvisiSoglie(daCentesimi(entrate), anno),
  };
}
