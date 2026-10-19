"use client";

import { aliquoteIva, dataSvizzera, datiStrumenti, fonti, fontiStrumenti, percentuale, regole } from "@/data/svizzera";
import {
  ALIQUOTE,
  calcolaRiga,
  NOMI_TIPO,
  normalizzaNumeroIva,
  riferimentoPerFattura,
  rigaVuota,
  type Documento,
  type Emittente,
  type Riga,
  type SceltaRiferimento,
} from "@/lib/strumenti/documenti";
import { importo } from "@/lib/strumenti/numeri";
import { formattaRiferimento, validaIbanPerQr, type IndirizzoStrutturato } from "@/lib/strumenti/qr";
import { IconaCestino, IconaPiu } from "../icone";
import { nuovoId } from "../id";
import { CampoArea, CampoScelta, CampoTesto, Casella, classePulsantePiccolo, FonteLink, Gruppo } from "../ui";
import { CampiIndirizzo } from "./campi-indirizzo";

type Props = {
  doc: Documento;
  /** Modifica il documento. */
  onCambia: (modifica: (d: Documento) => Documento) => void;
  /** Modifica i dati dell'emittente nel documento e nel profilo salvato. */
  onEmittente: (modifica: Partial<Emittente>) => void;
  /** true se i tuoi dati si salvano nell'account (non solo su questo dispositivo). */
  nellAccount?: boolean;
};

export function ModuloDocumento({ doc, onCambia, onEmittente, nellAccount = false }: Props) {
  const e = doc.emittente;
  const tipo = NOMI_TIPO[doc.tipo];
  const imposta = <K extends keyof Documento>(campo: K, valore: Documento[K]) => onCambia((d) => ({ ...d, [campo]: valore }));
  const cambiaRiga = (id: string, modifica: Partial<Riga>) =>
    onCambia((d) => ({ ...d, righe: d.righe.map((r) => (r.id === id ? { ...r, ...modifica } : r)) }));

  const iban = e.iban.trim() ? validaIbanPerQr(e.iban) : null;
  const numeroIvaValido = normalizzaNumeroIva(e.numeroIva);

  return (
    <form className="space-y-6" onSubmit={(ev) => ev.preventDefault()} noValidate>
      <Gruppo
        legenda="I tuoi dati"
        descrizione={
          nellAccount
            ? "Li ricordiamo nel tuo account per i prossimi preventivi e fatture, anche nell'app."
            : "Li ricordiamo su questo dispositivo per i prossimi preventivi e fatture."
        }
      >
        <CampiIndirizzo
          prefissoId="emittente"
          valore={e}
          onCambia={(m: Partial<IndirizzoStrutturato>) => onEmittente(m)}
          etichettaNome="Nome e cognome (o nome della ditta)"
          aiutoNome={
            <>
              Il nome di una ditta individuale deve contenere il tuo cognome (<FonteLink fonte={fonti.co945} />). Se sei
              iscritto nel registro di commercio, scrivilo esattamente come è iscritto (<FonteLink fonte={fontiStrumenti.co954a} />).
            </>
          }
          autoCompleta
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CampoTesto
            id="emittente-email"
            etichetta="Email"
            tipo="email"
            valore={e.email}
            onCambia={(v) => onEmittente({ email: v })}
            autoComplete="email"
            maxLength={200}
          />
          <CampoTesto
            id="emittente-telefono"
            etichetta="Telefono (facoltativo)"
            tipo="tel"
            valore={e.telefono}
            onCambia={(v) => onEmittente({ telefono: v })}
            autoComplete="tel"
            maxLength={60}
          />
          <CampoTesto
            id="emittente-iban"
            etichetta="IBAN o QR-IBAN del tuo conto"
            valore={e.iban}
            onCambia={(v) => onEmittente({ iban: v })}
            errore={iban && !iban.ok ? iban.errore : undefined}
            aiuto={
              iban?.ok
                ? iban.qrIban
                  ? "QR-IBAN riconosciuto: la fattura userà il riferimento QR."
                  : "IBAN valido."
                : "Lo trovi nell'e-banking o sulla carta del conto. Conti svizzeri o del Liechtenstein."
            }
            maxLength={60}
            className="sm:col-span-2"
          />
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <Casella
            id="emittente-iva"
            etichetta="Sono iscritto all'IVA (ho un numero IVA)"
            selezionata={e.ivaIscritto}
            onCambia={(v) => {
              onEmittente({ ivaIscritto: v });
              if (v) onCambia((d) => ({ ...d, valuta: "CHF" }));
            }}
            aiuto={
              <>
                L&apos;iscrizione è obbligatoria da {importo(regole.sogliaIva.valore, 0)} di cifra d&apos;affari annua (
                <FonteLink fonte={fonti.liva10} />
                ), sotto è facoltativa.
              </>
            }
          />
          {e.ivaIscritto ? (
            <CampoTesto
              id="emittente-numero-iva"
              etichetta="Numero IVA"
              valore={e.numeroIva}
              onCambia={(v) => onEmittente({ numeroIva: v })}
              onBlur={() => {
                if (numeroIvaValido && numeroIvaValido !== e.numeroIva) onEmittente({ numeroIva: numeroIvaValido });
              }}
              errore={e.numeroIva.trim() && !numeroIvaValido ? "Formato: CHE-123.456.789 IVA" : undefined}
              aiuto={
                <>
                  Nel formato CHE-123.456.789 IVA (<FonteLink fonte={fontiStrumenti.afcIdi} />
                  ). Prezzi delle voci senza IVA: la calcoliamo per aliquota.
                </>
              }
              placeholder="CHE-123.456.789 IVA"
              maxLength={40}
              className="mt-4 sm:max-w-sm"
            />
          ) : (
            <p className="mt-3 rounded-lg bg-brand-soft p-3 text-sm">
              Non sei iscritto all&apos;IVA: in fattura non puoi indicare l&apos;IVA. Se la indichi, la devi comunque
              all&apos;AFC (<FonteLink fonte={fonti.liva27} />
              ). Per questo i campi IVA non compaiono.
            </p>
          )}
        </div>
      </Gruppo>

      <Gruppo legenda="Cliente">
        <CampiIndirizzo
          prefissoId="cliente"
          valore={doc.cliente}
          onCambia={(m) => onCambia((d) => ({ ...d, cliente: { ...d.cliente, ...m } }))}
          etichettaNome="Nome del cliente (persona o azienda)"
        />
      </Gruppo>

      <Gruppo legenda={`Dati ${tipo.conDel}`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoTesto id="doc-numero" etichetta="Numero" valore={doc.numero} onCambia={(v) => imposta("numero", v)} maxLength={40} obbligatorio />
          <CampoTesto id="doc-data" etichetta="Data" tipo="date" valore={doc.data} onCambia={(v) => imposta("data", v)} />
          <CampoTesto
            id="doc-scadenza"
            etichetta={tipo.scadenza}
            tipo="date"
            valore={doc.scadenza}
            onCambia={(v) => imposta("scadenza", v)}
          />
          <CampoTesto
            id="doc-oggetto"
            etichetta="Oggetto (facoltativo)"
            valore={doc.oggetto}
            onCambia={(v) => imposta("oggetto", v)}
            placeholder="Per esempio: Sito web per Bar Centrale"
            maxLength={200}
            className="sm:col-span-2"
          />
          <CampoTesto
            id="doc-periodo"
            etichetta="Data o periodo della prestazione"
            valore={doc.periodoPrestazione}
            onCambia={(v) => imposta("periodoPrestazione", v)}
            placeholder="Per esempio: ottobre 2026"
            aiuto="Se è diverso dalla data del documento."
            maxLength={120}
          />
          <CampoScelta
            id="doc-valuta"
            etichetta="Valuta"
            valore={doc.valuta}
            onCambia={(v) => imposta("valuta", v)}
            opzioni={e.ivaIscritto ? [{ valore: "CHF", etichetta: "CHF" }] : [
              { valore: "CHF", etichetta: "CHF" },
              { valore: "EUR", etichetta: "EUR" },
            ]}
            aiuto={e.ivaIscritto ? "Con l'IVA questo strumento prepara documenti solo in CHF." : undefined}
          />
          {doc.valuta === "CHF" ? (
            <Casella
              id="doc-arrotonda"
              etichetta="Arrotonda il totale ai 5 centesimi"
              selezionata={doc.arrotonda5}
              onCambia={(v) => imposta("arrotonda5", v)}
              className="sm:col-span-2 sm:self-end"
            />
          ) : null}
        </div>
      </Gruppo>

      <Gruppo
        legenda="Voci"
        descrizione={`${e.ivaIscritto ? "Prezzi unitari senza IVA." : "Prezzi unitari."} Per i decimali usa il punto o la virgola (12.50 o 12,50); 1.500 vale 1'500.`}
      >
        <ul className="space-y-4">
          {doc.righe.map((r, i) => {
            const c = calcolaRiga(r);
            const compilata = r.descrizione.trim() || r.prezzo.trim();
            return (
              <li key={r.id} className="grid gap-3 border-b border-border pb-4 last:border-0 sm:grid-cols-12">
                <CampoArea
                  id={`riga-descrizione-${r.id}`}
                  etichetta={`Voce ${i + 1}: descrizione`}
                  valore={r.descrizione}
                  onCambia={(v) => cambiaRiga(r.id, { descrizione: v })}
                  righe={2}
                  maxLength={500}
                  placeholder="Che cosa hai fatto o venduto"
                  className="sm:col-span-12"
                />
                <CampoTesto
                  id={`riga-quantita-${r.id}`}
                  etichetta="Quantità"
                  numerico
                  valore={r.quantita}
                  onCambia={(v) => cambiaRiga(r.id, { quantita: v })}
                  errore={compilata && !c.valida && r.quantita.trim() ? "Quantità non valida" : undefined}
                  maxLength={30}
                  className="sm:col-span-2"
                />
                <CampoTesto
                  id={`riga-unita-${r.id}`}
                  etichetta="Unità"
                  valore={r.unita}
                  onCambia={(v) => cambiaRiga(r.id, { unita: v })}
                  placeholder="ore, pz…"
                  maxLength={30}
                  className="sm:col-span-2"
                />
                <CampoTesto
                  id={`riga-prezzo-${r.id}`}
                  etichetta={e.ivaIscritto ? "Prezzo senza IVA" : "Prezzo"}
                  prefisso={doc.valuta}
                  numerico
                  valore={r.prezzo}
                  onCambia={(v) => cambiaRiga(r.id, { prezzo: v })}
                  errore={compilata && r.prezzo.trim() && !c.valida ? "Prezzo non valido" : undefined}
                  maxLength={30}
                  className={e.ivaIscritto ? "sm:col-span-3" : "sm:col-span-4"}
                />
                {e.ivaIscritto ? (
                  <CampoScelta
                    id={`riga-aliquota-${r.id}`}
                    etichetta="IVA"
                    valore={r.aliquota}
                    onCambia={(v) => cambiaRiga(r.id, { aliquota: v })}
                    opzioni={ALIQUOTE.map((a) => ({ valore: a.id, etichetta: `${percentuale(aliquoteIva.valore[a.id])} ${a.etichetta.replace("Aliquota ", "")}` }))}
                    className="sm:col-span-2"
                  />
                ) : null}
                <div className={`flex items-end justify-between gap-3 ${e.ivaIscritto ? "sm:col-span-3" : "sm:col-span-4"}`}>
                  <p className="pb-2 text-sm">
                    <span className="text-muted">Importo </span>
                    <span className="font-medium tabular-nums">{importo(c.importo, 2, doc.valuta)}</span>
                  </p>
                  <button
                    type="button"
                    className={`${classePulsantePiccolo} mb-1`}
                    onClick={() => onCambia((d) => ({ ...d, righe: d.righe.filter((x) => x.id !== r.id) }))}
                  >
                    <IconaCestino className="size-4" />
                    <span>
                      Togli<span className="sr-only"> la voce {i + 1}</span>
                    </span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className={`${classePulsantePiccolo} mt-4`}
          onClick={() => onCambia((d) => ({ ...d, righe: [...d.righe, rigaVuota(nuovoId())] }))}
        >
          <IconaPiu className="size-4" />
          Aggiungi una voce
        </button>
        {e.ivaIscritto ? (
          <p className="mt-4 text-xs text-muted">
            Aliquote IVA in vigore: <FonteLink fonte={aliquoteIva.fonte} />. {aliquoteIva.nota}
          </p>
        ) : null}
      </Gruppo>

      <Gruppo legenda="Note (facoltative)">
        <CampoArea
          id="doc-note"
          etichetta="Testo in fondo al documento"
          valore={doc.note}
          onCambia={(v) => imposta("note", v)}
          righe={3}
          maxLength={1000}
          placeholder={doc.tipo === "fattura" ? "Per esempio: Grazie per la fiducia!" : "Per esempio: tempi di consegna, cosa è incluso e cosa no."}
        />
      </Gruppo>

      {doc.tipo === "fattura" ? <SceltaRiferimentoQr doc={doc} onCambia={onCambia} /> : null}
    </form>
  );
}

function SceltaRiferimentoQr({ doc, onCambia }: { doc: Documento; onCambia: Props["onCambia"] }) {
  const iban = validaIbanPerQr(doc.emittente.iban);
  const qrIban = iban.ok && iban.qrIban;
  const opzioni: { valore: SceltaRiferimento; etichetta: string }[] = qrIban
    ? [
        { valore: "automatico", etichetta: "Riferimento QR creato dal numero della fattura" },
        { valore: "manuale", etichetta: "Scrivo io il riferimento QR (27 cifre)" },
      ]
    : [
        { valore: "automatico", etichetta: "Creditor Reference (RF) creato dal numero della fattura" },
        { valore: "nessuno", etichetta: "Nessun riferimento" },
        { valore: "manuale", etichetta: "Scrivo io il Creditor Reference (RF…)" },
      ];
  const scelta = opzioni.some((o) => o.valore === doc.riferimento) ? doc.riferimento : "automatico";
  const rif = riferimentoPerFattura({ ...doc, riferimento: scelta });

  return (
    <Gruppo
      legenda="Pagamento con QR-fattura"
      descrizione={
        <>
          Il riferimento aiuta a riconoscere il pagamento sul conto. Con un QR-IBAN serve il riferimento QR; con un IBAN
          normale il Creditor Reference oppure nessun riferimento (<FonteLink fonte={fontiStrumenti.sixLineeGuidaQr} />
          ).
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Tipo di riferimento</legend>
        <div className="space-y-2">
          {opzioni.map((o) => (
            <label key={o.valore} className="flex items-start gap-3">
              <input
                type="radio"
                name="riferimento"
                value={o.valore}
                checked={scelta === o.valore}
                onChange={() => onCambia((d) => ({ ...d, riferimento: o.valore }))}
                className="mt-1 size-4 accent-[var(--brand)]"
              />
              <span>{o.etichetta}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {scelta === "manuale" ? (
        <CampoTesto
          id="riferimento-manuale"
          etichetta={qrIban ? "Riferimento QR" : "Creditor Reference"}
          valore={doc.riferimentoManuale}
          onCambia={(v) => onCambia((d) => ({ ...d, riferimentoManuale: v }))}
          placeholder={qrIban ? "21 00000 00003 13947 14300 09017" : "RF18 5390 0754 7034"}
          maxLength={40}
          className="mt-4 sm:max-w-md"
        />
      ) : null}
      {rif.ok && rif.tipo !== "NON" && scelta !== "manuale" ? (
        <p className="mt-4 text-sm">
          Riferimento: <span className="font-mono">{formattaRiferimento(rif.tipo, rif.valore)}</span>
        </p>
      ) : null}
      {!rif.ok && iban.ok ? <p className="mt-4 text-sm font-medium text-danger">{rif.errore.messaggio}</p> : null}
      {qrIban ? (
        <p className="mt-3 text-sm text-muted">
          Le prime cifre del riferimento QR si possono concordare con la tua banca, per raggruppare gli incassi.
        </p>
      ) : null}
      <p className="mt-3 text-sm text-muted">
        In stampa scegli la scala 100% (non «adatta alla pagina»): la sezione pagamento deve misurare 210 × 105 mm.
        Dal {dataSvizzera(datiStrumenti.indirizzoStrutturatoQr.valore)} la QR-fattura accetta solo
        indirizzi strutturati: per questo via, numero, NPA e località sono campi separati (
        <FonteLink fonte={datiStrumenti.indirizzoStrutturatoQr.fonte} />
        ).
      </p>
    </Gruppo>
  );
}
