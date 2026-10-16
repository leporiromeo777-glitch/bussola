import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sqlCompleto } from "../scripts/genera-sql-completo.mjs";

describe("supabase/setup-completo.sql", () => {
  it("è aggiornato rispetto alle migrazioni (rigenera con npm run supabase:sql)", () => {
    const attuale = readFileSync(new URL("./setup-completo.sql", import.meta.url), "utf8");
    expect(attuale).toBe(sqlCompleto());
  });
});
