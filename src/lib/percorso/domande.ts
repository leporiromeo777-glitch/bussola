import { chf } from "@/data/svizzera";
import type { IdDomanda, Risposte } from "./risposte";

export type Opzione<V extends string = string> = { valore: V; etichetta: string; aiuto?: string };

export type Domanda<K extends IdDomanda = IdDomanda> = {
  id: K;
  titolo: string;
  /** Etichetta corta per il riepilogo delle risposte. */
  breve: string;
  /** Una riga: perché te lo chiediamo. */
  perche: string;
  opzioni: Opzione<Risposte[K]>[];
};

type Domande = { [K in IdDomanda]: Domanda<K> }[IdDomanda];

/** Le 10 domande del questionario, nell'ordine in cui vengono mostrate. */
export const DOMANDE: readonly Domande[] = [
  {
    id: "attivita",
    breve: "Attività",
    titolo: "Che attività vuoi avviare?",
    perche: "Alcuni settori hanno bisogno di un'autorizzazione o di un passaggio in più prima di iniziare.",
    opzioni: [
      {
        valore: "digitale_creativo",
        etichetta: "Servizi digitali o creativi",
        aiuto: "Grafica, siti web, video, foto, social",
      },
      {
        valore: "consulenza_formazione",
        etichetta: "Consulenza o formazione",
        aiuto: "Lezioni, corsi, coaching, consulenze",
      },
      {
        valore: "artigianato_edilizia",
        etichetta: "Artigianato o edilizia",
        aiuto: "Muratore, imbianchino, falegname, elettricista",
      },
      { valore: "trasporti", etichetta: "Trasporti", aiuto: "Corriere, taxi, traslochi" },
      { valore: "commercio_online", etichetta: "Commercio o vendita online", aiuto: "Negozio, e-commerce, rivendita" },
      {
        valore: "ristorazione_alimentari",
        etichetta: "Ristorazione, bar o alimentari",
        aiuto: "Ristorante, bar, catering, prodotti alimentari",
      },
      { valore: "salute_benessere", etichetta: "Salute, cura o benessere", aiuto: "Terapie, cure, massaggi, fitness" },
      { valore: "altro", etichetta: "Altro", aiuto: "Descrivila in poche parole" },
    ],
  },
  {
    id: "cantone",
    breve: "Sede",
    titolo: "Dove avrà sede la tua attività?",
    perche:
      "Uffici, cassa AVS, imposte e autorizzazioni dipendono dal Cantone. Se lavori da casa, la sede è dove abiti.",
    opzioni: [
      { valore: "TI", etichetta: "Ticino" },
      { valore: "GR", etichetta: "Grigioni", aiuto: "Compreso il Grigioni italiano" },
      { valore: "altro", etichetta: "Un altro Cantone" },
    ],
  },
  {
    id: "soci",
    breve: "Soci",
    titolo: "Parti da solo o con dei soci?",
    perche: "La ditta individuale ha un solo titolare: con dei soci serve un'altra forma giuridica.",
    opzioni: [
      { valore: "solo", etichetta: "Da solo o da sola" },
      { valore: "con_soci", etichetta: "Con uno o più soci" },
    ],
  },
  {
    id: "fatturato",
    breve: "Cifra d'affari nei primi 12 mesi",
    titolo: "Quanto pensi di incassare nei primi 12 mesi?",
    perche: `Da ${chf(100_000)} di cifra d'affari cambiano le regole per IVA e registro di commercio. Conta l'incassato, non il guadagno.`,
    opzioni: [
      { valore: "meno_10k", etichetta: `Meno di ${chf(10_000)}` },
      { valore: "da_10k_a_60k", etichetta: `Da ${chf(10_000)} a ${chf(60_000)}` },
      { valore: "da_60k_a_100k", etichetta: `Da ${chf(60_000)} a meno di ${chf(100_000)}` },
      { valore: "almeno_100k", etichetta: `${chf(100_000)} o più` },
      { valore: "non_so", etichetta: "Non lo so ancora" },
    ],
  },
  {
    id: "clienti",
    breve: "Clienti",
    titolo: "Per quanti clienti pensi di lavorare?",
    perche: "Per essere riconosciuto come indipendente dall'AVS conta anche lavorare per diversi clienti.",
    opzioni: [
      { valore: "uno", etichetta: "Uno solo" },
      { valore: "pochi", etichetta: "Due o tre" },
      { valore: "molti", etichetta: "Molti" },
    ],
  },
  {
    id: "impiego",
    breve: "Lavoro da dipendente",
    titolo: "Hai anche un lavoro da dipendente?",
    perche: "Cambia come funzionano AVS, assicurazione infortuni e dichiarazione d'imposta.",
    opzioni: [
      { valore: "no", etichetta: "No" },
      { valore: "parziale", etichetta: "Sì, a tempo parziale" },
      { valore: "pieno", etichetta: "Sì, a tempo pieno", aiuto: "L'attività in proprio è accessoria" },
    ],
  },
  {
    id: "avviata",
    breve: "Già iniziato",
    titolo: "Hai già iniziato a lavorare in proprio?",
    perche: "Alcune pratiche vanno fatte nei primi mesi: così sappiamo cosa è urgente.",
    opzioni: [
      { valore: "no", etichetta: "Non ancora" },
      { valore: "meno_3_mesi", etichetta: "Sì, da meno di 3 mesi" },
      { valore: "oltre_3_mesi", etichetta: "Sì, da più di 3 mesi" },
    ],
  },
  {
    id: "permesso",
    breve: "Cittadinanza o permesso",
    titolo: "Che cittadinanza o permesso hai?",
    perche: "Chi non è svizzero può aver bisogno di un permesso per lavorare in proprio.",
    opzioni: [
      { valore: "svizzero_c", etichetta: "Cittadinanza svizzera o permesso C" },
      { valore: "b", etichetta: "Permesso B" },
      { valore: "g", etichetta: "Permesso G (frontaliere)" },
      { valore: "altro", etichetta: "Altro" },
    ],
  },
  {
    id: "locali",
    breve: "Locale aperto al pubblico",
    titolo: "Avrai un locale aperto al pubblico?",
    perche: "Negozi, bar e locali aperti al pubblico possono avere regole e autorizzazioni in più.",
    opzioni: [
      { valore: "si", etichetta: "Sì", aiuto: "Negozio, bar, studio dove ricevi i clienti" },
      { valore: "no", etichetta: "No" },
    ],
  },
  {
    id: "venditaOnline",
    breve: "Vendita online ai privati",
    titolo: "Venderai online a clienti privati?",
    perche: "Chi vende online deve mostrare sul sito chi è e come contattarlo.",
    opzioni: [
      { valore: "si", etichetta: "Sì", aiuto: "Negozio online, prenotazioni o servizi venduti dal sito" },
      { valore: "no", etichetta: "No" },
    ],
  },
];

/** L'etichetta leggibile di una risposta, per il riepilogo. */
export function etichettaRisposta<K extends IdDomanda>(id: K, valore: Risposte[K]): string {
  const domanda = DOMANDE.find((d) => d.id === id);
  const opzione = (domanda?.opzioni as Opzione[] | undefined)?.find((o) => o.valore === valore);
  return opzione?.etichetta ?? String(valore);
}
