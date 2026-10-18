/**
 * Lezione 20: «Metti da parte i soldi per le imposte». Fonti, ricontrollate
 * il 18.10.2026 (VERIFICATO_IMPOSTE in src/data/svizzera.ts):
 * - Portale PMI, «La non imposizione fiscale di alcune società»
 *   (fontiPercorso.pmiImposteDitta): la ditta individuale non è tassata come
 *   impresa; il titolare paga le imposte federale, cantonale e comunale sul
 *   reddito complessivo, e l'imposta sulla sostanza insieme a quella privata;
 * - Istruzioni PF 2025, pp. 48-49 (fontiPercorso.istruzioniPf2025): sistema
 *   postnumerando, l'Ufficio esazione e condoni riscuote imposta cantonale e
 *   federale diretta, il Comune la sua; i nuovi contribuenti non ricevono le
 *   richieste d'acconto e dopo la tassazione pagano tutto in
 *   regoleImposte.terminePagamentoGiorni giorni; possono chiedere le polizze
 *   per pagamenti volontari indicando reddito e sostanza prevedibili;
 * - DC, pagine «Richiesta d'acconto / calcolo provvisorio» (acconti calcolati
 *   sull'ultima tassazione, cambi di reddito non noti al fisco non
 *   considerati), «Richiesta d'acconto imposta cantonale» (tre rate e
 *   conguaglio, regolePercorso.accontiCantonaliTicino) e «Calcolo provvisorio
 *   imposta federale diretta» (rata unica, regolePercorso.ifdRataUnicaTicino);
 * - decreto esecutivo sulla riscossione 2026 (fontiPercorso.decretoRiscossione2026):
 *   tre rate d'acconto e una a conguaglio (art. 1), interesse sui pagamenti
 *   prima della scadenza e di ritardo (artt. 3 e 6,
 *   regoleImposte.interessiCantonali[2026]), acconti equi (art. 10);
 * - LT artt. 241-243 (fontiPercorso.leggeTributariaTicino): rate sulla base
 *   dell'ultima tassazione o dell'importo presumibile, pagamento nei 30 giorni
 *   dalla scadenza, interessi;
 * - AFC, calcolatore d'imposta (fontiStrumenti.afcCalcolatoreImposte).
 * Gli strumenti «Budget del primo anno» (src/lib/strumenti/budget.ts: la
 * riserva per le imposte è una percentuale scelta da te, messa da parte un
 * dodicesimo al mese) e «Tariffa oraria» (src/lib/strumenti/tariffa.ts: la
 * riserva entra nel reddito da coprire con la tariffa) non calcolano le imposte.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import {
  fonti,
  fontiPercorso,
  fontiStrumenti,
  percentuale,
  regoleImposte,
  regolePercorso,
  ufficiPercorso,
} from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("acconti-imposte");
if (!corso) throw new Error("Manca la lezione acconti-imposte in src/data/corso.ts");

const GIORNI = regoleImposte.terminePagamentoGiorni.valore;
const interessi = regoleImposte.interessiCantonali[2026]?.valore;
const IFD = regolePercorso.ifdRataUnicaTicino.valore;
const RATE = regolePercorso.accontiCantonaliTicino[2026]?.valore.length;
const esazione = ufficiPercorso.esazioneCondoniTicino.valore;

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  GIORNI !== 30 ||
  !interessi ||
  interessi.pagamentiAnticipati !== 0.001 ||
  interessi.ritardo !== 0.035 ||
  IFD.giorno !== 31 ||
  IFD.mese !== 3 ||
  RATE !== 3
) {
  throw new Error(
    "Una regola sulle imposte è cambiata: aggiorna `testo` e `voce` delle scene 4, 5 e 8 e rifalle (npm run voce -- acconti-imposte 4 5 8).",
  );
}

const ANTICIPI = percentuale(interessi.pagamentiAnticipati, 2);
const RITARDO = percentuale(interessi.ritardo, 2);

export const accontiImposte: Lezione = {
  id: corso.passoId,
  numero: corso.numero,
  titolo: corso.titolo,
  stile: "misto",
  clip: "clip.mp4",
  prossimoPasso: titoloProssimoPasso(corso.passoId),
  scene: [
    {
      audio: "scena-1.mp3",
      disegno: "titolo-lezione",
      stile: "presentatore",
      testo:
        "Ciao, sono Bleo! Con la tua ditta arrivano i primi guadagni. Ma una parte servirà per pagare le imposte. Ti spiego come arrivarci preparato.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "imp-tu",
      stile: "lavagna",
      testo:
        "La ditta individuale non paga imposte per conto suo: le paghi tu. L'utile della ditta si somma al tuo reddito, e su tutto paghi le imposte alla Confederazione, al Cantone e al Comune. Anche la sostanza della ditta si somma alla tua.",
      schermo: {
        tipo: "punto",
        titolo: "Le imposte le paghi tu",
        testo: "L'utile della ditta si somma al tuo reddito: imposte federale, cantonale e comunale. La sostanza della ditta si somma alla tua.",
        fonte: fontiPercorso.pmiImposteDitta,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "imp-dopo",
      stile: "lavagna",
      testo:
        "Le imposte di un anno si calcolano dopo, con la dichiarazione che consegni all'inizio dell'anno seguente. Intanto si pagano degli acconti: rate calcolate sull'ultima tassazione che hai ricevuto.",
      schermo: {
        tipo: "punto",
        titolo: "Le imposte arrivano dopo",
        testo: "Si calcolano con la dichiarazione dell'anno seguente. Intanto si pagano acconti, calcolati sull'ultima tassazione.",
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "imp-rate",
      stile: "lavagna",
      testo: `In Ticino l'imposta cantonale si paga in tre rate d'acconto, più un conguaglio dopo la tassazione. L'imposta federale ha una rata unica, entro il ${IFD.giorno} marzo dell'anno dopo. E l'imposta comunale la chiede il tuo Comune.`,
      voce: "In Ticino l'imposta cantonale si paga in tre rate d'acconto, più un conguaglio dopo la tassazione. L'imposta federale ha una rata unica, entro il trentuno marzo dell'anno dopo. E l'imposta comunale la chiede il tuo Comune.",
      schermo: {
        tipo: "punto",
        titolo: "Le rate in Ticino",
        testo: `Cantonale: ${RATE} rate d'acconto e un conguaglio. Federale: rata unica entro il ${IFD.giorno} marzo dell'anno dopo. Comunale: la chiede il Comune.`,
        fonte: fontiPercorso.dcAccontoCantonale,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "imp-primo-anno",
      stile: "lavagna",
      testo: `Ma attenzione: se compili la dichiarazione per la prima volta, le richieste di acconto non arrivano. Dopo la tassazione ricevi la polizza per tutta l'imposta, da pagare in ${GIORNI} giorni. E può essere una somma importante.`,
      voce: "Ma attenzione: se compili la dichiarazione per la prima volta, le richieste di acconto non arrivano. Dopo la tassazione ricevi la polizza per tutta l'imposta, da pagare in trenta giorni. E può essere una somma importante.",
      schermo: {
        tipo: "attenzione",
        titolo: "La prima dichiarazione",
        testo: `Niente richieste di acconto: dopo la tassazione paghi tutta l'imposta in ${GIORNI} giorni.`,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "imp-polizze",
      stile: "lavagna",
      testo:
        "Per evitarlo, chiedi all'Ufficio esazione e condoni, a Bellinzona, le polizze per pagamenti volontari. Indica i tuoi dati, il reddito e la sostanza che prevedi per l'anno. L'ufficio ti manda le polizze calcolate su quelle cifre.",
      schermo: {
        tipo: "punto",
        titolo: "Chiedi le polizze",
        testo: `${esazione.nome}: ${esazione.email}, tel. ${esazione.telefono}. Indica reddito e sostanza che prevedi.`,
        fonte: fontiPercorso.dcRichiestaAcconto,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "imp-vecchia",
      stile: "lavagna",
      testo:
        "E se gli acconti li ricevi già, per esempio perché hai lavorato da dipendente? Sono calcolati sulla tassazione vecchia, senza il reddito della ditta. Se il tuo reddito cambia molto, puoi chiedere acconti adatti a quello nuovo.",
      schermo: {
        tipo: "punto",
        titolo: "Ricevi già gli acconti?",
        testo: "Sono calcolati sull'ultima tassazione, senza la ditta. Se il reddito cambia molto, puoi chiedere acconti adatti.",
        fonte: fontiPercorso.decretoRiscossione2026,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "imp-interessi",
      stile: "lavagna",
      testo: `Pagare prima conviene. Per l'imposta cantonale, se paghi in anticipo ricevi un piccolo interesse: nel 2026 lo ${ANTICIPI}. Se paghi più di ${GIORNI} giorni dopo la scadenza, invece, c'è un interesse di ritardo: nel 2026 il ${RITARDO}.`,
      voce: "Pagare prima conviene. Per l'imposta cantonale, se paghi in anticipo ricevi un piccolo interesse: nel duemilaventisei lo zero virgola dieci per cento. Se paghi più di trenta giorni dopo la scadenza, invece, c'è un interesse di ritardo: nel duemilaventisei il tre virgola cinquanta per cento.",
      schermo: {
        tipo: "punto",
        titolo: "Pagare prima conviene",
        testo: `Imposta cantonale, tassi 2026: ${ANTICIPI} sui pagamenti in anticipo, ${RITARDO} di interesse di ritardo.`,
        fonte: fontiPercorso.decretoRiscossione2026,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "imp-quanto",
      stile: "lavagna",
      testo:
        "Quanto mettere da parte? Dipende dal tuo reddito, dalla tua sostanza e dal tuo Comune. Per farti un'idea, la Confederazione ha un calcolatore d'imposta online.",
      schermo: {
        tipo: "punto",
        titolo: "Quanto mettere da parte?",
        testo: "Dipende da reddito, sostanza e Comune. Per farti un'idea: il calcolatore d'imposta dell'AFC.",
        fonte: fontiStrumenti.afcCalcolatoreImposte,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "imp-strumenti",
      stile: "lavagna",
      testo:
        "Bleo ha due strumenti che ti aiutano. Nel «Budget del primo anno» scegli una percentuale per le imposte, e vedi quanto mettere da parte ogni mese. Nella «Tariffa oraria», la stessa riserva entra nel prezzo della tua ora.",
      schermo: {
        tipo: "punto",
        titolo: "Gli strumenti di Bleo",
        testo: "«Budget del primo anno»: quanto mettere da parte ogni mese. «Tariffa oraria»: la riserva entra nel prezzo.",
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo non calcola le tue imposte: per una stima sul tuo caso, rivolgiti a un fiduciario autorizzato. Fuori dal Ticino, chiedi al tuo Cantone: gli acconti seguono regole cantonali. E per ogni dubbio, chiedi a Bleo in chat.",
      schermo: {
        tipo: "punto",
        titolo: "Hai un dubbio?",
        testo: "Stima sul tuo caso: un fiduciario autorizzato. Fuori dal Ticino: chiedi al tuo Cantone. E chiedi a Bleo in chat.",
        fonte: fonti.albofiduciari,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.istruzioniPf2025, verificatoIl: corso.verificatoIl },
    },
  ],
};
