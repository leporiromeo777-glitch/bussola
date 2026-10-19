import { describe, expect, it } from "vitest";
import { LIMITI_RICHIESTE, chiaveLimite, chiaveLimiteUtente, ipDaIntestazioni } from "./richieste";

const intestazioni = (valori: Record<string, string>) => new Headers(valori);

describe("ipDaIntestazioni", () => {
  it("preferisce l'intestazione scritta dall'hosting", () => {
    expect(
      ipDaIntestazioni(
        intestazioni({
          "x-nf-client-connection-ip": "203.0.113.7",
          "x-real-ip": "198.51.100.1",
          "x-forwarded-for": "1.2.3.4",
        }),
      ),
    ).toBe("203.0.113.7");
    expect(ipDaIntestazioni(intestazioni({ "x-real-ip": "198.51.100.1", "x-forwarded-for": "1.2.3.4" }))).toBe(
      "198.51.100.1",
    );
  });

  it("da X-Forwarded-For prende l'ultimo valore, quello del proxy più vicino", () => {
    expect(ipDaIntestazioni(intestazioni({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("accetta IPv6 e ignora valori che non sono indirizzi", () => {
    expect(ipDaIntestazioni(intestazioni({ "x-real-ip": "2001:DB8::1" }))).toBe("2001:db8::1");
    expect(ipDaIntestazioni(intestazioni({ "x-real-ip": "non-un-ip" }))).toBeNull();
    expect(ipDaIntestazioni(intestazioni({}))).toBeNull();
  });
});

describe("chiaveLimite", () => {
  it("non contiene l'IP in chiaro e dipende da ambito, IP e segreto", () => {
    const chiave = chiaveLimite("listaAttesa", "203.0.113.7", "segreto");
    expect(chiave.startsWith("listaAttesa:")).toBe(true);
    expect(chiave).not.toContain("203.0.113.7");
    expect(chiaveLimite("listaAttesa", "203.0.113.7", "segreto")).toBe(chiave);
    expect(chiaveLimite("accesso", "203.0.113.7", "segreto")).not.toBe(chiave);
    expect(chiaveLimite("listaAttesa", "203.0.113.8", "segreto")).not.toBe(chiave);
    expect(chiaveLimite("listaAttesa", "203.0.113.7", "altro")).not.toBe(chiave);
    expect(chiave.length).toBeLessThanOrEqual(200);
  });
});

describe("chiaveLimiteUtente", () => {
  const ID = "0f8b6c2e-6a3d-4c1e-9b7a-2d5e8f1a3c40";

  it("non contiene l'id in chiaro e dipende da ambito, utente e segreto", () => {
    const chiave = chiaveLimiteUtente("lettera", ID, "segreto");
    expect(chiave.startsWith("lettera:u:")).toBe(true);
    expect(chiave).not.toContain(ID);
    expect(chiaveLimiteUtente("lettera", ID, "segreto")).toBe(chiave);
    expect(chiaveLimiteUtente("racconto", ID, "segreto")).not.toBe(chiave);
    expect(chiaveLimiteUtente("lettera", "1f8b6c2e-6a3d-4c1e-9b7a-2d5e8f1a3c40", "segreto")).not.toBe(chiave);
    expect(chiaveLimiteUtente("lettera", ID, "altro")).not.toBe(chiave);
    expect(chiave.length).toBeLessThanOrEqual(200);
  });

  it("non si confonde mai con la chiave di una connessione", () => {
    // Anche se qualcuno avesse come «IP» lo stesso testo dell'id, le chiavi restano diverse.
    expect(chiaveLimiteUtente("lettera", "203.0.113.7", "segreto")).not.toBe(chiaveLimite("lettera", "203.0.113.7", "segreto"));
    expect(chiaveLimite("lettera", "203.0.113.7", "segreto").startsWith("lettera:u:")).toBe(false);
  });
});

describe("LIMITI_RICHIESTE", () => {
  it("ha limiti positivi", () => {
    for (const { massimo, finestraSecondi } of Object.values(LIMITI_RICHIESTE)) {
      expect(massimo).toBeGreaterThan(0);
      expect(finestraSecondi).toBeGreaterThan(0);
    }
  });
});
