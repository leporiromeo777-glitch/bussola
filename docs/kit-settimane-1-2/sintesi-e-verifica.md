# Sintesi delle 20 interviste e verifica del 01.11.2026

Kit per le settimane 1-2 (19.10.2026 - 01.11.2026). Come trasformare 20
interviste in una decisione: andare avanti con il servizio a mano, oppure
cambiare segmento o offerta, o ripetere la fase.

> «Bussola» è un nome provvisorio: per cambiarlo, cerca e sostituisci in tutti
> i file di questa cartella.

---

## 1. Calendario

| Quando | Cosa | Tempo |
|---|---|---|
| Dopo ogni intervista | Scheda post-intervista e una riga nel registro | 15 min |
| Entro 7 giorni da ogni intervista | Cancella la registrazione, se c'è, e annota la data nella scheda | 2 min |
| ven 23.10.2026 sera | Controllo a metà: le domande funzionano? Cosa non stai capendo? | 30 min |
| sab 31.10.2026 | Sintesi: raggruppamento dei problemi, top 5, citazioni | 3-4 ore |
| dom 01.11.2026 | Cruscotto della verifica e decisione scritta | 1-2 ore |
| lun 02.11.2026 | Si parte con la fase decisa | |

Nel controllo di metà percorso puoi migliorare le domande di rilancio, ma non
cambiare le 10 domande centrali: altrimenti le interviste non si possono
confrontare.

## 2. Come compilare il registro

File: `registro-interviste.csv`. Separatore punto e virgola, così Excel con
le impostazioni svizzere lo apre in colonne. Cancella le due righe di esempio
(iniziano con `#ESEMPIO`) prima di iniziare.

| Colonna | Valori ammessi | Nota |
|---|---|---|
| `id` | T01-T15, F01-F05 | Mai il nome |
| `data` | 20.10.2026 | |
| `tipo` | titolare, fiduciario | |
| `fase` | idea, in apertura, aperta (fiduciari: n.a.) | |
| `cantone` | TI, GR | |
| `attivita` | testo breve | Es. «grafica freelance» |
| `canale_contatto` | testo breve | Per amici e familiari scrivi esattamente `rete personale stretta` |
| `problema_principale` | una frase, con le sue parole | |
| `ha_speso_chf` | numero intero, senza apostrofo (es. 1200) | Così Excel lo somma. Vuoto per i fiduciari |
| `ore_perse` | numero intero (stima) | Vuoto per i fiduciari |
| `chi_ha_aiutato` | testo breve | |
| `segnale_pagamento` | forte, debole, nessuno | Definizioni in `interviste-titolari.md` (sezione 10) e `interviste-fiduciari.md` (sezione 7) |
| `impegno_concreto` | testo con data | Anche impegni non economici |
| `iscritto_lista` | si, no | Solo se lo sai: te l'ha detto o l'hai visto |
| `citazione_chiave` | tra virgolette, testuale | Senza nomi né dettagli che identificano |
| `note` | testo | |

Evita il punto e virgola dentro i testi.

## 3. La sintesi (sabato 31.10.2026)

### Raggruppare i problemi (affinity clustering)

1. **Un fatto, una nota.** Rileggi le 20 schede. Per ogni fatto scrivi una
   nota (post-it o riga in un foglio) con il codice dell'intervista, per
   esempio «T04: ha messo l'IVA in fattura senza essere iscritto». Solo fatti e
   parole degli intervistati, non tue interpretazioni.
2. **Quattro colori**, se usi i post-it: problemi e blocchi; soluzioni usate
   oggi e chi ha aiutato; soldi e tempo; citazioni.
3. **Raggruppa senza categorie preparate.** Metti vicine le note simili. Solo
   dopo dai a ogni gruppo un nome, con le parole degli intervistati: «Non so se
   la cassa AVS mi riconosce come indipendente» è meglio di «Problemi AVS».
4. **Conta le persone, non le note.** Un gruppo con 8 note della stessa
   persona vale 1.
5. **Dai un'intensità a ogni gruppo**, guardando le prove:

   | Intensità | Prova |
   |---|---|
   | 0 | Ne ha solo parlato |
   | 1 | Ci ha perso tempo (ore, giorni) |
   | 2 | Ha speso soldi o ha cercato attivamente una soluzione |
   | 3 | Ha fatto un errore con un costo reale (interessi, multa, cliente perso, lavoro rifatto) |

6. **Classifica:** prima i gruppi con più persone, a parità di persone quelli
   con l'intensità più alta.
7. **Confronta** variante A (devo ancora aprire) e variante B (ho aperto):
   i blocchi sono gli stessi? Chi ha già aperto ha più problemi prima o dopo
   l'apertura?
8. **Confronta con il piano.** Il piano parte da quattro blocchi: scegliere la
   forma giuridica, capire gli obblighi, fare i conti, partire davvero. Quali
   sono confermati? Ne è emerso uno nuovo? Uno non è mai uscito?

### I 5 blocchi principali

| # | Blocco (con le parole degli intervistati) | Persone (x/15) | Intensità | Prove (CHF, ore, errori) | Citazione (codice) | Cosa vuol dire per Bussola |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

Aggiungi sotto la tabella:

- **Mediana dei soldi spesi** dai titolari: `=MEDIANA(I:I)` in Excel.
- **Mediana delle ore perse:** `=MEDIANA(J:J)`.
- **Fonti usate**, in ordine di frequenza (EasyGov, Portale PMI, chatbot,
  amici…).
- **Chi ha aiutato**, in ordine di frequenza, e quanti l'hanno pagato.

Le righe dei fiduciari hanno queste due colonne vuote, quindi non entrano nelle
mediane.

### Le citazioni

- Massimo 2 per blocco, **testuali**, con il codice (T04).
- Mai inventarle, mai «migliorarle», mai unirne due.
- Restano interne. Per usarne una in pubblico (landing, social) serve il
  consenso scritto della persona per quella frase precisa. Mai testimonianze di
  fantasia.

### I fiduciari

Dalle 5 schede dei fiduciari estrai:

| Cosa | A cosa serve |
|---|---|
| Domande ricorrenti a cui rispondono «per tutti allo stesso modo» | Prima lista delle pagine ufficiali da mettere nella base di fonti |
| Domande che «dipendono dal caso» | Casi da passare a un fiduciario: è il confine del prodotto |
| Errori più costosi | Temi per i contenuti social, sempre con il link ufficiale |
| Prezzo per l'apertura (fasce, anonime) | Capire se CHF 49 è percepito come alternativa o come preparazione al fiduciario. Non pubblicare mai prezzi con il nome dello studio |
| Carte LFid: quante «I», «C», «D» per ogni carta | Materiale per la richiesta di accertamento (art. 10 LFid) |
| Candidati partner, prossimo passo e data | Obiettivo del piano: accordo con 2 fiduciari entro gennaio 2027 |

## 4. Il cruscotto della verifica (domenica 01.11.2026)

Il piano: **almeno 10 intervistati su 20 pagherebbero e 100 iscritti in
lista**. Se la verifica non passa, non si va avanti.

| Indicatore | Obiettivo del piano | Risultato al 01.11.2026 | Passa? |
|---|---|---|---|
| Interviste fatte | 20 (15 titolari + 5 fiduciari) | __ / 20 | |
| **Segnali di pagamento forti** | **almeno 10 su 20** | __ / 20 | sì / no |
| di cui titolari | | __ / 15 | da leggere |
| di cui fiduciari | | __ / 5 | da leggere |
| segnali forti senza la `rete personale stretta` | | __ / 20 | da leggere |
| **Iscritti alla lista d'attesa** | **almeno 100** | __ / 100 | sì / no |
| Intervistati iscritti alla lista | nessuna soglia nel piano | __ / 20 = __ % | da leggere |
| Prenotazioni del servizio a mano con data tra il 02.11 e il 15.11 | 5-10 persone per le settimane 3-4 | __ | da leggere |

**Formule per Excel** (versione italiana, separatore `;`), sul file del
registro:

- Segnali forti totali: `=CONTA.SE(L:L;"forte")`
- Segnali forti dei titolari: `=CONTA.PIÙ.SE(C:C;"titolare";L:L;"forte")`
- Segnali forti dei fiduciari: `=CONTA.PIÙ.SE(C:C;"fiduciario";L:L;"forte")`
- Segnali forti senza amici stretti:
  `=CONTA.PIÙ.SE(L:L;"forte";G:G;"<>rete personale stretta")`
- Intervistati iscritti alla lista: `=CONTA.SE(N:N;"si")`

**Il numero degli iscritti** lo leggi dalla lista d'attesa della landing.
Conta solo le iscrizioni confermate, se usi il doppio opt-in. Gli
intervistati che si iscrivono contano anche loro nei 100. Le iscrizioni
arrivate dal link con `utm_source=intervista` ti danno un controllo per la
riga «Intervistati iscritti alla lista».

**Come leggere le righe «da leggere».** Non cambiano il risultato, ma ti
dicono quanto fidarti:

- Se i 10 segnali forti arrivano soprattutto dai fiduciari, il servizio a mano
  per i giovani non è dimostrato: guarda il cambio C (sezione 6).
- Se senza la `rete personale stretta` scendi sotto 10, il risultato è
  fragile: gli amici tendono a dire sì.
- Se gli intervistati non si iscrivono nemmeno alla lista gratuita, rileggi i
  loro «sì» con sospetto.

## 5. Le regole di decisione

**Decidi le soglie adesso, non dopo aver visto i dati.** Non abbassarle il
01.11 perché «ci siamo quasi».

| Risultato | Decisione |
|---|---|
| Entrambe le soglie raggiunte | **Avanti.** Dal 02.11.2026 servizio a mano con chi ha prenotato. Prossima verifica alla fine delle settimane 3-4: almeno 3 persone hanno pagato il servizio a mano |
| Una o entrambe le soglie mancate | **Non si va avanti a costruire.** Come dice il piano: si cambia segmento o offerta, o si ripete la fase |

Se la verifica non passa, usa questa tabella per capire **cosa** cambiare:

| Cosa vedi nelle interviste | Cosa vuol dire | Cosa fai |
|---|---|---|
| Hai fatto meno di 20 interviste | Dati insufficienti | **Ripeti la fase** per una settimana: finisci le interviste prima di decidere |
| Problemi intensi (soldi e tempo spesi, errori costosi) ma pochi segnali forti | Il problema c'è, l'offerta no: prezzo, formato o momento sbagliati | **Cambia offerta** (vedi la variante d'offerta nella sezione 6) |
| Problemi deboli: risolti con EasyGov o un amico, pochi soldi spesi, nessuna ricerca attiva | Per questo segmento il problema è piccolo | **Cambia segmento**: cambio A o B (sezione 6) |
| I segnali forti vengono soprattutto dai fiduciari | Il valore è per i fiduciari, non per i giovani | **Cambio C** (sezione 6) |
| Segnali forti sufficienti, ma meno di 100 iscritti | Il problema c'è, ma il messaggio o i canali non arrivano | **Ripeti la fase** sulla parte che manca: una settimana su landing, contenuti e canali. Non iniziare a costruire l'MVP finché la lista non arriva a 100 |

**Chi ha già prenotato il servizio a mano.** Se la verifica non passa ma hai
prenotazioni confermate, hai preso un impegno con quelle persone: è una
decisione tua se mantenerle. Una via ragionevole: le mantieni, perché sono
anche un test utile, ma non inizi a costruire niente finché la verifica non
passa.

Scrivi la decisione in un paragrafo, con la data, in fondo a questo file o in
`docs/piano.md`: cosa hai visto, cosa decidi, quale sarà la prossima verifica.

## 6. Se la verifica non passa: tre cambi da testare

Per ogni cambio: quando sceglierlo, cosa testare in una settimana, come
verificarlo. La verifica del cambio usa la stessa proporzione del piano:
**almeno la metà degli intervistati con un segnale forte**.

### Cambio A · Chi apre una Sagl

È la fase 2 del piano: problemi più complessi, maggiore disponibilità a pagare.

- **Quando sceglierlo:** i giovani con la ditta individuale dicono che è
  stato facile o quasi gratis; nelle interviste spuntano persone che
  pensano alla Sagl.
- **Perché il problema è più grande (fatti):**
  - la Sagl richiede un capitale di almeno CHF 20'000
    ([art. 773 CO](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/it#art_773)),
    da versare tutto alla costituzione
    ([art. 777c CO](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/it#art_777_c));
  - serve un atto pubblico dal notaio
    ([art. 777 CO](https://www.fedlex.admin.ch/eli/cc/27/317_321_377/it#art_777))
    e i passi sono sette, dal nome alla liberazione del capitale
    ([check list del Portale PMI](https://www.kmu.admin.ch/it/check-list-creare-una-ditta-individuale-una-sagl-o-una-sa));
  - dal 01.10.2026 Sagl e SA devono annunciare chi ne è il vero proprietario
    al registro per la trasparenza
    ([EasyGov](https://attualita.easygov.swiss/news-it/registro-per-la-trasparenza/));
  - chi lavora nella propria Sagl è considerato dipendente per le
    assicurazioni sociali
    ([Portale PMI](https://www.kmu.admin.ch/it/il-funzionamento-delle-assicurazioni-sociali));
  - il Portale PMI stima per la Sagl costi di notaio di CHF 700-2'000 e di
    consulenza di CHF 600-2'000
    ([pagina Sagl](https://www.kmu.admin.ch/it/forma-giuridica-societa-a-garanzia-limitata-sagl)):
    è un mercato dove già si paga.
- **Test in 7 giorni:** 8 interviste a chi ha fondato una Sagl negli ultimi 2
  anni o la sta preparando. Nomi dalle nuove iscrizioni di Sagl nel FUSC (solo
  per messaggi individuali) e dai fiduciari intervistati. Stesse domande,
  variante B. Test d'impegno: un accompagnamento nei sette passi, a un prezzo
  da decidere **prima** delle interviste.
- **Attenzione LFid:** la costituzione di società a titolo fiduciario e la
  consulenza aziendale sono attività del fiduciario commercialista
  ([LFid art. 3 lett. e e g](https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/618)).
  Con la Sagl sei più vicino al confine: fallo con un fiduciario partner.

### Cambio B · Chi lascia un lavoro dipendente per mettersi in proprio

Anche questo è nella fase 2 del piano. Spesso non ha tra 18 e 30 anni: è un
cambio di segmento vero.

- **Quando sceglierlo:** nelle interviste, chi veniva da un impiego ha
  raccontato più problemi e ha speso di più.
- **Perché il problema è più grande (fatti):**
  - da indipendente non sei assicurato contro la disoccupazione
    ([LADI art. 2](https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/it#art_2)),
    e non puoi assicurarti volontariamente
    ([Portale PMI](https://www.kmu.admin.ch/it/assicurazione-contro-la-disoccupazione-ad));
  - l'assicurazione infortuni non è più obbligatoria per te
    ([LAINF art. 1a](https://www.fedlex.admin.ch/eli/cc/1982/1676_1676_1676/it#art_1_a)):
    chi passa da dipendente a indipendente deve verificare la copertura
    infortuni nella cassa malati
    ([LAMal art. 8](https://www.fedlex.admin.ch/eli/cc/1995/1328_1328_1328/it#art_8));
  - la cassa pensione diventa facoltativa
    ([LPP art. 4](https://www.fedlex.admin.ch/eli/cc/1983/797_797_797/it#art_4));
  - chi lavora per un solo mandante, magari l'ex datore di lavoro, è
    normalmente considerato dipendente dall'AVS
    ([Promemoria 2.02, punto 1](https://www.ahv-iv.ch/p/2.02.i));
  - chi ha almeno 20 anni, è disoccupato senza colpa e presenta un progetto
    di attività indipendente può ricevere fino a 90 indennità giornaliere
    durante la progettazione
    ([LADI art. 71a-71b](https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/it#art_71_a)).
- **Test in 7 giorni:** 8 interviste a persone che hanno lasciato o stanno
  lasciando un impiego. Canali: LinkedIn (messaggio 4), la tua rete allargata
  (genitori, ex colleghi), i corsi per indipendenti di Fondounimpresa. Test
  d'impegno: il servizio a mano con in più la lista delle coperture da
  verificare, con le fonti ufficiali.
- **Attenzione:** la scelta di un'assicurazione è personale: dai la regola
  generale e la fonte, non un consiglio. Non annotare dettagli su aiuti
  sociali: sono dati degni di particolare protezione
  ([LPD art. 5](https://www.fedlex.admin.ch/eli/cc/2022/491/it#art_5)).

### Cambio C · I fiduciari come canale (B2B)

- **Quando sceglierlo:** i fiduciari hanno dato segnali forti, dicono che il
  cliente piccolo al primo anno non conviene, e vorrebbero clienti più
  preparati. I giovani invece non pagano.
- **Ipotesi:** Bussola prepara il giovane (passi chiari, documenti in ordine,
  domande scritte) e passa i casi che richiedono consulenza a fiduciari
  partner. Ricavo: una commissione sulle segnalazioni, sempre dichiarata
  all'utente (come prevede il piano), o una licenza per lo studio. Il
  fiduciario partner aiuta anche a restare dentro i limiti della LFid.
- **Test in 7 giorni:** 5 fiduciari in più dall'albo online
  ([albo](https://www4.ti.ch/di/dg/fiduciari/albo-online/albo)). Proposta
  concreta: «A novembre Le passo 1-3 casi preparati. Se il tempo risparmiato
  vale qualcosa per Lei, ci accordiamo per iscritto entro il [DATA]».
- **Verifica:** almeno 2 fiduciari firmano o confermano per iscritto un
  pilota con condizioni economiche. È lo stesso obiettivo del piano (2
  partner entro gennaio), solo anticipato.

### Variante d'offerta (stesso segmento)

Se i giovani della variante B raccontano più problemi **dopo** l'apertura
(acconti AVS, fatture, scadenze) che prima, il problema forse non è aprire ma
restare in regola. Testa prima l'Accompagnamento dopo la fondazione (CHF 12 al
mese nel piano) al posto del servizio a mano per l'apertura, con 8 interviste
a chi ha aperto negli ultimi 2 anni.

## 7. Errori da evitare nella sintesi

- **Contare i complimenti.** «Bellissima idea» non è un segnale.
- **Contare gli amici come tutti gli altri.** Guarda la riga senza la
  `rete personale stretta`.
- **Generalizzare da una storia.** Una storia forte è un indizio, non una
  prova.
- **Cercare solo conferme.** Prima di leggere le schede, scrivi in una riga
  cosa ti farebbe cambiare idea. Poi cercalo.
- **Spostare le soglie.** 10 su 20 e 100 iscritti restano tali.
- **Trasformare i problemi in funzioni del prodotto.** La sintesi descrive
  problemi; le soluzioni vengono dopo.
