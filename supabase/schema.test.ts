import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { ID_PASSI } from "../src/data/passi";
import { DOMANDE_GRATIS_AL_MESE } from "../src/lib/chat/quota";
import { VERSIONE_REGOLE } from "../src/lib/percorso/regole";
import {
  ATTIVITA,
  AVVII,
  CANTONI,
  CLIENTI,
  FATTURATI,
  IMPIEGHI,
  LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO,
  PERMESSI,
  SI_NO,
  SOCI,
  VERSIONE_RISPOSTE,
  leggiRisposte,
} from "../src/lib/percorso/risposte";

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

  it("la lista d'attesa ricorda quando è partita l'ultima email di conferma", async () => {
    const r = await db.query<{ conferma_inviata_il: string | null }>(
      "insert into public.lista_attesa (email, consenso_email) values ('nuova@example.ch', true) returning conferma_inviata_il",
    );
    expect(r.rows).toEqual([{ conferma_inviata_il: null }]);
    await db.exec("delete from public.lista_attesa where email = 'nuova@example.ch'");
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

describe("vincoli sulle scritture dell'utente", () => {
  const PERCORSO = "44444444-4444-4444-4444-444444444444";
  const piuLungo = <T extends string>(valori: readonly T[]) =>
    valori.reduce((a, b) => (b.length > a.length ? b : a));

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${PERCORSO}', 'percorso@example.ch')`);
  });

  it("tutti i passi reali si possono segnare come fatti", async () => {
    const valori = ID_PASSI.map((_, i) => `($1, $${i + 2})`).join(", ");
    await comeUtente(
      () => db.query(`insert into public.passi_completati (user_id, passo_id) values ${valori}`, [PERCORSO, ...ID_PASSI]),
      PERCORSO,
    );
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.passi_completati where user_id = $1", [
      PERCORSO,
    ]);
    expect(r.rows[0]?.n).toBe(ID_PASSI.length);
  });

  it("rifiuta un passo_id che non ha la forma degli id dei passi", async () => {
    for (const id of ["Passo Finto", "x".repeat(65), "", "passo;drop"]) {
      await expect(
        comeUtente(
          () => db.query("insert into public.passi_completati (user_id, passo_id) values ($1, $2)", [PERCORSO, id]),
          PERCORSO,
        ),
      ).rejects.toThrow(/passi_completati_id_formato/);
    }
  });

  it("rifiuta oltre 100 passi completati per utente", async () => {
    const altri = Array.from({ length: 100 - ID_PASSI.length }, (_, i) => `finto-${i}`);
    const valori = altri.map((_, i) => `($1, $${i + 2})`).join(", ");
    await comeUtente(
      () => db.query(`insert into public.passi_completati (user_id, passo_id) values ${valori}`, [PERCORSO, ...altri]),
      PERCORSO,
    );
    await expect(
      comeUtente(
        () => db.query("insert into public.passi_completati (user_id, passo_id) values ($1, 'uno-di-troppo')", [PERCORSO]),
        PERCORSO,
      ),
    ).rejects.toThrow(/troppi passi completati/);
  });

  it("accetta le risposte valide più lunghe e rifiuta un questionario enorme", async () => {
    const massime = {
      versione: VERSIONE_RISPOSTE,
      attivita: "altro" as const,
      // Le virgolette raddoppiano nel testo JSON: è il caso peggiore.
      attivitaAltro: '"'.repeat(LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO),
      cantone: piuLungo(CANTONI),
      soci: piuLungo(SOCI),
      fatturato: piuLungo(FATTURATI),
      clienti: piuLungo(CLIENTI),
      impiego: piuLungo(IMPIEGHI),
      avviata: piuLungo(AVVII),
      permesso: piuLungo(PERMESSI),
      locali: piuLungo(SI_NO),
      venditaOnline: piuLungo(SI_NO),
    };
    expect(leggiRisposte(massime)).not.toBeNull();
    expect(ATTIVITA).toContain("altro");

    const salva = (risposte: unknown) =>
      comeUtente(
        () =>
          db.query(
            `insert into public.questionari (user_id, risposte, versione_regole) values ($1, $2::jsonb, $3)
             on conflict (user_id) do update set risposte = excluded.risposte`,
            [PERCORSO, JSON.stringify(risposte), VERSIONE_REGOLE],
          ),
        PERCORSO,
      );
    await expect(salva(massime)).resolves.toBeDefined();
    await expect(salva({ ...massime, riempitivo: "x".repeat(5000) })).rejects.toThrow(/questionari_risposte_dimensione/);
    await expect(salva(["non", "un", "oggetto"])).rejects.toThrow(/questionari_risposte_oggetto/);
  });

  it("domande_chat non accetta domande vuote o troppe fonti nemmeno dal server", async () => {
    await expect(
      db.query("insert into public.domande_chat (user_id, domanda) values ($1, '')", [PERCORSO]),
    ).rejects.toThrow(/domande_chat_domanda_lunghezza/);
    await expect(
      db.query("insert into public.domande_chat (user_id, domanda, fonti_citate) values ($1, 'ok', $2)", [
        PERCORSO,
        Array.from({ length: 21 }, (_, i) => `f${i}`),
      ]),
    ).rejects.toThrow(/domande_chat_fonti_massimo/);
  });
});

describe("pulizia dei dati scaduti (pulisci_dati e pg_cron)", () => {
  const PULIZIA = "55555555-5555-5555-5555-555555555555";

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${PULIZIA}', 'pulizia@example.ch')`);
  });

  it("la migrazione pianifica il job ogni giorno (pg_cron non c'è in PGlite)", () => {
    const sql = readFileSync(new URL("20261016000004_pulizia_dati.sql", CARTELLA), "utf8");
    expect(sql).toMatch(/^create extension if not exists pg_cron with schema pg_catalog;$/m);
    expect(sql).toMatch(/^select cron\.schedule\('pulizia-dati', '17 3 \* \* \*', \$\$select public\.pulisci_dati\(\)\$\$\);$/m);
  });

  it("cancella le domande alla chat più vecchie di 12 mesi e tiene le altre", async () => {
    await db.query(
      `insert into public.domande_chat (user_id, domanda, creato_il) values
         ($1, 'vecchia', now() - interval '12 months 1 day'),
         ($1, 'recente', now() - interval '11 months')`,
      [PULIZIA],
    );
    await db.exec("select public.pulisci_dati()");
    const r = await db.query<{ domanda: string }>(
      "select domanda from public.domande_chat where user_id = $1 and domanda in ('vecchia', 'recente')",
      [PULIZIA],
    );
    expect(r.rows).toEqual([{ domanda: "recente" }]);
  });

  it("cancella solo le iscrizioni non confermate 30 giorni dopo l'email di conferma", async () => {
    await db.exec(`
      insert into public.lista_attesa (email, consenso_email, confermato_il, conferma_inviata_il, creato_il) values
        ('scaduta@example.ch', true, null, now() - interval '31 days', now() - interval '40 days'),
        ('in-attesa@example.ch', true, null, now() - interval '29 days', now() - interval '40 days'),
        ('confermata@example.ch', true, now() - interval '35 days', now() - interval '36 days', now() - interval '40 days'),
        ('senza-email@example.ch', true, null, null, now() - interval '400 days');
    `);
    await db.exec("select public.pulisci_dati()");
    const r = await db.query<{ email: string }>("select email from public.lista_attesa order by email");
    expect(r.rows.map((x) => x.email)).toEqual([
      "confermata@example.ch",
      "in-attesa@example.ch",
      "senza-email@example.ch",
    ]);
  });

  it("cancella i contatori del limite più vecchi di un giorno", async () => {
    await db.exec(`
      insert into public.limiti_richieste (chiave, creato_il) values
        ('pulizia:vecchia', now() - interval '25 hours'), ('pulizia:recente', now() - interval '2 hours');
    `);
    await db.exec("select public.pulisci_dati()");
    const r = await db.query<{ chiave: string }>("select chiave from public.limiti_richieste where chiave like 'pulizia:%'");
    expect(r.rows).toEqual([{ chiave: "pulizia:recente" }]);
  });

  it("gli utenti non possono lanciarla", async () => {
    await expect(comeUtente(() => db.exec("select public.pulisci_dati()"))).rejects.toThrow(/permission denied/);
    await expect(come("anon", "", () => db.exec("select public.pulisci_dati()"))).rejects.toThrow(/permission denied/);
  });
});

describe("eliminazione dell'account (src/lib/account/eliminazione.ts)", () => {
  const ELIMINATO = "66666666-6666-6666-6666-666666666666";

  it("ogni tabella che punta ad auth.users si svuota con l'utente (on delete cascade)", async () => {
    const r = await db.query<{ tabella: string; cancellazione: string }>(`
      select c.conrelid::regclass::text as tabella, c.confdeltype as cancellazione
        from pg_constraint c
       where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
       order by 1`);
    expect(r.rows.map((x) => x.tabella)).toEqual(["domande_chat", "passi_completati", "profili", "questionari"]);
    // 'c' = cascade: eliminaAccount cancella solo l'utente da Supabase Auth.
    expect(r.rows.every((x) => x.cancellazione === "c")).toBe(true);
  });

  it("cancellando l'utente da auth.users non resta nessuna sua riga", async () => {
    await db.exec(`insert into auth.users (id, email) values ('${ELIMINATO}', 'eliminato@example.ch')`);
    await db.query("insert into public.questionari (user_id, risposte, versione_regole) values ($1, '{}', 'prova')", [
      ELIMINATO,
    ]);
    await db.query("insert into public.passi_completati (user_id, passo_id) values ($1, $2)", [ELIMINATO, ID_PASSI[0]]);
    await db.query("insert into public.domande_chat (user_id, domanda) values ($1, 'Devo iscrivermi all''IVA?')", [
      ELIMINATO,
    ]);
    await db.query("delete from auth.users where id = $1", [ELIMINATO]);
    const r = await db.query<{ righe: number }>(
      `select (select count(*) from public.profili where id = $1)
            + (select count(*) from public.questionari where user_id = $1)
            + (select count(*) from public.passi_completati where user_id = $1)
            + (select count(*) from public.domande_chat where user_id = $1) as righe`,
      [ELIMINATO],
    );
    expect(Number(r.rows[0]?.righe)).toBe(0);
  });
});
