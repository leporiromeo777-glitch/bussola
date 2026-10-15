import { describe, expect, it } from "vitest";
import { CAMPO_TRAPPOLA, leggiToken, trappolaCompilata, validaIscrizione } from "./validazione";

function modulo(campi: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campi)) form.set(k, v);
  return form;
}

const valido = { email: "giulia@example.ch", consenso: "si" };

describe("validaIscrizione", () => {
  it("accetta solo email e consenso; i campi facoltativi diventano null", () => {
    const r = validaIscrizione(modulo(valido));
    expect(r).toEqual({
      ok: true,
      dati: {
        email: "giulia@example.ch",
        nome: null,
        cantone: null,
        situazione: null,
        consenso: true,
        provenienza: null,
      },
    });
  });

  it("normalizza l'email in minuscolo e senza spazi", () => {
    const r = validaIscrizione(modulo({ ...valido, email: "  Giulia.Rossi@Example.CH " }));
    expect(r.ok && r.dati.email).toBe("giulia.rossi@example.ch");
  });

  it("compatta gli spazi del nome e accetta i valori degli elenchi", () => {
    const r = validaIscrizione(
      modulo({ ...valido, nome: "  Giulia \n  Rossi ", cantone: "TI", situazione: "in_apertura" }),
    );
    expect(r.ok && r.dati).toMatchObject({ nome: "Giulia Rossi", cantone: "TI", situazione: "in_apertura" });
  });

  it.each(["idea", "in_apertura", "aperta_da_poco", "fiduciario", "altro"])(
    "accetta la situazione %s (valori del vincolo nel database)",
    (situazione) => {
      expect(validaIscrizione(modulo({ ...valido, situazione })).ok).toBe(true);
    },
  );

  it("taglia la provenienza a 60 caratteri", () => {
    const r = validaIscrizione(modulo({ ...valido, provenienza: "x".repeat(100) }));
    expect(r.ok && r.dati.provenienza).toBe("x".repeat(60));
  });

  it("rifiuta un'email mancante o non valida, con il messaggio sul campo giusto", () => {
    for (const email of ["", "   ", "giulia", "giulia@", "giulia@example", "a b@example.ch"]) {
      const r = validaIscrizione(modulo({ ...valido, email }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errori.email).toBeTruthy();
    }
  });

  it("rifiuta un'email troppo lunga", () => {
    const r = validaIscrizione(modulo({ ...valido, email: `${"a".repeat(250)}@example.ch` }));
    expect(r.ok).toBe(false);
  });

  it("senza consenso non iscrive e lo spiega", () => {
    const r = validaIscrizione(modulo({ email: "giulia@example.ch" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errori.consenso).toMatch(/spunta la casella/);
      expect(r.errori.email).toBeUndefined();
    }
  });

  it("rifiuta valori fuori elenco per Cantone e situazione", () => {
    const r = validaIscrizione(modulo({ ...valido, cantone: "ZH", situazione: "boh" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errori.cantone).toBeTruthy();
      expect(r.errori.situazione).toBeTruthy();
    }
  });

  it("restituisce i valori scritti per ripresentarli nel modulo", () => {
    const r = validaIscrizione(modulo({ email: "giulia@", nome: "Giulia", cantone: "GR", situazione: "ZZ" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.valori).toEqual({ email: "giulia@", nome: "Giulia", cantone: "GR", situazione: "", consenso: false });
    }
  });

  it("ignora i file al posto del testo", () => {
    const form = modulo(valido);
    form.set("nome", new Blob(["x"]));
    const r = validaIscrizione(form);
    expect(r.ok && r.dati.nome).toBeNull();
  });
});

describe("trappolaCompilata", () => {
  it("è false se il campo trappola è vuoto o assente", () => {
    expect(trappolaCompilata(modulo(valido))).toBe(false);
    expect(trappolaCompilata(modulo({ ...valido, [CAMPO_TRAPPOLA]: "  " }))).toBe(false);
  });

  it("è true se un bot lo compila", () => {
    expect(trappolaCompilata(modulo({ ...valido, [CAMPO_TRAPPOLA]: "https://spam.example" }))).toBe(true);
  });
});

describe("leggiToken", () => {
  const token = "3f2b8c1e-7a4d-4f6b-9c2e-1d5a6b7c8d9e";

  it("accetta un UUID e lo porta in minuscolo", () => {
    expect(leggiToken(token)).toBe(token);
    expect(leggiToken(` ${token.toUpperCase()} `)).toBe(token);
    expect(leggiToken([token, "altro"])).toBe(token);
  });

  it("rifiuta tutto il resto", () => {
    for (const v of [undefined, null, "", "abc", `${token}x`, "' or 1=1 --", 42, [], {}]) {
      expect(leggiToken(v)).toBeNull();
    }
  });
});
