"use client";

import { useId, useState } from "react";
import { ElencoFonti } from "@/components/percorso/elenco-fonti";
import { IconaCopia, IconaPosta, IconaSpunta } from "@/components/strumenti/icone";
import { CampoArea, CampoTesto } from "@/components/strumenti/ui";
import { useArchivioAccount } from "@/components/strumenti/documenti/usa-archivio-account";
import { useArchivio } from "@/components/strumenti/usa-archivio";
import { regoleSolleciti } from "@/data/svizzera";
import { dataIsoValida } from "@/lib/conti/importi";
import {
  FIRMA_MASSIMA,
  FONTI_SOLLECITO,
  GIORNI_NUOVO_TERMINE,
  NOMI_LIVELLO,
  datiDaStrumentoFattura,
  leggiIbanSollecito,
  linkEmail,
  livelloConsigliato,
  nuovoTermineProposto,
  preparaSollecito,
  TASSO_INTERESSE_MORA,
  testoDaCopiare,
  VERIFICA_FONTI_SOLLECITO,
} from "@/lib/conti/sollecito";
import { LIVELLI_SOLLECITO, type FatturaEmessa, type LivelloSollecito } from "@/lib/conti/tipi";
import { CHIAVI_ARCHIVIO } from "@/lib/strumenti/archivio";
import { emittenteVuoto, schemaElencoDocumenti, schemaEmittente, type Documento } from "@/lib/strumenti/documenti";
import { chiama } from "./api";
import { Messaggio, classeNo, classePiccolo, classeSi, data } from "./ui-conti";

const nessunDocumento = (): Documento[] => [];

/**
 * «Prepara il sollecito»: Bleo scrive oggetto e testo per il cliente, l'utente
 * li controlla, li copia o li apre nella sua email e li manda lui. Poi segna
 * il sollecito come inviato, così la volta dopo Bleo propone il secondo.
 * IBAN e nome vengono dallo strumento fattura: prima dalla fattura e dai
 * tuoi dati salvati nell'account, poi da quelli rimasti in questo browser.
 * Il testo del sollecito non va al server.
 */
export function PannelloSollecito({
  fattura: f,
  oggi,
  onChiudi,
  onCambiato,
}: {
  fattura: FatturaEmessa;
  oggi: string;
  onChiudi: () => void;
  onCambiato: (annuncio: string) => void;
}) {
  const id = useId();
  const [documenti] = useArchivio(CHIAVI_ARCHIVIO.documenti, schemaElencoDocumenti, nessunDocumento);
  const [emittente] = useArchivio(CHIAVI_ARCHIVIO.emittente, schemaEmittente, emittenteVuoto);
  const { stato: conto } = useArchivioAccount(true);
  const dalConto =
    conto?.caricamento === "pronto" ? datiDaStrumentoFattura(f.numero, conto.documenti, conto.emittente) : null;
  const dalBrowser = datiDaStrumentoFattura(f.numero, documenti, emittente);
  const locali = { iban: dalConto?.iban || dalBrowser.iban, firma: dalConto?.firma || dalBrowser.firma };

  const [livello, setLivello] = useState<LivelloSollecito>(livelloConsigliato(f));
  const [termine, setTermine] = useState(nuovoTermineProposto(oggi));
  // null = non ancora cambiato: vale quello dello strumento fattura (che arriva dopo l'idratazione).
  const [ibanScritto, setIbanScritto] = useState<string | null>(null);
  const [firmaScritta, setFirmaScritta] = useState<string | null>(null);
  // Testo cambiato a mano; si perde se cambiano le scelte qui sopra.
  const [modificato, setModificato] = useState<{ oggetto: string; testo: string } | null>(null);
  const [stato, setStato] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const iban = ibanScritto ?? locali.iban;
  const firma = firmaScritta ?? locali.firma;
  const ibanLetto = leggiIbanSollecito(iban);
  const termineValido = dataIsoValida(termine) && termine >= oggi;
  const generato = preparaSollecito({
    livello,
    fattura: f,
    nuovoTermine: termineValido ? termine : nuovoTermineProposto(oggi),
    iban: ibanLetto.iban,
    firma,
  });
  const attuale = modificato ?? generato;

  function scelta(cambia: () => void) {
    cambia();
    setModificato(null);
    setStato("");
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(testoDaCopiare(attuale));
      setStato("Testo copiato con l'oggetto: incollalo nell'email o nel messaggio al cliente.");
    } catch {
      setStato("Non riesco a copiare da qui: seleziona il testo nel riquadro e copialo a mano.");
    }
  }

  async function segnaInviato() {
    setInCorso(true);
    setErrore(null);
    const esito = await chiama(`/api/conti/fatture/${encodeURIComponent(f.id)}`, {
      metodo: "PATCH",
      corpo: { sollecito: { livello, inviatoIl: oggi } },
    });
    setInCorso(false);
    if (!esito.ok) return setErrore(esito.messaggio);
    onCambiato(`Fattura ${f.numero}: ${NOMI_LIVELLO[livello].breve} segnato come inviato il ${data(oggi)}.`);
    onChiudi();
  }

  const { ufficio } = regoleSolleciti.esecuzione.valore;

  return (
    <section aria-labelledby={`${id}-titolo`} className="mt-4 rounded-2xl border border-brand/40 bg-background p-4 sm:p-5">
      <h3 id={`${id}-titolo`} className="font-bold">
        Sollecito per la fattura {f.numero}
      </h3>
      <p className="mt-1 text-sm text-muted">
        Bleo ti prepara il testo: controllalo, poi aprilo nella tua email o copialo e mandalo tu a {f.cliente}.
      </p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Che sollecito vuoi mandare?</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {LIVELLI_SOLLECITO.map((l) => (
            <label
              key={l}
              className={`flex min-h-11 cursor-pointer flex-col rounded-xl border px-3 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                livello === l ? "border-brand bg-brand-soft" : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name={`${id}-livello`}
                value={l}
                checked={livello === l}
                onChange={() => scelta(() => setLivello(l))}
                className="sr-only"
              />
              <span className="font-semibold">
                {NOMI_LIVELLO[l].titolo}
                {l === livelloConsigliato(f) ? <span className="font-normal text-muted"> · consigliato</span> : null}
              </span>
              <span className="text-muted">{NOMI_LIVELLO[l].descrizione}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <CampoTesto
          id={`${id}-termine`}
          etichetta="Nuovo termine per pagare"
          tipo="date"
          valore={termine}
          onCambia={(v) => scelta(() => setTermine(v))}
          errore={termineValido ? undefined : "Scegli una data da oggi in poi."}
          aiuto={`Bleo propone ${GIORNI_NUOVO_TERMINE} giorni da oggi: puoi cambiare la data.`}
        />
        <CampoTesto
          id={`${id}-iban`}
          etichetta="IBAN per il pagamento"
          valore={iban}
          onCambia={(v) => scelta(() => setIbanScritto(v))}
          errore={ibanLetto.errore ?? undefined}
          placeholder="Facoltativo"
          maxLength={60}
          aiuto={
            locali.iban && ibanScritto === null
              ? "Preso dallo strumento fattura di questo browser. Bleo non lo salva."
              : "Facoltativo. Resta nel tuo browser: Bleo non lo salva."
          }
        />
        <CampoTesto
          id={`${id}-firma`}
          etichetta="Il tuo nome o quello della ditta"
          valore={firma}
          onCambia={(v) => scelta(() => setFirmaScritta(v))}
          placeholder="Per la firma"
          maxLength={FIRMA_MASSIMA}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-4 space-y-3">
        <CampoTesto
          id={`${id}-oggetto`}
          etichetta="Oggetto"
          valore={attuale.oggetto}
          onCambia={(v) => setModificato({ ...attuale, oggetto: v })}
          maxLength={200}
        />
        <CampoArea
          id={`${id}-testo`}
          etichetta="Testo"
          valore={attuale.testo}
          onCambia={(v) => setModificato({ ...attuale, testo: v })}
          righe={16}
          maxLength={5000}
          aiuto="Puoi cambiarlo come vuoi. Se cambi le scelte qui sopra, Bleo lo riscrive."
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={linkEmail(attuale)}
          className={classeSi}
          onClick={() => setStato("Si apre la tua app dell'email: scegli il cliente come destinatario e manda.")}
        >
          <IconaPosta className="size-5" />
          Apri nell&apos;email
        </a>
        <button type="button" className={classeNo} onClick={() => void copia()}>
          <IconaCopia className="size-5" />
          Copia il testo
        </button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-muted" role="status" aria-live="polite">
        {stato}
      </p>

      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          L&apos;hai mandato? Segnalo qui: la prossima volta Bleo ti propone il passo successivo.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className={`${classePiccolo} border-brand text-brand`} disabled={inCorso} onClick={() => void segnaInviato()}>
            <IconaSpunta className="size-4" />
            {inCorso ? "Salvo…" : "Segna come inviato oggi"}
          </button>
          <button type="button" className={classePiccolo} disabled={inCorso} onClick={onChiudi}>
            Chiudi
          </button>
        </div>
      </div>
      <Messaggio testo={errore} />

      <div className="mt-4 space-y-2 rounded-xl bg-brand-soft/60 p-4 text-sm">
        <p className="font-semibold">Da sapere</p>
        <p>
          Se in fattura c&apos;era una data di pagamento, quando passa il cliente è in mora (art. 102 CO): puoi chiedere
          gli interessi di mora previsti dalla legge, il {TASSO_INTERESSE_MORA} all&apos;anno, se nel contratto non ne avete pattuiti di
          più alti (art. 104 CO). Il secondo sollecito li ricorda.
        </p>
        <p>
          Mandare un sollecito non è obbligatorio, ma si usa. Se il cliente non paga neanche dopo i solleciti, la via
          ufficiale è la domanda d&apos;esecuzione all&apos;{ufficio} del luogo di domicilio del cliente.
        </p>
        <p>
          Sono informazioni generali, non una consulenza: se il cliente contesta la fattura o il tuo caso è complicato,
          chiedi a un fiduciario autorizzato o a un avvocato.
        </p>
        <ElencoFonti
          fonti={FONTI_SOLLECITO}
          verificatoIl={VERIFICA_FONTI_SOLLECITO}
        />
      </div>
    </section>
  );
}
