import { describe, expect, it } from "vitest";
import type { FonteElenco } from "./elenco";
import { letterale, sqlFonte } from "./sql";

const fonte: FonteElenco = {
  id: "ti-rc",
  url: "https://www4.ti.ch/esempio",
  titolo: "Iscrizione d'una ditta",
  ente: "Cantone Ticino",
  livello: "cantonale",
  cantone: "TI",
  argomenti: ["registro di commercio"],
  verificato_il: "2026-10-16",
  verificato_da: "test",
  attiva: true,
};

describe("letterale", () => {
  it("raddoppia gli apici e gestisce null", () => {
    expect(letterale("l'IVA")).toBe("'l''IVA'");
    expect(letterale(null)).toBe("null");
  });
});

describe("sqlFonte", () => {
  it("aggiorna la fonte e sostituisce i frammenti", () => {
    const sql = sqlFonte(fonte, [{ posizione: 1, titolo_sezione: "Costi", testo: "Fr. 80 per l'iscrizione" }], "2026-10-16T08:00:00Z");
    expect(sql).toContain("on conflict (id) do update");
    expect(sql).toContain("'Iscrizione d''una ditta'");
    expect(sql).toContain("delete from public.frammenti_fonti where fonte_id = 'ti-rc';");
    expect(sql).toContain("('ti-rc', 1, 'Costi', 'Fr. 80 per l''iscrizione')");
  });

  it("per una fonte disattivata aggiorna solo la riga della fonte", () => {
    const sql = sqlFonte({ ...fonte, attiva: false }, null, "2026-10-16T08:00:00Z");
    expect(sql).toContain("false");
    expect(sql).not.toContain("frammenti_fonti");
  });
});
