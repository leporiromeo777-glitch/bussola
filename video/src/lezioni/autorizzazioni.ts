/**
 * Lezione 3: «Ti serve un'autorizzazione?». Fonti, ricontrollate il
 * 17.10.2026 (VERIFICATO_AUTORIZZAZIONI in src/data/svizzera.ts):
 * - Portale PMI, «Mettersi in proprio», punto 2: attività soggette ad
 *   autorizzazione (reputazione, controlli, numero chiuso per il commercio
 *   itinerante), professioni regolamentate (notaio, medico: formazione o
 *   esperienza), regole federali e cantonali, chiedere agli uffici
 *   (fontiPercorso.pmiMettersiInProprio);
 * - note informative della SEFRI sulle professioni regolamentate (sanità,
 *   edilizia, sicurezza e sorveglianza, attività sportive, …)
 *   (fontiPercorso.sefriProfessioniRegolamentate);
 * - autorizzazioni della Polizia cantonale (esercizi pubblici, commercio
 *   ambulante, agenzie di sicurezza, agriturismo, …)
 *   (fontiPercorso.poliziaAutorizzazioni).
 * Nessun elenco unico ticinese e i passi dedicati (ristoranti e bar,
 * alimenti, sanità, permesso di lavoro): dati del percorso (src/data/passi.ts).
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { fontiPercorso, VERIFICATO_AUTORIZZAZIONI } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("autorizzazioni");
if (!corso) throw new Error("Manca la lezione autorizzazioni in src/data/corso.ts");

export const autorizzazioni: Lezione = {
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
      testo: "Ciao, sono Bleo! Prima di iniziare, controlla una cosa importante: per la tua attività ti serve un'autorizzazione?",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "aut-attivita",
      stile: "lavagna",
      testo:
        "Alcune attività sono soggette ad autorizzazione. Per ottenerla contano per esempio la buona reputazione, dei controlli o, per alcune attività come il commercio ambulante, un numero limitato di posti.",
      schermo: {
        tipo: "punto",
        titolo: "Attività con autorizzazione",
        testo: "Contano la reputazione, dei controlli o, a volte, un numero limitato di posti.",
        fonte: fontiPercorso.pmiMettersiInProprio,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "aut-professioni",
      stile: "lavagna",
      testo: "Poi ci sono le professioni regolamentate, come il notaio o il medico: per esercitarle serve una formazione specifica o un'esperienza dimostrata.",
      schermo: {
        tipo: "punto",
        titolo: "Professioni regolamentate",
        testo: "Come il notaio o il medico: serve una formazione specifica o un'esperienza dimostrata.",
        fonte: fontiPercorso.pmiMettersiInProprio,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "aut-livelli",
      stile: "lavagna",
      testo:
        "Alcune regole sono della Confederazione, altre del Cantone. E per il Ticino non c'è un unico elenco ufficiale: il consiglio è informarsi prima di iniziare.",
      schermo: {
        tipo: "punto",
        titolo: "Confederazione e Cantone",
        testo: "Per il Ticino non c'è un unico elenco: informati prima di iniziare.",
        fonte: fontiPercorso.pmiMettersiInProprio,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "aut-sefri",
      stile: "lavagna",
      testo:
        "Primo controllo: cerca la tua professione nelle note informative della SEFRI. Ci sono per esempio le professioni sanitarie, l'edilizia, la sicurezza e alcune attività sportive.",
      schermo: {
        tipo: "punto",
        titolo: "1. Le note della SEFRI",
        testo: "Professioni sanitarie, edilizia, sicurezza, attività sportive e altre.",
        fonte: fontiPercorso.sefriProfessioniRegolamentate,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "aut-polizia",
      stile: "lavagna",
      testo:
        "Secondo controllo: in Ticino, guarda le autorizzazioni della Polizia cantonale. Per esempio per gli esercizi pubblici, il commercio ambulante, le agenzie di sicurezza o l'agriturismo.",
      schermo: {
        tipo: "punto",
        titolo: "2. La Polizia cantonale",
        testo: "Esercizi pubblici, commercio ambulante, agenzie di sicurezza, agriturismo e altre.",
        fonte: fontiPercorso.poliziaAutorizzazioni,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo: "Terzo: se hai ancora un dubbio, chiedi all'ufficio cantonale competente, prima di iniziare.",
      schermo: { tipo: "punto", titolo: "3. Nel dubbio, chiedi", testo: "All'ufficio cantonale competente, prima di iniziare.", fonte: fontiPercorso.pmiMettersiInProprio },
    },
    {
      audio: "scena-8.mp3",
      stile: "presentatore",
      testo:
        "Per alcuni casi frequenti Bleo ha dei passi dedicati: ristoranti e bar, alimenti, attività sanitarie e permesso di lavoro. Se ti riguardano, il tuo percorso te li segna da fare.",
      schermo: {
        tipo: "punto",
        titolo: "I passi dedicati",
        testo: "Ristoranti e bar, alimenti, attività sanitarie, permesso di lavoro: se ti riguardano, sono nel tuo percorso.",
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.pmiMettersiInProprio, verificatoIl: VERIFICATO_AUTORIZZAZIONI },
    },
  ],
};
