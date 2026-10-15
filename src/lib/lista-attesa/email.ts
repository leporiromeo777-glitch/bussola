/** Chi scrive: dati del sito e del titolare (LCSl art. 3 cpv. 1 lett. o e s). */
export type Mittente = {
  nomeSito: string;
  urlSito: string;
  titolare: { nome: string; indirizzo: string; email: string };
};

export type EmailComposta = {
  oggetto: string;
  html: string;
  testo: string;
  /** Intestazioni aggiuntive (es. List-Unsubscribe). */
  intestazioni: Record<string, string>;
};

const ENTITA_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Rende sicuro un testo da inserire in HTML (contenuto o attributo). */
export function escapeHtml(testo: string): string {
  return testo.replace(/[&<>"']/g, (c) => ENTITA_HTML[c] ?? c);
}

function linkConToken(urlSito: string, percorso: string, token: string): string {
  const url = new URL(percorso, urlSito);
  url.searchParams.set("token", token);
  return url.toString();
}

export function linkConferma(urlSito: string, token: string): string {
  return linkConToken(urlSito, "/lista-attesa/conferma", token);
}

export function linkDisiscrizione(urlSito: string, token: string): string {
  return linkConToken(urlSito, "/lista-attesa/disiscriviti", token);
}

/**
 * Email di conferma dell'iscrizione alla lista d'attesa (double opt-in).
 * Non contiene niente di scritto da chi compila il modulo (nemmeno il nome):
 * il modulo non si può usare per spedire testo a indirizzi altrui.
 */
export function componiEmailConferma({ token, mittente }: { token: string; mittente: Mittente }): EmailComposta {
  const conferma = linkConferma(mittente.urlSito, token);
  const disiscrizione = linkDisiscrizione(mittente.urlSito, token);
  const { nomeSito, titolare } = mittente;
  const host = new URL(mittente.urlSito).host;

  const oggetto = `Conferma la tua iscrizione alla lista d'attesa di ${nomeSito}`;

  const testo = [
    "Ciao,",
    "",
    `grazie per l'interesse per ${nomeSito}. Per confermare che questo indirizzo è tuo, apri questo link:`,
    "",
    conferma,
    "",
    "Dopo la conferma ti scriviamo quando apre la beta chiusa e al massimo due aggiornamenti al mese.",
    "Se non hai chiesto tu l'iscrizione, ignora questa email: senza conferma non ti scriveremo più.",
    "",
    "A presto,",
    nomeSito,
    "",
    "--",
    `${nomeSito} · ${titolare.nome} · ${titolare.indirizzo} · ${titolare.email}`,
    `Ricevi questa email perché questo indirizzo è stato inserito nella lista d'attesa su ${host}.`,
    `Per toglierti dalla lista: ${disiscrizione}`,
  ].join("\n");

  const e = escapeHtml;
  const html = `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(oggetto)}</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;color:#1c1f24;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;">
<p style="margin:0 0 24px;font-size:18px;font-weight:600;color:#0f5e6b;">${e(nomeSito)}</p>
<p style="margin:0 0 16px;">Ciao,</p>
<p style="margin:0 0 24px;">grazie per l'interesse per ${e(nomeSito)}. Per confermare che questo indirizzo è tuo, premi il pulsante:</p>
<p style="margin:0 0 24px;"><a href="${e(conferma)}" style="display:inline-block;background:#0f5e6b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px;">Confermo l'iscrizione</a></p>
<p style="margin:0 0 16px;font-size:14px;color:#5d6470;">Se il pulsante non funziona, copia questo link nel browser:<br><a href="${e(conferma)}" style="color:#0f5e6b;word-break:break-all;">${e(conferma)}</a></p>
<p style="margin:0 0 16px;">Dopo la conferma ti scriviamo quando apre la beta chiusa e al massimo due aggiornamenti al mese.</p>
<p style="margin:0 0 24px;">Se non hai chiesto tu l'iscrizione, ignora questa email: senza conferma non ti scriveremo più.</p>
<p style="margin:0 0 32px;">A presto,<br>${e(nomeSito)}</p>
<hr style="border:none;border-top:1px solid #e4e1da;margin:0 0 16px;">
<p style="margin:0 0 8px;font-size:13px;color:#5d6470;">${e(nomeSito)} · ${e(titolare.nome)} · ${e(titolare.indirizzo)} · <a href="mailto:${e(titolare.email)}" style="color:#5d6470;">${e(titolare.email)}</a></p>
<p style="margin:0;font-size:13px;color:#5d6470;">Ricevi questa email perché questo indirizzo è stato inserito nella lista d'attesa su ${e(host)}. <a href="${e(disiscrizione)}" style="color:#5d6470;">Toglimi dalla lista</a>.</p>
</div>
</body>
</html>`;

  return {
    oggetto,
    html,
    testo,
    intestazioni: { "List-Unsubscribe": `<${disiscrizione}>` },
  };
}
