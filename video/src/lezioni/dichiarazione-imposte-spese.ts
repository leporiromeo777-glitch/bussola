/**
 * Video facoltativo della lezione 22: «Quali spese puoi dedurre». Fonti,
 * ricontrollate il 18.10.2026 (VERIFICATO_SPESE_DITTA in src/data/svizzera.ts):
 * - LIFD art. 27 (fontiPercorso.lifd27) e LT art. 26: sono deducibili le
 *   spese aziendali e professionali giustificate; Portale PMI «La non
 *   imposizione fiscale di alcune società» (fontiPercorso.pmiImposteDitta):
 *   tutto ciò che è giustificato dall'uso commerciale, con i giustificativi;
 *   le spese private no, e le spese miste (auto usata anche privatamente,
 *   tasse telefoniche, premi assicurativi) si dividono;
 * - Modulo 10 2025 (fontiPercorso.modulo10), spese generali n. 8: pigione dei
 *   locali dell'azienda, riscaldamento ed elettricità, posta, telefono e
 *   materiale d'ufficio, assicurazioni aziendali; contributi AVS/AI/IPG del
 *   contribuente (lett. c); auto: chilometri totali e privati, meno la quota
 *   privata (lett. m); meno le quote private delle spese generali (lett. q);
 *   senza le imposte sul reddito e sulla sostanza (lett. o);
 * - LIFD art. 28 (fontiPercorso.lifd28) e LT art. 27: ammortamenti
 *   giustificati dall'uso commerciale, con la contabilità semplificata in
 *   speciali tabelle d'ammortamento (Modulo 10, n. 9); Portale PMI: auto,
 *   installazioni e immobili non si deducono nell'anno d'acquisto ma su più
 *   anni; Modulo 10, lett. o: l'acquisto di mobilio e macchine non è una spesa
 *   generale. I tassi del Modulo 10 («di regola») non li diciamo: dipendono
 *   dal caso, li vede il fiduciario;
 * - Istruzioni PF 2025 (fontiPercorso.istruzioniPf2025): i contributi AVS, AI,
 *   IPG alla cifra 10.1 se non già dedotti alla cifra 2 (pag. 25,
 *   regoleSpeseDitta.cifraContributiLegge); il pilastro 3a non si deduce dal
 *   reddito da attività indipendente ma alla cifra 11 (pag. 15,
 *   regoleSpeseDitta.cifraPilastro3a); i prelevamenti di merci dalla propria
 *   azienda sono reddito, al prezzo effettivo di vendita (pag. 14); i
 *   giustificativi si conservano dieci anni (pag. 14,
 *   regoleSpeseDitta.conservazioneGiustificativiAnni; come la lezione 18);
 * - Portale PMI «Sanzioni nel caso di dissimulazioni»
 *   (fontiPercorso.pmiSanzioniSpesePrivate): spese private messe tra quelle
 *   commerciali → reddito supplementare, recupero d'imposta ed eventualmente
 *   un'ammenda; il fisco informa anche l'AVS;
 * - albo dei fiduciari autorizzati (fonti.albofiduciari).
 * Lo strumento «I tuoi conti» è in src/app/conti: ogni voce letta si conferma
 * con «Sì, è della ditta» oppure «No, è privato» (da-confermare.tsx).
 * L'ufficio in casa non c'è: le fonti lette non dicono come si calcola.
 */
import { approfondimentoPerId } from "../../../src/data/corso";
import { fonti, fontiPercorso, regoleSpeseDitta, VERIFICATO_SPESE_DITTA } from "../../../src/data/svizzera";
import type { Lezione } from "./tipi";

const corso = approfondimentoPerId("dichiarazione-imposte-spese");
if (!corso) throw new Error("Manca il video facoltativo dichiarazione-imposte-spese in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  regoleSpeseDitta.cifraContributiLegge.valore !== "10.1" ||
  regoleSpeseDitta.cifraPilastro3a.valore !== "11" ||
  regoleSpeseDitta.conservazioneGiustificativiAnni.valore !== 10
) {
  throw new Error(
    "Le cifre della dichiarazione o gli anni dei giustificativi sono cambiati: aggiorna `voce` delle scene 5 e 7 e rifalle (npm run voce -- dichiarazione-imposte-spese 5 7).",
  );
}

const CIFRA_AVS = regoleSpeseDitta.cifraContributiLegge.valore;
const CIFRA_3A = regoleSpeseDitta.cifraPilastro3a.valore;
const ANNI = regoleSpeseDitta.conservazioneGiustificativiAnni.valore;

export const speseDitta: Lezione = {
  id: corso.approfondimento.id,
  numero: corso.lezione.numero,
  titolo: corso.approfondimento.titolo,
  stile: "misto",
  clip: "clip.mp4",
  prossimoPasso: corso.lezione.titolo,
  etichettaFine: "Torna alla lezione",
  scene: [
    {
      audio: "scena-1.mp3",
      stile: "presentatore",
      testo: "Ciao, sono Bleo! In questo video facoltativo vediamo quali spese puoi dedurre, e quali no.",
      schermo: { tipo: "titolo", etichetta: `Lezione ${corso.lezione.numero} · Video facoltativo`, titolo: corso.approfondimento.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "spese-regola",
      stile: "lavagna",
      testo:
        "La regola è questa: puoi dedurre le spese giustificate dall'uso commerciale, cioè quelle che ti servono per la ditta. Per esempio l'affitto del locale, l'elettricità, il materiale d'ufficio, le assicurazioni della ditta. Le spese private no, e nemmeno le imposte sul reddito.",
      schermo: {
        tipo: "punto",
        titolo: "Le spese della ditta",
        testo: "Si deduce quello che è giustificato dall'uso commerciale. Spese private e imposte sul reddito no.",
        fonte: fontiPercorso.pmiImposteDitta,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "spese-misto",
      stile: "lavagna",
      testo:
        "Se una cosa la usi sia per la ditta sia per te, come l'auto o il telefono, deduci solo la parte della ditta. Per l'auto, nel Modulo 10 scrivi i chilometri dell'anno e quanti erano privati. Quella parte privata la togli dalle spese.",
      voce: "Se una cosa la usi sia per la ditta sia per te, come l'auto o il telefono, deduci solo la parte della ditta. Per l'auto, nel modulo dieci scrivi i chilometri dell'anno e quanti erano privati. Quella parte privata la togli dalle spese.",
      schermo: {
        tipo: "punto",
        titolo: "In parte privato",
        testo: "Auto o telefono: deduci solo la parte della ditta. Per l'auto contano i chilometri privati.",
        fonte: fontiPercorso.modulo10,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "spese-ammortamento",
      stile: "lavagna",
      testo:
        "Un'auto, delle macchine o i mobili della ditta durano più anni: non li togli tutti nell'anno in cui li compri. Li togli un po' ogni anno, con l'ammortamento. Con la contabilità semplificata lo scrivi in una tabella apposta: c'è nel Modulo 10.",
      voce: "Un'auto, delle macchine o i mobili della ditta durano più anni: non li togli tutti nell'anno in cui li compri. Li togli un po' ogni anno, con l'ammortamento. Con la contabilità semplificata lo scrivi in una tabella apposta: c'è nel modulo dieci.",
      schermo: {
        tipo: "punto",
        titolo: "L'ammortamento",
        testo: "Quello che dura più anni si deduce un po' ogni anno, nella tabella d'ammortamento.",
        fonte: fontiPercorso.lifd28,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "spese-avs",
      stile: "lavagna",
      testo: `Anche i tuoi contributi AVS, invalidità e perdita di guadagno si deducono. Ma una volta sola: nel Modulo 10 tra le spese generali, oppure alla cifra ${CIFRA_AVS} della dichiarazione. Il pilastro 3a invece è privato: non va tra le spese della ditta, lo deduci a parte, alla cifra ${CIFRA_3A}.`,
      voce: "Anche i tuoi contributi AVS, invalidità e perdita di guadagno si deducono. Ma una volta sola: nel modulo dieci tra le spese generali, oppure alla cifra dieci punto uno della dichiarazione. Il pilastro tre a invece è privato: non va tra le spese della ditta, lo deduci a parte, alla cifra undici.",
      schermo: {
        tipo: "punto",
        titolo: "AVS e pilastro 3a",
        testo: `AVS/AI/IPG una volta sola: nel Modulo 10 o alla cifra ${CIFRA_AVS}. Il 3a a parte, alla cifra ${CIFRA_3A}.`,
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "spese-natura",
      stile: "lavagna",
      testo:
        "E se prendi per te qualcosa della ditta, per esempio la merce del tuo negozio? È un prelevamento in natura: il suo valore conta come un incasso, al prezzo a cui la vendi.",
      schermo: {
        tipo: "punto",
        titolo: "Prelevamenti in natura",
        testo: "La merce che prendi per te conta come un incasso, al prezzo di vendita.",
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "spese-ricevute",
      stile: "lavagna",
      testo: `Per ogni spesa che deduci ti serve il giustificativo, cioè la fattura o la ricevuta. Conservali ${ANNI} anni, come hai visto nella lezione sulla contabilità. Con lo strumento «I tuoi conti» di Bleo segni ogni ricevuta: «Sì, è della ditta» oppure «No, è privato».`,
      voce: "Per ogni spesa che deduci ti serve il giustificativo, cioè la fattura o la ricevuta. Conservali dieci anni, come hai visto nella lezione sulla contabilità. Con lo strumento «I tuoi conti» di Bleo segni ogni ricevuta: «Sì, è della ditta» oppure «No, è privato».",
      schermo: {
        tipo: "punto",
        titolo: "I giustificativi",
        testo: `Per ogni spesa, da conservare ${ANNI} anni. In «I tuoi conti»: della ditta o privato.`,
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-8.mp3",
      stile: "presentatore",
      testo:
        "Attenzione: non mettere spese private tra quelle della ditta. Se il fisco le trova, le aggiunge al tuo reddito: paghi l'imposta che mancava, e forse una multa. E lo dice anche all'AVS.",
      schermo: {
        tipo: "attenzione",
        titolo: "Niente spese private",
        testo: "Il fisco le aggiunge al reddito: recupera l'imposta e può dare una multa. E informa l'AVS.",
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Queste sono informazioni generali. Per il tuo caso, per esempio quanto ammortizzare o qual è la parte privata, chiedi a un fiduciario autorizzato. Per le domande generali, chiedi a Bleo in chat.",
      schermo: {
        tipo: "punto",
        titolo: "Con un fiduciario",
        testo: "Per il tuo caso, un fiduciario autorizzato: in Ticino c'è l'albo ufficiale.",
        fonte: fonti.albofiduciari,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ciao!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.istruzioniPf2025, verificatoIl: VERIFICATO_SPESE_DITTA },
    },
  ],
};
