import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { DOMANDE_GRATIS_AL_MESE } from "../src/lib/chat/quota";

// Esegue tutte le migrazioni, in ordine, su un Postgres in memoria con lo
// stretto necessario di Supabase (schema auth, ruoli). pgvector e pg_cron non
// ci sono in PGlite: la colonna embedding diventa real[] e le righe di
// pg_cron (estensione e pianificazione) si tolgono solo per il test.
const CARTELLA = new URL("./migrations/", import.meta.url);
const MIGRAZIONI = readdirSync(CARTELLA)
  .filter((nome) => nome.endsWith(".sql"))
  .sort();

function perPglite(sql: string): string {
  return sql
    .replace(/^create extension if not exists vector.*$/m, "")
    .replace("extensions.vector(1024)", "real[]")
    .replace(/^create extension if not exists pg_cron.*$/gm, "")
    .replace(/^select cron\.schedule\([\s\S]*?\);$/gm, "");
}

const UTENTE = "11111111-1111-1111-1111-111111111111";
const ALTRO = "22222222-2222-2222-2222-222222222222";
const ABBONATA = "33333333-3333-3333-3333-333333333333";
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema extensions; create schema auth;
    create role anon; create role authenticated; create role service_role;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  `);
  for (const nome of MIGRAZIONI) {
    await db.exec(perPglite(readFileSync(new URL(nome, CARTELLA), "utf8")));
  }
  await db.exec(`
    insert into auth.users (id, email) values
      ('${UTENTE}', 'test@example.ch'), ('${ALTRO}', 'altro@example.ch'), ('${ABBONATA}', 'avvio@example.ch');
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

async function come<T>(ruolo: "authenticated" | "anon", utente: string, fn: () => Promise<T>) {
  await db.exec(`set role ${ruolo}; select set_config('request.jwt.claim.sub', '${utente}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

const comeUtente = <T>(fn: () => Promise<T>, utente = UTENTE) => come("authenticated", utente, fn);

const consuma = (chiave: string, massimo = 3, finestra = 3600) =>
  db
    .query<{ ok: boolean }>("select public.consuma_limite($1, $2, $3) as ok", [chiave, massimo, finestra])
    .then((r) => r.rows[0]?.ok);

async function prenota(domanda = "Devo iscrivermi all'IVA?") {
  const r = await db.query<{ id: number | null }>("select public.prenota_domanda($1) as id", [domanda]);
  return r.rows[0]?.id ?? null;
}

describe("schema iniziale", () => {
  it("applica le migrazioni in ordine di data", () => {
    expect(MIGRAZIONI[0]).toBe("20261015000000_schema_iniziale.sql");
    expect(MIGRAZIONI.length).toBeGreaterThan(1);
  });

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
});

describe("quota della chat (prenota_domanda e chiudi_domanda)", () => {
  it("l'utente non scrive più direttamente in domande_chat, né per sé né per altri", async () => {
    for (const utente of [`'${UTENTE}'`, "gen_random_uuid()"]) {
      await expect(
        comeUtente(() => db.exec(`insert into public.domande_chat (user_id, domanda) values (${utente}, 'diretta')`)),
      ).rejects.toThrow(/row-level security/);
    }
  });

  it("con 11 richieste parallele di un utente gratis passano esattamente le domande del piano", async () => {
    const ids = await comeUtente(() => Promise.all(Array.from({ length: 11 }, () => prenota())));
    const prenotate = ids.filter((id) => id !== null);
    expect(prenotate).toHaveLength(DOMANDE_GRATIS_AL_MESE);
    expect(new Set(prenotate).size).toBe(DOMANDE_GRATIS_AL_MESE);
    expect(ids.filter((id) => id === null)).toHaveLength(1);

    // Ogni prenotazione è già una riga che conta per la quota.
    const r = await comeUtente(() =>
      db.query<{ n: number }>("select count(*)::int as n from public.domande_chat where user_id = $1", [UTENTE]),
    );
    expect(r.rows[0]?.n).toBe(DOMANDE_GRATIS_AL_MESE);
  });

  it("contano solo le domande del mese corrente (ora di Zurigo)", async () => {
    await comeUtente(() => prenota(), ALTRO);
    await db.exec(`
      insert into public.domande_chat (user_id, domanda, creato_il)
      select '${ALTRO}', 'vecchia', now() - interval '40 days' from generate_series(1, 20);
    `);
    expect(await comeUtente(() => prenota(), ALTRO)).not.toBeNull();
  });

  it("i piani a pagamento non hanno limite; avvio scaduto torna al limite gratis", async () => {
    await db.exec(`update public.profili set piano = 'avvio', piano_scade_il = now() + interval '30 days' where id = '${ABBONATA}'`);
    const ids = await comeUtente(() => Promise.all(Array.from({ length: 12 }, () => prenota())), ABBONATA);
    expect(ids.every((id) => id !== null)).toBe(true);

    await db.exec(`update public.profili set piano_scade_il = now() - interval '1 day' where id = '${ABBONATA}'`);
    expect(await comeUtente(() => prenota(), ABBONATA)).toBeNull();
  });

  it("rifiuta chi non è collegato e le domande vuote o troppo lunghe", async () => {
    await expect(come("anon", "", () => prenota())).rejects.toThrow(/permission denied/);
    await expect(comeUtente(() => prenota(), "")).rejects.toThrow(/non autenticato/);
    await expect(comeUtente(() => prenota(""), ALTRO)).rejects.toThrow(/domanda non valida/);
    await expect(comeUtente(() => prenota("x".repeat(1001)), ALTRO)).rejects.toThrow(/domanda non valida/);
  });

  it("chiudi_domanda completa solo le proprie righe e tiene solo fonti esistenti", async () => {
    const id = await comeUtente(() => prenota("Quando pago l'AVS?"), ALTRO);
    await comeUtente(
      () => db.query("select public.chiudi_domanda($1, $2, $3)", [id, ["avs", "inventata", "iva"], false]),
      ALTRO,
    );
    const r = await db.query<{ fonti_citate: string[]; senza_risposta: boolean }>(
      "select fonti_citate, senza_risposta from public.domande_chat where id = $1",
      [id],
    );
    expect(r.rows[0]).toEqual({ fonti_citate: ["avs", "iva"], senza_risposta: false });

    // Un altro utente non può toccarla.
    await comeUtente(() => db.query("select public.chiudi_domanda($1, $2, $3)", [id, [], true]));
    const dopo = await db.query<{ senza_risposta: boolean }>("select senza_risposta from public.domande_chat where id = $1", [id]);
    expect(dopo.rows[0]?.senza_risposta).toBe(false);
  });
});

describe("limite di richieste per connessione (consuma_limite)", () => {
  it("consente fino al massimo nella finestra, poi rifiuta", async () => {
    const esiti = [];
    for (let i = 0; i < 4; i++) esiti.push(await consuma("listaAttesa:abc"));
    expect(esiti).toEqual([true, true, true, false]);
    // Un'altra connessione ha il suo conteggio.
    expect(await consuma("listaAttesa:def")).toBe(true);
  });

  it("le richieste fuori dalla finestra non contano più e vengono cancellate", async () => {
    await db.exec(`
      insert into public.limiti_richieste (chiave, creato_il)
      select 'accesso:vecchia', now() - interval '2 hours' from generate_series(1, 5);
    `);
    expect(await consuma("accesso:vecchia")).toBe(true);
    const r = await db.query<{ n: number }>(
      "select count(*)::int as n from public.limiti_richieste where chiave = 'accesso:vecchia'",
    );
    expect(r.rows[0]?.n).toBe(1);
  });

  it("solo il server con la chiave segreta può usarlo; gli utenti non vedono la tabella", async () => {
    await expect(comeUtente(() => consuma("listaAttesa:xyz"))).rejects.toThrow(/permission denied/);
    await expect(come("anon", "", () => consuma("listaAttesa:xyz"))).rejects.toThrow(/permission denied/);
    const r = await comeUtente(() => db.query<{ n: number }>("select count(*)::int as n from public.limiti_richieste"));
    expect(r.rows[0]?.n).toBe(0);
  });
});
