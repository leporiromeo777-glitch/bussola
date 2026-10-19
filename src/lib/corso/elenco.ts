/**
 * «Il corso di Bleo» come elenco: le lezioni nell'ordine del percorso,
 * divise per fase, con il segno dei passi già fatti. Logica pura: la usa
 * la schermata del corso nell'app (mobile/src/app/corso.tsx).
 */
import { lezionePerPasso, type LezioneCorso } from "@/data/corso";
import { FASI, PASSI, TITOLI_FASI, type Fase, type IdPasso, type Passo } from "@/data/passi";

export type VoceCorso = {
  passo: Passo & { id: IdPasso };
  /** Numero della lezione: la lezione N spiega il passo N del percorso. */
  numero: number;
  /** La lezione del passo; manca solo per un passo nuovo, la cui lezione è «in arrivo». */
  lezione: LezioneCorso | undefined;
  /** Il passo è segnato come fatto. */
  fatto: boolean;
};

export type FaseCorso = { fase: Fase; titolo: string; voci: VoceCorso[] };

/** Le lezioni del corso per fase, nell'ordine del percorso. Le fasi senza passi non ci sono. */
export function corsoPerFasi(fatti: ReadonlySet<string> = new Set()): FaseCorso[] {
  const voci: VoceCorso[] = PASSI.map((passo, i) => ({
    passo,
    numero: i + 1,
    lezione: lezionePerPasso(passo.id),
    fatto: fatti.has(passo.id),
  }));
  return FASI.map((fase) => ({ fase, titolo: TITOLI_FASI[fase], voci: voci.filter((v) => v.passo.fase === fase) })).filter(
    (f) => f.voci.length > 0,
  );
}

/** Quante lezioni pronte, quanti video facoltativi e quante lezioni hanno il passo già fatto. */
export function riepilogoCorso(fasi: readonly FaseCorso[]): { lezioni: number; videoFacoltativi: number; fatte: number } {
  const pronte = fasi.flatMap((f) => f.voci).filter((v) => v.lezione);
  return {
    lezioni: pronte.length,
    videoFacoltativi: pronte.reduce((somma, v) => somma + (v.lezione?.approfondimenti?.length ?? 0), 0),
    fatte: pronte.filter((v) => v.fatto).length,
  };
}
