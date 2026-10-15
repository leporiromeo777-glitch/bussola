import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

// Esegue la migrazione su un Postgres in memoria con lo stretto necessario di
// Supabase (schema auth, ruoli). pgvector non c'è in PGlite: la colonna
// embedding viene sostituita da real[] solo per il test.
const migrazione = readFileSync(
  new URL("./migrations/20261015000000_schema_iniziale.sql", import.meta.url),
  "utf8",
)
  .replace(/^create extension if not exists vector.*$/m, "")
  .replace("extensions.vector(1024)", "real[]");

const UTENTE = "11111111-1111-1111-1111-111111111111";
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema extensions; create schema auth;
    create role anon; create role authenticated;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  `);
  await db.exec(migrazione);
  await db.exec(`
    insert into auth.users (id, email) values ('${UTENTE}', 'test@example.ch');
    insert into public.fonti (id, url, titolo, ente, livello, verificato_il, verificato_da) values
      ('avs', 'https://example.ch/avs', 'Contributi degli indipendenti', 'AVS', 'federale', '2026-10-15', 'test'),
      ('iva', 'https://example.ch/iva', 'Assoggettamento IVA', 'AFC', 'federale', '2026-10-15', 'test');
    insert into public.frammenti_fonti (fonte_id, posizione, titolo_sezione, testo) values
      ('avs', 1, 'Contributi', 'Gli indipendenti versano i contributi AVS/AI/IPG sul reddito.'),
      ('iva', 1, 'Obbligo', 'È assoggettato all''IVA chi realizza una cifra d''affari annua di almeno 100 000 franchi.');
    grant usage on schema public to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  `);
});

async function comeUtente<T>(fn: () => Promise<T>) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${UTENTE}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

describe("schema iniziale", () => {
  it("crea il profilo gratis alla registrazione", async () => {
    const r = await db.query<{ piano: string }>("select piano from public.profili where id = $1", [UTENTE]);
    expect(r.rows).toEqual([{ piano: "gratis" }]);
  });

  it("cerca_frammenti trova la fonte pertinente in italiano", async () => {
    const r = await db.query<{ fonte_id: string }>(
      "select fonte_id from public.cerca_frammenti($1, 5)",
      ["Devo iscrivermi all'IVA?"],
    );
    expect(r.rows[0]?.fonte_id).toBe("iva");
  });

  it("cerca_frammenti non esplode con testo vuoto o simboli", async () => {
    for (const q of ["", "ciao", "l'IVA: & 'cifra' | d'affari?"]) {
      await expect(db.query("select * from public.cerca_frammenti($1, 5)", [q])).resolves.toBeDefined();
    }
  });

  it("la lista d'attesa non è leggibile dagli utenti", async () => {
    const r = await comeUtente(() => db.query<{ n: number }>("select count(*)::int as n from public.lista_attesa"));
    expect(r.rows[0]?.n).toBe(0);
  });

  it("un utente non può scrivere domande a nome di un altro", async () => {
    await comeUtente(() =>
      db.exec(`insert into public.domande_chat (user_id, domanda) values ('${UTENTE}', 'mia')`),
    );
    await expect(
      comeUtente(() => db.exec(`insert into public.domande_chat (user_id, domanda) values (gen_random_uuid(), 'altrui')`)),
    ).rejects.toThrow(/row-level security/);
  });
});
