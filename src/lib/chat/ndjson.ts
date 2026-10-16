import type { EventoChat } from "./tipi";

/** Un evento come riga NDJSON. */
export function rigaEvento(evento: EventoChat): string {
  return `${JSON.stringify(evento)}\n`;
}

function eEventoChat(valore: unknown): valore is EventoChat {
  if (typeof valore !== "object" || valore === null || !("t" in valore)) return false;
  const { t } = valore as { t: unknown };
  if (t === "testo") return typeof (valore as { d?: unknown }).d === "string";
  if (t === "conversazione") {
    const { id, titolo } = valore as { id?: unknown; titolo?: unknown };
    return typeof id === "string" && typeof titolo === "string";
  }
  if (t === "errore") return typeof (valore as { messaggio?: unknown }).messaggio === "string";
  if (t === "fine") return Array.isArray((valore as { risposta?: unknown }).risposta);
  return false;
}

/**
 * Legge un flusso NDJSON a pezzi: i pezzi possono tagliare una riga a metà,
 * la riga si completa con il pezzo successivo. Le righe non valide si ignorano.
 */
export class LettoreNdjson {
  #resto = "";

  aggiungi(pezzo: string): EventoChat[] {
    this.#resto += pezzo;
    const righe = this.#resto.split("\n");
    this.#resto = righe.pop() ?? "";
    return righe.flatMap((riga) => this.#leggi(riga));
  }

  /** Da chiamare a fine flusso: legge l'eventuale ultima riga senza "\n". */
  chiudi(): EventoChat[] {
    const ultima = this.#resto;
    this.#resto = "";
    return this.#leggi(ultima);
  }

  #leggi(riga: string): EventoChat[] {
    if (!riga.trim()) return [];
    try {
      const valore: unknown = JSON.parse(riga);
      return eEventoChat(valore) ? [valore] : [];
    } catch {
      return [];
    }
  }
}

/**
 * Trasforma una sequenza asincrona di eventi in un flusso di byte NDJSON per
 * la Response. Un errore imprevisto diventa un evento "errore" con il
 * messaggio dato, così il browser non resta in attesa.
 */
export function flussoNdjson(
  eventi: AsyncGenerator<EventoChat, void, undefined>,
  messaggioErroreImprevisto: string,
  segnalaErrore: (errore: unknown) => void = () => {},
): ReadableStream<Uint8Array> {
  const codifica = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async pull(controllo) {
      try {
        const { value, done } = await eventi.next();
        if (done) controllo.close();
        else controllo.enqueue(codifica.encode(rigaEvento(value)));
      } catch (errore) {
        segnalaErrore(errore);
        controllo.enqueue(codifica.encode(rigaEvento({ t: "errore", messaggio: messaggioErroreImprevisto })));
        controllo.close();
      }
    },
    async cancel() {
      await eventi.return(undefined);
    },
  });
}
