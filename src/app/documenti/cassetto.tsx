"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { chiama } from "@/app/conti/api";
import { Messaggio, Sezione, classeNo, classePiccolo, classeSi } from "@/app/conti/ui-conti";
import {
  IconaCalendario,
  IconaCestino,
  IconaDocumento,
  IconaFotocamera,
  IconaPenna,
  IconaPiu,
} from "@/components/strumenti/icone";
import { ErroreFile, preparaFile, type FilePronto } from "@/components/strumenti/prepara-file";
import { CampoArea, CampoScelta, CampoTesto, FonteLink } from "@/components/strumenti/ui";
import { dataSvizzera, regolePermessi } from "@/data/svizzera";
import { DOCUMENTI_MASSIMI, GIORNI_AVVISO_DOCUMENTI, LUNGHEZZE_CASSETTO } from "@/lib/cassetto/limiti";
import { badgeScadenza, eventiDocumenti, raggruppaDocumenti, testoDataScadenza } from "@/lib/cassetto/scadenze";
import {
  TIPI_DOCUMENTO,
  etichettaTipoDocumento,
  type DocumentoCassetto,
  type RispostaCassetto,
  type TipoDocumento,
} from "@/lib/cassetto/tipi";
import { formatoMegabyte, PESO_MASSIMO_PDF } from "@/lib/lettera/richiesta";
import { generaIcs } from "@/lib/percorso/calendario";

type Stato =
  | { tipo: "caricamento" }
  | { tipo: "errore"; messaggio: string }
  | { tipo: "pronto"; documenti: DocumentoCassetto[] };

/** Il cassetto per chi ha fatto l'accesso: legge /api/documenti e ricarica dopo ogni modifica. */
export function Cassetto({ oggi }: { oggi: string }) {
  const [versione, setVersione] = useState(0);
  const [stato, setStato] = useState<Stato>({ tipo: "caricamento" });
  const [annuncio, setAnnuncio] = useState("");

  useEffect(() => {
    let attivo = true;
    chiama<RispostaCassetto>("/api/documenti").then((esito) => {
      if (!attivo) return;
      setStato(esito.ok ? { tipo: "pronto", documenti: esito.dati.documenti } : { tipo: "errore", messaggio: esito.messaggio });
    });
    return () => {
      attivo = false;
    };
  }, [versione]);

  function cambiato(testo: string) {
    setAnnuncio(testo);
    setVersione((v) => v + 1);
  }

  if (stato.tipo === "caricamento") {
    return (
      <p className="mt-8 rounded-2xl border border-border bg-card p-5 text-muted" role="status">
        Apro il cassetto…
      </p>
    );
  }
  if (stato.tipo === "errore") {
    return (
      <div className="mt-8">
        <Messaggio testo={stato.messaggio} />
        <button type="button" className={`${classeNo} mt-3`} onClick={() => setVersione((v) => v + 1)}>
          Riprova
        </button>
      </div>
    );
  }

  const { documenti } = stato;
  const { daGuardare, altri } = raggruppaDocumenti(documenti, oggi);
  const pieno = documenti.length >= DOCUMENTI_MASSIMI;

  return (
    <div className="mt-8 space-y-12">
      <p className="sr-only" role="status" aria-live="polite">
        {annuncio}
      </p>

      {daGuardare.length > 0 ? (
        <Sezione
          id="da-guardare"
          titolo={
            <>
              Da guardare
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-sm font-bold text-background">
                {daGuardare.length}
              </span>
            </>
          }
          descrizione={`Documenti scaduti o che scadono nei prossimi ${GIORNI_AVVISO_DOCUMENTI[0]} giorni: controlla se devi rinnovarli.`}
        >
          <ElencoDocumenti documenti={daGuardare} oggi={oggi} onCambiato={cambiato} />
        </Sezione>
      ) : null}

      <Sezione id="aggiungi" titolo="Aggiungi un documento">
        {pieno ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
            Nel cassetto ci sono già {DOCUMENTI_MASSIMI} documenti, il massimo. Elimina quelli che non ti servono più per
            aggiungerne altri.
          </p>
        ) : (
          <NuovoDocumento apertoAllInizio={documenti.length === 0} onAggiunto={cambiato} />
        )}
      </Sezione>

      <Sezione
        id="documenti"
        titolo={daGuardare.length > 0 ? "Gli altri documenti" : "I tuoi documenti"}
        descrizione={
          documenti.length > 0
            ? "Prima quelli con una scadenza, dalla più vicina; poi quelli che non scadono."
            : undefined
        }
      >
        {documenti.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
            Il cassetto è vuoto. Inizia dai documenti che ti servono più spesso: la decisione della cassa AVS, il numero
            IVA, la polizza dell&apos;assicurazione.
          </p>
        ) : altri.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
            Tutti i tuoi documenti sono qui sopra, in «Da guardare».
          </p>
        ) : (
          <ElencoDocumenti documenti={altri} oggi={oggi} onCambiato={cambiato} />
        )}
      </Sezione>

      <ScadenzeNelCalendario documenti={documenti} oggi={oggi} />
    </div>
  );
}

function ElencoDocumenti({
  documenti,
  oggi,
  onCambiato,
}: {
  documenti: DocumentoCassetto[];
  oggi: string;
  onCambiato: (annuncio: string) => void;
}) {
  return (
    <ul className="space-y-4">
      {documenti.map((d) => (
        <li key={d.id}>
          <SchedaDocumento documento={d} oggi={oggi} onCambiato={onCambiato} />
        </li>
      ))}
    </ul>
  );
}

const classeGrandeRosso =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-danger px-5 py-2.5 text-base font-semibold text-background transition-colors hover:opacity-90 disabled:opacity-60";

const TONI_BADGE = {
  pericolo: "bg-danger text-background",
  attenzione: "bg-accent text-background",
  neutro: "border border-border text-muted",
} as const;

function Badge({ scadeIl, oggi }: { scadeIl: string | null; oggi: string }) {
  const badge = badgeScadenza(scadeIl, oggi);
  if (!badge || badge.tono === "neutro") return null;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${TONI_BADGE[badge.tono]}`}>
      {badge.testo}
    </span>
  );
}

/** «Polizza d'assicurazione · Scade il 31.01.2027»; senza il tipo se il nome è già quello. */
function sottotitolo(d: DocumentoCassetto, oggi: string): string {
  const tipo = etichettaTipoDocumento(d.tipo);
  return [d.titolo.trim() === tipo ? null : tipo, testoDataScadenza(d.scadeIl, oggi)].filter(Boolean).join(" · ");
}

function descrizioneFile(file: DocumentoCassetto["file"]): string {
  const genere = file.tipo === "application/pdf" ? "PDF" : "Foto";
  return [genere, formatoMegabyte(file.byte), file.nome].filter(Boolean).join(" · ");
}

/** Apre il file con un link temporaneo, in una nuova scheda. */
async function apriFile(id: string): Promise<string | null> {
  // La scheda si apre subito (al clic), così il browser non la blocca; poi riceve il link.
  const scheda = window.open("", "_blank");
  const esito = await chiama<{ url: string }>(`/api/documenti/${encodeURIComponent(id)}/file`);
  if (!esito.ok) {
    scheda?.close();
    return esito.messaggio;
  }
  if (scheda) {
    scheda.opener = null;
    scheda.location.href = esito.dati.url;
  } else {
    window.location.href = esito.dati.url;
  }
  return null;
}

function SchedaDocumento({
  documento: d,
  oggi,
  onCambiato,
}: {
  documento: DocumentoCassetto;
  oggi: string;
  onCambiato: (annuncio: string) => void;
}) {
  const [modo, setModo] = useState<"vedi" | "modifica" | "elimina">("vedi");
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const idTitolo = `documento-${d.id}`;

  async function elimina() {
    setInCorso(true);
    setMessaggio(null);
    const esito = await chiama<void>(`/api/documenti/${encodeURIComponent(d.id)}`, { metodo: "DELETE" });
    setInCorso(false);
    if (!esito.ok) {
      setMessaggio(esito.messaggio);
      return;
    }
    onCambiato(`«${d.titolo}» eliminato dal cassetto.`);
  }

  return (
    <article aria-labelledby={idTitolo} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={idTitolo} className="font-semibold break-words">
            {d.titolo}
          </h3>
          <p className="text-sm text-muted">{sottotitolo(d, oggi)}</p>
        </div>
        <Badge scadeIl={d.scadeIl} oggi={oggi} />
      </div>
      {d.nota ? <p className="mt-2 text-sm break-words whitespace-pre-line">{d.nota}</p> : null}
      <p className="mt-2 text-xs text-muted break-all">{descrizioneFile(d.file)}</p>
      {d.tipo === "permesso" ? <NotaPermesso /> : null}

      {modo === "modifica" ? (
        <ModificaDocumento
          documento={d}
          onAnnulla={() => setModo("vedi")}
          onSalvato={(nuovo) => {
            setModo("vedi");
            onCambiato(`«${nuovo.titolo}» aggiornato.`);
          }}
        />
      ) : modo === "elimina" ? (
        <div className="mt-4 rounded-xl border border-danger/40 p-3" role="group" aria-label={`Eliminare ${d.titolo}?`}>
          <p className="text-sm font-medium">Eliminare questo documento? Cancelliamo anche il file, per sempre.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={classeGrandeRosso}
              onClick={elimina}
              disabled={inCorso}
            >
              {inCorso ? "Elimino…" : "Sì, elimina"}
            </button>
            <button type="button" className={classeNo} onClick={() => setModo("vedi")} disabled={inCorso}>
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={classePiccolo} onClick={async () => setMessaggio(await apriFile(d.id))}>
            <IconaDocumento className="size-4" />
            Apri<span className="sr-only"> {d.titolo}</span>
          </button>
          <button type="button" className={classePiccolo} onClick={() => setModo("modifica")}>
            <IconaPenna className="size-4" />
            Modifica<span className="sr-only"> {d.titolo}</span>
          </button>
          <button type="button" className={classePiccolo} onClick={() => setModo("elimina")}>
            <IconaCestino className="size-4" />
            Elimina<span className="sr-only"> {d.titolo}</span>
          </button>
        </div>
      )}
      <Messaggio testo={messaggio} />
    </article>
  );
}

/** Il termine per il rinnovo del permesso, con la fonte ufficiale. */
function NotaPermesso() {
  const rinnovo = regolePermessi.rinnovoPrimaDellaScadenzaGiorni;
  return (
    <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm">
      In Ticino il rinnovo del permesso va chiesto all&apos;Ufficio della migrazione almeno {rinnovo.valore} giorni prima
      della scadenza. Fonte: <FonteLink fonte={rinnovo.fonte} /> ({rinnovo.fonte.ente}), controllata il{" "}
      {dataSvizzera(rinnovo.verificatoIl)}.
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Campi del documento                                                 */
/* ------------------------------------------------------------------ */

type Campi = { titolo: string; tipo: TipoDocumento; scadeIl: string; nota: string };
type Errori = Partial<Record<keyof Campi, string>>;

const ETICHETTE = new Set<string>(TIPI_DOCUMENTO.map((t) => t.etichetta));

function controllaCampi(campi: Campi): Errori {
  const errori: Errori = {};
  if (!campi.titolo.trim()) errori.titolo = "Scrivi un nome per il documento, per esempio «Polizza RC».";
  if (campi.scadeIl && !/^\d{4}-\d{2}-\d{2}$/.test(campi.scadeIl)) errori.scadeIl = "Scegli una data valida, oppure lasciala vuota.";
  return errori;
}

function corpoCampi(campi: Campi) {
  return {
    titolo: campi.titolo.trim(),
    tipo: campi.tipo,
    scadeIl: campi.scadeIl || null,
    nota: campi.nota.trim() || null,
  };
}

function CampiDocumento({
  id,
  valori,
  onCambia,
  errori,
}: {
  id: string;
  valori: Campi;
  onCambia: (v: Campi) => void;
  errori: Errori;
}) {
  const cambia = <K extends keyof Campi>(campo: K, valore: Campi[K]) => onCambia({ ...valori, [campo]: valore });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoScelta
        id={`${id}-tipo`}
        etichetta="Che documento è?"
        valore={valori.tipo}
        onCambia={(tipo) =>
          onCambia({
            ...valori,
            tipo,
            // Il nome segue il tipo finché non lo scrivi tu.
            titolo:
              !valori.titolo.trim() || ETICHETTE.has(valori.titolo.trim())
                ? tipo === "altro"
                  ? ""
                  : etichettaTipoDocumento(tipo)
                : valori.titolo,
          })
        }
        opzioni={TIPI_DOCUMENTO.map((t) => ({ valore: t.id, etichetta: t.etichetta }))}
        errore={errori.tipo}
      />
      <CampoTesto
        id={`${id}-titolo`}
        etichetta="Nome"
        valore={valori.titolo}
        onCambia={(v) => cambia("titolo", v)}
        errore={errori.titolo}
        placeholder="Per esempio: Polizza RC aziendale"
        maxLength={LUNGHEZZE_CASSETTO.titolo}
      />
      <CampoTesto
        id={`${id}-scadenza`}
        etichetta="Scade il (facoltativo)"
        tipo="date"
        valore={valori.scadeIl}
        onCambia={(v) => cambia("scadeIl", v)}
        errore={errori.scadeIl}
        aiuto="Lascia vuoto se il documento non scade."
      />
      <CampoArea
        id={`${id}-nota`}
        etichetta="Nota (facoltativa)"
        valore={valori.nota}
        onCambia={(v) => cambia("nota", v)}
        placeholder="Per esempio: numero di polizza, a chi chiedere il rinnovo"
        righe={2}
        maxLength={LUNGHEZZE_CASSETTO.nota}
      />
    </div>
  );
}

function ModificaDocumento({
  documento,
  onAnnulla,
  onSalvato,
}: {
  documento: DocumentoCassetto;
  onAnnulla: () => void;
  onSalvato: (documento: DocumentoCassetto) => void;
}) {
  const [campi, setCampi] = useState<Campi>({
    titolo: documento.titolo,
    tipo: documento.tipo,
    scadeIl: documento.scadeIl ?? "",
    nota: documento.nota ?? "",
  });
  const [errori, setErrori] = useState<Errori>({});
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);

  async function salva() {
    const trovati = controllaCampi(campi);
    setErrori(trovati);
    if (Object.keys(trovati).length > 0) return;
    setInCorso(true);
    setMessaggio(null);
    const esito = await chiama<{ documento: DocumentoCassetto }>(`/api/documenti/${encodeURIComponent(documento.id)}`, {
      metodo: "PATCH",
      corpo: corpoCampi(campi),
    });
    setInCorso(false);
    if (!esito.ok) {
      setMessaggio(esito.messaggio);
      return;
    }
    onSalvato(esito.dati.documento);
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <CampiDocumento id={`modifica-${documento.id}`} valori={campi} onCambia={setCampi} errori={errori} />
      <p className="mt-3 text-xs text-muted">Il file resta lo stesso. Per cambiarlo, elimina il documento e caricalo di nuovo.</p>
      <Messaggio testo={messaggio} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={classeSi} onClick={salva} disabled={inCorso}>
          {inCorso ? "Salvo…" : "Salva le modifiche"}
        </button>
        <button type="button" className={classeNo} onClick={onAnnulla} disabled={inCorso}>
          Annulla
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Nuovo documento                                                     */
/* ------------------------------------------------------------------ */

const CAMPI_VUOTI: Campi = { titolo: etichettaTipoDocumento("decisione_avs"), tipo: "decisione_avs", scadeIl: "", nota: "" };

function NuovoDocumento({
  apertoAllInizio,
  onAggiunto,
}: {
  apertoAllInizio: boolean;
  onAggiunto: (annuncio: string) => void;
}) {
  const [aperto, setAperto] = useState(apertoAllInizio);
  const [campi, setCampi] = useState<Campi>(CAMPI_VUOTI);
  const [errori, setErrori] = useState<Errori>({});
  const [file, setFile] = useState<FilePronto | null>(null);
  const [stato, setStato] = useState<"pronto" | "preparo" | "invio">("pronto");
  const [errore, setErrore] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const inputFile = useRef<HTMLInputElement>(null);

  async function scegli(evento: ChangeEvent<HTMLInputElement>) {
    const scelto = evento.target.files?.[0];
    evento.target.value = "";
    if (!scelto) return;
    setErrore(null);
    setOk(null);
    setStato("preparo");
    try {
      setFile(await preparaFile(scelto, { controllaPagine: false }));
    } catch (e) {
      setErrore(e instanceof ErroreFile ? e.message : "Non riesco a leggere il file. Riprova con un'altra foto.");
    } finally {
      setStato("pronto");
    }
  }

  async function salva() {
    const trovati = controllaCampi(campi);
    setErrori(trovati);
    setOk(null);
    if (!file) {
      setErrore("Scegli una foto o un PDF del documento.");
      return;
    }
    if (Object.keys(trovati).length > 0) return;
    setErrore(null);
    setStato("invio");
    const esito = await chiama<{ documento: DocumentoCassetto }>("/api/documenti", {
      metodo: "POST",
      corpo: { ...corpoCampi(campi), file: { tipo: file.tipo, dati: file.dati, nomeFile: file.nome } },
    });
    setStato("pronto");
    if (!esito.ok) {
      setErrore(esito.messaggio);
      return;
    }
    setCampi(CAMPI_VUOTI);
    setFile(null);
    setErrori({});
    setOk(`Fatto: «${esito.dati.documento.titolo}» è nel cassetto.`);
    onAggiunto(`«${esito.dati.documento.titolo}» aggiunto al cassetto.`);
  }

  if (!aperto) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm text-muted">Una foto o un PDF, con il nome e, se c&apos;è, la data di scadenza.</p>
        <button type="button" className={`${classeSi} mt-4 w-full sm:w-auto`} onClick={() => setAperto(true)}>
          <IconaPiu className="size-5" />
          Aggiungi un documento
        </button>
        <Messaggio testo={ok} tipo="ok" />
      </div>
    );
  }

  const occupato = stato !== "pronto";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <CampiDocumento id="nuovo-documento" valori={campi} onCambia={setCampi} errori={errori} />
      {campi.tipo === "permesso" ? <NotaPermesso /> : null}

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Il file</legend>
        <p className="mt-1 text-sm text-muted">
          Una foto (la riduciamo prima di mandarla) o un PDF fino a {formatoMegabyte(PESO_MASSIMO_PDF)}.
        </p>
        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={scegli}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          ref={inputFile}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
          onChange={scegli}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        {file ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
            <p className="min-w-0 text-sm break-all">
              <span className="font-medium">{file.tipo === "application/pdf" ? "PDF pronto" : "Foto pronta"}:</span>{" "}
              {file.nome} ({formatoMegabyte(file.byte)})
            </p>
            <button type="button" className={classePiccolo} onClick={() => setFile(null)} disabled={occupato}>
              Cambia file
            </button>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" className={classeNo} disabled={occupato} onClick={() => inputFoto.current?.click()}>
              <IconaFotocamera className="size-5" />
              {stato === "preparo" ? "Preparo la foto…" : "Scatta una foto"}
            </button>
            <button type="button" className={classeNo} disabled={occupato} onClick={() => inputFile.current?.click()}>
              <IconaDocumento className="size-5" />
              Scegli foto o PDF
            </button>
          </div>
        )}
      </fieldset>

      <Messaggio testo={errore} />
      <Messaggio testo={ok} tipo="ok" />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={classeSi} onClick={salva} disabled={occupato}>
          {stato === "invio" ? "Salvo nel cassetto…" : "Salva nel cassetto"}
        </button>
        <button
          type="button"
          className={classeNo}
          onClick={() => {
            setAperto(false);
            setErrore(null);
          }}
          disabled={occupato}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calendario                                                          */
/* ------------------------------------------------------------------ */

function ScadenzeNelCalendario({ documenti, oggi }: { documenti: DocumentoCassetto[]; oggi: string }) {
  const [annuncio, setAnnuncio] = useState("");
  const conScadenza = eventiDocumenti(documenti, oggi);
  if (conScadenza.length === 0) return null;
  const [primo, secondo] = GIORNI_AVVISO_DOCUMENTI;

  function scarica() {
    const eventi = eventiDocumenti(documenti, oggi, `${window.location.origin}/documenti`);
    const ics = generaIcs(eventi, {
      adesso: new Date(),
      nomeCalendario: "Bleo: scadenze dei documenti",
      giorniPreavviso: GIORNI_AVVISO_DOCUMENTI,
    });
    try {
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "bleo-scadenze-documenti.ics";
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setAnnuncio(
        eventi.length === 1
          ? "Calendario scaricato con 1 scadenza. Aprilo per importarla nel tuo calendario."
          : `Calendario scaricato con ${eventi.length} scadenze. Aprilo per importarle nel tuo calendario.`,
      );
    } catch {
      setAnnuncio("Non sono riuscito a creare il file. Prova con un altro browser.");
    }
  }

  return (
    <Sezione id="calendario" titolo="Le scadenze nel tuo calendario">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm text-muted">
          Un file da aprire con Google Calendar, Calendario di Apple o Outlook: una data per ogni documento che scade, con
          un avviso {primo} e {secondo} giorni prima. Nell&apos;app di Bleo arrivano anche le notifiche sul telefono.
        </p>
        <button type="button" className={`${classeNo} mt-4 w-full sm:w-auto`} onClick={scarica}>
          <IconaCalendario className="size-5" />
          Scarica le scadenze (.ics)
        </button>
        <p role="status" aria-live="polite" className="mt-2 text-sm">
          {annuncio}
        </p>
      </div>
    </Sezione>
  );
}
