/**
 * Dettatura a voce (riconoscimento vocale del browser): come aggiungere il
 * testo dettato a quello già scritto e che cosa dire quando non funziona.
 * Logica pura, il componente è in src/components/dettatura.tsx.
 */

/** Lingua chiesta al riconoscimento vocale del browser. */
export const LINGUA_DETTATURA = "it-IT";

/**
 * Aggiunge il testo dettato in fondo a quello scritto: uno spazio in mezzo,
 * maiuscola se comincia una frase nuova, senza superare `massimo` caratteri.
 */
export function aggiungiDettato(testo: string, dettato: string, massimo = Infinity): string {
  let nuovo = dettato.replace(/\s+/g, " ").trim();
  if (!nuovo) return testo;
  const base = testo.replace(/\s+$/, "");
  const fineFrase = base === "" || /[.!?]$/.test(base);
  if (fineFrase) nuovo = nuovo.charAt(0).toLocaleUpperCase("it-CH") + nuovo.slice(1);
  const unito = base === "" ? nuovo : `${base} ${nuovo}`;
  return unito.length > massimo ? unito.slice(0, massimo) : unito;
}

/** Messaggio per un errore del riconoscimento vocale (codici della Web Speech API). */
export function messaggioErroreDettatura(codice: string): string {
  switch (codice) {
    case "not-allowed":
    case "service-not-allowed":
      return "Il browser non ha il permesso di usare il microfono: attivalo nelle impostazioni del sito e riprova.";
    case "no-speech":
      return "Non ho sentito niente: riprova parlando vicino al microfono.";
    case "audio-capture":
      return "Non trovo un microfono su questo dispositivo.";
    case "network":
      return "Per dettare a voce serve la connessione a internet.";
    case "aborted":
      return "";
    default:
      return "La dettatura non ha funzionato: riprova o scrivi il testo.";
  }
}
