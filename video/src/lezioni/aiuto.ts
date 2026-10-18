/**
 * Lezione 9: «A chi chiedere aiuto». Fonti, ricontrollate il 18.10.2026
 * (VERIFICATO_AIUTO in src/data/svizzera.ts):
 * - Fondounimpresa (IFC): per cittadini svizzeri o stranieri con permesso B
 *   o C residenti in Ticino o nella Regione Moesa; al massimo
 *   regolePercorso.fondounimpresa ore in anni; iscrizione con il formulario
 *   online e la copia del documento; niente contabilità, corrispondenza e
 *   dichiarazione d'imposta (fontiPercorso.fondounimpresa); «servizio
 *   pubblico gratuito», fattibilità, strategia e business plan
 *   (fontiPercorso.fondounimpresaGratuito); un consulente personale e i
 *   moduli di formazione (fontiPercorso.portaleImpresaServizi);
 *   l'accompagnamento breve per chi ha già avviato l'attività
 *   (fontiPercorso.fondounimpresaBreve); i corsi hanno un prezzo
 *   (fontiPercorso.fondounimpresaCorsi);
 * - LFid, artt. 1 e 3: chi tiene la contabilità o fa la consulenza fiscale
 *   per altri, di mestiere, deve essere autorizzato (fonti.lfid,
 *   fontiPercorso.autoritaFiduciari); l'albo online (fonti.albofiduciari);
 * - legge di applicazione della LAVS, artt. 3 e 6: un'agenzia in ogni
 *   Comune, che dà moduli e informazioni (fontiPercorso.dlAvsTicino);
 * - Portale PMI: liste di controllo (fontiPercorso.pmiMettersiInProprio),
 *   servizi di supporto (fontiPercorso.pmiServiziSupporto), EasyGov gratuito
 *   per le imprese, ma con le tasse degli uffici (fontiPercorso.pmiEasyGov);
 * - Grigioni, Ufficio dell'economia e del turismo: aiuta chi fonda
 *   un'impresa, fa da tramite con banche e fiduciarie
 *   (fontiPercorso.grCostituzioneStartup).
 * Lo strumento «I tuoi conti» è in src/app/conti, la chat «Chiedi a Bleo» in
 * src/app/chat.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { fonti, fontiPercorso, regolePercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("aiuto");
if (!corso) throw new Error("Manca la lezione aiuto in src/data/corso.ts");

const fondo = regolePercorso.fondounimpresa.valore;
// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (fondo.oreMassime !== 15 || fondo.anniMassimi !== 2) {
  throw new Error("Le ore o gli anni di Fondounimpresa sono cambiati: aggiorna `voce` della scena 4 e rifalla (npm run voce -- aiuto 4).");
}

export const aiuto: Lezione = {
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
        "Ciao, sono Bleo! Quando apri un'attività le domande sono tante, ed è normale. Chiedere aiuto è la cosa giusta da fare. Ti mostro a chi puoi rivolgerti.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "aiu-fondo",
      stile: "lavagna",
      testo:
        "In Ticino c'è Fondounimpresa, un servizio pubblico e gratuito. Ti affianca un consulente personale, che ti aiuta a valutare e a realizzare il tuo progetto.",
      schermo: {
        tipo: "punto",
        titolo: "Fondounimpresa",
        testo: "Servizio pubblico gratuito: un consulente personale per valutare e realizzare il tuo progetto.",
        fonte: fontiPercorso.fondounimpresaGratuito,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "aiu-chi",
      stile: "lavagna",
      testo:
        "Lo possono chiedere i cittadini svizzeri e gli stranieri con il permesso B o C. Ma devono vivere in Ticino, oppure nella Regione Moesa, nei Grigioni.",
      voce: "Lo possono chiedere i cittadini svizzeri e gli stranieri con il permesso bi o ci. Ma devono vivere in Ticino, oppure nella Regione Moesa, nei Grigioni.",
      schermo: {
        tipo: "punto",
        titolo: "Per chi è",
        testo: "Cittadini svizzeri e stranieri con permesso B o C, residenti in Ticino o nella Regione Moesa.",
        fonte: fontiPercorso.fondounimpresa,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "aiu-ore",
      stile: "lavagna",
      testo: `Puoi avere fino a ${fondo.oreMassime} ore con il consulente. L'accompagnamento dura al massimo ${fondo.anniMassimi} anni. Per iscriverti compili il formulario online, e alleghi una copia del documento d'identità o del permesso.`,
      voce: "Puoi avere fino a quindici ore con il consulente. L'accompagnamento dura al massimo due anni. Per iscriverti compili il formulario online, e alleghi una copia del documento d'identità o del permesso.",
      schermo: {
        tipo: "punto",
        titolo: `Fino a ${fondo.oreMassime} ore`,
        testo: `In al massimo ${fondo.anniMassimi} anni. Ti iscrivi online, con una copia del documento d'identità o del permesso.`,
        fonte: fontiPercorso.fondounimpresa,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "aiu-cosa",
      stile: "lavagna",
      testo:
        "Con il consulente lavori sullo studio di fattibilità, sulla strategia e sul business plan. Ma Fondounimpresa non tiene la tua contabilità, e non compila la tua dichiarazione d'imposta.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa fa e cosa no",
        testo: "Sì: fattibilità, strategia, business plan. No: contabilità, corrispondenza, dichiarazione d'imposta.",
        fonte: fontiPercorso.fondounimpresa,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "aiu-corsi",
      stile: "lavagna",
      testo:
        "Hai già aperto la tua attività? Per le domande puntuali c'è l'accompagnamento breve. E poi ci sono i corsi, per esempio su business plan, contabilità e marketing: quelli però si pagano.",
      schermo: {
        tipo: "punto",
        titolo: "Breve, e i corsi",
        testo: "Se hai già aperto: accompagnamento breve per le domande puntuali. I corsi invece si pagano.",
        fonte: fontiPercorso.fondounimpresaBreve,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "aiu-fiduciario",
      stile: "lavagna",
      testo:
        "Per il tuo caso personale, come le tue imposte o la tua contabilità, la persona giusta è un fiduciario commercialista. In Ticino, chi fa questo lavoro per altri deve essere autorizzato dal Cantone.",
      schermo: {
        tipo: "punto",
        titolo: "Il fiduciario commercialista",
        testo: "Contabilità e dichiarazioni d'imposta per altri: in Ticino serve l'autorizzazione del Cantone.",
        fonte: fonti.lfid,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "aiu-albo",
      stile: "lavagna",
      testo:
        "Per sapere se è autorizzato, cercalo nell'albo online del Cantone. E Bleo ha uno strumento, «I tuoi conti»: tieni in ordine entrate, uscite e fatture, e a fine anno scarichi tutto per il fiduciario.",
      schermo: {
        tipo: "punto",
        titolo: "L'albo dei fiduciari",
        testo: "Cerca il fiduciario nell'albo online del Cantone. Con «I tuoi conti» prepari tutto per lui.",
        fonte: fonti.albofiduciari,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "aiu-avs",
      stile: "lavagna",
      testo: "Per l'AVS, in ogni Comune del Ticino c'è un'agenzia comunale. Lì ti danno informazioni e i moduli che ti servono.",
      schermo: {
        tipo: "punto",
        titolo: "L'agenzia AVS del Comune",
        testo: "In ogni Comune ticinese: informazioni e moduli dell'AVS.",
        fonte: fontiPercorso.dlAvsTicino,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "aiu-confederazione",
      stile: "lavagna",
      testo:
        "Anche la Confederazione ti aiuta. Il Portale PMI ha liste di controllo per mettersi in proprio. Su EasyGov fai online le pratiche, per esempio l'iscrizione all'AVS o all'IVA. Usarlo è gratis, ma gli uffici possono chiedere le loro tasse.",
      schermo: {
        tipo: "punto",
        titolo: "Portale PMI ed EasyGov",
        testo: "Liste di controllo per mettersi in proprio e pratiche online, gratis. Le tasse degli uffici restano.",
        fonte: fontiPercorso.pmiEasyGov,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "aiu-grigioni",
      stile: "lavagna",
      testo:
        "E nei Grigioni? Lì Fondounimpresa è solo per chi vive nella Regione Moesa. In tutto il Cantone c'è l'Ufficio dell'economia e del turismo: aiuta chi fonda un'impresa e ti mette in contatto con banche e fiduciari.",
      schermo: {
        tipo: "punto",
        titolo: "Nei Grigioni",
        testo: "L'Ufficio dell'economia e del turismo aiuta chi fonda un'impresa e fa da tramite con banche e fiduciari.",
        fonte: fontiPercorso.grCostituzioneStartup,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "E poi ci sono io! In «Chiedi a Bleo» rispondo alle domande generali, solo con le fonti ufficiali e sempre con il link. Per il tuo caso personale, invece, serve un professionista. Non restare mai da solo con un dubbio!",
      schermo: {
        tipo: "punto",
        titolo: "Chiedi a Bleo",
        testo: "Domande generali, risposte dalle fonti ufficiali con il link. Per il tuo caso: un professionista.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      // La pagina dell'accompagnamento ha un titolo con una parola troppo lunga per la scheda.
      schermo: { tipo: "fonte", fonte: fontiPercorso.fondounimpresaGratuito, verificatoIl: corso.verificatoIl },
    },
  ],
};
