/**
 * «I tuoi conti»: il sollecito di pagamento per le fatture emesse scadute e
 * non pagate. Logica pura, la usano il sito e l'app: giorni di ritardo,
 * livello da proporre, testo pronto (oggetto e corpo) e link per l'email.
 *
 * Bleo prepara il testo, ma a mandarlo è l'utente, con la sua email o un'altra
 * app. Sugli interessi di mora dà solo l'informazione generale della legge
 * (art. 102 e 104 CO, regoleMancatoPagamento in src/data/svizzera.ts): non è
 * una consulenza legale.
 */
import {
  dataSvizzera,
  fontiPercorso,
  percentuale,
  regoleMancatoPagamento,
  VERIFICATO_MANCATO_PAGAMENTO,
  VERIFICATO_SOLLECITI,
  type Fonte,
} from "@/data/svizzera";
import {
  formattaIban,
  formattaRiferimentoQr,
  formattaRiferimentoScor,
  ibanValido,
  normalizzaIban,
  riferimentoQrValido,
  riferimentoScorValido,
} from "@/lib/strumenti/qr";
import { aggiungiGiorni, chf2, giorniTra } from "./importi";
import type { FatturaEmessa, LivelloSollecito, Sollecito } from "./tipi";

/**
 * Giorni del nuovo termine di pagamento proposto nel sollecito. Non è un
 * valore di legge: è solo la data che Bleo propone, e l'utente la cambia.
 */
export const GIORNI_NUOVO_TERMINE = 10;

/** Fonti mostrate con il sollecito: mora, interessi moratori e procedura d'esecuzione. */
export const FONTI_SOLLECITO: readonly Fonte[] = [fontiPercorso.co102, fontiPercorso.co104, fontiPercorso.chEsecuzioni];

/** Data del controllo meno recente tra quelli di queste fonti. */
export const VERIFICA_FONTI_SOLLECITO = [VERIFICATO_MANCATO_PAGAMENTO, VERIFICATO_SOLLECITI].sort()[0];

/** Tasso degli interessi di mora della legge, da mostrare: «5%» (art. 104 CO). */
export const TASSO_INTERESSE_MORA = percentuale(regoleMancatoPagamento.interesseMora.valore, 0);

/** Lunghezza massima del nome per la firma (come il nome nella fattura). */
export const FIRMA_MASSIMA = 140;

/** Giorni di ritardo oggi: 0 se è pagata, se non ha scadenza o se non è ancora scaduta. */
export function giorniDiRitardo(f: Pick<FatturaEmessa, "pagataIl" | "scadenza">, oggi: string): number {
  if (f.pagataIl || !f.scadenza) return 0;
  return Math.max(0, giorniTra(f.scadenza, oggi));
}

/** «Scaduta da 1 giorno», «Scaduta da 12 giorni». */
export function testoRitardo(giorni: number): string {
  return giorni === 1 ? "Scaduta da 1 giorno" : `Scaduta da ${giorni} giorni`;
}

/** Il livello da proporre: il primo se non hai ancora mandato solleciti, poi il secondo. */
export function livelloConsigliato(f: Pick<FatturaEmessa, "sollecito">): LivelloSollecito {
  return f.sollecito ? 2 : 1;
}

export const NOMI_LIVELLO: Record<LivelloSollecito, { breve: string; titolo: string; descrizione: string }> = {
  1: {
    breve: "1° sollecito",
    titolo: "Primo sollecito",
    descrizione: "Un promemoria gentile, con un nuovo termine per pagare.",
  },
  2: {
    breve: "2° sollecito",
    titolo: "Secondo sollecito",
    descrizione: "Più deciso: ricorda gli interessi di mora previsti dalla legge.",
  },
};

/** «1° sollecito inviato il 10.10.2026» */
export function testoSollecitoInviato(s: Sollecito): string {
  return `${NOMI_LIVELLO[s.livello].breve} inviato il ${dataSvizzera(s.inviatoIl)}`;
}

/** Nuovo termine proposto: oggi più GIORNI_NUOVO_TERMINE. */
export function nuovoTermineProposto(oggi: string): string {
  return aggiungiGiorni(oggi, GIORNI_NUOVO_TERMINE);
}

/** Riferimento di pagamento a gruppi, come nella QR-fattura; com'è se non è QR né SCOR. */
export function riferimentoLeggibile(riferimento: string): string {
  const pulito = riferimento.replace(/\s/g, "");
  if (riferimentoQrValido(pulito)) return formattaRiferimentoQr(pulito);
  if (riferimentoScorValido(pulito)) return formattaRiferimentoScor(pulito);
  return riferimento.trim();
}

/**
 * L'IBAN scritto dall'utente per il sollecito: vuoto → null, valido → a
 * gruppi di 4, altrimenti l'errore da mostrare (il testo non lo usa).
 */
export function leggiIbanSollecito(testo: string): { iban: string | null; errore: string | null } {
  if (normalizzaIban(testo) === "") return { iban: null, errore: null };
  if (!ibanValido(testo)) {
    return { iban: null, errore: "L'IBAN non sembra corretto: controlla di averlo copiato senza errori." };
  }
  return { iban: formattaIban(testo), errore: null };
}

export type DatiSollecito = {
  livello: LivelloSollecito;
  fattura: Pick<FatturaEmessa, "numero" | "data" | "scadenza" | "importo" | "riferimento" | "sollecito">;
  /** Nuovo termine di pagamento, AAAA-MM-GG. */
  nuovoTermine: string;
  /** IBAN già controllato (leggiIbanSollecito), o null. */
  iban?: string | null;
  /** Il nome dell'utente o della ditta: firma e beneficiario del pagamento. */
  firma?: string | null;
};

export type TestoSollecito = { oggetto: string; testo: string };

function datiPagamento(d: DatiSollecito): string {
  const { fattura } = d;
  const riferimento = fattura.riferimento?.trim() ? riferimentoLeggibile(fattura.riferimento) : null;
  const firma = d.firma?.trim();
  if (d.iban) {
    return [
      "Dati per il pagamento:",
      `IBAN: ${d.iban}`,
      ...(firma ? [`A favore di: ${firma}`] : []),
      `Importo: ${chf2(fattura.importo)}`,
      riferimento ? `Riferimento: ${riferimento}` : `Motivo del pagamento: fattura ${fattura.numero}`,
    ].join("\n");
  }
  if (riferimento) {
    return `Trova i dati per il pagamento sulla fattura, nella sezione pagamento con il codice QR (riferimento ${riferimento}).`;
  }
  return "Trova i dati per il pagamento sulla fattura.";
}

/** Oggetto e testo del sollecito, in italiano, con il «lei» di cortesia. */
export function preparaSollecito(d: DatiSollecito): TestoSollecito {
  const f = d.fattura;
  const fattura = `la fattura n. ${f.numero} del ${dataSvizzera(f.data)}, di ${chf2(f.importo)}`;
  const scadenza = f.scadenza ? dataSvizzera(f.scadenza) : null;
  const termine = dataSvizzera(d.nuovoTermine);
  const firma = d.firma?.trim().slice(0, FIRMA_MASSIMA);
  const chiusura = ["Cordiali saluti", ...(firma ? [firma] : [])].join("\n");

  if (d.livello === 1) {
    return {
      oggetto: `Promemoria di pagamento: fattura ${f.numero}`,
      testo: [
        "Buongiorno,",
        `le scrivo per ricordarle ${fattura}${scadenza ? `, da pagare entro il ${scadenza}` : ""}. Secondo i miei dati il pagamento non è ancora arrivato.`,
        `Può capitare di dimenticarsene: le chiedo gentilmente di pagarla entro il ${termine}.`,
        datiPagamento(d),
        "Se ha già pagato nel frattempo, non tenga conto di questo messaggio. Se ha domande sulla fattura, mi scriva pure.",
        chiusura,
      ].join("\n\n"),
    };
  }

  const precedente = f.sollecito;
  const apertura = precedente
    ? `il ${dataSvizzera(precedente.inviatoIl)} le ho mandato ${precedente.livello === 1 ? "un promemoria" : "un sollecito"} per ${fattura}${scadenza ? `, scaduta il ${scadenza}` : ""}.`
    : `${fattura.charAt(0).toUpperCase()}${fattura.slice(1)}, ${scadenza ? `è scaduta il ${scadenza}` : "è ancora da pagare"}.`;
  return {
    oggetto: `Secondo sollecito di pagamento: fattura ${f.numero}`,
    testo: [
      "Buongiorno,",
      `${apertura} Ad oggi il pagamento non è ancora arrivato.`,
      `La prego di pagare l'importo entro il ${termine}.`,
      datiPagamento(d),
      `Le ricordo che per i pagamenti in ritardo la legge prevede interessi di mora del ${TASSO_INTERESSE_MORA} all'anno (art. 104 del Codice delle obbligazioni): se il pagamento non arriva entro questo termine, mi riservo di chiederli.`,
      "Se ha già pagato nel frattempo, la ringrazio e non tenga conto di questo messaggio. Se c'è un problema con la fattura, mi contatti entro la stessa data.",
      chiusura,
    ].join("\n\n"),
  };
}

/** Testo completo da copiare: oggetto e corpo. */
export function testoDaCopiare(t: TestoSollecito): string {
  return `Oggetto: ${t.oggetto}\n\n${t.testo}`;
}

/**
 * Link mailto: con oggetto e testo (senza destinatario: lo sceglie l'utente
 * nella sua app dell'email). A capo come CRLF, come chiede la RFC 6068.
 */
export function linkEmail(t: TestoSollecito): string {
  const codifica = (testo: string) => encodeURIComponent(testo.replace(/\r?\n/g, "\r\n"));
  return `mailto:?subject=${codifica(t.oggetto)}&body=${codifica(t.testo)}`;
}

/**
 * IBAN e nome per il sollecito dai dati dello strumento fattura salvati nel
 * browser (mai sul server): prima la fattura con lo stesso numero, poi i
 * dati dell'emittente salvati. Stringhe vuote se non ci sono.
 */
export function datiDaStrumentoFattura(
  numero: string,
  documenti: readonly { tipo: string; numero: string; emittente: { nome: string; iban: string } }[] | null,
  emittente: { nome: string; iban: string } | null,
): { iban: string; firma: string } {
  const doc = documenti?.find((d) => d.tipo === "fattura" && d.numero.trim() === numero.trim());
  const fonte = doc?.emittente.iban.trim() || doc?.emittente.nome.trim() ? doc.emittente : emittente;
  return { iban: fonte?.iban.trim() ?? "", firma: fonte?.nome.trim() ?? "" };
}
