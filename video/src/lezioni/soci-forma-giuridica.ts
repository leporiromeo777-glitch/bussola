/**
 * Lezione 2: «Fondare una Sagl con i soci». Segue, nello stesso ordine, la
 * check list del Portale PMI per creare una Sagl (fonti.pmiChecklist,
 * ricontrollata il 17.10.2026, vedi VERIFICATO_CHECKLIST in
 * src/data/svizzera.ts): preventivo delle spese, nome dell'impresa e verifica
 * al registro di commercio, capitale e quote con la liberazione (in contanti
 * o in natura), soci e direzione, conto vincolato in banca, atto di
 * fondazione e statuto, esame preliminare dal notaio e al registro,
 * assemblea costitutiva, iscrizione nel registro, rilascio delle quote con
 * l'estratto, assicurazioni sociali (anche il fondatore è dipendente) e IVA;
 * EasyGov per le iscrizioni.
 *
 * Le alternative con dei soci (scene 8 e 9, con i disegni della lezione 1):
 * la società in nome collettivo (fontiPercorso.pmiNomeCollettivo) e la SA,
 * con passi simili nella stessa check list e più capitale
 * (regole.capitaleMinimoSa e versamentoMinimoSa, artt. 621 e 632 CO).
 *
 * Altre fonti: capitale minimo regole.capitaleMinimoSagl (art. 773 CO),
 * versamento per intero (art. 777c CO), atto pubblico (art. 777 CO), i
 * fondatori attivi nella Sagl sono dipendenti
 * (fontiPercorso.pmiAssicurazioniSociali), albo dei fiduciari.
 * Della check list resta fuori solo la dichiarazione di accettazione
 * dell'organo di revisione (se è previsto): la check list completa è citata
 * nella scena 13.
 *
 * La voce dice «società a garanzia limitata» (la sigla Sagl solo nella scena
 * 2, da ascoltare e scegliere fra più versioni), «a-vu-esse» e le cifre in
 * parole (nel campo `voce` delle scene 4 e 9).
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fonti, fontiPercorso, regole, VERIFICATO_CHECKLIST } from "../../../src/data/svizzera";
import { SIGLA_SAGL } from "../voce";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("soci-forma-giuridica");
if (!corso) throw new Error("Manca la lezione soci-forma-giuridica in src/data/corso.ts");

// La voce dice «ventimila» (scena 4), «centomila» e «cinquantamila franchi» (scena 9).
if (
  regole.capitaleMinimoSagl.valore !== 20_000 ||
  regole.capitaleMinimoSa.valore !== 100_000 ||
  regole.versamentoMinimoSa.valore !== 50_000
) {
  throw new Error("Il capitale di Sagl o SA è cambiato: aggiorna `voce` delle scene 4 e 9 e rifalle (npm run voce -- soci-forma-giuridica 4 9).");
}
const SAGL = chf(regole.capitaleMinimoSagl.valore);
const SA = chf(regole.capitaleMinimoSa.valore);
const SA_VERSATO = chf(regole.versamentoMinimoSa.valore);

export const sociFormaGiuridica: Lezione = {
  id: corso.passoId,
  numero: corso.numero,
  titolo: "Fondare una Sagl con i soci",
  stile: "misto",
  clip: "clip.mp4",
  prossimoPasso: titoloProssimoPasso(corso.passoId),
  scene: [
    {
      audio: "scena-1.mp3",
      disegno: "titolo-lezione",
      stile: "presentatore",
      testo: "Ciao, sono Bleo! Vuoi aprire un'attività insieme a un amico o a un socio? La ditta individuale non basta: ha un solo titolare.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: "Fondare una Sagl con i soci" },
    },
    {
      audio: "scena-2.mp3",
      disegno: "fondare-soci",
      stile: "lavagna",
      testo: "Una forma possibile è la società a garanzia limitata, detta anche Sagl. Ecco come si fonda, seguendo la check list ufficiale del Portale PMI.",
      // Solo qui la voce dice la sigla, lettera per lettera; altrove il nome per esteso.
      voce: `Una forma possibile è la società a garanzia limitata, detta anche ${SIGLA_SAGL}. Ecco come si fonda, seguendo la check list ufficiale del Portale PMI.`,
      schermo: {
        tipo: "punto",
        titolo: "Società a garanzia limitata (Sagl)",
        testo: "Come si fonda, passo per passo: la check list del Portale PMI.",
        fonte: fonti.pmiChecklist,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "fondare-basi",
      stile: "lavagna",
      testo:
        "Primo: preparate le basi. Fate un preventivo delle spese di fondazione, scegliete il nome della società e verificatelo al registro di commercio.",
      schermo: {
        tipo: "punto",
        titolo: "1. Le basi",
        testo: "Preventivo delle spese, nome della società e verifica del nome al registro di commercio.",
        fonte: fonti.pmiChecklist,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "fondare-capitale",
      stile: "lavagna",
      testo: `Decidete chi sono i soci, chi dirige la società e il capitale: almeno ${SAGL}, diviso in quote fra i soci e da versare per intero, in soldi o in natura, cioè con dei beni.`,
      voce: "Decidete chi sono i soci, chi dirige la società e il capitale: almeno ventimila franchi, diviso in quote fra i soci e da versare per intero, in soldi o in natura, cioè con dei beni.",
      schermo: {
        tipo: "punto",
        titolo: "Soci, direzione e capitale",
        testo: `Capitale di almeno ${SAGL}, in quote fra i soci, versato per intero (in soldi o in natura).`,
        fonte: fonti.co773,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "fondare-banca",
      stile: "lavagna",
      testo: "Secondo: scegliete una banca e aprite un conto vincolato, cioè bloccato, dove versate il capitale.",
      schermo: {
        tipo: "punto",
        titolo: "2. La banca",
        testo: "Un conto vincolato (bloccato) dove versare il capitale.",
        fonte: fonti.pmiChecklist,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "fondare-notaio",
      stile: "lavagna",
      testo:
        "Terzo: preparate l'atto di fondazione e lo statuto, e fateli controllare prima dal notaio e dal registro di commercio. Poi fate l'assemblea di fondazione, con l'atto pubblico dal notaio.",
      schermo: {
        tipo: "punto",
        titolo: "3. Documenti e notaio",
        testo: "Atto di fondazione e statuto, controllo preliminare, assemblea di fondazione con l'atto pubblico.",
        fonte: fontiPercorso.co777,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "fondare-iscrizione",
      stile: "lavagna",
      testo: "Quarto: la Sagl viene iscritta nel registro di commercio. Con l'estratto del registro, la banca sblocca il capitale.",
      schermo: {
        tipo: "punto",
        titolo: "4. Registro di commercio",
        testo: "Iscrizione nel registro; con l'estratto, la banca sblocca il capitale.",
        fonte: fonti.pmiChecklist,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "nome-collettivo",
      stile: "lavagna",
      testo:
        "Se non volete una Sagl, c'è anche la società in nome collettivo. Non serve un capitale minimo, ma va iscritta nel registro di commercio. Se la società non paga i suoi debiti, ne rispondete anche voi, con il vostro patrimonio personale.",
      schermo: {
        tipo: "punto",
        titolo: "Società in nome collettivo",
        testo: "Nessun capitale minimo, iscrizione nel registro di commercio. Per i debiti rispondono anche i soci.",
        fonte: fontiPercorso.pmiNomeCollettivo,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "sagl-sa",
      stile: "lavagna",
      testo: `La SA si fonda con passi simili alla Sagl. Anche qui servono il notaio e il registro di commercio. Ma serve più capitale: almeno ${SA}, e quando la fondate dovete versarne almeno ${SA_VERSATO}.`,
      voce: "La SA si fonda con passi simili alla Sagl. Anche qui servono il notaio e il registro di commercio. Ma serve più capitale: almeno centomila franchi, e quando la fondate dovete versarne almeno cinquantamila franchi.",
      schermo: {
        tipo: "punto",
        titolo: "Società anonima (SA)",
        testo: `Passi simili alla Sagl. Capitale di almeno ${SA}, versati almeno ${SA_VERSATO}.`,
        fonte: fontiPercorso.pmiSa,
      },
    },
    {
      audio: "scena-10.mp3",
      stile: "presentatore",
      testo:
        "Attenzione: nella Sagl anche voi fondatori, se lavorate nella società, siete considerati dipendenti. Annunciatevi alla cassa AVS e stipulate le assicurazioni obbligatorie, contro gli infortuni e per la previdenza professionale.",
      schermo: {
        tipo: "attenzione",
        titolo: "Nella Sagl anche i fondatori sono dipendenti",
        testo: "Cassa AVS e assicurazioni obbligatorie: infortuni e previdenza professionale.",
      },
    },
    {
      audio: "scena-11.mp3",
      stile: "presentatore",
      testo:
        "Infine chiarite se dovete pagare l'IVA. Per le iscrizioni al registro di commercio, all'IVA, all'AVS e all'assicurazione infortuni c'è il portale online EasyGov.",
      schermo: {
        tipo: "punto",
        titolo: "IVA ed EasyGov",
        testo: "Chiarite se dovete pagare l'IVA. Per le iscrizioni c'è il portale online EasyGov.",
        fonte: fonti.pmiChecklist,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Sono tanti passi: chiedete un preventivo a un notaio e, per il vostro caso, a un fiduciario autorizzato. L'elenco è nell'albo online del Cantone.",
      schermo: {
        tipo: "punto",
        titolo: "Per il vostro caso",
        testo: "Preventivo dal notaio e consiglio da un fiduciario autorizzato.",
        fonte: fonti.albofiduciari,
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "La check list completa la trovi qui sotto, sul Portale PMI. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonti.pmiChecklist, verificatoIl: VERIFICATO_CHECKLIST },
    },
  ],
};
