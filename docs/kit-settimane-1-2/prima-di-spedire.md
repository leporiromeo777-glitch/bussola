# Prima di spedire: le tre lettere della settimana 1

Kit per le settimane 1-2 (19.10.2026 - 01.11.2026). Una checklist che tiene
insieme le tre lettere della prima settimana: date, cosa preparare e un
registro per seguire le risposte.

| File | A chi | Canale | Invio |
|---|---|---|---|
| `lettera-autorita-lfid.md` | Autorità di vigilanza sull'esercizio delle professioni di fiduciario, Bellinzona | Raccomandata (più una telefonata prima) | mer 21.10.2026 |
| `email-fondounimpresa.md` | Fondounimpresa, Camorino | E-mail | mar 20.10.2026 |
| `email-fondazione-agire.md` | Fondazione Agire, Manno | E-mail con la scheda progetto in PDF | gio 22.10.2026 |

> «Bussola» è un nome provvisorio: per cambiarlo, cerca e sostituisci in tutti
> i file di questa cartella. Tempo totale: circa 4 ore di preparazione nel
> weekend, poi 30-60 minuti al giorno, oltre alle interviste.

---

## 1. Calendario

| Quando | Cosa | Dove |
|---|---|---|
| entro **sab 17.10** | Iscriviti al webinar di Fondounimpresa del 19.10 (le iscrizioni chiudono il 17.10) | `email-fondounimpresa.md`, sezione 1 |
| sab 17.10 - dom 18.10 | Prepara tutto quello della sezione 2: landing, schermate, scheda progetto, allegati della lettera | sezione 2 |
| lun 19.10 | Telefonata al segretariato dell'Autorità, +41 91 814 03 51 (10 minuti). Sera, 18:00-19:30: webinar | `lettera-autorita-lfid.md`, sezione 1 |
| mar 20.10 | Email A a Fondounimpresa. Scegli l'opzione A o B per il servizio a mano. Completa, stampa e firma la lettera all'Autorità | `email-fondounimpresa.md`; `lettera-autorita-lfid.md` |
| mer 21.10 | Raccomandata alla posta. Scansione di lettera e allegati. Riga nel registro | `lettera-autorita-lfid.md`, sezione 5 |
| gio 22.10 | Email ad Agire, con i numeri del giorno e la scheda in PDF | `email-fondazione-agire.md` |
| ven 23.10 | Post LinkedIn sul confine LFid: scrivi «ho chiesto» solo se la lettera è partita | `contenuti-social.md`, giorno 5 |
| lun 26.10 | Controlla con il numero di invio che la raccomandata sia stata consegnata | |
| mar 27.10 | Follow-up a Fondounimpresa, solo se non hanno risposto | `email-fondounimpresa.md`, sezione 2 |
| gio 29.10 | Follow-up ad Agire, solo se non hanno risposto | `email-fondazione-agire.md`, sezione 3 |
| ven 30.10 | Ultimo giorno per spedire la lettera all'Autorità, se non è ancora partita | |
| dom 01.11 | Se hai scelto l'opzione A (servizio a mano gratis fino alla risposta), riscrivi la seconda verifica del piano | `sintesi-e-verifica.md` |
| mer 04.11 | Se l'Autorità non ha confermato la ricezione, telefona al segretariato | `lettera-autorita-lfid.md`, sezione 5 |

---

## 2. Cosa preparare (entro dom 18.10)

### Landing online, con impressum e privacy

Autorità, Agire e Fondounimpresa guarderanno il sito. Deve dire chi sei e le
stesse cose delle lettere. La lista per i social è in `contenuti-social.md`
(«Da fare prima di lunedì 19.10»); qui ci sono solo i punti che servono alle
lettere.

- [ ] Il sito si apre su `https://[dominio]`, senza password e senza «coming
      soon».
- [ ] **Impressum** (`/impressum`) con nome e cognome, indirizzo completo (via,
      numero, NPA, località) ed e-mail. Nel codice questi dati vengono dalle
      variabili `NEXT_PUBLIC_TITOLARE_NOME`, `NEXT_PUBLIC_TITOLARE_INDIRIZZO` e
      `NEXT_PUBLIC_TITOLARE_EMAIL` (`src/lib/sito.ts`): se non le imposti
      sull'hosting, il sito mostra «[Nome e cognome del titolare]». Per una
      lista d'attesa senza vendita l'obbligo non è sicuro (interpretazione),
      ma pubblicarlo non costa nulla e Stripe/TWINT lo chiederanno comunque
      ([LCSl art. 3 cpv. 1 lett. s](https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/it#art_3);
      [Stripe Docs](https://docs.stripe.com/payments/twint)).
- [ ] **Privacy** (`/privacy`): chi sei, a cosa servono i dati, quali fornitori
      li ricevono e in quali Paesi
      ([LPD art. 19](https://www.fedlex.admin.ch/eli/cc/2022/491/it#art_19)).
      Per un fornitore negli Stati Uniti, verifica la certificazione Swiss-U.S.
      Data Privacy Framework
      ([OPDa, allegato 1](https://www.fedlex.admin.ch/eli/cc/2022/568/it#annex_1)).
- [ ] **Lista d'attesa:** casella di consenso non preselezionata, email di
      conferma (doppio opt-in), link per cancellarsi in ogni invio
      ([LCSl art. 3 cpv. 1 lett. o](https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/it#art_3)).
      Prova tu con un secondo indirizzo: arriva l'email? La cancellazione
      funziona?
- [ ] Funzionano le pagine che le lettere citano: «Cosa Bussola non è»,
      questionario e checklist, chat con l'avviso «intelligenza artificiale,
      non un fiduciario» e il link all'albo.

### Schermate

- [ ] Le 8-9 schermate elencate in `lettera-autorita-lfid.md`, sezione 3
      (allegato 1), con **dati di fantasia**. Da computer per la lettera (più
      leggibili su carta), dal telefono per i colloqui.
- [ ] Sotto ogni schermata: data e indirizzo della pagina.

### Descrizione in una pagina e allegati

- [ ] Scheda progetto in PDF, una pagina A4
      (`email-fondazione-agire.md`, sezione 4). Serve per Agire e, se vuoi,
      per Fondounimpresa.
- [ ] Allegati 2, 3 e 4 della lettera all'Autorità: domande e regole del
      questionario, esempi stampati dall'app, testi degli avvisi
      (`lettera-autorita-lfid.md`, sezioni 3 e 4).
- [ ] Le tre lettere descrivono Bussola allo stesso modo: stesse funzioni,
      stesso «cosa non fa», prezzi «da verificare».

### Cose da verificare prima di scrivere che esistono

- [ ] **Gli strumenti** (tariffa oraria, budget con stima AVS, business plan
      di una pagina, preventivo e fattura con QR): descrivili come esistenti
      solo se il giorno dell'invio funzionano. Altrimenti scrivi «in
      preparazione». Stato al 15.10.2026: sono nel codice (`/strumenti`) e
      funzionano; i dati restano nel browser dell'utente e nessuno strumento
      usa l'intelligenza artificiale per scrivere testi. Manca solo la
      pubblicazione del sito.
- [ ] **Le fonti della chat:** le prime 10 sono segnate «import automatico -
      da ricontrollare a mano» (`docs/fonti.md`). Ricontrollale prima di
      scrivere che le pagine sono controllate a mano, e conta quante sono.

### Dati e firma

- [ ] **Numeri del giorno**, solo veri: interviste fatte (titolari e
      fiduciari), iscritti confermati alla lista (solo chi ha cliccato il link
      di conferma), prenotazioni o impegni scritti per il servizio a mano.
- [ ] **Nome provvisorio:** tutte e tre le lettere dicono «Bussola (nome
      provvisorio)». bussola.ch è occupato e c'è un marchio attivo «BUSSOLA
      DELA SALUTE» nelle classi del software
      ([scheda concorrenti e nome](../ricerca/concorrenti-nome.md), parte B).
      Se scegli il nome definitivo prima di spedire, cambialo ovunque:
      lettere, scheda, sito.
- [ ] **Firma** dell'email con nome, telefono e sito. Lavori da solo/a: scrivi
      «io», non «noi».

### Stampa e posta (per la raccomandata)

- [ ] Lettera firmata a mano e 4 allegati numerati, in una busta grande (A4
      non piegato).
- [ ] Una scansione PDF di tutto, prima di chiudere la busta.
- [ ] Alla posta chiedi l'invio raccomandato e conserva la ricevuta con il
      numero di invio.

---

## 3. Registro dei contatti istituzionali

Tieni questi contatti **fuori** da `registro-interviste.csv`, che serve solo
per le 20 interviste (vedi anche la regola 4 di `messaggi-contatto.md`:
contatti separati dalle note). Puoi copiare la tabella in un foglio di
calcolo. Le persone che Agire o Fondounimpresa ti presentano per
un'intervista vanno invece nel registro delle interviste, con il canale
`Fondazione Agire` o `Fondounimpresa`.

| Data | Ente | Canale | Cosa | Riferimento | Chi ha risposto | Esito | Prossimo passo | Follow-up |
|---|---|---|---|---|---|---|---|---|
| 19.10.2026 | Autorità di vigilanza fiduciari | Telefono, +41 91 814 03 51 | Domande sulla procedura | | | | Invio della lettera | |
| 20.10.2026 | Fondounimpresa | E-mail, fondounimpresa@edu.ti.ch | Versione A: collaborazione, 20 minuti | Oggetto dell'email | | | | 27.10.2026 |
| 21.10.2026 | Autorità di vigilanza fiduciari | Raccomandata | Richiesta di accertamento, art. 10 LFid | N. di invio: [...] | | | | 04.11.2026 |
| 22.10.2026 | Fondazione Agire | E-mail, info@agire.ch | Primo colloquio, scheda progetto | Oggetto dell'email | | | | 29.10.2026 |

**Esito:** in attesa, risposta ricevuta, incontro fissato, rifiutato, nessuna
risposta. **Prossimo passo:** sempre con una data.

---

## 4. Regole per tutte e tre

1. **Solo fatti con la fonte.** Niente promesse e niente numeri arrotondati
   per eccesso.
2. **Niente collaborazioni annunciate prima del tempo.** Non scrivere sul sito
   o sui social «con Fondounimpresa», «sostenuto da Agire» o «approvato
   dall'Autorità» senza un accordo o una decisione per iscritto.
3. **Un solo follow-up** per ogni email, dopo 5 giorni lavorativi.
4. **Rispondi entro 24 ore** a ogni risposta e annotala nel registro lo
   stesso giorno.
5. **Se una risposta cambia il piano** (per esempio l'Autorità ti chiede di
   aspettare), aggiorna subito `sintesi-e-verifica.md` e i post programmati
   in `contenuti-social.md`.
