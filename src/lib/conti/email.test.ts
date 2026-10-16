import { describe, expect, it } from "vitest";
import {
  allegatiDaLeggere,
  codiceConfermaGmail,
  eSpam,
  leggiAllegati,
  leggiConfermaGmail,
  leggiEmail,
  leggiEvento,
  linkConfermaGmail,
  pianoEmail,
  sembraRicevuta,
  testoDaHtml,
  tipoAllegato,
  type Allegato,
  type EmailRicevuta,
} from "./email";
import { ALLEGATI_MASSIMI_PER_EMAIL } from "./limiti";

const CASELLA = "ricevute-k3m7q2xw5vbn4hjd6tyrz2pqaa@abc123.resend.app";
const LINK = "https://mail-settings.google.com/mail/vf-%5BANGjdJ8n2Kq_xR4%5D-Zw9pL3mT0bYc1JxQ";

// Email di conferma dell'inoltro di Gmail, come arrivano davvero (testo e
// oggetto ricostruiti dai messaggi di Google in italiano, tedesco e inglese).
const CONFERME = {
  it: {
    oggetto: "(#152648392) Conferma dell'inoltro di Gmail - Ricevi posta da mario.rossi@gmail.com",
    testo: `mario.rossi@gmail.com ha richiesto di inoltrare automaticamente la posta al tuo indirizzo email
${CASELLA}.
Codice di conferma: 152648392

Per consentire a mario.rossi@gmail.com di inoltrare automaticamente la posta al tuo indirizzo, fai clic sul link riportato di seguito per confermare la richiesta:

${LINK}

Se fai clic sul link e risulta danneggiato, copialo e incollalo in una nuova finestra del browser.

Grazie per aver utilizzato Gmail.

Cordiali saluti,

Il team di Gmail

Se non hai approvato questa richiesta o non desideri inoltrare la posta a questo indirizzo, ignora questo messaggio.`,
  },
  de: {
    oggetto: "(#987654321) Gmail-Weiterleitungsbestätigung – E-Mails von anna.muster@gmail.com empfangen",
    testo: `anna.muster@gmail.com hat angefordert, E-Mails automatisch an Ihre E-Mail-Adresse
${CASELLA} weiterzuleiten.
Bestätigungscode: 987654321

Klicken Sie auf den folgenden Link, um die Anfrage zu bestätigen und anna.muster@gmail.com zu erlauben, E-Mails automatisch an Ihre Adresse weiterzuleiten:

${LINK}

Wenn Sie auf den Link klicken und er nicht funktioniert, kopieren Sie ihn und fügen Sie ihn in ein neues Browserfenster ein.

Vielen Dank, dass Sie Gmail verwenden.

Ihr Gmail-Team`,
  },
  en: {
    oggetto: "(#314159265) Gmail Forwarding Confirmation - Receive Mail from luca.bianchi@gmail.com",
    testo: `luca.bianchi@gmail.com has requested to automatically forward mail to your email
address ${CASELLA}.
Confirmation code: 314159265

To allow luca.bianchi@gmail.com to automatically forward mail to your address, please click the link below to confirm the request:

${LINK}

If you click the link and it appears to be broken, please copy and paste it
into a new browser window. If you aren't able to access the link, you can send the confirmation code
314159265 to luca.bianchi@gmail.com.

Thanks for using Gmail!

Sincerely,

The Gmail Team`,
  },
};

function email(campi: Partial<EmailRicevuta>): EmailRicevuta {
  return {
    id: "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
    mittente: "shop@example.ch",
    oggetto: "",
    html: null,
    testo: null,
    intestazioni: {},
    autenticazione: { spf: "pass", dkim: "pass", dmarc: "pass" },
    allegati: [],
    ...campi,
  };
}

function allegato(campi: Partial<Allegato>): Allegato {
  return { id: "a", nome: "fattura.pdf", tipo: "application/pdf", disposizione: "attachment", contentId: null, byte: 12_000, url: null, ...campi };
}

describe("leggiEvento", () => {
  it("legge l'evento email.received della documentazione di Resend", () => {
    const evento = leggiEvento({
      type: "email.received",
      created_at: "2026-02-22T23:41:12.126Z",
      data: {
        email_id: "56761188-7520-42d8-8898-ff6fc54ce618",
        created_at: "2026-02-22T23:41:11.894Z",
        from: "onboarding@resend.dev",
        to: ["delivered@resend.dev"],
        bcc: [],
        cc: [],
        received_for: [CASELLA],
        message_id: "<111-222-333@email.example.com>",
        subject: "Sending this example",
        attachments: [{ id: "2a0c9ce0", filename: "avatar.png", content_type: "image/png" }],
      },
    });
    expect(evento).toEqual({
      tipo: "email.received",
      email: {
        id: "56761188-7520-42d8-8898-ff6fc54ce618",
        mittente: "onboarding@resend.dev",
        destinatari: [CASELLA, "delivered@resend.dev"],
        oggetto: "Sending this example",
      },
    });
  });

  it("altri eventi: solo il tipo; corpi strani: null", () => {
    expect(leggiEvento({ type: "email.sent", data: { email_id: "x" } })).toEqual({ tipo: "email.sent", email: null });
    expect(leggiEvento({ nulla: true })).toBeNull();
    expect(leggiEvento("testo")).toBeNull();
  });

  it("campi mancanti non fanno fallire la lettura", () => {
    expect(leggiEvento({ type: "email.received", data: { email_id: "x", to: "non una lista" } })?.email).toEqual({
      id: "x",
      mittente: "",
      destinatari: [],
      oggetto: "",
    });
  });
});

describe("leggiEmail e leggiAllegati", () => {
  it("legge la risposta di GET /emails/receiving/{id}", () => {
    const letta = leggiEmail({
      object: "email",
      id: "4ef9a417",
      to: ["delivered@resend.dev"],
      from: "onboarding@resend.dev",
      subject: "Hello World",
      html: "Congrats on sending your <strong>first email</strong>!",
      text: null,
      headers: { From: "Acme <onboarding@resend.dev>", "X-Spam-Flag": "NO", "Mime-Version": "1.0" },
      authentication: { spf: "pass", dkim: "pass", dmarc: "pass" },
      attachments: [
        { id: "3b1d", filename: "document.pdf", content_type: "application/pdf", content_disposition: null, content_id: null, size: 13264 },
      ],
    });
    expect(letta).toMatchObject({
      id: "4ef9a417",
      mittente: "onboarding@resend.dev",
      oggetto: "Hello World",
      intestazioni: { from: "Acme <onboarding@resend.dev>", "x-spam-flag": "NO" },
      autenticazione: { spf: "pass", dkim: "pass", dmarc: "pass" },
      allegati: [{ id: "3b1d", nome: "document.pdf", tipo: "application/pdf", byte: 13264 }],
    });
  });

  it("legge l'elenco degli allegati con il link per scaricarli", () => {
    expect(
      leggiAllegati({
        object: "list",
        has_more: false,
        data: [
          {
            id: "2a0c",
            filename: "avatar.png",
            size: 4096,
            content_type: "image/png",
            content_disposition: "inline",
            content_id: "img001",
            download_url: "https://inbound-cdn.resend.com/x/attachments/2a0c?signature=s",
            expires_at: "2026-10-17T14:29:41.521Z",
          },
        ],
      }),
    ).toEqual([
      {
        id: "2a0c",
        nome: "avatar.png",
        tipo: "image/png",
        disposizione: "inline",
        contentId: "img001",
        byte: 4096,
        url: "https://inbound-cdn.resend.com/x/attachments/2a0c?signature=s",
      },
    ]);
    expect(leggiAllegati({ errore: true })).toEqual([]);
  });
});

describe("conferma dell'inoltro di Gmail", () => {
  for (const [lingua, { oggetto, testo }] of Object.entries(CONFERME)) {
    it(`trova codice e link (${lingua})`, () => {
      const conferma = leggiConfermaGmail(email({ mittente: "Gmail Team <forwarding-noreply@google.com>", oggetto, testo }));
      expect(conferma).toEqual({ codice: /\(#(\d+)\)/.exec(oggetto)![1], link: LINK });
    });

    it(`trova il codice anche senza oggetto (${lingua})`, () => {
      expect(codiceConfermaGmail("", testo)).toBe(/\(#(\d+)\)/.exec(oggetto)![1]);
    });
  }

  it("trova il link anche solo nell'HTML, con &amp;", () => {
    const html = `<p>Codice di conferma: 152648392</p><a href="https://mail.google.com/mail/u/0/?ui=2&amp;ik=abc&amp;view=vf">Conferma</a>`;
    const conferma = leggiConfermaGmail(email({ mittente: "forwarding-noreply@google.com", html }));
    expect(conferma).toEqual({ codice: "152648392", link: "https://mail.google.com/mail/u/0/?ui=2&ik=abc&view=vf" });
  });

  it("non mostra link che non sono di Google", () => {
    expect(linkConfermaGmail("Clicca qui: https://mail-settings.google.com.evil.example/mail/vf-x")).toBeNull();
    expect(linkConfermaGmail("http://mail-settings.google.com/mail/vf-x")).toBeNull();
    expect(linkConfermaGmail("https://accounts.google.com/signin")).toBeNull();
  });

  it("ignora un'email che finge di essere Google ma non ha la firma DKIM", () => {
    const falsa = email({
      mittente: "forwarding-noreply@google.com",
      oggetto: CONFERME.it.oggetto,
      testo: CONFERME.it.testo,
      autenticazione: { spf: "fail", dkim: "fail", dmarc: "fail" },
    });
    expect(leggiConfermaGmail(falsa)).toBeNull();
    expect(pianoEmail(falsa)).toEqual({ azione: "niente" });
  });

  it("da un altro mittente non è una conferma", () => {
    expect(leggiConfermaGmail(email({ oggetto: CONFERME.en.oggetto, testo: CONFERME.en.testo }))).toBeNull();
  });
});

describe("spam e allegati", () => {
  it("riconosce le intestazioni antispam", () => {
    expect(eSpam({ "x-spam-flag": "YES" })).toBe(true);
    expect(eSpam({ "x-spam-status": "Yes, score=7.1 required=5.0" })).toBe(true);
    expect(eSpam({ "x-spam-status": "No, score=0.1" })).toBe(false);
    expect(eSpam({})).toBe(false);
  });

  it("tipo dal content type o dall'estensione", () => {
    expect(tipoAllegato({ tipo: "application/pdf", nome: null })).toBe("application/pdf");
    expect(tipoAllegato({ tipo: "image/jpg", nome: null })).toBe("image/jpeg");
    expect(tipoAllegato({ tipo: "application/octet-stream", nome: "Rechnung.PDF" })).toBe("application/pdf");
    expect(tipoAllegato({ tipo: "application/zip", nome: "x.pdf" })).toBeNull();
    expect(tipoAllegato({ tipo: "image/gif", nome: "logo.gif" })).toBeNull();
  });

  it("legge PDF e foto, non i loghi inline né i file troppo grandi; al massimo 5, prima i PDF", () => {
    const scelti = allegatiDaLeggere([
      allegato({ id: "logo", nome: "logo.png", tipo: "image/png", disposizione: "inline", contentId: "logo", byte: 3000 }),
      allegato({ id: "foto", nome: "scontrino.jpg", tipo: "image/jpeg", byte: 800_000 }),
      allegato({ id: "pdf", byte: 50_000 }),
      allegato({ id: "enorme", byte: 9_000_000 }),
      allegato({ id: "zip", nome: "x.zip", tipo: "application/zip" }),
    ]);
    expect(scelti.map((a) => a.id)).toEqual(["pdf", "foto"]);
    const tanti = allegatiDaLeggere(Array.from({ length: 9 }, (_, i) => allegato({ id: `p${i}` })));
    expect(tanti).toHaveLength(ALLEGATI_MASSIMI_PER_EMAIL);
  });
});

describe("testo dell'email", () => {
  it("dall'HTML toglie stili, script e tag", () => {
    const html = `<html><head><style>p{color:red}</style></head><body><script>alert(1)</script>
      <table><tr><td>Totale</td><td>CHF&nbsp;48.50</td></tr></table><p>Grazie &amp; a presto</p><!-- nascosto --></body></html>`;
    expect(testoDaHtml(html)).toBe("Totale CHF 48.50\nGrazie & a presto");
  });

  it("sembra una ricevuta solo con una parola chiave e un importo", () => {
    expect(sembraRicevuta("Conferma d'ordine n. 1234", "Totale: CHF 129.00")).toBe(true);
    expect(sembraRicevuta("Ihre Rechnung", "Betrag 59.90 CHF")).toBe(true);
    expect(sembraRicevuta("Your receipt from Apple", "Total $4.99")).toBe(true);
    expect(sembraRicevuta("Votre facture", "Montant 30,00 €")).toBe(true);
    expect(sembraRicevuta("Newsletter di ottobre", "Le novità del mese")).toBe(false);
    expect(sembraRicevuta("Ciao", "Ci vediamo alle 18.30")).toBe(false);
  });
});

describe("pianoEmail", () => {
  it("conferma di Gmail prima di tutto", () => {
    const piano = pianoEmail(email({ mittente: "forwarding-noreply@google.com", ...CONFERME.de }));
    expect(piano).toEqual({ azione: "conferma_gmail", conferma: { codice: "987654321", link: LINK } });
  });

  it("lo spam si salta anche con allegati", () => {
    expect(pianoEmail(email({ intestazioni: { "x-spam-flag": "YES" } }), [allegato({})])).toEqual({ azione: "spam" });
  });

  it("con allegati leggibili si leggono quelli", () => {
    const piano = pianoEmail(email({ oggetto: "Fattura" }), [allegato({ id: "pdf" })]);
    expect(piano.azione).toBe("allegati");
  });

  it("senza allegati legge il testo se sembra una ricevuta, altrimenti niente", () => {
    const ordine = email({ oggetto: "Il tuo ordine Galaxus", testo: "Grazie per l'acquisto.\nTotale CHF 89.90" });
    expect(pianoEmail(ordine)).toEqual({ azione: "testo", testo: "Grazie per l'acquisto.\nTotale CHF 89.90" });
    expect(pianoEmail(email({ oggetto: "Ciao", testo: "Come stai?" }))).toEqual({ azione: "niente" });
  });
});
