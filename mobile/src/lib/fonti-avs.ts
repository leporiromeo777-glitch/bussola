import { tavoleScalari, type AnnoAvs } from "@/data/avs-tavola-scalare";
import { datiStrumenti, fonti, supplementiTicino, type Fonte } from "@/data/svizzera";

/** Le fonti della stima dei contributi (le stesse dello strumento sul sito), senza doppioni. */
export function fontiContributi(anno: AnnoAvs): Fonte[] {
  const tutte = [
    tavoleScalari[anno].fonte,
    fonti.avsPromemoria202,
    datiStrumenti.arrotondamentoRedditoAvs.fonte,
    supplementiTicino.speseAmministrative.fonte,
    supplementiTicino.assegniFamiliari.fonte,
    supplementiTicino.assegnoIntegrativo.fonte,
  ];
  return tutte.filter((f, i) => tutte.findIndex((g) => g.url === f.url) === i);
}
