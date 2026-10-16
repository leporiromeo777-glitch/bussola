// Unisce tutte le migrazioni in supabase/setup-completo.sql, da incollare in
// un colpo solo nel SQL editor di Supabase (progetto nuovo e vuoto).
// Uso: npm run supabase:sql
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const cartella = new URL("../supabase/migrations/", import.meta.url);

export function sqlCompleto() {
  const file = readdirSync(cartella).filter((nome) => nome.endsWith(".sql")).sort();
  const parti = file.map(
    (nome) => `-- ===========================================================================\n-- ${nome}\n-- ===========================================================================\n\n${readFileSync(new URL(nome, cartella), "utf8").trim()}\n`,
  );
  return [
    "-- Bussola: tutte le migrazioni in ordine, per un progetto Supabase nuovo.",
    "-- File generato da scripts/genera-sql-completo.mjs: non modificarlo a mano,",
    "-- cambia le migrazioni in supabase/migrations/ e rigeneralo.",
    "",
    ...parti,
  ].join("\n");
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  writeFileSync(new URL("../supabase/setup-completo.sql", import.meta.url), sqlCompleto());
  console.log("Scritto supabase/setup-completo.sql");
}
