import type { FonteElenco } from "./elenco";
import type { Frammento } from "./frammenti";

/** Stringa SQL con gli apici raddoppiati: 'd''iscrizione'. */
export function letterale(valore: string | null): string {
  return valore === null ? "null" : `'${valore.replace(/'/g, "''")}'`;
}

function arrayTesto(valori: readonly string[]): string {
  return valori.length ? `array[${valori.map(letterale).join(", ")}]::text[]` : "'{}'::text[]";
}

/**
 * Istruzioni SQL equivalenti a quello che l'import scrive con la chiave
 * segreta: aggiorna la fonte e, se ci sono, sostituisce i suoi frammenti.
 * Servono a importare dal SQL editor di Supabase senza chiavi.
 */
export function sqlFonte(fonte: FonteElenco, frammenti: readonly Frammento[] | null, adesso: string): string {
  const righe = [
    `insert into public.fonti (id, url, titolo, ente, livello, cantone, argomenti, lingua, verificato_il, verificato_da, attiva, aggiornato_il)`,
    `values (${[
      letterale(fonte.id),
      letterale(fonte.url),
      letterale(fonte.titolo),
      letterale(fonte.ente),
      letterale(fonte.livello),
      letterale(fonte.cantone),
      arrayTesto(fonte.argomenti),
      letterale("it"),
      letterale(fonte.verificato_il),
      letterale(fonte.verificato_da),
      fonte.attiva ? "true" : "false",
      letterale(adesso),
    ].join(", ")})`,
    `on conflict (id) do update set url = excluded.url, titolo = excluded.titolo, ente = excluded.ente, livello = excluded.livello, cantone = excluded.cantone, argomenti = excluded.argomenti, verificato_il = excluded.verificato_il, verificato_da = excluded.verificato_da, attiva = excluded.attiva, aggiornato_il = excluded.aggiornato_il;`,
  ];
  if (frammenti) {
    righe.push(`delete from public.frammenti_fonti where fonte_id = ${letterale(fonte.id)};`);
    if (frammenti.length) {
      righe.push(
        `insert into public.frammenti_fonti (fonte_id, posizione, titolo_sezione, testo) values`,
        frammenti
          .map((f) => `  (${letterale(fonte.id)}, ${f.posizione}, ${letterale(f.titolo_sezione)}, ${letterale(f.testo)})`)
          .join(",\n") + ";",
      );
    }
  }
  return righe.join("\n");
}
