import { describe, expect, it } from "vitest";
import { TOLLERANZA_FIRMA_SECONDI, chiaveSegreto, firmaSvix, verificaFirma } from "./firma";

// Esempio della documentazione di Svix (e di Resend): segreto, id, timestamp, corpo e firma.
const ESEMPIO = {
  segreto: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
  id: "msg_p5jXN8AQM9LWM0D4loKWxJek",
  timestamp: "1614265330",
  corpo: '{"test": 2432232314}',
  firma: "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
};
const ADESSO = Number(ESEMPIO.timestamp) * 1000;

describe("verificaFirma", () => {
  it("accetta l'esempio ufficiale di Svix", () => {
    expect(
      verificaFirma(ESEMPIO.corpo, { id: ESEMPIO.id, timestamp: ESEMPIO.timestamp, firma: ESEMPIO.firma }, ESEMPIO.segreto, ADESSO),
    ).toBe("valida");
  });

  it("basta una firma valida tra quelle separate da spazi", () => {
    const firma = `v1,AAAA v2,xyz ${ESEMPIO.firma}`;
    expect(verificaFirma(ESEMPIO.corpo, { id: ESEMPIO.id, timestamp: ESEMPIO.timestamp, firma }, ESEMPIO.segreto, ADESSO)).toBe(
      "valida",
    );
  });

  it("rifiuta un corpo cambiato, un altro id o un altro segreto", () => {
    const intestazioni = { id: ESEMPIO.id, timestamp: ESEMPIO.timestamp, firma: ESEMPIO.firma };
    expect(verificaFirma('{"test": 2432232315}', intestazioni, ESEMPIO.segreto, ADESSO)).toBe("non_valida");
    expect(verificaFirma(ESEMPIO.corpo, { ...intestazioni, id: "msg_altro" }, ESEMPIO.segreto, ADESSO)).toBe("non_valida");
    const altro = `whsec_${Buffer.from("un altro segreto di prova!").toString("base64")}`;
    expect(verificaFirma(ESEMPIO.corpo, intestazioni, altro, ADESSO)).toBe("non_valida");
  });

  it("rifiuta un timestamp troppo vecchio o nel futuro (richieste rimandate)", () => {
    const intestazioni = { id: ESEMPIO.id, timestamp: ESEMPIO.timestamp, firma: ESEMPIO.firma };
    const oltre = (TOLLERANZA_FIRMA_SECONDI + 1) * 1000;
    expect(verificaFirma(ESEMPIO.corpo, intestazioni, ESEMPIO.segreto, ADESSO + oltre)).toBe("scaduta");
    expect(verificaFirma(ESEMPIO.corpo, intestazioni, ESEMPIO.segreto, ADESSO - oltre)).toBe("scaduta");
    expect(verificaFirma(ESEMPIO.corpo, intestazioni, ESEMPIO.segreto, ADESSO + oltre - 2000)).toBe("valida");
  });

  it("intestazioni mancanti, segreto mancante o non valido", () => {
    expect(verificaFirma(ESEMPIO.corpo, { id: null, timestamp: ESEMPIO.timestamp, firma: ESEMPIO.firma }, ESEMPIO.segreto)).toBe(
      "mancante",
    );
    const intestazioni = { id: ESEMPIO.id, timestamp: ESEMPIO.timestamp, firma: ESEMPIO.firma };
    expect(verificaFirma(ESEMPIO.corpo, intestazioni, undefined, ADESSO)).toBe("non_valida");
    expect(verificaFirma(ESEMPIO.corpo, intestazioni, "whsec_!!!", ADESSO)).toBe("non_valida");
    expect(verificaFirma(ESEMPIO.corpo, { ...intestazioni, timestamp: "ieri" }, ESEMPIO.segreto, ADESSO)).toBe("non_valida");
  });

  it("una firma creata con firmaSvix si verifica", () => {
    const chiave = chiaveSegreto(ESEMPIO.segreto)!;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const corpo = JSON.stringify({ type: "email.received", data: { email_id: "x" } });
    const firma = `v1,${firmaSvix(chiave, "msg_1", timestamp, corpo)}`;
    expect(verificaFirma(corpo, { id: "msg_1", timestamp, firma }, ESEMPIO.segreto)).toBe("valida");
  });
});
