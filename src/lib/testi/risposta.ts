/**
 * «Testi pronti» nell'app: lettura della risposta di POST /api/testi.
 * Logica pura, senza browser né React Native: la usa mobile/src/lib/testi.ts.
 */
import { MESSAGGI_TESTI, type TestoPronto } from "./richiesta";

export type EsitoTesti = { ok: true; testi: TestoPronto[] } | { ok: false; messaggio: string; stato: number };

function eTesto(valore: unknown): valore is TestoPronto {
  const t = valore as Partial<TestoPronto> | null;
  return !!t && typeof t === "object" && typeof t.titolo === "string" && typeof t.testo === "string" && t.testo.trim() !== "";
}

/**
 * Dalla risposta di POST /api/testi (stato HTTP e corpo JSON già letto,
 * null se non era JSON) ai testi da mostrare, come sulla pagina del sito:
 * si tengono solo i testi con titolo e testo; nessun testo = errore, con il
 * messaggio del sito o uno di ripiego.
 */
export function leggiRispostaTesti(stato: number, corpo: unknown): EsitoTesti {
  const o = corpo && typeof corpo === "object" && !Array.isArray(corpo) ? (corpo as Record<string, unknown>) : {};
  const testi = Array.isArray(o.testi) ? o.testi.filter(eTesto).map((t) => ({ titolo: t.titolo, testo: t.testo })) : [];
  if (stato >= 200 && stato < 300 && testi.length > 0) return { ok: true, testi };
  const messaggio = typeof o.messaggio === "string" ? o.messaggio.trim() : "";
  const ripiego = stato === 429 ? MESSAGGI_TESTI.troppeRichieste : stato === 503 ? MESSAGGI_TESTI.occupato : MESSAGGI_TESTI.nonRiuscito;
  return { ok: false, messaggio: messaggio || ripiego, stato };
}
