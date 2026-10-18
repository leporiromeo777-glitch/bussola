import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Avviso, PaginaLegale } from "@/components/landing/pagina-legale";
import { DatiTitolare, EmailTitolare } from "@/components/landing/titolare";
import { SCAMBI_PRECEDENTI_MASSIMI } from "@/lib/chat/limiti";
import { DURATA_LINK_DOCUMENTO, LETTURE_AL_GIORNO } from "@/lib/conti/limiti";
import { calendarioAttivo } from "@/lib/percorso/abbonamento-server";
import { dataSvizzera, fonti, regolePercorso } from "@/data/svizzera";
import { ELENCO_DPF, GARANZIE_USA, informativaPrivacy, OPDA, trattamentiAttivi } from "@/lib/privacy";
import { listaAttesaAttiva } from "@/lib/lista-attesa/stato";
import { sito } from "@/lib/sito";

export const metadata: Metadata = {
  title: "Informativa sulla privacy",
  description: `Quali dati raccoglie ${sito.nome}, perché, per quanto tempo, con chi li condivide e come puoi esercitare i tuoi diritti.`,
  alternates: { canonical: "/privacy" },
};

const AGGIORNATO = { iso: "2026-10-18", testo: "18.10.2026" };

// Regione del database, hosting, garanzie per gli USA e durata dei log:
// src/lib/privacy.ts. Le parti tra parentesi quadre sono da completare.
const { luogoDati, hosting, durataDatiTecnici, incompleta } = informativaPrivacy;

const LPD = "https://www.fedlex.admin.ch/eli/cc/2022/491/it";
const LCSL = "https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/it";
const IFPDT = "https://www.edoeb.admin.ch/it";

/** Accanto a un trattamento descritto ma non ancora acceso. */
function NonAttivo({ attivo, testo = "non ancora attivo" }: { attivo: boolean; testo?: string }) {
  if (attivo) return null;
  return <span className="font-normal text-muted"> ({testo})</span>;
}

/** Garanzia per i dati comunicati negli Stati Uniti (LPD art. 19 cpv. 4). */
function GaranziaUsa({ testo }: { testo: string }) {
  return <> Garanzia per i dati comunicati fuori dalla Svizzera e dall&apos;UE: {testo}.</>;
}

export default async function PaginaPrivacy() {
  // Al momento della richiesta: quali servizi sono attivi dipende dalle
  // variabili d'ambiente del server, non da quelle della build.
  await connection();
  const attivi = trattamentiAttivi({
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  });
  const calendario = calendarioAttivo();

  return (
    <PaginaLegale
      titolo="Informativa sulla privacy"
      aggiornato={AGGIORNATO}
      prima={
        <Avviso>
          <p className="mt-0! font-semibold">Bozza: da far rivedere da un giurista prima del lancio.</p>
          <p className="mt-1!">
            Questo testo descrive come funziona oggi {sito.nome}.
            {incompleta ? " Le parti tra parentesi quadre vanno completate." : null}
          </p>
        </Avviso>
      }
    >
      <section aria-labelledby="in-breve" className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 id="in-breve" className="mt-0!">
          In breve
        </h2>
        <ul>
          <li>Raccogliamo solo i dati che servono a farti usare {sito.nome} e a scriverti, se ce lo chiedi.</li>
          <li>Non vendiamo i tuoi dati e non li usiamo per pubblicità.</li>
          <li>Il database è su server {luogoDati}.</li>
          {hosting.server ? (
            <li>
              Il sito e il suo server girano su Netlify {hosting.server}: i dati che mandi con i moduli (lista
              d&apos;attesa, accesso, questionario salvato nell&apos;account, domande della chat, ricevute di «I tuoi
              conti») passano da lì prima di arrivare al database.
            </li>
          ) : null}
          <li>
            Puoi chiedere in ogni momento di vedere, correggere o cancellare i tuoi dati scrivendo a <EmailTitolare />.
          </li>
        </ul>
      </section>

      <p>
        Questa informativa spiega quali dati personali tratta {sito.nome}, perché, per quanto tempo e con chi li
        condivide. Vale per il sito e per l&apos;app. Si basa sulla{" "}
        <a href={LPD} target="_blank" rel="noopener noreferrer">
          legge federale sulla protezione dei dati (LPD, RS 235.1)
        </a>
        .
      </p>

      <section aria-labelledby="titolare">
        <h2 id="titolare">1. Chi è responsabile dei tuoi dati</h2>
        <p>Il responsabile del trattamento è:</p>
        <DatiTitolare />
        <p>Per qualsiasi domanda sui tuoi dati scrivi a questo indirizzo email.</p>
      </section>

      <section aria-labelledby="dati">
        <h2 id="dati">2. Quali dati raccogliamo e perché</h2>

        <h3>
          Lista d&apos;attesa
          <NonAttivo attivo={listaAttesaAttiva()} testo="non ancora attiva: per ora non salviamo le iscrizioni" />
        </h3>
        <ul>
          <li>
            <strong>Dati:</strong> la tua email (obbligatoria); se vuoi, il nome, il Cantone e a che punto sei con la
            tua attività; da quale link sei arrivato (per esempio «instagram»), la data di iscrizione, il tuo consenso
            e la data in cui hai confermato l&apos;indirizzo.
          </li>
          <li>
            <strong>Perché:</strong> per scriverti quando apre la beta chiusa e mandarti al massimo due aggiornamenti
            al mese; per capire chi è interessato e dove (Cantone, situazione, provenienza) e costruire il prodotto
            giusto.
          </li>
        </ul>

        <h3>
          Account
          <NonAttivo attivo={attivi.account} />
        </h3>
        <ul>
          <li>
            <strong>Dati:</strong> la tua email, il piano scelto e le date di accesso.
          </li>
          <li>
            <strong>Perché:</strong> per farti entrare con un link via email (senza password) e salvare il tuo
            percorso.
          </li>
        </ul>

        <h3>Questionario e percorso</h3>
        <ul>
          <li>
            <strong>Dati:</strong> le risposte al questionario (per esempio tipo di attività, Cantone, fatturato
            previsto, numero di clienti, eventuali soci, cittadinanza o tipo di permesso) e i passi che segni come
            completati.
          </li>
          <li>
            <strong>Perché:</strong> per calcolare il tuo percorso personale e ricordarti a che punto sei.
          </li>
          <li>
            <strong>Dove:</strong> senza account restano solo nel tuo browser (memoria locale del dispositivo). Se
            accedi, li salviamo anche nel tuo account, così li ritrovi su altri dispositivi.
          </li>
        </ul>

        <h3 id="calendario">
          Calendario sempre aggiornato
          <NonAttivo attivo={calendario} />
        </h3>
        <ul>
          <li>
            <strong>Dati:</strong> se crei il link personale del calendario, salviamo nel tuo account un&apos;impronta
            del link (un codice calcolato dal link, da cui il link non si può ricostruire), quando l&apos;hai creato e
            quando un calendario l&apos;ha letto l&apos;ultima volta. Il link intero resta solo nel browser o nel
            telefono dove l&apos;hai creato.
          </li>
          <li>
            <strong>Perché:</strong> per dare al calendario che scegli (per esempio Google Calendar o Apple
            Calendario) le tue scadenze e le votazioni da seguire, calcolate a ogni lettura dalle risposte al
            questionario salvate nell&apos;account. Nel calendario non mettiamo il tuo nome né la tua email.
          </li>
          <li>
            <strong>Chi le riceve:</strong> il servizio di calendario che scegli legge il link dai suoi server e tiene
            gli eventi secondo le sue regole. Chi ha il link vede le tue scadenze: non condividerlo. Puoi rigenerarlo o
            disattivarlo quando vuoi dalla pagina del percorso.
          </li>
        </ul>

        <h3>Strumenti (tariffa, budget, business plan, preventivi e fatture)</h3>
        <ul>
          <li>
            <strong>Dati:</strong> quello che inserisci negli strumenti, compresi i dati dei tuoi clienti e il tuo IBAN
            se prepari una fattura.
          </li>
          <li>
            <strong>Dove:</strong> solo nel tuo browser. Non li riceviamo e non li salviamo sui nostri server; puoi
            cancellarli dallo strumento stesso.
          </li>
          <li>
            <strong>Eccezione:</strong> se hai un account e nello strumento fattura scegli «Registra in I tuoi conti»,
            salviamo nei tuoi conti numero, nome del cliente, date, importo e riferimento di pagamento di quella
            fattura (vedi «I tuoi conti» qui sotto). Il resto della fattura, compreso il tuo IBAN, resta nel browser.
          </li>
        </ul>

        <h3 id="conti">
          I tuoi conti
          <NonAttivo attivo={attivi.conti} />
        </h3>
        <ul>
          <li>
            <strong>Dati:</strong> le entrate e le uscite che registri (data, importo, descrizione, fornitore o
            cliente, categoria, se è della ditta o privata); le fatture emesse che registri (numero, nome del cliente,
            date, importo, riferimento di pagamento, data del pagamento e, se lo segni, giorno e livello
            dell&apos;ultimo sollecito mandato); le foto e i PDF di ricevute e fatture che
            carichi, con tutto quello che c&apos;è scritto.
          </li>
          <li>
            <strong>Clienti e ore:</strong> i clienti che aggiungi (nome, indirizzo, email se la scrivi, tariffa
            oraria) e le ore che segni per ognuno (giorno, durata, descrizione, tariffa, giorno in cui le hai
            fatturate). Sono dati dei tuoi clienti: inseriscili solo per lavorare con loro. Quando crei la fattura
            dalle ore, nome e indirizzo del cliente e le voci passano allo strumento fattura nell&apos;indirizzo della
            pagina, dopo il «#»: quella parte il browser non la manda ai nostri server, e la fattura resta nel
            browser come le altre.
          </li>
          <li>
            <strong>Email inoltrate</strong>
            <NonAttivo attivo={attivi.contiEmail} testo="non ancora attivo" />: se inoltri email al tuo indirizzo
            personale di Bleo, salviamo gli allegati (PDF e immagini) oppure, se non ce ne sono e l&apos;email sembra
            una ricevuta, il suo testo; in più mittente, oggetto e data di arrivo di ogni email, e il codice di
            conferma che Gmail manda quando attivi l&apos;inoltro. Le altre email (senza ricevute, pubblicità, spam)
            non le leggiamo e ne teniamo solo mittente, oggetto e data.
          </li>
          <li>
            <strong>Dove:</strong> nel database e nell&apos;archivio dei file (Storage) di Supabase, su server{" "}
            {luogoDati}, in una cartella privata che puoi vedere solo tu.
          </li>
          <li>
            <strong>Perché:</strong> per tenere in ordine le tue entrate, uscite e fatture, mostrarti il riepilogo
            dell&apos;anno e preparare le fatture delle ore. Bleo non fa la contabilità né le dichiarazioni d&apos;imposta per te: i conti li tieni tu.
          </li>
          <li>
            <strong>«Quanto mettere da parte»:</strong> la percentuale per le imposte, gli acconti AVS, il mese in cui
            hai iniziato e se l&apos;attività è principale o accessoria restano solo sul tuo dispositivo (nel browser o
            nella memoria dell&apos;app). Non li riceviamo: la stima si calcola lì, dai conti che vedi.
          </li>
          <li>
            <strong>Solleciti di pagamento:</strong> il testo del sollecito per una fattura scaduta lo prepara il tuo
            browser o l&apos;app, e lo mandi tu con la tua email o un&apos;altra app: noi non lo riceviamo e non lo
            mandiamo. L&apos;IBAN e il nome che scrivi nel sollecito non li salviamo; sul sito li prendiamo, se ci sono,
            dallo strumento fattura salvato nel tuo browser. Salviamo solo, quando lo segni, il giorno e il livello
            del sollecito.
          </li>
          <li>
            <strong>Promemoria nell&apos;app:</strong> se attivi i promemoria sul telefono, l&apos;app programma sul
            telefono stesso un avviso per il mattino dopo la scadenza di ogni fattura non pagata, con numero, nome
            del cliente e scadenza. È una notifica locale: non passa dai nostri server e la togli spegnendo i
            promemoria o uscendo dall&apos;account.
          </li>
          <li>
            <strong>Lettura automatica</strong>
            <NonAttivo attivo={attivi.contiLettura} testo="non ancora attiva" />: le foto, i PDF e le email inoltrate
            li legge l&apos;intelligenza artificiale di Anthropic (Claude, vedi sotto), solo per estrarre data,
            importo, fornitore e categoria. Quello che legge resta «da confermare» finché non lo confermi tu. Per
            limitare i costi e gli abusi leggiamo al massimo {LETTURE_AL_GIORNO} documenti al giorno per persona:
            per contarli salviamo solo l&apos;ora di ogni lettura, per 2 giorni.
          </li>
        </ul>

        <h3>
          Domande alla chat
          <NonAttivo attivo={attivi.chat} testo="non ancora attiva" />
        </h3>
        <ul>
          <li>
            <strong>Dati:</strong> il testo delle domande, le fonti citate nella risposta e se la risposta è stata
            trovata. Nel tuo account salviamo anche le tue chat: le domande, le risposte di Bleo con le loro fonti e
            il titolo di ogni chat.
          </li>
          <li>
            <strong>Perché:</strong> per risponderti, contare le domande del mese e capire quali fonti
            ufficiali mancano. Le chat le salviamo perché tu possa riaprirle e continuarle; le vedi solo tu, e puoi
            rinominarle o eliminarle una per una quando vuoi. Ti chiediamo di non scrivere nella chat dati personali che non servono (per esempio il
            numero AVS o dati sulla salute).
          </li>
          <li>
            Le risposte sono generate automaticamente da un modello di intelligenza artificiale a partire dalle fonti
            ufficiali. Non prendiamo decisioni automatizzate che ti riguardano.
          </li>
        </ul>

        <h3>
          «Racconta a Bleo» nel questionario
          <NonAttivo attivo={attivi.racconto} testo="non ancora attivo" />
        </h3>
        <ul>
          <li>
            <strong>Dati:</strong> la descrizione della tua idea che scrivi tu, per esempio che lavoro vuoi fare e dove.
          </li>
          <li>
            <strong>Perché:</strong> per dedurre le risposte del questionario e chiederti solo quelle che mancano. Non
            salviamo il testo: lo riceve solo il fornitore di intelligenza artificiale (vedi sotto), e ti mostriamo le
            risposte dedotte prima di usarle. Per limitare gli abusi contiamo le richieste per connessione, con
            un&apos;impronta dell&apos;indirizzo IP e mai l&apos;IP in chiaro.
          </li>
        </ul>

        <h3>
          Strumenti con l&apos;AI: nome della ditta, testi pronti, lettere
          <NonAttivo attivo={attivi.racconto} testo="non ancora attivi" />
        </h3>
        <ul>
          <li>
            <strong>Nome della ditta:</strong> se chiedi delle proposte, il tuo cognome, il nome (se lo scrivi), cosa
            fai, le parole che ti piacciono e lo stile scelto vengono inviati al fornitore di intelligenza artificiale
            (vedi sotto), solo per proporre i nomi.
          </li>
          <li>
            <strong>Testi pronti:</strong> quello che scrivi (cosa fai e, se li indichi, il nome della ditta, dove
            lavori e chi sono i tuoi clienti), con il tipo di testo, il tono e la lingua scelti, viene inviato al
            fornitore di intelligenza artificiale solo per scrivere i testi.
          </li>
          <li>
            <strong>Fotografa la lettera:</strong> la foto o il PDF della lettera che scegli tu (per esempio dalla
            cassa AVS, dalle contribuzioni o dal Comune), con tutto quello che c&apos;è scritto, anche il tuo nome e
            indirizzo, viene inviato al fornitore di intelligenza artificiale per spiegarti cos&apos;è, cosa ti
            chiedono, entro quando e cosa fare. Prima dell&apos;invio la foto viene rimpicciolita nel tuo browser. Ti
            consigliamo di coprire il numero AVS e le coordinate bancarie: per capire la lettera non servono.
          </li>
          <li>
            <strong>Cosa salviamo:</strong> niente. Né quello che scrivi o fotografi né le risposte: restano nella
            pagina finché non la chiudi. Per limitare gli abusi contiamo le richieste per connessione, con
            un&apos;impronta dell&apos;indirizzo IP e mai l&apos;IP in chiaro. Non scrivere dati personali che non
            servono, come telefono o numero AVS.
          </li>
        </ul>

        <h3>Controllo del nome nel registro di commercio</h3>
        <ul>
          <li>
            Nello strumento «Nome della ditta», i nomi proposti e il nome che scrivi in «Hai già un nome in mente?»
            vengono inviati dal nostro server a Zefix, l&apos;indice centrale delle ditte gestito dall&apos;Ufficio
            federale del registro di commercio, per cercare le ditte con nomi simili. Il nome della ditta di solito
            contiene il tuo cognome. Non salviamo questi dati; per il limite di richieste contiamo solo
            un&apos;impronta dell&apos;indirizzo IP.
          </li>
        </ul>

        <h3>Dettatura a voce</h3>
        <ul>
          <li>
            Se usi il pulsante «Dillo a voce», la voce viene trasformata in testo dal tuo browser, con il suo servizio
            di riconoscimento vocale (per esempio quello di Google in Chrome o di Apple in Safari), secondo le regole di
            quel fornitore. Bleo non riceve né salva l&apos;audio: riceve solo il testo, come se l&apos;avessi
            scritto.
          </li>
        </ul>

        <h3>Dati tecnici</h3>
        <ul>
          <li>
            <strong>Dati:</strong> indirizzo IP, data e ora, pagina richiesta, tipo di browser e messaggi di errore,
            registrati automaticamente dal fornitore di hosting e dal database.
          </li>
          <li>
            <strong>Protezione dei moduli</strong>
            <NonAttivo attivo={attivi.protezioneModuli} testo="non ancora attiva" />: per limitare gli abusi dei moduli di iscrizione e di accesso
            conserviamo per al massimo un giorno un&apos;impronta cifrata del tuo indirizzo IP, mai l&apos;indirizzo in
            chiaro.
          </li>
          <li>
            <strong>Perché:</strong> per far funzionare il sito, proteggerlo dagli abusi e correggere gli errori.
          </li>
        </ul>
      </section>

      <section aria-labelledby="basi">
        <h2 id="basi">3. Su che base trattiamo i dati</h2>
        <p>
          Trattiamo i dati solo per gli scopi descritti sopra e nel rispetto dei principi della LPD. Per le email della
          lista d&apos;attesa ti chiediamo un consenso esplicito: spunti una casella e, se l&apos;invio delle email è
          attivo, confermi l&apos;indirizzo con il pulsante della pagina che apri dal link dell&apos;email (doppia
          conferma). Ogni email indica chi la manda e come
          disiscriversi gratis, come chiede la{" "}
          <a href={LCSL} target="_blank" rel="noopener noreferrer">
            legge contro la concorrenza sleale (LCSl, art. 3 cpv. 1 lett. o)
          </a>
          .
        </p>
        <p>
          Puoi revocare il consenso in ogni momento con il link in fondo a ogni email o scrivendo a <EmailTitolare />.
          I dati dell&apos;account e del percorso servono a fornirti il servizio che hai chiesto; i dati tecnici servono
          alla sicurezza del sito.
        </p>
      </section>

      <section aria-labelledby="conservazione">
        <h2 id="conservazione">4. Per quanto tempo li conserviamo</h2>
        <ul>
          <li>
            <strong>Lista d&apos;attesa:</strong> finché non ti disiscrivi, al più tardi 12 mesi dopo il lancio del
            servizio. Se non confermi l&apos;iscrizione, la cancelliamo automaticamente 30 giorni dopo l&apos;ultima
            email di conferma.
          </li>
          <li>
            <strong>Account, questionario e percorso:</strong> finché hai un account. Se chiedi di cancellarlo,
            cancelliamo anche questi dati.
          </li>
          <li>
            <strong>Link del calendario</strong> (impronta e date): finché non lo disattivi o lo rigeneri, o finché
            non elimini l&apos;account.
          </li>
          <li>
            <strong>Domande alla chat:</strong> 12 mesi: le domande più vecchie vengono cancellate automaticamente
            ogni notte.
          </li>
          <li>
            <strong>Chat salvate</strong> (domande e risposte con le fonti): finché non le elimini tu, al più tardi 12
            mesi dopo l&apos;ultima domanda nella chat: ogni notte cancelliamo automaticamente le chat senza attività
            da 12 mesi. Se elimini l&apos;account cancelliamo anche tutte le chat.
          </li>
          <li>
            <strong>I tuoi conti</strong> (voci, fatture, ricevute, allegati, dati delle email inoltrate, clienti e
            ore): finché non
            li cancelli tu o non elimini l&apos;account. Se elimini l&apos;account cancelliamo tutto, file compresi. La
            legge chiede di conservare i documenti della contabilità per {regolePercorso.conservazioneDocumentiAnni.valore}{" "}
            anni (
            <a href={fonti.co958f.url} target="_blank" rel="noopener noreferrer">
              art. 958f CO
            </a>
            ): questo obbligo è tuo, non lo assolviamo noi. Scarica i conti e conserva le ricevute anche altrove. I
            contatori delle letture automatiche li cancelliamo dopo 2 giorni.
          </li>
          <li>
            <strong>Dati tecnici:</strong> {durataDatiTecnici}.
          </li>
        </ul>
        <p>
          Se la legge ci obbliga a conservare un dato più a lungo (per esempio per la contabilità), lo conserviamo solo
          per quello scopo.
        </p>
      </section>

      <section aria-labelledby="fornitori">
        <h2 id="fornitori">5. Con chi condividiamo i dati</h2>
        <p>
          Per far funzionare {sito.nome} usiamo alcuni fornitori che trattano dati per nostro conto, solo secondo le
          nostre istruzioni:
        </p>
        <ul>
          <li>
            <strong>Supabase Pte. Ltd. (Singapore)</strong>: database, archivio dei file (le ricevute di «I tuoi
            conti») e accesso all&apos;account (compresa l&apos;email con il link di accesso). I dati sono salvati su server {luogoDati}; per assistenza e
            manutenzione possono essere consultati da Supabase a Singapore e da suoi fornitori negli Stati Uniti,
            tra cui Supabase, Inc.
            <GaranziaUsa testo={GARANZIE_USA.supabase} />
          </li>
          <li>
            <strong>Hosting del sito</strong>: {hosting.nome}.
            {hosting.server ? (
              <>
                {" "}
                Su Netlify gira anche il server del sito, {hosting.server}: riceve i dati che mandi con i moduli
                (lista d&apos;attesa, accesso, questionario salvato nell&apos;account, domande della chat, strumenti con l&apos;AI, «I tuoi conti»)
                e li passa al database.
              </>
            ) : null}
            {hosting.garanzia ? <GaranziaUsa testo={hosting.garanzia} /> : null}
          </li>
          <li>
            <strong>Anthropic Ireland, Limited (Irlanda), con Anthropic, PBC (USA)</strong>
            <NonAttivo
              attivo={attivi.chat || attivi.racconto || attivi.contiLettura}
              testo="non ancora attivo: la chat è spenta"
            />
            : genera le risposte della chat, deduce le risposte del questionario da «Racconta a Bleo», propone i nomi
            della ditta, scrive i testi pronti, spiega le lettere di «Fotografa la lettera» e legge le ricevute di «I
            tuoi conti». Per la chat riceve la
            tua domanda, al massimo le {SCAMBI_PRECEDENTI_MASSIMI} domande e risposte precedenti
            della stessa conversazione e i testi delle fonti pubbliche trovate per rispondere; non riceve la tua
            email né altri dati dell&apos;account. Per gli altri strumenti riceve solo quello che scrivi lì, e per
            «Fotografa la lettera» solo la foto o il PDF che scegli. Per «I tuoi conti» riceve la foto o il PDF della
            ricevuta oppure l&apos;allegato o il testo dell&apos;email inoltrata, con mittente e oggetto
            dell&apos;email, solo per estrarne i dati. Questi dati sono conservati negli Stati Uniti e
            cancellati da Anthropic entro 30 giorni.
            <GaranziaUsa testo={GARANZIE_USA.anthropic} />
          </li>
          <li>
            <strong>Resend (Plus Five Five, Inc., USA)</strong>
            <NonAttivo
              attivo={attivi.email || attivi.contiEmail}
              testo="non ancora attivo: per ora non inviamo né riceviamo email"
            />
            : invia le email della lista d&apos;attesa (conferma e aggiornamenti). Riceve il tuo indirizzo email e il
            testo dell&apos;email, e conserva i dati degli invii negli Stati Uniti per 30 giorni.
            {attivi.contiEmail ? (
              <>
                {" "}
                Per «I tuoi conti» riceve per noi le email che inoltri al tuo indirizzo personale, con testo e
                allegati, e le tiene per il tempo previsto dal suo servizio di ricezione [da verificare prima del
                lancio].
              </>
            ) : null}
            <GaranziaUsa testo={GARANZIE_USA.resend} />
          </li>
          {attivi.verificaAntiRobot ? (
            <li>
              <strong>Cloudflare, Inc. (USA)</strong>: verifica anti-robot (Turnstile) nella pagina di accesso.
              Riceve dati tecnici del browser e l&apos;indirizzo IP. Garanzia per il trasferimento:{" "}
              [da confermare prima del lancio].
            </li>
          ) : null}
          {attivi.statistiche ? (
            <li>
              <strong>Plausible Insights OÜ (Estonia, UE)</strong>: statistiche di visita senza cookie e senza
              profili personali.
            </li>
          ) : null}
        </ul>
        <p>
          Per la Svizzera la protezione dei dati è adeguata negli Stati dell&apos;Unione europea e, negli Stati Uniti,
          solo presso le imprese certificate secondo lo Swiss-U.S. Data Privacy Framework (
          <a href={OPDA} target="_blank" rel="noopener noreferrer">
            ordinanza sulla protezione dei dati, allegato 1
          </a>
          ; vedi l&apos;
          <a href={ELENCO_DPF.url} target="_blank" rel="noopener noreferrer">
            elenco delle imprese certificate
          </a>
          , controllato il {dataSvizzera(ELENCO_DPF.verificatoIl)}). Per ogni fornitore negli Stati Uniti trovi qui
          sopra la garanzia usata.
        </p>
        <p>Non vendiamo i tuoi dati e non li diamo a terzi per pubblicità.</p>
      </section>

      <section aria-labelledby="diritti">
        <h2 id="diritti">6. I tuoi diritti</h2>
        <p>In ogni momento puoi chiederci di:</p>
        <ul>
          <li>sapere quali dati abbiamo su di te (diritto d&apos;accesso);</li>
          <li>correggere dati sbagliati (rettifica);</li>
          <li>cancellare i tuoi dati;</li>
          <li>non usarli più per un certo scopo (opposizione), per esempio per le email;</li>
          <li>ricevere i dati che ci hai dato in un formato elettronico di uso comune.</li>
        </ul>
        <p>
          Scrivi a <EmailTitolare /> dall&apos;indirizzo che hai usato con noi: ti rispondiamo gratis e nei termini
          previsti dalla legge. Se non possiamo riconoscerti dall&apos;indirizzo, ti chiediamo come verificare chi sei.
          Per la lista d&apos;attesa puoi anche usare il link «Toglimi dalla lista» in fondo a ogni email.
        </p>
        <p>
          Se pensi che trattiamo i tuoi dati in modo scorretto puoi rivolgerti all&apos;
          <a href={IFPDT} target="_blank" rel="noopener noreferrer">
            Incaricato federale della protezione dei dati e della trasparenza (IFPDT)
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="cookie">
        <h2 id="cookie">7. Cookie e statistiche</h2>
        <p>
          Usiamo solo cookie tecnici: quando accedi al tuo account salviamo nel browser i cookie di sessione che ti
          tengono collegato. Non usiamo cookie di profilazione né di pubblicità.
        </p>
        <p>
          {attivi.statistiche
            ? "Per contare le visite usiamo Plausible, che non usa cookie e non crea profili delle persone."
            : "Per ora non usiamo strumenti di statistica. Se li attiveremo, saranno senza cookie e lo scriveremo qui."}
        </p>
      </section>

      <section aria-labelledby="sicurezza">
        <h2 id="sicurezza">8. Sicurezza</h2>
        <p>
          Il sito usa solo connessioni cifrate (HTTPS). Nel database ogni persona può leggere solo i propri dati; la
          lista d&apos;attesa è accessibile solo dal server. Le ricevute di «I tuoi conti» stanno in un archivio
          privato: si aprono solo con un link temporaneo che vale {DURATA_LINK_DOCUMENTO / 60} minuti. L&apos;indirizzo personale per inoltrare
          le email contiene un codice casuale che nessuno può indovinare; se finisce in giro puoi cambiarlo. Anche il
          link del calendario sempre aggiornato contiene un codice casuale: nel database ne teniamo solo
          un&apos;impronta e, se finisce in giro, puoi rigenerarlo. Solo il titolare ha accesso amministrativo.
        </p>
      </section>

      <section aria-labelledby="modifiche">
        <h2 id="modifiche">9. Modifiche</h2>
        <p>
          Possiamo aggiornare questa informativa, per esempio quando aggiungiamo una funzione o un fornitore (come i
          pagamenti). La versione valida è sempre su questa pagina, con la data dell&apos;ultimo aggiornamento. Se le
          modifiche sono importanti te lo scriviamo.
        </p>
        <p>
          Vedi anche l&apos;<Link href="/impressum">impressum</Link>.
        </p>
      </section>
    </PaginaLegale>
  );
}
