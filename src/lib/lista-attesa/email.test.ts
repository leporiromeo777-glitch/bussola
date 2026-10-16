import { describe, expect, it } from "vitest";
import { componiEmailConferma, escapeHtml, linkConferma, linkDisiscrizione, type Mittente } from "./email";

const mittente: Mittente = {
  nomeSito: "Bleo",
  urlSito: "https://bussola.example",
  titolare: { nome: "Maria Esempio", indirizzo: "Via Esempio 1, 6900 Lugano", email: "ciao@bussola.example" },
};
const token = "3f2b8c1e-7a4d-4f6b-9c2e-1d5a6b7c8d9e";

describe("escapeHtml", () => {
  it("neutralizza i caratteri speciali dell'HTML", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });
});

describe("link", () => {
  it("costruisce i link di conferma e disiscrizione dal dominio del sito", () => {
    expect(linkConferma(mittente.urlSito, token)).toBe(`https://bussola.example/lista-attesa/conferma?token=${token}`);
    expect(linkDisiscrizione("https://bussola.example/", token)).toBe(
      `https://bussola.example/lista-attesa/disiscriviti?token=${token}`,
    );
  });
});

describe("componiEmailConferma", () => {
  it("contiene il link di conferma e quello per disiscriversi, in HTML e in testo", () => {
    const email = componiEmailConferma({ token, mittente });
    for (const corpo of [email.html, email.testo]) {
      expect(corpo).toContain(`https://bussola.example/lista-attesa/conferma?token=${token}`);
      expect(corpo).toContain(`https://bussola.example/lista-attesa/disiscriviti?token=${token}`);
    }
    expect(email.oggetto).toBe("Conferma la tua iscrizione alla lista d'attesa di Bleo");
    expect(email.intestazioni["List-Unsubscribe"]).toBe(
      `<https://bussola.example/lista-attesa/disiscriviti?token=${token}>`,
    );
  });

  it("mostra il titolare nel piè di pagina (LCSl)", () => {
    const email = componiEmailConferma({ token, mittente });
    for (const corpo of [email.html, email.testo]) {
      expect(corpo).toContain("Maria Esempio");
      expect(corpo).toContain("Via Esempio 1, 6900 Lugano");
      expect(corpo).toContain("ciao@bussola.example");
    }
  });

  it("saluta sempre in modo generico: nessun testo scritto da chi compila il modulo", () => {
    const email = componiEmailConferma({ token, mittente });
    expect(email.testo.startsWith("Ciao,\n")).toBe(true);
    expect(email.html).toContain("<p style=\"margin:0 0 16px;\">Ciao,</p>");
  });

  it("il testo dell'email è uguale per ogni iscrizione, a parte i link con il token", () => {
    const altro = "9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e";
    const a = componiEmailConferma({ token, mittente });
    const b = componiEmailConferma({ token: altro, mittente });
    expect(b.testo.replaceAll(altro, token)).toBe(a.testo);
    expect(b.html.replaceAll(altro, token)).toBe(a.html);
  });
});
