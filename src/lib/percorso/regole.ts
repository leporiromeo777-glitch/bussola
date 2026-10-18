/**
 * Motore delle regole del percorso: dalle risposte al questionario ai passi,
 * agli avvisi e alle scadenze. Funzione pura e deterministica: niente date di
 * sistema, niente rete. Le cifre vengono da src/data/svizzera.ts, i testi dei
 * passi da src/data/passi.ts.
 *
 * Il tono è quello dell'informazione generale ("di regola", "da verificare
 * con"): Bleo non dà consulenza personalizzata (LFid ticinese).
 */
import { FASI, PASSI, type IdPasso, type Passo } from "@/data/passi";
import {
  avsIndipendenti,
  chf,
  dataSvizzera,
  fonti,
  fontiPercorso,
  percentuale,
  regole,
  regolePercorso,
  supplementiTicino,
  uffici,
  ufficiPercorso,
  type Fonte,
} from "@/data/svizzera";
import type { Risposte } from "./risposte";

/** Versione delle regole salvata con le risposte (colonna questionari.versione_regole). */
export const VERSIONE_REGOLE = "2026-10-16";

export type StatoPasso = "da_fare" | "facoltativo" | "non_serve";

export type PassoPercorso = {
  passo: Passo;
  stato: StatoPasso;
  /** Una o due frasi: perché questo passo vale (o non vale) per te. */
  perche: string;
  /** Indicazioni in più per la tua situazione (Cantone, ufficio, casi particolari). */
  note: string[];
};

export type LivelloAvviso = "importante" | "attenzione" | "info";

export type Avviso = {
  id: string;
  livello: LivelloAvviso;
  titolo: string;
  testo: string;
  fonti: Fonte[];
};

/** Come una scadenza diventa una data nel calendario. */
export type RegolaCalendario =
  | { tipo: "annuale"; date: { giorno: number; mese: number; etichetta: string }[] }
  | { tipo: "fisse"; date: { data: string; etichetta: string }[] }
  | { tipo: "dopo-inizio"; giorni: number }
  | { tipo: "nessuna" };

export type Scadenza = {
  id: string;
  titolo: string;
  /** Titolo del singolo evento nel calendario, se diverso (per esempio al singolare). */
  titoloEvento?: string;
  /** Quando, in parole. */
  quando: string;
  dettaglio?: string;
  fonti: Fonte[];
  calendario: RegolaCalendario;
};

export type Percorso = {
  versioneRegole: string;
  passi: PassoPercorso[];
  avvisi: Avviso[];
  scadenze: Scadenza[];
};

type Esito = { stato: StatoPasso; perche: string; note?: string[] };

const SOGLIA_100K = chf(regole.sogliaRegistroCommercio.valore);
const SOGLIA_CONTABILITA = chf(regole.sogliaContabilitaSemplificata.valore);
const GIORNI_IVA = regole.termineAnnuncioIvaGiorni.valore;

const SOLO_DITTA =
  "Vale per chi apre una ditta individuale da solo. In una Sagl le regole sono diverse: da verificare con un notaio o un fiduciario autorizzato.";
const SAGL_DIPENDENTI =
  "In una Sagl i soci che lavorano nella società sono dipendenti per le assicurazioni sociali: questo passo vale per la ditta individuale. Da verificare con un fiduciario autorizzato.";

const conSoci = (r: Risposte) => r.soci === "con_soci";
const inTicino = (r: Risposte) => r.cantone === "TI";
const haLavoroDipendente = (r: Risposte) => r.impiego !== "no";
const prevedeAlmeno100k = (r: Risposte) => r.fatturato === "almeno_100k";
const giaAvviata = (r: Risposte) => r.avviata !== "no";
const edileOTrasporti = (r: Risposte) => r.attivita === "artigianato_edilizia" || r.attivita === "trasporti";

/**
 * Le fonti dell'avviso sul permesso: le avvertenze ticinesi per il permesso G
 * o B (con l'art. 38 LStrI, per chi ha un permesso B ma non è cittadino
 * UE/AELS), o la legge sugli stranieri.
 */
function fontiAvvisoPermesso(r: Risposte) {
  if (r.permesso === "g") return [fontiPercorso.pmiMettersiInProprio, fontiPercorso.umIndipendentiUeAels];
  if (r.permesso === "b") return [fontiPercorso.pmiMettersiInProprio, fontiPercorso.umIndipendentiUeAelsB, fontiPercorso.lstri38];
  return [fontiPercorso.pmiMettersiInProprio, fontiPercorso.lstri19];
}

function notaCassaAvs(r: Risposte): string {
  if (r.cantone === "TI") {
    const cassa = uffici.cassaCompensazioneTicino.valore;
    const ias = ufficiPercorso.iasContributiPersonali.valore;
    return `La tua cassa cantonale è l'${cassa.nome}, ${cassa.indirizzo}, tel. ${cassa.telefono} (affiliazioni: tel. ${ias.telefonoAffiliazioni}).`;
  }
  if (r.cantone === "GR") {
    const cassa = uffici.cassaCompensazioneGrigioni.valore;
    return `La tua cassa cantonale è la ${cassa.nome}, ${cassa.indirizzo}.`;
  }
  return "La tua cassa cantonale è quella del Cantone dove ha sede la tua attività: trovi l'elenco sul sito ufficiale AVS/AI.";
}

function notaAttivitaAccessoria(): string {
  const avs2026 = avsIndipendenti[2026].valore;
  const avs2027 = avsIndipendenti[2027].valore;
  // Promemoria 2.02, punto 6: il tasso più basso vale solo sotto il limite inferiore della tavola scalare.
  return `Se l'attività in proprio è accessoria e il reddito non supera ${chf(regolePercorso.attivitaAccessoriaAvs.valore)} l'anno, i contributi si pagano solo se li chiedi tu. Se sul salario hai già pagato il contributo minimo e il reddito dell'attività in proprio è inferiore a ${chf(avs2026.limiteInferioreScala)} (${chf(avs2027.limiteInferioreScala)} dal 2027), puoi chiedere il tasso più basso (${percentuale(avs2026.tassoMinimoScala, 3)}) invece del contributo minimo (${chf(avs2026.contributoMinimo)} nel 2026, ${chf(avs2027.contributoMinimo)} dal 2027). Sopra questo limite vale la tavola scalare.`;
}

/** Una regola per ogni passo del catalogo. */
const REGOLE_PASSI: Record<IdPasso, (r: Risposte) => Esito> = {
  "ditta-individuale": (r) =>
    conSoci(r)
      ? {
          stato: "facoltativo",
          perche:
            "Una ditta individuale ha un solo titolare: con dei soci serve un'altra forma. Leggilo per capire la differenza.",
        }
      : {
          stato: "da_fare",
          perche:
            "È la forma del tuo percorso: conviene capire bene cosa comporta, soprattutto la responsabilità personale.",
        },

  "soci-forma-giuridica": (r) =>
    conSoci(r)
      ? {
          stato: "da_fare",
          perche:
            "Parti con dei soci: la ditta individuale non basta e il percorso Sagl di Bleo arriverà più avanti.",
        }
      : { stato: "non_serve", perche: "Parti da solo: la ditta individuale ha un solo titolare, cioè tu." },

  autorizzazioni: (r) => {
    const note: string[] = [];
    if (r.attivita === "altro" && r.attivitaAltro) {
      note.push(
        `Hai descritto la tua attività come «${r.attivitaAltro}»: cerca proprio questa professione nell'elenco della SEFRI.`,
      );
    }
    if (r.attivita === "consulenza_formazione" && inTicino(r)) {
      note.push(
        "In Ticino la contabilità, la consulenza fiscale e la consulenza aziendale per conto di terzi, a titolo professionale, sono attività di fiduciario e richiedono un'autorizzazione (LFid).",
      );
    }
    if (!inTicino(r)) {
      note.push("L'elenco della Polizia cantonale vale per il Ticino: nel tuo Cantone chiedi agli uffici cantonali.");
    }
    return {
      stato: "da_fare",
      perche: "Alcune professioni sono regolamentate: di regola conviene verificare la tua prima di iniziare.",
      note,
    };
  },

  "autorizzazione-esercizio-pubblico": (r) => {
    if (r.attivita !== "ristorazione_alimentari") {
      return { stato: "non_serve", perche: "Riguarda ristoranti, bar e alberghi." };
    }
    return inTicino(r)
      ? {
          stato: "da_fare",
          perche:
            "Hai indicato ristorazione, bar o alimentari: se apri un esercizio pubblico, in Ticino ti serve l'autorizzazione prima di aprire.",
        }
      : {
          stato: "da_fare",
          perche:
            "Hai indicato ristorazione, bar o alimentari: se apri un esercizio pubblico, anche fuori dal Ticino di regola ti serve un'autorizzazione cantonale prima di aprire.",
          note: [
            "La procedura descritta qui (legge LEAR) è ticinese. Nel tuo Cantone chiedi all'ufficio cantonale competente quale autorizzazione serve e come chiederla.",
          ],
        };
  },

  "notifica-derrate-alimentari": (r) => {
    if (r.attivita !== "ristorazione_alimentari") {
      return { stato: "non_serve", perche: "Riguarda chi produce, trasforma o vende alimenti." };
    }
    const chi =
      "Hai indicato ristorazione, bar o alimentari: chi lavora con gli alimenti, anche con un catering o con prodotti fatti in casa, deve notificare l'attività";
    if (inTicino(r)) {
      return { stato: "da_fare", perche: `${chi} al ${ufficiPercorso.laboratorioCantonaleTicino.valore.nome}.` };
    }
    return {
      stato: "da_fare",
      perche: `${chi} all'autorità cantonale per le derrate alimentari del tuo Cantone.`,
      note: [
        r.cantone === "GR"
          ? "Il formulario e l'indirizzo del passo sono ticinesi. Nei Grigioni la notifica si fa con il modulo online dell'Ufficio per la sicurezza delle derrate alimentari e la salute degli animali (trovi il link tra le fonti)."
          : "Il formulario e l'indirizzo del passo sono ticinesi: nel tuo Cantone usa quelli dell'autorità cantonale per le derrate alimentari.",
      ],
    };
  },

  "autorizzazione-sanitaria": (r) => {
    if (r.attivita !== "salute_benessere") {
      return { stato: "non_serve", perche: "Riguarda le attività sanitarie." };
    }
    return inTicino(r)
      ? {
          stato: "da_fare",
          perche:
            "Hai indicato salute, cura o benessere: se la tua è un'attività sanitaria sotto la tua responsabilità, in Ticino serve un'autorizzazione.",
        }
      : {
          stato: "da_fare",
          perche:
            "Hai indicato salute, cura o benessere: se la tua è un'attività sanitaria sotto la tua responsabilità, di regola serve un'autorizzazione anche fuori dal Ticino.",
          note: [
            "La procedura descritta qui è ticinese. Nel tuo Cantone chiedi all'autorità sanitaria cantonale se la tua attività ha bisogno di un'autorizzazione e come chiederla.",
          ],
        };
  },

  "permesso-lavoro": (r) => {
    if (giaAvviata(r) && r.permesso !== "svizzero_c") {
      return {
        stato: "da_fare",
        perche:
          r.permesso === "g"
            ? "Sei frontaliere e hai già iniziato: se non hai ancora il permesso G per l'attività indipendente, chiedilo subito all'ufficio della migrazione."
            : r.permesso === "b"
              ? "Hai un permesso B e hai già iniziato: verifica subito con l'ufficio della migrazione che ti consenta di lavorare come indipendente."
              : "Hai già iniziato: verifica subito con l'ufficio della migrazione del tuo Cantone se e come puoi lavorare in proprio.",
        note: ["È un caso complesso: fatti aiutare da un professionista, per esempio un avvocato che si occupa di permessi."],
      };
    }
    switch (r.permesso) {
      case "g":
        return {
          stato: "da_fare",
          perche:
            "Sei frontaliere: per metterti in proprio chiedi il permesso G per l'attività indipendente, prima di iniziare.",
        };
      case "b":
        return {
          stato: "da_fare",
          perche:
            "Hai un permesso B: verifica con l'ufficio della migrazione che ti consenta di lavorare come indipendente, prima di iniziare.",
        };
      case "altro":
        return {
          stato: "da_fare",
          perche:
            "Verifica con l'ufficio della migrazione del tuo Cantone se e come puoi lavorare in proprio, prima di iniziare.",
        };
      case "svizzero_c":
        return {
          stato: "non_serve",
          perche:
            "Con la cittadinanza svizzera o il permesso C puoi lavorare in proprio in tutta la Svizzera (LStrI, art. 38): di regola questo passo non ti riguarda.",
        };
    }
  },

  "nome-ditta": (r) =>
    conSoci(r)
      ? {
          stato: "facoltativo",
          perche:
            "Per una Sagl il nome è libero, ma deve indicare la forma giuridica (art. 950 CO) e distinguersi chiaramente da quelli delle società già iscritte in Svizzera (art. 951 CO). Le regole di questo passo valgono per la ditta individuale.",
        }
      : {
          stato: "da_fare",
          perche:
            "Il nome della ditta deve contenere il tuo cognome: sceglilo prima di preparare sito, biglietti e fatture.",
        },

  aiuto: (r) => {
    let perche: string;
    if (r.cantone === "altro") {
      perche =
        "Fondounimpresa è per chi risiede in Ticino o nella Regione Moesa: nel tuo Cantone cerca i servizi cantonali per chi apre un'attività.";
    } else if (r.permesso === "g") {
      perche =
        "Fondounimpresa è per cittadini svizzeri e stranieri con permesso B o C: con il permesso G, di regola, non vi hai accesso. Restano l'agenzia AVS del Comune e i fiduciari autorizzati.";
    } else if (r.permesso === "altro") {
      perche =
        "Fondounimpresa è per cittadini svizzeri e stranieri con permesso B o C: verifica con loro se vi hai accesso.";
    } else if (r.cantone === "GR") {
      perche = "Fondounimpresa accompagna anche chi risiede nella Regione Moesa, nel Grigioni italiano.";
    } else {
      const fondo = regolePercorso.fondounimpresa.valore;
      perche = `Se risiedi in Ticino puoi chiedere a Fondounimpresa fino a ${fondo.oreMassime} ore di accompagnamento.`;
    }
    return { stato: "facoltativo", perche };
  },

  "statuto-suva": (r) => {
    if (!edileOTrasporti(r)) return { stato: "non_serve", perche: "Riguarda i settori assicurati dalla Suva, come l'edilizia e i trasporti." };
    if (conSoci(r)) return { stato: "non_serve", perche: SOLO_DITTA };
    return {
      stato: "da_fare",
      perche:
        r.attivita === "trasporti"
          ? "Lavori nei trasporti: la cassa AVS inoltra la tua domanda alla Suva, che decide insieme alla cassa."
          : "Hai indicato artigianato o edilizia: se lavori nell'edilizia (per esempio come muratore o imbianchino), la cassa AVS inoltra la tua domanda alla Suva, che decide insieme alla cassa.",
    };
  },

  "riconoscimento-avs": (r) => {
    if (conSoci(r)) return { stato: "non_serve", perche: SAGL_DIPENDENTI };
    const tempo =
      r.avviata === "oltre_3_mesi"
        ? "Hai già iniziato da più di 3 mesi: presenta la domanda adesso."
        : r.avviata === "meno_3_mesi"
          ? "Sei nei primi mesi di attività: è il momento giusto per la domanda."
          : "Presentala appena inizi, con le prime offerte o fatture come prova.";
    const clienti =
      r.clienti === "uno"
        ? "Con un solo cliente la cassa potrebbe considerarti dipendente: da verificare con la cassa prima di fatturare."
        : r.clienti === "pochi"
          ? "Lavorare per diversi clienti è uno dei criteri: con due o tre clienti conserva bene le prove di ogni incarico."
          : "Lavorare per molti clienti è uno dei criteri che la cassa guarda.";
    const note = [notaCassaAvs(r)];
    if (edileOTrasporti(r))
      note.push("Nell'edilizia e nei trasporti la cassa inoltra la domanda alla Suva, che decide insieme alla cassa.");
    if (haLavoroDipendente(r)) note.push(notaAttivitaAccessoria());
    return { stato: "da_fare", perche: `${tempo} ${clienti}`, note };
  },

  "assicurazione-infortuni": (r) => {
    if (conSoci(r)) return { stato: "non_serve", perche: SAGL_DIPENDENTI };
    const note = edileOTrasporti(r)
      ? ["Nei settori della Suva, come l'edilizia, la Suva offre un'assicurazione facoltativa per imprenditori."]
      : [];
    return haLavoroDipendente(r)
      ? {
          stato: "facoltativo",
          perche:
            "Hai anche un lavoro da dipendente; per l'attività in proprio la LAINF non è obbligatoria. Come sei coperto è da verificare con la tua cassa malati.",
          note,
        }
      : {
          stato: "da_fare",
          perche:
            "Lavorerai solo in proprio: nessun datore di lavoro ti assicura contro gli infortuni. Se prima eri dipendente, controlla che la copertura infortuni della cassa malati sia di nuovo attiva.",
          note,
        };
  },

  "iscrizione-rc": (r) => {
    if (conSoci(r)) {
      return {
        stato: "non_serve",
        perche: "Una Sagl si iscrive sempre nel registro di commercio, dopo l'atto dal notaio: vedi il passo sui soci.",
      };
    }
    const note: string[] = [];
    if (inTicino(r)) {
      const rc = uffici.registroCommercioTicino.valore;
      note.push(`${rc.nome}: ${rc.indirizzo}, ${rc.email}, tel. ${rc.telefono}.`);
    } else {
      note.push(
        "L'ufficio di Biasca è quello ticinese: trovi l'ufficio del tuo Cantone nell'elenco ufficiale degli uffici del registro di commercio. Con EasyGov puoi iscriverti online.",
      );
    }
    if (prevedeAlmeno100k(r)) {
      note.push(
        "Sono esentati i liberi professionisti che non gestiscono l'impresa in forma commerciale: da verificare con l'ufficio del registro di commercio.",
      );
      return {
        stato: "da_fare",
        perche: `Prevedi almeno ${SOGLIA_100K}: l'iscrizione diventa obbligatoria appena un esercizio chiude con questa cifra d'affari. Puoi anche iscriverti subito.`,
        note,
      };
    }
    return {
      stato: "facoltativo",
      perche:
        r.fatturato === "non_so"
          ? `Finché resti sotto ${SOGLIA_100K} di cifra d'affari l'iscrizione è facoltativa: controlla la cifra a fine anno.`
          : `Con meno di ${SOGLIA_100K} di cifra d'affari l'iscrizione è facoltativa.`,
      note,
    };
  },

  "iscrizione-iva": (r) => {
    if (prevedeAlmeno100k(r)) {
      return {
        stato: "da_fare",
        perche: `Prevedi almeno ${SOGLIA_100K} entro 12 mesi: di regola sei assoggettato all'IVA da subito e hai ${GIORNI_IVA} giorni per annunciarti.`,
        note: giaAvviata(r)
          ? [
              `Hai già iniziato: se i ${GIORNI_IVA} giorni sono passati, annunciati il prima possibile e verifica la tua situazione con l'AFC.`,
            ]
          : [],
      };
    }
    return {
      stato: "non_serve",
      perche:
        r.fatturato === "non_so"
          ? `Finché la cifra d'affari annua resta sotto ${SOGLIA_100K} sei esentato dall'IVA: tienila d'occhio a fine anno.`
          : `Sotto ${SOGLIA_100K} di cifra d'affari annua sei esentato dall'IVA. Ci si può iscrivere anche volontariamente (art. 11 LIVA): da valutare con un fiduciario.`,
    };
  },

  "sito-online": (r) =>
    r.venditaOnline === "si"
      ? {
          stato: "da_fare",
          perche: "Vendi online: sul sito devono esserci la tua identità e i tuoi contatti completi.",
        }
      : { stato: "non_serve", perche: "Vale per chi vende online. Se in futuro aprirai un negozio online, torna qui." },

  "locali-pubblico": (r) => {
    if (r.locali === "no") return { stato: "non_serve", perche: "Non avrai un locale aperto al pubblico." };
    return {
      stato: "da_fare",
      perche: "Avrai un locale aperto al pubblico: verifica regole e autorizzazioni prima di aprire.",
      note: inTicino(r)
        ? []
        : ["Le leggi citate qui sono ticinesi: nel tuo Cantone verifica con il Comune e con il Cantone."],
    };
  },

  fatture: (r) => ({
    stato: "da_fare",
    perche: prevedeAlmeno100k(r)
      ? "Sarai iscritto all'IVA: nelle tue fatture servono il numero IVA, l'aliquota e l'importo dell'IVA."
      : "Finché non sei iscritto all'IVA, nelle tue fatture l'IVA non deve comparire.",
  }),

  contabilita: (r) => {
    if (conSoci(r)) {
      return {
        stato: "non_serve",
        perche:
          "La contabilità semplificata vale per la ditta individuale: per una Sagl le regole sono diverse, da verificare con un fiduciario autorizzato.",
      };
    }
    return {
      stato: "da_fare",
      perche: prevedeAlmeno100k(r)
        ? `Finché la cifra d'affari resta sotto ${SOGLIA_CONTABILITA} ti basta la contabilità semplificata.`
        : "Con la cifra d'affari che prevedi ti basta la contabilità semplificata: entrate, uscite e patrimonio.",
    };
  },

  "acconti-avs": (r) => {
    if (conSoci(r)) return { stato: "non_serve", perche: SAGL_DIPENDENTI };
    const note: string[] = [];
    if (inTicino(r)) {
      const ias = ufficiPercorso.iasContributiPersonali.valore;
      note.push(
        `Con la cassa cantonale ticinese paghi anche lo ${percentuale(supplementiTicino.assegniFamiliari.valore, 2)} per gli assegni familiari e lo ${percentuale(supplementiTicino.assegnoIntegrativo.valore, 2)} per l'assegno integrativo, sul reddito soggetto AVS (aliquote 2026).`,
        `${ias.nome}: ${ias.email}, tel. ${ias.telefono}.`,
      );
    }
    return {
      stato: "da_fare",
      perche:
        "Gli acconti si pagano ogni trimestre: se restano troppo bassi rispetto ai contributi definitivi, paghi interessi di mora.",
      note,
    };
  },

  "acconti-imposte": (r) => {
    if (conSoci(r)) return { stato: "non_serve", perche: SOLO_DITTA };
    if (!inTicino(r)) {
      return {
        stato: "facoltativo",
        perche:
          "Le indicazioni di questo passo sono ticinesi. Nel tuo Cantone gli acconti seguono regole cantonali: da verificare con l'amministrazione delle imposte. Le imposte sul reddito della ditta, in ogni caso, le paghi tu.",
      };
    }
    return {
      stato: "da_fare",
      perche:
        "Il primo anno non ricevi le richieste di acconto: senza pagamenti durante l'anno, dopo la tassazione rischi di dover pagare tutto in 30 giorni.",
    };
  },

  "assicurazioni-previdenza": (r) => {
    if (conSoci(r)) return { stato: "non_serve", perche: SAGL_DIPENDENTI };
    return haLavoroDipendente(r)
      ? {
          stato: "facoltativo",
          perche:
            "Hai anche un lavoro da dipendente, con le sue assicurazioni; per l'attività in proprio valgono le regole degli indipendenti.",
          note: [
            "Se sei affiliato a una cassa pensione, per esempio dal lavoro da dipendente, per il pilastro 3a vale il limite con cassa pensione.",
          ],
        }
      : {
          stato: "facoltativo",
          perche:
            "Lavorerai solo in proprio: niente assicurazione contro la disoccupazione e niente cassa pensione obbligatoria.",
        };
  },

  "dichiarazione-imposte": (r) => {
    if (conSoci(r)) return { stato: "non_serve", perche: SOLO_DITTA };
    const perche = haLavoroDipendente(r)
      ? "Hai anche un salario: se l'attività in proprio è accessoria, il suo reddito va alla cifra 2.2."
      : "Il reddito della ditta va nella tua dichiarazione personale, alla cifra 2.";
    if (!inTicino(r)) {
      return {
        stato: "da_fare",
        perche: "Il reddito della ditta va nella tua dichiarazione personale.",
        note: [
          "Moduli, cifre e termini di questo passo sono ticinesi: nel tuo Cantone valgono quelli cantonali, da verificare.",
        ],
      };
    }
    return {
      stato: "da_fare",
      perche,
      note: [
        `Per la dichiarazione 2025 il termine era il ${dataSvizzera(regolePercorso.termineDichiarazioneTicino2025.valore)}: quello della dichiarazione 2026 sarà scritto a pagina 1 del modulo.`,
      ],
    };
  },

  "soglie-annuali": (r) => {
    switch (r.fatturato) {
      case "da_60k_a_100k":
        return {
          stato: "da_fare",
          perche: `Prevedi una cifra d'affari vicina a ${SOGLIA_100K}: controllala a fine anno, perché dalla soglia scattano registro di commercio e IVA.`,
        };
      case "non_so":
        return {
          stato: "da_fare",
          perche: "Non sai ancora quanto fatturerai: a fine anno somma la cifra d'affari e confrontala con le soglie.",
        };
      case "almeno_100k":
        return {
          stato: "facoltativo",
          perche: `Prevedi già almeno ${SOGLIA_100K}: registro e IVA ti riguardano. Resta da guardare la soglia di ${SOGLIA_CONTABILITA} per la contabilità completa.`,
        };
      case "meno_10k":
      case "da_10k_a_60k":
        return {
          stato: "facoltativo",
          perche: "Sei lontano dalle soglie, ma se l'attività cresce conviene controllare ogni anno.",
        };
    }
  },
};

const ORDINE_LIVELLI: Record<LivelloAvviso, number> = { importante: 0, attenzione: 1, info: 2 };

function calcolaAvvisi(r: Risposte): Avviso[] {
  const avvisi: Avviso[] = [];

  if (conSoci(r)) {
    avvisi.push({
      id: "soci",
      livello: "importante",
      titolo: "Con dei soci la ditta individuale non basta",
      testo: `La ditta individuale ha un solo titolare. Per partire insieme serve un'altra forma, per esempio una Sagl: almeno ${chf(regole.capitaleMinimoSagl.valore)} di capitale versato per intero e un atto pubblico dal notaio. Il percorso Sagl di Bleo arriverà più avanti: intanto segui la check list del Portale PMI e rivolgiti a un notaio o a un fiduciario autorizzato.`,
      fonti: [fonti.pmiDittaIndividuale, fonti.co773, fontiPercorso.co777c, fonti.pmiChecklist],
    });
  }

  if (r.clienti === "uno" && !conSoci(r)) {
    avvisi.push({
      id: "un-solo-cliente",
      livello: "importante",
      titolo: "Con un solo cliente rischi di non essere riconosciuto come indipendente",
      testo:
        "Il promemoria ufficiale AVS dice: «L'attività svolta per un solo mandante è normalmente classificata come attività lucrativa dipendente». Se la cassa respinge la domanda, per quell'attività sei considerato dipendente e il tuo cliente deve versare i contributi AVS per te. Da verificare con la cassa AVS prima di iniziare a fatturare.",
      fonti: [fonti.avsPromemoria202, fontiPercorso.avsCosaSuccedeOra],
    });
  }

  if (prevedeAlmeno100k(r)) {
    avvisi.push({
      id: "iva-da-subito",
      livello: "importante",
      titolo: `Con almeno ${SOGLIA_100K} previsti, l'IVA ti riguarda da subito`,
      testo:
        `Se all'avvio è presumibile che superi la soglia entro ${regolePercorso.mesiPerIvaDaSubito.valore} mesi, sei assoggettato all'IVA dall'inizio e devi annunciarti all'AFC entro ${GIORNI_IVA} giorni.` +
        (giaAvviata(r)
          ? " Hai già iniziato: se il termine è passato, annunciati il prima possibile e verifica la tua situazione con l'AFC."
          : ""),
      fonti: [fonti.liva14, fonti.liva66, fonti.afcAssoggettamento],
    });
  } else {
    avvisi.push({
      id: "niente-iva-in-fattura",
      livello: "attenzione",
      titolo: "Non scrivere l'IVA nelle fatture",
      testo:
        "Finché non sei iscritto all'IVA non puoi indicarla in fattura: se lo fai, devi all'AFC l'importo che hai indicato (art. 27 LIVA).",
      fonti: [fonti.liva27],
    });
  }

  if (r.attivita === "ristorazione_alimentari") {
    avvisi.push({
      id: "autorizzazione-ristorazione",
      livello: "importante",
      titolo: "Ristorante o bar: prima l'autorizzazione",
      testo: inTicino(r)
        ? "In Ticino un esercizio pubblico può essere aperto e gestito solo dopo aver ottenuto l'autorizzazione; di regola serve un gerente con il diploma cantonale di esercente (con alcune eccezioni)."
        : "Per ristoranti e bar valgono regole cantonali: verifica con gli uffici del tuo Cantone prima di aprire.",
      fonti: inTicino(r)
        ? [fontiPercorso.lear]
        : [fontiPercorso.pmiMettersiInProprio, fontiPercorso.sefriProfessioniRegolamentate],
    });
  }

  if (r.attivita === "salute_benessere") {
    avvisi.push({
      id: "autorizzazione-sanitaria",
      livello: "importante",
      titolo: "Attività sanitaria: prima l'autorizzazione",
      testo: inTicino(r)
        ? "In Ticino ogni attività sanitaria svolta sotto la propria responsabilità professionale è soggetta ad autorizzazione. Verifica se la tua lo è prima di iniziare."
        : "Le attività sanitarie sono regolate dai Cantoni: verifica con l'autorità sanitaria del tuo Cantone prima di iniziare.",
      fonti: inTicino(r)
        ? [fontiPercorso.sanitaLiberoEsercizio]
        : [fontiPercorso.pmiMettersiInProprio, fontiPercorso.sefriProfessioniRegolamentate],
    });
  }

  if (edileOTrasporti(r) && !conSoci(r)) {
    avvisi.push({
      id: "suva-statuto",
      livello: "importante",
      titolo: "Edilizia e trasporti: decide anche la Suva",
      testo:
        "Nell'edilizia e nei trasporti la cassa AVS inoltra la domanda alla Suva, che decide insieme alla cassa. Chi lavora in subappalto o a cottimo per un'altra impresa è di regola considerato dipendente.",
      fonti: [fontiPercorso.suvaAccertamento],
    });
  }

  if (r.permesso !== "svizzero_c") {
    const ufficio = inTicino(r) ? "l'Ufficio della migrazione" : "l'ufficio della migrazione del tuo Cantone";
    const allUfficio = inTicino(r) ? "all'Ufficio della migrazione" : "all'ufficio della migrazione del tuo Cantone";
    avvisi.push(
      giaAvviata(r)
        ? {
            id: "permesso",
            livello: "importante",
            titolo: "Hai già iniziato: verifica subito il tuo permesso",
            testo:
              (r.permesso === "g"
                ? `Per lavorare in proprio i frontalieri hanno bisogno del permesso G per l'attività indipendente. Se non l'hai ancora, rivolgiti subito ${allUfficio}.`
                : r.permesso === "b"
                  ? `Verifica subito con ${ufficio} che il tuo permesso B ti consenta di lavorare come indipendente.`
                  : `Verifica subito con ${ufficio} se e come puoi lavorare in proprio.`) +
              " È un caso complesso: fatti aiutare da un professionista, per esempio un avvocato che si occupa di permessi.",
            fonti: fontiAvvisoPermesso(r),
          }
        : {
            id: "permesso",
            livello: "importante",
            titolo: "Prima di iniziare, verifica il tuo permesso",
            testo:
              r.permesso === "g"
                ? "I frontalieri che vogliono mettersi in proprio chiedono il permesso G per l'attività indipendente: di regola, prima di iniziare."
                : r.permesso === "b"
                  ? `Verifica con ${ufficio} che il tuo permesso B ti consenta di lavorare come indipendente.`
                  : `Verifica con ${ufficio} se e come puoi lavorare in proprio.`,
            fonti: fontiAvvisoPermesso(r),
          },
    );
  }

  if (r.avviata === "oltre_3_mesi" && !conSoci(r)) {
    avvisi.push({
      id: "gia-iniziato",
      livello: "attenzione",
      titolo: "Hai già iniziato da più di 3 mesi",
      testo:
        "La domanda di riconoscimento come indipendente va presentata nei primissimi mesi di attività: se non l'hai ancora fatta, falla adesso.",
      fonti: [fonti.avsDomandaIndipendente],
    });
  }

  if (r.cantone === "GR") {
    avvisi.push({
      id: "grigioni",
      livello: "info",
      titolo: "Grigioni: alcune indicazioni sono solo per il Ticino",
      testo:
        "Le regole federali (AVS, IVA, registro di commercio) valgono anche per te. Imposte, moduli e autorizzazioni del Cantone dei Grigioni non sono ancora nelle fonti di Bleo: verificali con gli uffici cantonali.",
      fonti: [fonti.avsCasseCantonali, fontiPercorso.zefixUffici],
    });
  }

  if (r.cantone === "altro") {
    avvisi.push({
      id: "fuori-zona",
      livello: "info",
      titolo: "Bleo per ora copre Ticino e Grigioni italiano",
      testo:
        "Le regole federali (AVS, IVA, registro di commercio, Codice delle obbligazioni) valgono anche per te. Uffici, moduli, imposte e autorizzazioni cantonali sono diversi: verificali con il tuo Cantone.",
      fonti: [fontiPercorso.pmiMettersiInProprio, fonti.avsCasseCantonali, fontiPercorso.zefixUffici],
    });
  }

  return avvisi
    .map((a, i) => ({ a, i }))
    .sort((x, y) => ORDINE_LIVELLI[x.a.livello] - ORDINE_LIVELLI[y.a.livello] || x.i - y.i)
    .map(({ a }) => a);
}

function calcolaScadenze(r: Risposte): Scadenza[] {
  const scadenze: Scadenza[] = [];

  if (prevedeAlmeno100k(r)) {
    scadenze.push({
      id: "annuncio-iva",
      titolo: "Annuncio all'IVA",
      quando: `Entro ${GIORNI_IVA} giorni dall'inizio dell'assoggettamento`,
      dettaglio: "Se prevedi di superare la soglia entro 12 mesi, l'assoggettamento inizia con l'attività.",
      fonti: [fonti.liva66, fonti.liva14],
      calendario: { tipo: "dopo-inizio", giorni: GIORNI_IVA },
    });
  }

  if (conSoci(r)) return scadenze;

  const avs = regolePercorso.accontiAvs.valore;
  const trimestri = ["4° trimestre dell'anno prima", "1° trimestre", "2° trimestre", "3° trimestre"];
  scadenze.push({
    id: "acconti-avs",
    titolo: "Acconti AVS",
    titoloEvento: "Acconto AVS",
    quando: "10 gennaio, 10 aprile, 10 luglio e 10 ottobre",
    dettaglio: `Se gli acconti restano sotto il ${percentuale(regolePercorso.sogliaAccontiAvs.valore, 0)} dei contributi definitivi paghi interessi di mora. Il conguaglio dopo la tassazione si paga entro ${regolePercorso.termineConguaglioAvsGiorni.valore} giorni.`,
    fonti: [fonti.avsPromemoria202],
    calendario: {
      tipo: "annuale",
      date: avs.mesi.map((mese, i) => ({ giorno: avs.giorno, mese, etichetta: trimestri[i] ?? "" })),
    },
  });

  if (!inTicino(r)) return scadenze;

  const ifd = regolePercorso.ifdRataUnicaTicino.valore;
  scadenze.push({
    id: "ifd",
    titolo: "Imposta federale diretta",
    quando: "31 marzo",
    dettaglio: "Termine per la rata unica del calcolo provvisorio dell'anno prima, se l'hai ricevuto.",
    fonti: [fontiPercorso.dcIfdProvvisorio],
    calendario: { tipo: "annuale", date: [{ giorno: ifd.giorno, mese: ifd.mese, etichetta: "rata unica" }] },
  });

  const anniAcconti = Object.keys(regolePercorso.accontiCantonaliTicino)
    .map(Number)
    .sort((a, b) => a - b);
  const ultimoAnno = anniAcconti.at(-1);
  const acconti = ultimoAnno === undefined ? undefined : regolePercorso.accontiCantonaliTicino[ultimoAnno];
  scadenze.push({
    id: "acconti-cantonali",
    titolo: "Acconti dell'imposta cantonale",
    titoloEvento: "Acconto dell'imposta cantonale",
    // Niente date qui: il riquadro delle scadenze le mostra confrontandole con
    // la data di oggi (dateFisseDaOggi in calendario.ts), così i termini già
    // passati non sembrano scadenze future.
    quando: "3 rate più un conguaglio, alle date fissate ogni anno da un decreto cantonale",
    dettaglio:
      "Il primo anno le richieste di acconto non arrivano da sole: chiedi le polizze per pagamenti volontari.",
    fonti: acconti ? [acconti.fonte, fontiPercorso.istruzioniPf2025] : [fontiPercorso.istruzioniPf2025],
    calendario: {
      tipo: "fisse",
      // Le date di tutti gli anni pubblicati: dateScadenza sceglie quelle dell'anno.
      date: anniAcconti.flatMap((anno) =>
        (regolePercorso.accontiCantonaliTicino[anno]?.valore ?? []).map((data, i) => ({
          data,
          etichetta: `${i + 1}ª rata`,
        })),
      ),
    },
  });

  scadenze.push({
    id: "dichiarazione",
    titolo: "Dichiarazione d'imposta",
    quando: "Entro il termine scritto a pagina 1 della dichiarazione",
    dettaglio: `Per la dichiarazione 2025 il termine era il ${dataSvizzera(regolePercorso.termineDichiarazioneTicino2025.valore)}.`,
    fonti: [regolePercorso.termineDichiarazioneTicino2025.fonte],
    calendario: { tipo: "nessuna" },
  });

  return scadenze;
}

/** Calcola il percorso personale: passi in ordine di fase, avvisi, scadenze. */
export function calcolaPercorso(r: Risposte): Percorso {
  const passi = PASSI.map((passo, indice) => ({ passo, indice }))
    .sort((a, b) => FASI.indexOf(a.passo.fase) - FASI.indexOf(b.passo.fase) || a.indice - b.indice)
    .map(({ passo }): PassoPercorso => {
      const esito = REGOLE_PASSI[passo.id](r);
      return { passo, stato: esito.stato, perche: esito.perche, note: esito.note ?? [] };
    });

  return { versioneRegole: VERSIONE_REGOLE, passi, avvisi: calcolaAvvisi(r), scadenze: calcolaScadenze(r) };
}

/** Avanzamento sui passi da fare (i facoltativi non contano). */
export function avanzamento(percorso: Percorso, fatti: ReadonlySet<string>): { fatti: number; totale: number } {
  const daFare = percorso.passi.filter((p) => p.stato === "da_fare");
  return { fatti: daFare.filter((p) => fatti.has(p.passo.id)).length, totale: daFare.length };
}

/** Il primo passo da fare non ancora fatto, nell'ordine del percorso. */
export function prossimoPasso(percorso: Percorso, fatti: ReadonlySet<string>): PassoPercorso | undefined {
  return percorso.passi.find((p) => p.stato === "da_fare" && !fatti.has(p.passo.id));
}
