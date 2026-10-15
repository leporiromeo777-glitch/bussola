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

> Le prime 10 fonti sono state aggiunte il 15.10.2026 con
> `"verificato_da": "import automatico - da ricontrollare a mano"`.
> **Prima della beta vanno aperte e ricontrollate una per una** (vedi
> "Controllo mensile"), poi si mette il proprio nome in `verificato_da`.
> Finché `verificato_da` comincia con "import automatico", `npm run
> fonti:importa` salva la fonte con `attiva = false` e senza scaricarla:
> la chat non la usa e il riepilogo la segna come "non ancora ricontrollata
> a mano".
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
collegarle alle persone. Valuta di cancellare periodicamente quelle vecchie
(per esempio oltre 12 mesi), tenendo conto che servono anche per la quota
mensile del piano gratuito.
