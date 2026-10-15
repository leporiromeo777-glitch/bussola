/** Nome del campo che il widget Turnstile aggiunge al modulo. */
export const CAMPO_CAPTCHA = "cf-turnstile-response";

export const MESSAGGI_ACCESSO = {
  captchaMancante:
    "Conferma di non essere un robot con la casella qui sopra. Se non la vedi, attiva JavaScript e ricarica la pagina.",
  captchaNonValido: "La verifica anti-robot non è riuscita. Riprova con la casella qui sopra.",
  troppeRichieste:
    "Da questa connessione sono arrivate troppe richieste di link in poco tempo. Riprova tra un'ora.",
  invioNonRiuscito: "Invio non riuscito. Riprova tra qualche minuto.",
} as const;

/**
 * Token della verifica anti-robot dal modulo. Se la verifica è attiva
 * (chiave del sito impostata) e il token manca, la richiesta non parte.
 */
export function leggiCaptcha(
  form: FormData,
  chiaveSito: string | undefined,
): { ok: true; token: string | undefined } | { ok: false; messaggio: string } {
  const valore = form.get(CAMPO_CAPTCHA);
  const token = typeof valore === "string" && valore.trim() !== "" ? valore.trim() : undefined;
  if (chiaveSito && !token) return { ok: false, messaggio: MESSAGGI_ACCESSO.captchaMancante };
  return { ok: true, token };
}

/** Messaggio per un errore di Supabase Auth nell'invio del link, senza dettagli tecnici. */
export function messaggioErroreInvio(codice: string | undefined): string {
  if (codice === "captcha_failed") return MESSAGGI_ACCESSO.captchaNonValido;
  return MESSAGGI_ACCESSO.invioNonRiuscito;
}
