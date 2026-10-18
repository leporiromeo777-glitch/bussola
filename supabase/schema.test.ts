import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { ID_PASSI } from "../src/data/passi";
import { DOCUMENTI_MASSIMI } from "../src/lib/cassetto/limiti";
import { TIPI_DOCUMENTO } from "../src/lib/cassetto/tipi";
import { TITOLO_MASSIMO } from "../src/lib/chat/conversazioni";
import { MINUTI_MASSIMI, TARIFFA_MASSIMA } from "../src/lib/clienti/limiti";
import { DOMANDE_GRATIS_AL_MESE } from "../src/lib/chat/quota";
import { LETTURE_AL_GIORNO } from "../src/lib/conti/limiti";
import { CATEGORIE, LIVELLI_SOLLECITO } from "../src/lib/conti/tipi";
import { improntaToken, nuovoTokenCalendario } from "../src/lib/percorso/abbonamento";
import { VERSIONE_REGOLE } from "../src/lib/percorso/regole";
import { LUNGHEZZE_INDIRIZZO_QR } from "../src/lib/strumenti/qr";
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
// stretto necessario di Supabase (schema auth, ruoli, tabelle dello Storage). pgvector e pg_cron non
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
    create schema storage;
    create table storage.buckets (
      id text primary key, name text not null, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid
    );
    alter table storage.objects enable row level security;
    -- Come in Supabase: le cartelle del percorso, senza il nome del file.
    create function storage.foldername(name text) returns text[] language sql immutable as
      $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  `);
  // Come in Supabase: le tabelle nuove di public sono accessibili ad anon e
  // authenticated (la RLS decide le righe), finché una migrazione non revoca.
  // Anche auth.uid() si può chiamare da loro (serve alle funzioni security invoker).
  await db.exec(`
    grant usage on schema public to anon, authenticated;
    grant usage on schema auth to anon, authenticated;
    alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
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
    grant usage on schema storage to anon, authenticated;
    grant select, insert, update, delete on all tables in schema storage to anon, authenticated;
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
    expect(r.rows.map((x) => x.tabella)).toEqual([
      "cassetto_documenti",
      "chat_conversazioni",
      "chat_messaggi",
      "conti_caselle",
      "conti_clienti",
      "conti_documenti",
      "conti_email",
      "conti_fatture",
      "conti_letture",
      "conti_movimenti",
      "conti_ore",
      "domande_chat",
      "link_calendario",
      "passi_completati",
      "profili",
      "questionari",
    ]);
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

describe("«I tuoi conti»", () => {
  const CONTI = "77777777-7777-7777-7777-777777777777";
  const INTRUSO = "88888888-8888-8888-8888-888888888888";

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${CONTI}', 'conti@example.ch'), ('${INTRUSO}', 'intruso@example.ch')`);
  });

  const movimento = (utente: string, campi: Record<string, string | number | null> = {}) => {
    const riga = {
      user_id: utente,
      tipo: "uscita",
      data: "2026-10-16",
      importo_centesimi: 4850,
      descrizione: "Carta per stampante",
      categoria: "materiale",
      stato: "confermato",
      origine: "manuale",
      ...campi,
    };
    const colonne = Object.keys(riga);
    return db.query<{ id: string }>(
      `insert into public.conti_movimenti (${colonne.join(", ")}) values (${colonne.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
      Object.values(riga),
    );
  };

  it("le categorie nel database sono quelle di src/lib/conti/tipi.ts", () => {
    const sql = readFileSync(new URL("20261017000000_conti.sql", CARTELLA), "utf8");
    const elenco = /categoria in \(([^)]*)\)\),/.exec(sql)?.[1] ?? "";
    const nelDatabase = [...elenco.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(nelDatabase).toEqual(CATEGORIE.map((c) => c.id));
    const entrate = /\(tipo = 'entrata'\) = \(categoria in \(([^)]*)\)\)/.exec(sql)?.[1] ?? "";
    expect([...entrate.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])).toEqual(
      CATEGORIE.filter((c) => c.tipo === "entrata").map((c) => c.id),
    );
  });

  it("ognuno vede e cambia solo i propri movimenti", async () => {
    await comeUtente(() => movimento(CONTI), CONTI);
    const proprie = await comeUtente(
      () => db.query<{ n: number }>("select count(*)::int as n from public.conti_movimenti"),
      CONTI,
    );
    expect(proprie.rows[0]?.n).toBe(1);
    const altrui = await comeUtente(
      () => db.query<{ n: number }>("select count(*)::int as n from public.conti_movimenti"),
      INTRUSO,
    );
    expect(altrui.rows[0]?.n).toBe(0);
    await expect(comeUtente(() => movimento(CONTI), INTRUSO)).rejects.toThrow(/row-level security/);
    const aggiornate = await comeUtente(
      () => db.query("update public.conti_movimenti set descrizione = 'rubato'"),
      INTRUSO,
    );
    expect(aggiornate.affectedRows).toBe(0);
  });

  it("rifiuta importi negativi, stati e categorie sconosciute, categoria del tipo sbagliato", async () => {
    await expect(movimento(CONTI, { importo_centesimi: -1 })).rejects.toThrow(/check/);
    await expect(movimento(CONTI, { stato: "approvato" })).rejects.toThrow(/check/);
    await expect(movimento(CONTI, { categoria: "vacanze" })).rejects.toThrow(/check/);
    await expect(movimento(CONTI, { tipo: "entrata", categoria: "materiale" })).rejects.toThrow(
      /conti_movimenti_categoria_tipo/,
    );
    await expect(movimento(CONTI, { origine: "fattura" })).rejects.toThrow(/conti_movimenti_fattura_origine/);
  });

  it("una fattura pagata crea una sola entrata confermata, che sparisce se non è più pagata", async () => {
    const entrate = (id: string) =>
      db.query<{ data: string; importo_centesimi: string; stato: string; categoria: string; origine: string }>(
        "select data::text as data, importo_centesimi::text, stato, categoria, origine from public.conti_movimenti where fattura_id = $1",
        [id],
      );
    const fattura = await comeUtente(
      () =>
        db.query<{ id: string }>(
          `insert into public.conti_fatture (user_id, numero, cliente, data, scadenza, importo_centesimi)
           values ($1, 'F-2026-001', 'Rossi SA', '2026-10-01', '2026-10-31', 120000) returning id`,
          [CONTI],
        ),
      CONTI,
    );
    const id = fattura.rows[0]!.id;
    expect((await entrate(id)).rows).toEqual([]);

    for (let i = 0; i < 2; i++) {
      await comeUtente(() => db.query("update public.conti_fatture set pagata_il = '2026-10-20' where id = $1", [id]), CONTI);
    }
    expect((await entrate(id)).rows).toEqual([
      { data: "2026-10-20", importo_centesimi: "120000", stato: "confermato", categoria: "vendite", origine: "fattura" },
    ]);

    // Importo corretto dopo: l'entrata segue la fattura.
    await comeUtente(() => db.query("update public.conti_fatture set importo_centesimi = 125000 where id = $1", [id]), CONTI);
    expect((await entrate(id)).rows[0]?.importo_centesimi).toBe("125000");

    await comeUtente(() => db.query("update public.conti_fatture set pagata_il = null where id = $1", [id]), CONTI);
    expect((await entrate(id)).rows).toEqual([]);

    // Un numero solo per utente.
    await expect(
      db.query(
        "insert into public.conti_fatture (user_id, numero, cliente, data, importo_centesimi) values ($1, 'F-2026-001', 'Altro', '2026-10-02', 1)",
        [CONTI],
      ),
    ).rejects.toThrow(/unique|duplicate/);
  });

  it("i livelli del sollecito nel database sono quelli di src/lib/conti/tipi.ts", () => {
    const sql = readFileSync(new URL("20261019000001_solleciti_fatture.sql", CARTELLA), "utf8");
    const elenco = /sollecito_livello in \(([^)]*)\)/.exec(sql)?.[1] ?? "";
    expect(elenco.split(",").map((v) => Number(v.trim()))).toEqual([...LIVELLI_SOLLECITO]);
  });

  it("il sollecito si segna solo sulle proprie fatture: data e livello insieme, mai prima della fattura", async () => {
    const fattura = await comeUtente(
      () =>
        db.query<{ id: string }>(
          `insert into public.conti_fatture (user_id, numero, cliente, data, scadenza, importo_centesimi)
           values ($1, 'F-2026-050', 'Verdi Sagl', '2026-09-01', '2026-09-30', 50000) returning id`,
          [CONTI],
        ),
      CONTI,
    );
    const id = fattura.rows[0]!.id;
    const segna = (il: string | null, livello: number | null, utente = CONTI) =>
      comeUtente(
        () => db.query("update public.conti_fatture set sollecito_il = $2, sollecito_livello = $3 where id = $1", [id, il, livello]),
        utente,
      );

    expect((await segna("2026-10-05", 1)).affectedRows).toBe(1);
    const letta = await comeUtente(
      () =>
        db.query<{ il: string; livello: number }>(
          "select sollecito_il::text as il, sollecito_livello as livello from public.conti_fatture where id = $1",
          [id],
        ),
      CONTI,
    );
    expect(letta.rows).toEqual([{ il: "2026-10-05", livello: 1 }]);
    // Segnare il sollecito non crea entrate: la fattura non è pagata.
    const entrate = await db.query("select 1 from public.conti_movimenti where fattura_id = $1", [id]);
    expect(entrate.rows).toEqual([]);

    await expect(segna("2026-10-05", null)).rejects.toThrow(/conti_fatture_sollecito/);
    await expect(segna(null, 2)).rejects.toThrow(/conti_fatture_sollecito/);
    await expect(segna("2026-10-05", 3)).rejects.toThrow(/conti_fatture_sollecito/);
    await expect(segna("2026-08-31", 1)).rejects.toThrow(/conti_fatture_sollecito/);
    expect((await segna(null, null)).affectedRows).toBe(1);

    // Un altro utente non vede la fattura e non può segnarci niente.
    expect((await segna("2026-10-10", 2, INTRUSO)).affectedRows).toBe(0);
    const altrui = await comeUtente(
      () => db.query<{ n: number }>("select count(*)::int as n from public.conti_fatture where id = $1", [id]),
      INTRUSO,
    );
    expect(altrui.rows[0]?.n).toBe(0);
  });

  it("la casella si legge ma non si scrive dall'utente; il token ha la forma giusta", async () => {
    await db.query("insert into public.conti_caselle (user_id, token) values ($1, $2)", [CONTI, "abcdefghijklmnopqrstuvwxyz"]);
    const letta = await comeUtente(() => db.query<{ token: string }>("select token from public.conti_caselle"), CONTI);
    expect(letta.rows).toEqual([{ token: "abcdefghijklmnopqrstuvwxyz" }]);
    const altrui = await comeUtente(() => db.query("select token from public.conti_caselle"), INTRUSO);
    expect(altrui.rows).toEqual([]);
    const cambiate = await comeUtente(
      () => db.query("update public.conti_caselle set token = 'aaaaaaaaaaaaaaaaaaaaaaaaaa'"),
      CONTI,
    );
    expect(cambiate.affectedRows).toBe(0);
    await expect(
      db.query("insert into public.conti_caselle (user_id, token) values ($1, 'corto')", [INTRUSO]),
    ).rejects.toThrow(/check/);
    await expect(
      db.query("update public.conti_caselle set conferma_link = 'javascript:alert(1)' where user_id = $1", [CONTI]),
    ).rejects.toThrow(/check/);
  });

  it("al massimo LETTURE_AL_GIORNO letture al giorno per utente, contate dal database", async () => {
    const prenota = () =>
      db.query<{ ok: boolean }>("select public.prenota_lettura_conti() as ok").then((r) => r.rows[0]?.ok);
    const esiti = await comeUtente(() => Promise.all(Array.from({ length: LETTURE_AL_GIORNO + 2 }, prenota)), INTRUSO);
    expect(esiti.filter(Boolean)).toHaveLength(LETTURE_AL_GIORNO);
    // Un utente non può consumare le letture di un altro: conta sempre per sé.
    const perAltri = await comeUtente(
      () => db.query<{ ok: boolean }>("select public.prenota_lettura_conti($1) as ok", [CONTI]).then((r) => r.rows[0]?.ok),
      INTRUSO,
    );
    expect(perAltri).toBe(false);
    // Il server (senza utente nel token) indica l'utente.
    const server = await db.query<{ ok: boolean }>("select public.prenota_lettura_conti($1) as ok", [CONTI]);
    expect(server.rows[0]?.ok).toBe(true);
    await expect(come("anon", "", () => prenota())).rejects.toThrow(/permission denied/);
  });

  it("il percorso del documento deve stare nella cartella dell'utente", async () => {
    await expect(
      db.query(
        "insert into public.conti_documenti (user_id, percorso, tipo, byte, origine) values ($1, $2, 'image/jpeg', 10, 'foto')",
        [CONTI, `${INTRUSO}/11111111-2222-3333-4444-555555555555.jpg`],
      ),
    ).rejects.toThrow(/conti_documenti_percorso_utente/);
    await db.query(
      "insert into public.conti_documenti (user_id, percorso, tipo, byte, origine) values ($1, $2, 'image/jpeg', 10, 'foto')",
      [CONTI, `${CONTI}/11111111-2222-3333-4444-555555555555.jpg`],
    );
  });

  it("nello Storage ognuno vede e carica solo nella sua cartella del bucket ricevute", async () => {
    const r = await db.query<{ public: boolean; file_size_limit: string }>(
      "select public, file_size_limit::text from storage.buckets where id = 'ricevute'",
    );
    expect(r.rows).toEqual([{ public: false, file_size_limit: "3500000" }]);
    await comeUtente(
      () => db.query("insert into storage.objects (bucket_id, name) values ('ricevute', $1)", [`${CONTI}/a.jpg`]),
      CONTI,
    );
    await expect(
      comeUtente(
        () => db.query("insert into storage.objects (bucket_id, name) values ('ricevute', $1)", [`${CONTI}/b.jpg`]),
        INTRUSO,
      ),
    ).rejects.toThrow(/row-level security/);
    const visti = await comeUtente(() => db.query("select name from storage.objects"), INTRUSO);
    expect(visti.rows).toEqual([]);
  });

  it("la pulizia cancella i contatori delle letture vecchi", async () => {
    await db.query("insert into public.conti_letture (user_id, creato_il) values ($1, now() - interval '3 days')", [CONTI]);
    await db.exec("select public.pulisci_dati()");
    const r = await db.query<{ n: number }>(
      "select count(*)::int as n from public.conti_letture where creato_il < now() - interval '2 days'",
    );
    expect(r.rows[0]?.n).toBe(0);
  });

  it("cancellando l'utente spariscono tutti i suoi conti", async () => {
    await db.query("delete from auth.users where id = $1", [CONTI]);
    const r = await db.query<{ righe: number }>(
      `select (select count(*) from public.conti_movimenti where user_id = $1)
            + (select count(*) from public.conti_fatture where user_id = $1)
            + (select count(*) from public.conti_documenti where user_id = $1)
            + (select count(*) from public.conti_caselle where user_id = $1)
            + (select count(*) from public.conti_letture where user_id = $1) as righe`,
      [CONTI],
    );
    expect(Number(r.rows[0]?.righe)).toBe(0);
  });
});

describe("chat salvate (chat_conversazioni e chat_messaggi)", () => {
  const CHAT = "99999999-9999-9999-9999-999999999999";
  const CURIOSO = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${CHAT}', 'chat@example.ch'), ('${CURIOSO}', 'curioso@example.ch')`);
  });

  const nuovaChat = (utente: string, titolo = "Devo iscrivermi all'IVA?") =>
    comeUtente(
      () =>
        db
          .query<{ id: string }>("insert into public.chat_conversazioni (user_id, titolo) values ($1, $2) returning id", [
            utente,
            titolo,
          ])
          .then((r) => r.rows[0]!.id),
      utente,
    );

  const domanda = (utente: string, chat: string, testo = "Devo iscrivermi all'IVA?", come = utente) =>
    comeUtente(
      () =>
        db.query(
          "insert into public.chat_messaggi (conversazione_id, user_id, ruolo, testo) values ($1, $2, 'utente', $3)",
          [chat, utente, testo],
        ),
      come,
    );

  const risposta = (utente: string, chat: string, campi: { risposta?: string; fonti?: string } = {}) =>
    comeUtente(
      () =>
        db.query(
          `insert into public.chat_messaggi (conversazione_id, user_id, ruolo, testo, risposta, fonti, senza_risposta, avviso)
           values ($1, $2, 'bleo', 'Sì, se superi la soglia.', $3::jsonb, $4::jsonb, false, null)`,
          [chat, utente, campi.risposta ?? '[{"testo":"Sì, se superi la soglia.","citazioni":[]}]', campi.fonti ?? "[]"],
        ),
      utente,
    );

  it("il titolo ha al massimo TITOLO_MASSIMO caratteri, come in src/lib/chat/conversazioni.ts", async () => {
    const sql = readFileSync(new URL("20261018000000_chat_conversazioni.sql", CARTELLA), "utf8");
    expect(sql).toContain(`check (char_length(titolo) between 1 and ${TITOLO_MASSIMO})`);
    await expect(nuovaChat(CHAT, "")).rejects.toThrow(/check/);
    await expect(nuovaChat(CHAT, "x".repeat(TITOLO_MASSIMO + 1))).rejects.toThrow(/check/);
  });

  it("ognuno crea e vede solo le sue chat e i suoi messaggi", async () => {
    const id = await nuovaChat(CHAT);
    await domanda(CHAT, id);
    await risposta(CHAT, id);
    const proprie = await comeUtente(
      () => db.query<{ n: number }>("select count(*)::int as n from public.chat_messaggi where conversazione_id = $1", [id]),
      CHAT,
    );
    expect(proprie.rows[0]?.n).toBe(2);

    const viste = await comeUtente(
      () =>
        db.query<{ n: number }>(
          "select (select count(*) from public.chat_conversazioni) + (select count(*) from public.chat_messaggi) as n",
        ),
      CURIOSO,
    );
    expect(Number(viste.rows[0]?.n)).toBe(0);
    await expect(
      comeUtente(
        () => db.query("insert into public.chat_conversazioni (user_id, titolo) values ($1, 'Intrusa')", [CHAT]),
        CURIOSO,
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(come("anon", "", () => db.query("select * from public.chat_conversazioni"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("nessuno scrive messaggi nella chat di un altro, nemmeno con il proprio user_id", async () => {
    const id = await nuovaChat(CHAT);
    // Con user_id altrui: la RLS lo ferma.
    await expect(domanda(CHAT, id, "intrusa", CURIOSO)).rejects.toThrow(/row-level security/);
    // Con il proprio user_id ma la chat di un altro: il trigger lo ferma.
    await expect(domanda(CURIOSO, id)).rejects.toThrow(/chat di un altro utente/);
    // Nemmeno il server con la chiave segreta può mescolare utenti.
    await expect(
      db.query("insert into public.chat_messaggi (conversazione_id, user_id, ruolo, testo) values ($1, $2, 'utente', 'x')", [
        id,
        CURIOSO,
      ]),
    ).rejects.toThrow(/chat di un altro utente/);
  });

  it("l'utente cambia solo il titolo; le date le decide il database", async () => {
    const id = await comeUtente(
      () =>
        db
          .query<{ id: string; creata_il: Date; aggiornata_il: Date }>(
            "insert into public.chat_conversazioni (user_id, titolo, creata_il, aggiornata_il) values ($1, 'futura', now() + interval '5 years', now() + interval '5 years') returning id, creata_il, aggiornata_il",
            [CHAT],
          )
          .then((r) => r.rows[0]!),
      CHAT,
    ).catch((e: Error) => e);
    // Con i privilegi per colonna di Supabase le date non si possono nemmeno indicare.
    expect(id).toBeInstanceOf(Error);
    expect(String(id)).toMatch(/permission denied/);

    const chat = await nuovaChat(CHAT, "Prima");
    await comeUtente(() => db.query("update public.chat_conversazioni set titolo = 'Dopo' where id = $1", [chat]), CHAT);
    await expect(
      comeUtente(
        () => db.query("update public.chat_conversazioni set aggiornata_il = now() + interval '5 years' where id = $1", [chat]),
        CHAT,
      ),
    ).rejects.toThrow(/permission denied/);
    // Anche dove i privilegi per colonna mancassero, il trigger tiene date e proprietario.
    await db.query(
      "update public.chat_conversazioni set user_id = $2, creata_il = now() - interval '2 years', aggiornata_il = now() - interval '2 years' where id = $1",
      [chat, CURIOSO],
    );
    const r = await db.query<{ titolo: string; user_id: string; vecchia: boolean }>(
      "select titolo, user_id, aggiornata_il < now() - interval '1 year' as vecchia from public.chat_conversazioni where id = $1",
      [chat],
    );
    expect(r.rows).toEqual([{ titolo: "Dopo", user_id: CHAT, vecchia: false }]);

    // Un altro utente non la rinomina.
    const altrui = await comeUtente(
      () => db.query("update public.chat_conversazioni set titolo = 'Mia' where id = $1", [chat]),
      CURIOSO,
    );
    expect(altrui.affectedRows).toBe(0);
  });

  it("ogni messaggio porta la chat in cima (aggiornata_il)", async () => {
    const chat = await nuovaChat(CHAT);
    await db.query("alter table public.chat_conversazioni disable trigger chat_conversazione_modifica");
    await db.query("update public.chat_conversazioni set aggiornata_il = now() - interval '3 days' where id = $1", [chat]);
    await db.query("alter table public.chat_conversazioni enable trigger chat_conversazione_modifica");
    await domanda(CHAT, chat);
    const r = await db.query<{ recente: boolean }>(
      "select aggiornata_il > now() - interval '1 minute' as recente from public.chat_conversazioni where id = $1",
      [chat],
    );
    expect(r.rows).toEqual([{ recente: true }]);
  });

  it("i messaggi non si modificano né si cancellano uno per uno; la chat sì, con i messaggi", async () => {
    const chat = await nuovaChat(CHAT);
    await domanda(CHAT, chat);
    await expect(
      comeUtente(() => db.query("update public.chat_messaggi set testo = 'cambiata' where conversazione_id = $1", [chat]), CHAT),
    ).rejects.toThrow(/permission denied/);
    await expect(
      comeUtente(() => db.query("delete from public.chat_messaggi where conversazione_id = $1", [chat]), CHAT),
    ).rejects.toThrow(/permission denied/);

    const altrui = await comeUtente(
      () => db.query("delete from public.chat_conversazioni where id = $1", [chat]),
      CURIOSO,
    );
    expect(altrui.affectedRows).toBe(0);
    await comeUtente(() => db.query("delete from public.chat_conversazioni where id = $1", [chat]), CHAT);
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.chat_messaggi where conversazione_id = $1", [chat]);
    expect(r.rows[0]?.n).toBe(0);
  });

  it("rifiuta domande vuote o troppo lunghe e risposte senza blocchi", async () => {
    const chat = await nuovaChat(CHAT);
    await expect(domanda(CHAT, chat, "")).rejects.toThrow(/chat_messaggi_testo_lunghezza/);
    await expect(domanda(CHAT, chat, "x".repeat(1001))).rejects.toThrow(/chat_messaggi_testo_lunghezza/);
    await expect(risposta(CHAT, chat, { risposta: '{"testo":"non un elenco"}' })).rejects.toThrow(/chat_messaggi_risposta/);
    await expect(
      comeUtente(
        () =>
          db.query(
            "insert into public.chat_messaggi (conversazione_id, user_id, ruolo, testo, fonti) values ($1, $2, 'utente', 'ok?', '[]')",
            [chat, CHAT],
          ),
        CHAT,
      ),
    ).rejects.toThrow(/chat_messaggi_risposta/);
  });

  it("al massimo 2000 chat per utente", async () => {
    await db.query(
      "insert into public.chat_conversazioni (user_id, titolo) select $1, 'riempitivo' from generate_series(1, 2000 - (select count(*) from public.chat_conversazioni where user_id = $1))",
      [CURIOSO],
    );
    await expect(nuovaChat(CURIOSO)).rejects.toThrow(/troppe righe in chat_conversazioni/);
    await db.query("delete from public.chat_conversazioni where user_id = $1", [CURIOSO]);
  });

  it("la pulizia cancella le chat senza attività da 12 mesi, con i messaggi", async () => {
    const vecchia = await nuovaChat(CHAT, "Vecchia");
    const recente = await nuovaChat(CHAT, "Recente");
    await domanda(CHAT, vecchia);
    await db.query("alter table public.chat_conversazioni disable trigger chat_conversazione_modifica");
    await db.query("update public.chat_conversazioni set aggiornata_il = now() - interval '12 months 1 day' where id = $1", [vecchia]);
    await db.query("update public.chat_conversazioni set aggiornata_il = now() - interval '11 months' where id = $1", [recente]);
    await db.query("alter table public.chat_conversazioni enable trigger chat_conversazione_modifica");
    await db.exec("select public.pulisci_dati()");
    const r = await db.query<{ id: string }>("select id from public.chat_conversazioni where id in ($1, $2)", [vecchia, recente]);
    expect(r.rows).toEqual([{ id: recente }]);
    const messaggi = await db.query<{ n: number }>("select count(*)::int as n from public.chat_messaggi where conversazione_id = $1", [
      vecchia,
    ]);
    expect(messaggi.rows[0]?.n).toBe(0);
  });

  it("cancellando l'utente spariscono tutte le sue chat", async () => {
    const chat = await nuovaChat(CHAT);
    await domanda(CHAT, chat);
    await db.query("delete from auth.users where id = $1", [CHAT]);
    const r = await db.query<{ righe: number }>(
      `select (select count(*) from public.chat_conversazioni where user_id = $1)
            + (select count(*) from public.chat_messaggi where user_id = $1) as righe`,
      [CHAT],
    );
    expect(Number(r.rows[0]?.righe)).toBe(0);
  });
});

describe("«Clienti e ore» (conti_clienti e conti_ore)", () => {
  const LIBERA = "dddddddd-dddd-dddd-dddd-dddddddddddd";
  const SPIONE = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${LIBERA}', 'libera@example.ch'), ('${SPIONE}', 'spione-ore@example.ch')`);
  });

  const nuovoCliente = (utente: string, campi: Record<string, string | number | null> = {}, come = utente) => {
    const riga = { user_id: utente, nome: "Rossi SA", via: "Via Nassa", numero: "5", npa: "6900", localita: "Lugano", ...campi };
    const colonne = Object.keys(riga);
    return comeUtente(
      () =>
        db
          .query<{ id: string }>(
            `insert into public.conti_clienti (${colonne.join(", ")}) values (${colonne.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
            Object.values(riga),
          )
          .then((r) => r.rows[0]!.id),
      come,
    );
  };

  const nuovaVoce = (utente: string, cliente: string, campi: Record<string, string | number | null> = {}, come = utente) => {
    const riga = { user_id: utente, cliente_id: cliente, data: "2026-10-15", minuti: 90, descrizione: "Sviluppo del sito", ...campi };
    const colonne = Object.keys(riga);
    return comeUtente(
      () =>
        db
          .query<{ id: string }>(
            `insert into public.conti_ore (${colonne.join(", ")}) values (${colonne.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
            Object.values(riga),
          )
          .then((r) => r.rows[0]!.id),
      come,
    );
  };

  it("i limiti nel database sono quelli di src/lib (indirizzo QR, durata, tariffa)", () => {
    const sql = readFileSync(new URL("20261019000005_clienti_ore.sql", CARTELLA), "utf8");
    for (const campo of ["via", "numero", "npa", "localita"] as const) {
      expect(sql).toContain(`check (char_length(${campo}) <= ${LUNGHEZZE_INDIRIZZO_QR[campo]})`);
    }
    expect(sql).toContain(`check (char_length(nome) between 1 and ${LUNGHEZZE_INDIRIZZO_QR.nome})`);
    expect(sql).toContain(`check (minuti between 1 and ${MINUTI_MASSIMI})`);
    expect(sql.match(new RegExp(`tariffa_centesimi between 0 and ${TARIFFA_MASSIMA * 100}\\)`, "g"))).toHaveLength(2);
  });

  it("ognuno vede e cambia solo i propri clienti e le proprie ore", async () => {
    const cliente = await nuovoCliente(LIBERA);
    await nuovaVoce(LIBERA, cliente);
    const viste = await comeUtente(
      () =>
        db.query<{ n: number }>(
          "select (select count(*) from public.conti_clienti) + (select count(*) from public.conti_ore) as n",
        ),
      SPIONE,
    );
    expect(Number(viste.rows[0]?.n)).toBe(0);
    const proprie = await comeUtente(
      () => db.query<{ n: number }>("select count(*)::int as n from public.conti_ore where cliente_id = $1", [cliente]),
      LIBERA,
    );
    expect(proprie.rows[0]?.n).toBe(1);

    await expect(nuovoCliente(LIBERA, {}, SPIONE)).rejects.toThrow(/row-level security/);
    await expect(nuovaVoce(LIBERA, cliente, {}, SPIONE)).rejects.toThrow(/row-level security/);
    for (const sql of [
      "update public.conti_clienti set nome = 'Rubato'",
      "update public.conti_ore set fatturata_il = '2026-10-31'",
      "delete from public.conti_ore",
      "delete from public.conti_clienti",
    ]) {
      const r = await comeUtente(() => db.query(sql), SPIONE);
      expect(r.affectedRows).toBe(0);
    }
    await expect(come("anon", "", () => db.query("select * from public.conti_clienti"))).rejects.toThrow(/permission denied/);
    await expect(come("anon", "", () => db.query("select * from public.conti_ore"))).rejects.toThrow(/permission denied/);
  });

  it("nessuno attacca ore al cliente di un altro, nemmeno con il proprio user_id o dal server", async () => {
    const altrui = await nuovoCliente(LIBERA);
    await expect(nuovaVoce(SPIONE, altrui)).rejects.toThrow(/conti_ore_cliente_utente/);
    await expect(
      db.query("insert into public.conti_ore (user_id, cliente_id, data, minuti) values ($1, $2, '2026-10-15', 30)", [SPIONE, altrui]),
    ).rejects.toThrow(/conti_ore_cliente_utente/);
    // Spostare una propria voce sul cliente di un altro non passa.
    const mio = await nuovoCliente(SPIONE);
    const voce = await nuovaVoce(SPIONE, mio);
    await expect(
      comeUtente(() => db.query("update public.conti_ore set cliente_id = $1 where id = $2", [altrui, voce]), SPIONE),
    ).rejects.toThrow(/conti_ore_cliente_utente/);
  });

  it("rifiuta durate, paesi, email e tariffe non validi", async () => {
    const cliente = await nuovoCliente(LIBERA);
    await expect(nuovaVoce(LIBERA, cliente, { minuti: 0 })).rejects.toThrow(/check/);
    await expect(nuovaVoce(LIBERA, cliente, { minuti: MINUTI_MASSIMI + 1 })).rejects.toThrow(/check/);
    await expect(nuovaVoce(LIBERA, cliente, { descrizione: "x".repeat(201) })).rejects.toThrow(/check/);
    await expect(nuovaVoce(LIBERA, cliente, { tariffa_centesimi: -1 })).rejects.toThrow(/check/);
    await expect(nuovoCliente(LIBERA, { paese: "ch" })).rejects.toThrow(/check/);
    await expect(nuovoCliente(LIBERA, { nome: "" })).rejects.toThrow(/check/);
    await expect(nuovoCliente(LIBERA, { localita: "x".repeat(LUNGHEZZE_INDIRIZZO_QR.localita + 1) })).rejects.toThrow(/check/);
    await expect(nuovoCliente(LIBERA, { email: "non un'email" })).rejects.toThrow(/check/);
    await expect(nuovoCliente(LIBERA, { tariffa_centesimi: TARIFFA_MASSIMA * 100 + 1 })).rejects.toThrow(/check/);
    await nuovoCliente(LIBERA, { email: "info@rossi.ch", tariffa_centesimi: 12000, paese: "IT" });
  });

  it("le ore segnate come fatturate non si segnano una seconda volta", async () => {
    const cliente = await nuovoCliente(LIBERA, { nome: "Fatture SA" });
    for (const data of ["2026-10-01", "2026-10-31", "2026-11-01"]) await nuovaVoce(LIBERA, cliente, { data });
    // La stessa modifica che fa POST /api/conti/ore/fattura.
    const segna = () =>
      comeUtente(
        () =>
          db.query<{ id: string }>(
            `update public.conti_ore set fatturata_il = '2026-11-02'
              where cliente_id = $1 and data >= '2026-10-01' and data <= '2026-10-31' and fatturata_il is null
              returning id`,
            [cliente],
          ),
        LIBERA,
      );
    expect((await segna()).rows).toHaveLength(2);
    expect((await segna()).rows).toHaveLength(0);
    const novembre = await db.query<{ fatturata_il: string | null }>(
      "select fatturata_il::text from public.conti_ore where cliente_id = $1 and data = '2026-11-01'",
      [cliente],
    );
    expect(novembre.rows).toEqual([{ fatturata_il: null }]);
  });

  it("cancellando un cliente spariscono le sue ore", async () => {
    const cliente = await nuovoCliente(LIBERA, { nome: "Da cancellare" });
    await nuovaVoce(LIBERA, cliente);
    await nuovaVoce(LIBERA, cliente, { data: "2026-10-16" });
    await comeUtente(() => db.query("delete from public.conti_clienti where id = $1", [cliente]), LIBERA);
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.conti_ore where cliente_id = $1", [cliente]);
    expect(r.rows[0]?.n).toBe(0);
  });

  it("al massimo 2000 clienti per utente", async () => {
    await db.query(
      "insert into public.conti_clienti (user_id, nome) select $1, 'riempitivo' from generate_series(1, 2000 - (select count(*) from public.conti_clienti where user_id = $1))",
      [SPIONE],
    );
    await expect(nuovoCliente(SPIONE)).rejects.toThrow(/troppe righe in conti_clienti/);
    await db.query("delete from public.conti_clienti where user_id = $1", [SPIONE]);
  });

  it("cancellando l'utente spariscono tutti i suoi clienti e le sue ore", async () => {
    await db.query("delete from auth.users where id = $1", [LIBERA]);
    const r = await db.query<{ righe: number }>(
      `select (select count(*) from public.conti_clienti where user_id = $1)
            + (select count(*) from public.conti_ore where user_id = $1) as righe`,
      [LIBERA],
    );
    expect(Number(r.rows[0]?.righe)).toBe(0);
  });
});

describe("«Cassetto dei documenti» (cassetto_documenti e bucket cassetto)", () => {
  const TITOLARE = "c4550000-0000-4000-8000-000000000001";
  const CURIOSA = "c4550000-0000-4000-8000-000000000002";
  const percorso = (utente: string, n = 1, estensione = "pdf") =>
    `${utente}/${String(n).padStart(8, "0")}-2222-3333-4444-555555555555.${estensione}`;

  beforeAll(async () => {
    await db.exec(
      `insert into auth.users (id, email) values ('${TITOLARE}', 'cassetto@example.ch'), ('${CURIOSA}', 'curiosa@example.ch')`,
    );
  });

  const documento = (utente: string, campi: Record<string, string | number | null> = {}, come = utente) => {
    const riga = {
      user_id: utente,
      titolo: "Permesso B",
      tipo: "permesso",
      scade_il: "2027-05-31",
      percorso: percorso(utente),
      tipo_file: "application/pdf",
      byte: 120000,
      ...campi,
    };
    const colonne = Object.keys(riga);
    return comeUtente(
      () =>
        db.query<{ id: string }>(
          `insert into public.cassetto_documenti (${colonne.join(", ")}) values (${colonne.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
          Object.values(riga),
        ),
      come,
    );
  };

  it("i tipi e il numero massimo nel database sono quelli di src/lib/cassetto", () => {
    const sql = readFileSync(new URL("20261019000004_cassetto_documenti.sql", CARTELLA), "utf8");
    const elenco = /tipo in \(([^)]*)\)\),/.exec(sql)?.[1] ?? "";
    expect([...elenco.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])).toEqual(TIPI_DOCUMENTO.map((t) => t.id));
    expect(sql).toContain(`limita_righe_conti('${DOCUMENTI_MASSIMI}')`);
  });

  it("ognuno vede, cambia e cancella solo i propri documenti", async () => {
    const id = (await documento(TITOLARE)).rows[0]!.id;
    const proprie = await comeUtente(() => db.query<{ n: number }>("select count(*)::int as n from public.cassetto_documenti"), TITOLARE);
    expect(proprie.rows[0]?.n).toBe(1);
    const altrui = await comeUtente(() => db.query<{ n: number }>("select count(*)::int as n from public.cassetto_documenti"), CURIOSA);
    expect(altrui.rows[0]?.n).toBe(0);
    await expect(documento(TITOLARE, { percorso: percorso(TITOLARE, 2) }, CURIOSA)).rejects.toThrow(/row-level security/);
    const cambiate = await comeUtente(
      () => db.query("update public.cassetto_documenti set titolo = 'rubato' where id = $1", [id]),
      CURIOSA,
    );
    expect(cambiate.affectedRows).toBe(0);
    const cancellate = await comeUtente(() => db.query("delete from public.cassetto_documenti where id = $1", [id]), CURIOSA);
    expect(cancellate.affectedRows).toBe(0);
    await expect(come("anon", "", () => db.query("select * from public.cassetto_documenti"))).resolves.toMatchObject({ rows: [] });
  });

  it("dopo il caricamento si cambiano nome, tipo, scadenza e nota, non il file", async () => {
    const id = (await documento(TITOLARE, { percorso: percorso(TITOLARE, 3) })).rows[0]!.id;
    await comeUtente(
      () =>
        db.query(
          "update public.cassetto_documenti set titolo = 'Permesso B rinnovato', tipo = 'altro', scade_il = null, nota = 'ok', aggiornato_il = now() where id = $1",
          [id],
        ),
      TITOLARE,
    );
    for (const colonna of ["percorso = percorso", "byte = 1", "tipo_file = 'image/png'", `user_id = '${CURIOSA}'`]) {
      await expect(
        comeUtente(() => db.query(`update public.cassetto_documenti set ${colonna} where id = $1`, [id]), TITOLARE),
      ).rejects.toThrow(/permission denied/);
    }
    const r = await db.query<{ titolo: string; scade_il: string | null }>(
      "select titolo, scade_il from public.cassetto_documenti where id = $1",
      [id],
    );
    expect(r.rows).toEqual([{ titolo: "Permesso B rinnovato", scade_il: null }]);
  });

  it("rifiuta tipi sconosciuti, titoli vuoti, date strane, file troppo grandi e percorsi fuori dalla cartella", async () => {
    await expect(documento(TITOLARE, { tipo: "ricevuta", percorso: percorso(TITOLARE, 4) })).rejects.toThrow(/check/);
    await expect(documento(TITOLARE, { titolo: "", percorso: percorso(TITOLARE, 4) })).rejects.toThrow(/check/);
    await expect(documento(TITOLARE, { scade_il: "1999-12-31", percorso: percorso(TITOLARE, 4) })).rejects.toThrow(/check/);
    await expect(documento(TITOLARE, { byte: 3_500_001, percorso: percorso(TITOLARE, 4) })).rejects.toThrow(/check/);
    await expect(documento(TITOLARE, { tipo_file: "text/plain", percorso: percorso(TITOLARE, 4) })).rejects.toThrow(/check/);
    await expect(documento(TITOLARE, { percorso: percorso(CURIOSA, 4) })).rejects.toThrow(/cassetto_documenti_percorso_utente/);
    await expect(documento(TITOLARE, { percorso: `${TITOLARE}/../x.pdf` })).rejects.toThrow(/cassetto_documenti_percorso_utente/);
  });

  it(`al massimo ${DOCUMENTI_MASSIMI} documenti per utente`, async () => {
    await db.query(
      `insert into public.cassetto_documenti (user_id, titolo, tipo, percorso, tipo_file, byte)
       select $1::uuid, 'riempitivo', 'altro', $1::text || '/' || lpad(n::text, 8, '0') || '-0000-4000-8000-000000000000.pdf', 'application/pdf', 10
         from generate_series(1, ${DOCUMENTI_MASSIMI}) as n`,
      [CURIOSA],
    );
    await expect(documento(CURIOSA, { percorso: percorso(CURIOSA, 999) })).rejects.toThrow(/troppe righe in cassetto_documenti/);
    await db.query("delete from public.cassetto_documenti where user_id = $1", [CURIOSA]);
  });

  it("nello Storage il bucket cassetto è privato e ognuno usa solo la sua cartella", async () => {
    const r = await db.query<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(
      "select public, file_size_limit::text, allowed_mime_types from storage.buckets where id = 'cassetto'",
    );
    expect(r.rows).toEqual([
      { public: false, file_size_limit: "3500000", allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
    ]);
    await comeUtente(
      () => db.query("insert into storage.objects (bucket_id, name) values ('cassetto', $1)", [percorso(TITOLARE)]),
      TITOLARE,
    );
    await expect(
      comeUtente(
        () => db.query("insert into storage.objects (bucket_id, name) values ('cassetto', $1)", [percorso(TITOLARE, 2)]),
        CURIOSA,
      ),
    ).rejects.toThrow(/row-level security/);
    const visti = await comeUtente(
      () => db.query("select name from storage.objects where bucket_id = 'cassetto'"),
      CURIOSA,
    );
    expect(visti.rows).toEqual([]);
    const propri = await comeUtente(
      () => db.query<{ name: string }>("select name from storage.objects where bucket_id = 'cassetto'"),
      TITOLARE,
    );
    expect(propri.rows).toEqual([{ name: percorso(TITOLARE) }]);
    const cancellati = await comeUtente(
      () => db.query("delete from storage.objects where bucket_id = 'cassetto' and name = $1", [percorso(TITOLARE)]),
      CURIOSA,
    );
    expect(cancellati.affectedRows).toBe(0);
    await comeUtente(
      () => db.query("delete from storage.objects where bucket_id = 'cassetto' and name = $1", [percorso(TITOLARE)]),
      TITOLARE,
    );
  });

  it("cancellando l'utente spariscono tutti i suoi documenti", async () => {
    await documento(TITOLARE, { percorso: percorso(TITOLARE, 5) });
    await db.query("delete from auth.users where id = $1", [TITOLARE]);
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.cassetto_documenti where user_id = $1", [TITOLARE]);
    expect(r.rows[0]?.n).toBe(0);
  });
});

describe("«Calendario sempre aggiornato» (link_calendario)", () => {
  const CALENDARIO = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const SPIONE = "cccccccc-cccc-cccc-cccc-cccccccccccc";

  beforeAll(async () => {
    await db.exec(
      `insert into auth.users (id, email) values ('${CALENDARIO}', 'calendario@example.ch'), ('${SPIONE}', 'spione@example.ch')`,
    );
  });

  const impronta = () => improntaToken(nuovoTokenCalendario());

  const nuovoLink = (utente: string, valore: string) =>
    comeUtente(
      () =>
        db
          .query<{ id: string; creato_il: string }>("select * from public.nuovo_link_calendario($1)", [valore])
          .then((r) => r.rows[0]!),
      utente,
    );

  const linkDi = (utente: string) =>
    db
      .query<{ id: string; impronta: string; letto_il: string | null }>(
        "select id, impronta, letto_il from public.link_calendario where user_id = $1",
        [utente],
      )
      .then((r) => r.rows);

  it("ognuno crea e vede solo il proprio link; senza accesso non si vede niente", async () => {
    const mio = await nuovoLink(CALENDARIO, await impronta());
    expect(mio.id).toMatch(/^[0-9a-f-]{36}$/);
    const visti = await comeUtente(
      () => db.query<{ user_id: string }>("select user_id from public.link_calendario"),
      CALENDARIO,
    );
    expect(visti.rows).toEqual([{ user_id: CALENDARIO }]);
    const dallaSpia = await comeUtente(() => db.query("select * from public.link_calendario"), SPIONE);
    expect(dallaSpia.rows).toEqual([]);
    await expect(come("anon", "", () => db.query("select * from public.link_calendario"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("«Rigenera il link»: il vecchio sparisce, resta un solo link per utente", async () => {
    const primo = await nuovoLink(CALENDARIO, await impronta());
    const nuovaImpronta = await impronta();
    const secondo = await nuovoLink(CALENDARIO, nuovaImpronta);
    expect(secondo.id).not.toBe(primo.id);
    const righe = await linkDi(CALENDARIO);
    expect(righe.map((r) => r.id)).toEqual([secondo.id]);
    expect(righe[0]?.impronta).toBe(nuovaImpronta);
    // Un secondo link accanto al primo, senza passare dalla funzione, non entra.
    await expect(
      comeUtente(
        async () =>
          db.query("insert into public.link_calendario (user_id, impronta) values ($1, $2)", [CALENDARIO, await impronta()]),
        CALENDARIO,
      ),
    ).rejects.toThrow(/link_calendario_user_id_key/);
  });

  it("nel database c'è solo l'impronta SHA-256 (64 cifre esadecimali), mai il token", async () => {
    const token = nuovoTokenCalendario();
    await nuovoLink(CALENDARIO, await improntaToken(token));
    const [riga] = await linkDi(CALENDARIO);
    expect(riga?.impronta).toMatch(/^[0-9a-f]{64}$/);
    expect(riga?.impronta).not.toContain(token);
    for (const sbagliata of [token, "A".repeat(64), "a".repeat(63), ""]) {
      await expect(nuovoLink(CALENDARIO, sbagliata)).rejects.toThrow(/check/);
    }
    // La funzione è atomica: con un'impronta sbagliata il link di prima resta.
    expect((await linkDi(CALENDARIO)).map((r) => r.impronta)).toEqual([riga?.impronta]);
  });

  it("l'utente non modifica il link, non sceglie le date e non crea link per altri", async () => {
    const { id } = await nuovoLink(CALENDARIO, await impronta());
    await expect(
      comeUtente(() => db.query("update public.link_calendario set impronta = $1 where id = $2", ["b".repeat(64), id]), CALENDARIO),
    ).rejects.toThrow(/permission denied/);
    await expect(
      comeUtente(
        async () =>
          db.query("insert into public.link_calendario (user_id, impronta, creato_il) values ($1, $2, now() - interval '1 year')", [
            SPIONE,
            await impronta(),
          ]),
        SPIONE,
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      comeUtente(
        async () => db.query("insert into public.link_calendario (user_id, impronta) values ($1, $2)", [SPIONE, await impronta()]),
        CALENDARIO,
      ),
    ).rejects.toThrow(/row-level security/);
    const r = await db.query<{ recente: boolean; letto_il: string | null }>(
      "select creato_il > now() - interval '1 minute' as recente, letto_il from public.link_calendario where id = $1",
      [id],
    );
    expect(r.rows).toEqual([{ recente: true, letto_il: null }]);
  });

  it("ognuno revoca solo il proprio link", async () => {
    await nuovoLink(CALENDARIO, await impronta());
    await nuovoLink(SPIONE, await impronta());
    await comeUtente(() => db.query("delete from public.link_calendario"), SPIONE);
    expect(await linkDi(SPIONE)).toEqual([]);
    expect(await linkDi(CALENDARIO)).toHaveLength(1);
  });

  it("senza accesso nuovo_link_calendario non si può chiamare", async () => {
    await expect(
      come("anon", "", async () => db.query("select * from public.nuovo_link_calendario($1)", [await impronta()])),
    ).rejects.toThrow(/permission denied/);
  });

  it("il server (chiave segreta) trova il link dall'impronta e segna la lettura", async () => {
    const token = nuovoTokenCalendario();
    const valore = await improntaToken(token);
    await nuovoLink(CALENDARIO, valore);
    const trovato = await db.query<{ user_id: string }>("select user_id from public.link_calendario where impronta = $1", [
      await improntaToken(token),
    ]);
    expect(trovato.rows).toEqual([{ user_id: CALENDARIO }]);
    await db.query("update public.link_calendario set letto_il = now() where impronta = $1", [valore]);
    expect((await linkDi(CALENDARIO))[0]?.letto_il).not.toBeNull();
    const altro = await db.query("select user_id from public.link_calendario where impronta = $1", [
      await improntaToken(nuovoTokenCalendario()),
    ]);
    expect(altro.rows).toEqual([]);
  });

  it("cancellando l'utente sparisce il suo link", async () => {
    await nuovoLink(SPIONE, await impronta());
    await db.query("delete from auth.users where id = $1", [SPIONE]);
    expect(await linkDi(SPIONE)).toEqual([]);
  });
});
