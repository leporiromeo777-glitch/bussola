import type { Metadata } from "next";
import Link from "next/link";
import { Avviso, PaginaLegale } from "@/components/landing/pagina-legale";
import { DatiTitolare, EmailTitolare } from "@/components/landing/titolare";
import { SCAMBI_PRECEDENTI_MASSIMI } from "@/lib/chat/limiti";
import { dataSvizzera } from "@/data/svizzera";
import { ELENCO_DPF, GARANZIE_USA, informativaPrivacy, OPDA } from "@/lib/privacy";
import { sito } from "@/lib/sito";

export const metadata: Metadata = {
  title: "Informativa sulla privacy",
  description: `Quali dati raccoglie ${sito.nome}, perché, per quanto tempo, con chi li condivide e come puoi esercitare i tuoi diritti.`,
  alternates: { canonical: "/privacy" },
};

const AGGIORNATO = { iso: "2026-10-15", testo: "15.10.2026" };

const statisticheAttive = Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);
const verificaAntiRobotAttiva = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

// Regione del database, hosting, garanzie per gli USA e durata dei log:
// src/lib/privacy.ts. Le parti tra parentesi quadre sono da completare.
const { luogoDati, hosting, durataDatiTecnici } = informativaPrivacy;

const LPD = "https://www.fedlex.admin.ch/eli/cc/2022/491/it";
const LCSL = "https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/it";
const IFPDT = "https://www.edoeb.admin.ch/it";

/** Garanzia per i dati comunicati negli Stati Uniti (LPD art. 19 cpv. 4). */
function GaranziaUsa({ testo }: { testo: string }) {
  return <> Garanzia per i dati comunicati fuori dalla Svizzera e dall&apos;UE: {testo}.</>;
}

export default function PaginaPrivacy() {
  return (
    <PaginaLegale
      titolo="Informativa sulla privacy"
      aggiornato={AGGIORNATO}
      prima={
        <Avviso>
          <p className="mt-0! font-semibold">Bozza: da far rivedere da un giurista prima del lancio.</p>
          <p className="mt-1!">
            Questo testo descrive come funziona oggi {sito.nome}. Le parti tra parentesi quadre vanno completate.
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

        <h3>Lista d&apos;attesa</h3>
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

        <h3>Account</h3>
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
        </ul>

        <h3>Domande alla chat</h3>
        <ul>
          <li>
            <strong>Dati:</strong> il testo delle domande, le fonti citate nella risposta e se la risposta è stata
            trovata.
          </li>
          <li>
            <strong>Perché:</strong> per risponderti, contare le domande del piano gratuito e capire quali fonti
            ufficiali mancano. Ti chiediamo di non scrivere nella chat dati personali che non servono (per esempio il
            numero AVS o dati sulla salute).
          </li>
          <li>
            Le risposte sono generate automaticamente da un modello di intelligenza artificiale a partire dalle fonti
            ufficiali. Non prendiamo decisioni automatizzate che ti riguardano.
          </li>
        </ul>

        <h3>Dati tecnici</h3>
        <ul>
          <li>
            <strong>Dati:</strong> indirizzo IP, data e ora, pagina richiesta, tipo di browser e messaggi di errore,
            registrati automaticamente dal fornitore di hosting e dal database.
          </li>
          <li>
            <strong>Protezione dei moduli:</strong> per limitare gli abusi dei moduli di iscrizione e di accesso
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
            <strong>Domande alla chat:</strong> 12 mesi: le domande più vecchie vengono cancellate automaticamente
            ogni notte.
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
            <strong>Supabase Pte. Ltd. (Singapore)</strong>: database e accesso all&apos;account (compresa
            l&apos;email con il link di accesso). I dati sono salvati su server {luogoDati}; per assistenza e
            manutenzione possono essere consultati da Supabase a Singapore e da suoi fornitori negli Stati Uniti,
            tra cui Supabase, Inc.
            <GaranziaUsa testo={GARANZIE_USA.supabase} />
          </li>
          <li>
            <strong>Hosting del sito</strong>: {hosting.nome}.
            {hosting.garanzia ? <GaranziaUsa testo={hosting.garanzia} /> : null}
          </li>
          <li>
            <strong>Anthropic Ireland, Limited (Irlanda), con Anthropic, PBC (USA)</strong>: genera le risposte
            della chat. Riceve la tua domanda, al massimo le {SCAMBI_PRECEDENTI_MASSIMI} domande e risposte precedenti
            della stessa conversazione e i testi delle fonti pubbliche trovate per rispondere; non riceve la tua
            email né altri dati dell&apos;account. Questi dati sono conservati negli Stati Uniti e cancellati da
            Anthropic entro 30 giorni.
            <GaranziaUsa testo={GARANZIE_USA.anthropic} />
          </li>
          <li>
            <strong>Resend (Plus Five Five, Inc., USA)</strong>: invia le email della lista d&apos;attesa (conferma e
            aggiornamenti). Riceve il tuo indirizzo email e il testo dell&apos;email, e conserva i dati degli invii
            negli Stati Uniti per 30 giorni.
            <GaranziaUsa testo={GARANZIE_USA.resend} />
          </li>
          {verificaAntiRobotAttiva ? (
            <li>
              <strong>Cloudflare, Inc. (USA)</strong>: verifica anti-robot (Turnstile) nella pagina di accesso.
              Riceve dati tecnici del browser e l&apos;indirizzo IP. Garanzia per il trasferimento:{" "}
              [da confermare prima del lancio].
            </li>
          ) : null}
          {statisticheAttive ? (
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
          {statisticheAttive
            ? "Per contare le visite usiamo Plausible, che non usa cookie e non crea profili delle persone."
            : "Per ora non usiamo strumenti di statistica. Se li attiveremo, saranno senza cookie e lo scriveremo qui."}
        </p>
      </section>

      <section aria-labelledby="sicurezza">
        <h2 id="sicurezza">8. Sicurezza</h2>
        <p>
          Il sito usa solo connessioni cifrate (HTTPS). Nel database ogni persona può leggere solo i propri dati; la
          lista d&apos;attesa è accessibile solo dal server. Solo il titolare ha accesso amministrativo.
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
