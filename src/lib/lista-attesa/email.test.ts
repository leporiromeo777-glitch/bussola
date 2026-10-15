import { describe, expect, it } from "vitest";
import { componiEmailConferma, escapeHtml, linkConferma, linkDisiscrizione, type Mittente } from "./email";

const mittente: Mittente = {
  nomeSito: "Bussola",
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
    const email = componiEmailConferma({ nome: "Giulia", token, mittente });
    for (const corpo of [email.html, email.testo]) {
      expect(corpo).toContain(`https://bussola.example/lista-attesa/conferma?token=${token}`);
      expect(corpo).toContain(`https://bussola.example/lista-attesa/disiscriviti?token=${token}`);
    }
    expect(email.oggetto).toBe("Conferma la tua iscrizione alla lista d'attesa di Bussola");
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

  it("saluta per nome se c'è, altrimenti in modo generico", () => {
    expect(componiEmailConferma({ nome: "Giulia", token, mittente }).testo.startsWith("Ciao Giulia,")).toBe(true);
    expect(componiEmailConferma({ nome: "  ", token, mittente }).testo.startsWith("Ciao,")).toBe(true);
    expect(componiEmailConferma({ nome: null, token, mittente }).html).toContain("<p style=\"margin:0 0 16px;\">Ciao,</p>");
  });

  it("fa l'escape del nome scritto dall'utente nell'HTML", () => {
    const email = componiEmailConferma({ nome: `<img src=x onerror="alert(1)">`, token, mittente });
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("Ciao &lt;img src=x onerror=&quot;alert(1)&quot;&gt;,");
  });

  it("tiene il nome su una riga nel testo semplice", () => {
    const email = componiEmailConferma({ nome: "Giulia\r\nBcc: altro@example.ch", token, mittente });
    expect(email.testo.split("\n")[0]).toBe("Ciao Giulia Bcc: altro@example.ch,");
  });
});
