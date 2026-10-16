# Base di fonti della chat

La chat "Chiedi a Bussola" risponde **solo** con i testi delle pagine ufficiali
raccolte qui, e mostra sempre il link. Se una cosa non è nelle fonti, la chat
dice che non ha una fonte verificata e rimanda a un professionista. Quindi la
qualità della chat dipende da questa base: poche pagine giuste, controllate
ogni mese.

Come funziona, in breve:

1. `supabase/fonti/elenco.json` è l'elenco delle pagine (una voce per pagina).
2. `npm run fonti:importa` scarica ogni pagina, ne estrae il testo utile, lo
   divide in frammenti di circa 1'000-1'500 caratteri e li salva nelle tabelle
   `fonti` e `frammenti_fonti` di Supabase.
3. A ogni domanda, la chat cerca i frammenti più pertinenti con la funzione
   `public.cerca_frammenti` e li passa a Claude, che risponde citandoli.
4. Ogni domanda finisce in `domande_chat`, con le fonti citate e il segno
   `senza_risposta` quando una fonte mancava.

> Il 16.10.2026 tutte le 13 fonti sono state aperte, lette e confrontate con
> `docs/ricerca/` (vedi "Verifica del 16.10.2026" in fondo): 10 sono attive,
> 3 escluse perché il loro messaggio principale è sbagliato o superato.
> Una fonte nuova si aggiunge con `"verificato_da": "import automatico - da
> ricontrollare a mano"`: finché resta così, `npm run fonti:importa` la salva
> con `attiva = false` e senza scaricarla, e la chat non la usa.
>
> Revisione del 15.10.2026: `pmi-ditta-individuale-lanciarsi` è disattivata
> (`"attiva": false`) perché dice che si chiede prima lo statuto alla Suva e
> solo dopo all'AVS, mentre la domanda va alla cassa AVS, che la inoltra alla
> Suva. Al suo posto ci sono `suva-accertamento-indipendente` e
> `avs-presentare-domanda-indipendente`, con la procedura giusta. Quando due
> pagine si contraddicono, la chat dà la precedenza all'ufficio che decide.

## Aggiungere una fonte

Va bene una pagina che:

- è **ufficiale**: Confederazione (admin.ch, ch.ch, EasyGov), AVS/AI
  (ahv-iv.ch), Cantoni (ti.ch, gr.ch), Comuni, oppure enti pubblici;
- è **in italiano** e ha un indirizzo stabile;
- risponde a domande vere di chi apre una ditta individuale (guarda le domande
  senza risposta, più sotto);
- ha il testo nella pagina: le pagine che si caricano solo con JavaScript (per
  esempio parti di ch.ch o del portale EasyGov) non si possono importare; in
  quel caso cerca la stessa informazione in un PDF o in un'altra pagina.

Aggiungi una voce in `supabase/fonti/elenco.json`:

```json
{
  "id": "ti-rc-iscrizione-ditta-individuale",
  "url": "https://www4.ti.ch/di/dg/rf/sportello/formulari-rc/di-iscrizione",
  "titolo": "Iscrizione di nuova ditta individuale",
  "ente": "Ufficio del registro di commercio del Cantone Ticino",
  "livello": "cantonale",
  "cantone": "TI",
  "argomenti": ["registro di commercio", "ditta individuale"],
  "verificato_il": "2026-10-15",
  "verificato_da": "Nome Cognome"
}
```

| Campo | Cosa mettere |
|---|---|
| `id` | Nome breve e stabile: minuscole, cifre e trattini. Non cambiarlo più: le domande registrate lo usano. |
| `url` | Indirizzo completo `https://`. Se la pagina reindirizza altrove, l'import lo segnala: usa l'indirizzo finale. |
| `titolo` | Il titolo della pagina, come lo vedrà l'utente sotto la risposta. |
| `ente` | Chi pubblica la pagina (es. "Amministrazione federale delle contribuzioni (AFC)"). |
| `livello` | `federale`, `cantonale`, `comunale` o `altro`. |
| `cantone` | `TI`, `GR` oppure `null` per le fonti federali. |
| `argomenti` | Parole chiave libere, utili per orientarsi. |
| `verificato_il` | Data (AAAA-MM-GG) in cui **tu** hai aperto e letto la pagina. La chat la mostra accanto a ogni fonte. |
| `verificato_da` | Nome di chi l'ha controllata. Con il segnaposto "import automatico - da ricontrollare a mano" la fonte resta fuori dalla chat. |
| `attiva` | Facoltativo. `false` toglie la fonte dalla chat senza cancellarla. |

Poi prova l'estrazione senza toccare il database:

```bash
npm run fonti:importa -- --prova --solo ti-rc-iscrizione-ditta-individuale
```

Guarda i frammenti stampati: devono contenere il testo della pagina, non menu
o banner. La prova funziona anche con il segnaposto in `verificato_da`, così
puoi controllare i frammenti prima di firmare la fonte con il tuo nome. Se va
bene, importa davvero (sezione seguente).

## Eseguire l'import

Servono in `.env.local` (mai nel codice, mai con il prefisso `NEXT_PUBLIC_`
per la chiave segreta):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Comandi:

```bash
npm run fonti:importa                         # tutte le fonti dell'elenco
npm run fonti:importa -- --solo <id>          # una fonte sola
npm run fonti:importa -- --prova              # solo scarica e divide, senza database
```

Per ogni fonte lo script (le fonti con `"attiva": false` o con il segnaposto in
`verificato_da` le salva solo con `attiva = false`, senza scaricarle):

1. scarica la pagina (con un User-Agent riconoscibile, seguendo i
   reindirizzamenti, al massimo 30 secondi);
2. estrae il testo: per l'HTML tiene `main`/`article`/`#content` e scarta menu,
   intestazioni, piè di pagina, script, moduli e banner dei cookie; i PDF (come
   gli opuscoli AVS) li legge con `unpdf`;
3. divide il testo in frammenti sui confini di titoli e paragrafi, ricordando
   il titolo della sezione;
4. aggiorna la riga in `fonti` e **sostituisce** tutti i suoi frammenti.

Alla fine stampa un riepilogo (frammenti per fonte, errori) ed esce con codice
diverso da zero se anche una sola fonte non è riuscita. Gli errori più comuni:

- **HTTP 404 / 410**: la pagina è stata spostata. Cerca il nuovo indirizzo sul
  sito dell'ente e aggiorna `url`, oppure metti `"attiva": false`.
- **testo estratto troppo corto**: la pagina si carica con JavaScript o è
  cambiata molto. Cerca un'altra pagina o un PDF con la stessa informazione.
- **nessuna risposta entro 30 secondi**: il sito è lento, riprova più tardi.
- **inserimento dei frammenti non riuscito**: i vecchi frammenti sono già
  stati tolti, quindi la fonte per ora non compare nella chat. Rilancia
  l'import di quella fonte con `--solo`.

Lo script avvisa anche se nel database ci sono fonti attive che non sono più
nell'elenco: `elenco.json` è la fonte di verità, tienilo in Git.

### Importare senza chiave segreta (SQL editor)

Se non vuoi mettere `SUPABASE_SECRET_KEY` sul tuo computer, l'import può
scrivere le istruzioni SQL in un file, da incollare nel SQL editor di
Supabase:

```bash
npm run fonti:importa -- --sql fonti.sql
```

Il file aggiorna le fonti e sostituisce i loro frammenti in una sola
transazione (`begin; … commit;`).

## Controllo mensile (il primo lunedì del mese)

Le regole cambiano (aliquote AVS, soglie, emolumenti). Ogni fonte ha
`verificato_il` e la chat lo mostra: una data vecchia toglie fiducia.

1. Elenca le fonti da ricontrollare (SQL editor di Supabase):

   ```sql
   select id, titolo, url, verificato_il, verificato_da
   from public.fonti
   where attiva and verificato_il < current_date - 30
   order by verificato_il;
   ```

2. Per ogni fonte apri l'URL e confrontala con quello che sai e con le
   risposte recenti della chat: cifre, soglie, scadenze, nomi degli uffici,
   moduli. Attenzione alle pagine che indicano "Stato al 1° gennaio ...".
3. Poi, in `supabase/fonti/elenco.json`:
   - **niente è cambiato** → aggiorna `verificato_il` (data di oggi) e
     `verificato_da`;
   - **il testo è cambiato** → aggiorna le date come sopra; l'import scaricherà
     il testo nuovo. Controlla con `--prova --solo <id>` che i frammenti siano
     giusti;
   - **la pagina non esiste più o non è più affidabile** → nuovo `url` oppure
     `"attiva": false`.
4. Lancia `npm run fonti:importa` e verifica il riepilogo (nessun errore).
5. Fai una prova nella chat con 2-3 domande sui temi cambiati.
6. Fai il commit di `elenco.json` con un messaggio tipo
   "Controllo fonti di novembre 2026".

**Cambio d'anno degli importi AVS.** Gli importi AVS (contributo minimo,
tavola scalare) cambiano spesso il 1° gennaio. Per il 2027:

- `ufas-importi-2027` è la scheda UFAS con i valori validi dal 01.01.2027
  (contributo minimo CHF 541, tavola scalare da CHF 10'300 a 61'500);
- `ahv-2-02-indipendenti` e `ufas-attivita-indipendente` riportano ancora i
  valori 2026. Quando esce l'opuscolo 2.02 edizione 2027 (di solito a
  novembre), ricontrollalo e rilancia
  `npm run fonti:importa -- --solo ahv-2-02-indipendenti`: l'indirizzo
  `ahv-iv.ch/p/2.02.i` resta lo stesso. Fai lo stesso con la pagina UFAS
  quando viene aggiornata;
- quando il Consiglio federale pubblica gli importi di un nuovo anno (di
  solito in autunno), aggiungi la nuova scheda UFAS e, dal 1° gennaio,
  metti `"attiva": false` a quella vecchia.

Per disattivare subito una fonte sbagliata, senza aspettare l'import:

```sql
update public.fonti set attiva = false where id = '<id>';
```

e poi metti `"attiva": false` anche in `elenco.json`, altrimenti il prossimo
import la riattiva.

## Trovare le fonti mancanti con `domande_chat`

Ogni domanda alla chat salva il testo della domanda, le fonti citate
(`fonti_citate`) e `senza_risposta = true` quando la chat non aveva una fonte
(nessun frammento trovato, risposta senza citazioni, oppure rifiuto). È il
modo più rapido per capire cosa aggiungere ("ogni domanda arricchisce la base
di fonti").

Domande senza risposta degli ultimi 30 giorni:

```sql
select creato_il::date as giorno, domanda
from public.domande_chat
where senza_risposta and creato_il > now() - interval '30 days'
order by creato_il desc;
```

Quante domande hanno trovato una fonte, mese per mese:

```sql
select date_trunc('month', creato_il at time zone 'Europe/Zurich')::date as mese,
       count(*) as domande,
       count(*) filter (where senza_risposta) as senza_risposta
from public.domande_chat
group by 1
order by 1 desc;
```

Fonti più citate (e, per differenza, quelle mai citate):

```sql
select f.id, f.titolo, count(c.fonte_id) as citazioni
from public.fonti f
left join (
  select unnest(fonti_citate) as fonte_id from public.domande_chat
) c on c.fonte_id = f.id
where f.attiva
group by f.id, f.titolo
order by citazioni desc;
```

Come usarle: raggruppa a mano le domande senza risposta per tema (AVS, IVA,
assicurazioni, permessi, Comune...), cerca per ogni tema una pagina ufficiale
in italiano e aggiungila con la procedura sopra. Una fonte mai citata per
mesi forse non serve: valuta se toglierla.

**Privacy:** le domande sono scritte dagli utenti e possono contenere dati
personali. Leggile solo per migliorare le fonti, non copiarle altrove e non
collegarle alle persone.

Le domande più vecchie di 12 mesi si cancellano da sole, come promette
l'informativa: ogni notte alle 03:17 (UTC) il job `pulizia-dati` di pg_cron
lancia `public.pulisci_dati()` (migrazione
`supabase/migrations/20261016000004_pulizia_dati.sql`). La stessa funzione
cancella le iscrizioni alla lista d'attesa non confermate 30 giorni dopo
l'ultima email di conferma e i contatori del limite per connessione. La quota
del piano gratuito guarda solo il mese corrente, quindi non ne risente.
Le query sopra vedono quindi al massimo gli ultimi 12 mesi.

Per controllare che il job giri:

```sql
select jobname, schedule, command from cron.job where jobname = 'pulizia-dati';
select status, return_message, start_time
from cron.job_run_details
order by start_time desc
limit 5;
```

Per lanciarla a mano (per esempio dopo un ripristino): `select public.pulisci_dati();`.

## Verifica del 16.10.2026

Ogni pagina è stata aperta e letta, e il contenuto confrontato con
`docs/ricerca/` e `src/data/svizzera.ts`. Le avvertenze qui sotto dicono cosa
la chat non deve prendere alla lettera da ciascuna fonte.

| Fonte | Stato | Aggiornata | Avvertenze |
|---|---|---|---|
| [ahv-2-02-indipendenti](https://www.ahv-iv.ch/p/2.02.i) | attiva | Stato al 1° gennaio 2026 (edizione novembre 2025, codice 2.02-26/01-I) | Valori validi solo fino al 31.12.2026: «Se il reddito annuo è inferiore a 10 100 franchi va versato un contributo minimo di 530 franchi» e «Per i redditi annui inferiori a 60 500 franchi…». Dal 1.1.2027 il minimo è CHF 5; Punto 7: la tabella dei tassi d'interesse sul capitale proprio si ferma al 2024, ma il testo fa l'esempio dell'«anno contributivo 2025». Mancano i tassi 2025 e 2026. È una lacuna minore e Bussola non usa questo dato.; Punto 1: tra gli indizi di indipendenza cita «l'iscrizione nel registro di commercio» e chi «conteggiano l'imposta sul valore aggiunto». Sono esempi, non requisiti. La chat non deve dedurne che RC o IVA siano obbligatori |
| [ufas-attivita-indipendente](https://www.bsv.admin.ch/it/attivita-indipendente) | attiva | Pubblicato il 26 agosto 2025 | «L'importo minimo dei contributi è di 530 franchi all'anno» e «tra il 5,371 e il 10 per cento»: oggi è corretto (valori 2025-2026), ma dal 1.1.2027 il minimo è CHF 541 (ufas-importi-2027). La pagina va ricontrollata a ge; «Il reddito determinante è il reddito netto annuo stabilito e comunicato alla cassa di compensazione dalle autorità fiscali» è una semplificazione. La cassa riaggiunge i contributi AVS/AI/IPG dedotti e toglie un interess; Sezione «Obbligo di annunciarsi»: il link «www.indipendente-svizzera.ch» ha un href relativo e porta a https://www.bsv.admin.ch/it/www.indipendente-svizzera.ch, che risponde 404. Il link della sezione precedente funziona |
| [ufas-importi-2027](https://cms.news.admin.ch/fileservice/sdweb-docs-prod-nsbcch-files/files/2026/10/02/5ab00ecd-a640-4c4a-829c-ee47bb35fec1.pdf) | attiva | Data: 2.10.2026; Stato: Decisione del Consiglio federale (importi validi dal 1°  | nessuna |
| [pmi-forma-giuridica-ditta-individuale](https://www.kmu.admin.ch/it/forma-giuridica-ditta-individuale) | **esclusa** | non indicata sulla pagina (metadati CMS: pubblicazione 30.10.2023, ultima modifi | §9: «se il fatturato annuale supera i CHF 100'000.-». L'art. 931 cpv. 1 CO dice «di almeno 100 000 franchi» nell'ultimo esercizio, quindi con CHF 100'000 esatti l'obbligo c'è già. Al §4 la stessa pagina scrive invece «pa; §9: «(art. 931 ORC)». La norma giusta è l'art. 931 CO (il link porta infatti al CO). La soglia nell'ORC (art. 36) è abrogata dal 1.1.2021.; §5: «vista l'obbligatorietà dell'iscrizione nel registro del commercio, non è possibile mantenere l'anonimato», e §4: «È richiesta soltanto la registrazione nel registro del commercio». Per gran parte del pubblico di Bus |
| [pmi-ditta-individuale-lanciarsi](https://www.kmu.admin.ch/it/ditta-individuale-per-lanciarsi-da-soli) | **esclusa** | non indicata sulla pagina (metadati CMS: pubblicazione 25.01.2024, ultima modifi | «Nel settore della costruzione (imbianchini, muratori) o del trasporto (conducenti di taxi ad esempio) è la SUVA che rilascia lo statuto di lavoratore autonomo. Solo una volta ottenuto il permesso dalla SUVA, i fondatori; «gli imprenditori possono fare domanda presso l'AVS nel luogo o nel campo di esercizio». Non è facoltativo: chi avvia un'attività indipendente deve annunciarsi e affiliarsi alla cassa competente (LAVS art. 64; UFAS, «Obb; «In linea di principio, viene richiesta solo l'iscrizione nel registro di commercio». Manca la soglia: l'iscrizione è obbligatoria solo con una cifra d'affari di almeno CHF 100'000 nell'ultimo esercizio, altrimenti è fac |
| [pmi-check-list-costituzione](https://www.kmu.admin.ch/it/check-list-creare-una-ditta-individuale-una-sagl-o-una-sa) | attiva | nessuna data visibile nel testo; nei metadati del CMS pubblicata il 30.05.2024,  | «l'ufficio AVS/AI/APG»: APG è la sigla francese. In italiano l'assicurazione si chiama IPG (AVS/AI/IPG), come in docs/ricerca/avs-assicurazioni.md. È solo una questione di termini.; «Nel caso in cui venga impiegato del personale: ... stipulare l'assicurazione obbligatoria per la LPP e la LAINF»: è impreciso. La LPP è obbligatoria solo per i dipendenti con un salario annuo sopra la soglia d'entrata (; Sagl e SA: la check list non dice nulla del registro per la trasparenza, obbligatorio dal 1.10.2026. Una nuova società deve annunciare gli aventi economicamente diritto entro un mese dall'iscrizione nel RC (art. 9 cpv. 4 |
| [easygov-ditta-individuale](https://ditta-individuale.easygov.swiss/) | **esclusa** | metadato article:modified_time 15.11.2021 (nel footer «2026 Tutti i diritti rise | «in modo semplice, veloce e gratuito»: il portale è gratuito, ma se la ditta si iscrive al registro di commercio le tasse restano dovute: CHF 80 per la prima iscrizione, più CHF 20 per la funzione e CHF 20 per la firma, ; «Tempi ridotti del 60% rispetto alle usuali procedure»: è un'affermazione pubblicitaria senza fonte né metodo. La chat non deve riportarla come un fatto.; È una landing page promozionale del 2021. Non nomina il login AGOV, non dice quali iscrizioni fa (RC, AVS, IVA, LAINF) e non dice che lo sviluppo è fermo da settembre 2026 a settembre 2027 (docs/ricerca/concorrenti-nome. |
| [afc-assoggettamento-iva](https://www.estv.admin.ch/it/assoggettamento-all-iva) | attiva | nessuna data visibile per il contenuto («Attualizzato il 22 set 2026» si riferis | Nell'introduzione: «Se queste imprese superano i limiti di cifra d'affari determinante elencati di seguito si raccomanda di verificare...». «Superano» è impreciso: l'elenco subito sotto e l'art. 10 cpv. 2 lett. a LIVA di; Esempio superato: «se sul biglietto per l'entrata al cinema è riportata l'aliquota d'imposta del 2,5 %». Dal 1.1.2024 l'aliquota ridotta è del 2,6% (svizzera.ts aliquoteIva; docs/ricerca §3).; «il contribuente deve annunciare la fine dell'assoggettamento all'AFC per scritto entro 30 giorni»: dal 1.1.2027 l'annuncio di fine assoggettamento va fatto obbligatoriamente per via elettronica (art. 123 OIVA nella vers |
| [ti-rc-iscrizione-ditta-individuale](https://www4.ti.ch/di/dg/rf/sportello/formulari-rc/di-iscrizione) | attiva | non indicata (la pagina mostra l'avviso sulla LTPG entrata in vigore il 1.10.202 | «Le persone fisiche che gestiscono un'impresa in forma commerciale e che conseguono un introito lordo annuo pari ad almeno Fr. 100'000.00 (cifra d'affari), hanno l'obbligo di far iscrivere...»: è la formulazione del vecc; Passo «PAGARE»: elenca solo CHF 80 + 20 + 20 e non nomina il costo dell'autenticazione della firma, che è obbligatoria: CHF 20 all'Ufficio RC o al massimo CHF 30 dal notaio (svizzera.ts autenticazioneFirmaRcTicino, pagin; L'avviso sulla LTPG dice che l'obbligo vale «per gran parte delle imprese svizzere», senza precisare che le ditte individuali ne sono escluse. In più docs/ricerca/forma-registro-iva.md §1 cita questa pagina come fonte di |
| [ti-ias-affiliazione-cassa-compensazione](https://www4.ti.ch/dss/ias/prestazioni-e-contributi/scheda/p/s/dettaglio/obbligo-contributivo-nelle-assicurazioni-sociali/affiliazione-alla-cassa-di-compensazione-competente-per-la-riscossione-dei-contributi) | attiva | non indicata (la pagina elenca già le «Aliquote contributive 2026 (datore di lav | Contraddizione interna e con l'OAVS: nella risposta «Come avviene l'affiliazione di un lavoratore indipendente?» la pagina dice «le altre persone dovranno annunciarsi alla Cassa cantonale di compensazione del Cantone dov; La pagina dice «compilando il formulario apposito e consegnandolo alla Cassa di compensazione competente», come se fosse un modulo cartaceo. Oggi la domanda è il modulo online 318.146, che si apre da selbststaendig-erwer; Link vecchi: la LAVS rimanda ancora a admin.ch/opc/it/classified-compilation/19460217 (alla verifica automatica risponde 403); il calcolatore UFAS usa il vecchio URL bsv.admin.ch/bsv/it/home/..., che però reindirizza a b |
| [avs-presentare-domanda-indipendente](https://selbststaendig-erwerbend.ch/it/presentare-una-domanda) | attiva | non indicata (il glossario del sito usa i valori 2026: CHF 10'100, 60'500 e 530) | Frase semplificata: «Solo dopo aver ricevuto il riconoscimento come persona che svolge un'attività lucrativa indipendente può beneficiare della copertura dell'assicurazione sociale.» La decisione sullo statuto vale anche; Il glossario del sito non viene importato: sta nei dati JSON della pagina ed estraiTestoHtml lo toglie. Contiene però errori. Voce AD: «Le persone che svolgono un'attività lucrativa indipendente sono assicurate contro la; In svizzera.ts (avsDomandaIndipendente) e in elenco.json l'ente è «Casse di compensazione AVS». Secondo l'impronta del sito il responsabile è il «Centro d'informazione AVS/AI». |
| [suva-accertamento-indipendente](https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/accertamento-indipendente-dipendente) | attiva | non indicata | «Si invia una richiesta alla cassa cantonale di compensazione competente (AVS).» Non è preciso: chi fa parte di un'associazione fondatrice va alla sua cassa professionale (LAVS art. 64, OAVS art. 117; ricerca §2).; «Se siete indipendenti e la vostra attività rientra nella sfera di competenza della Suva, potete assicurarvi alla Suva o presso qualsiasi altra assicurazione infortuni.» Secondo l'art. 135 cpv. 2-3 OAINF (fedlex, version; Nessuna contraddizione sul passo «prima la Suva»: la pagina dice giustamente che la domanda va alla cassa AVS e che è la cassa a inoltrarla alla Suva. |
| [ti-fondounimpresa](https://www4.ti.ch/dfe/de/portale-impresa/portale-impresa/fondounimpresa) | attiva | non indicata | L'indirizzo è in conflitto. Il Portale impresa scrive «Ala Munda 35, 6528 Camorino». La pagina IFC sull'accompagnamento alla microimprenditorialità, controllata oggi, scrive «Ala Munda 41, 6528 Camorino». svizzera.ts (uf; La pagina non dice i limiti e le condizioni che si leggono sul sito IFC e nella ricerca (svizzera.ts regolePercorso.fondounimpresa): al massimo 15 ore in al massimo 2 anni; solo per cittadini svizzeri o stranieri con per; Il titolo della pagina è «*Fondounimpresa» con l'asterisco, e la sezione «Formazione e ricerca del personale» non parla affatto di ricerca del personale. |
