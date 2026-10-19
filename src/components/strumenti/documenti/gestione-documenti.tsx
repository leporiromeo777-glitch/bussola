"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { dataSvizzera } from "@/data/svizzera";
import { documentoDaPrecompilazione, leggiPrecompilazione, type LetturaLink } from "@/lib/clienti/fattura";
import { emittenteCompilato } from "@/lib/strumenti/account";
import { CHIAVI_ARCHIVIO } from "@/lib/strumenti/archivio";
import {
  calcolaTotali,
  controllaDocumento,
  dataIsoLocale,
  dataIsoValida,
  duplicaDocumento,
  elementiObbligatoriIva,
  emittenteVuoto,
  fatturaPerConti,
  NOMI_TIPO,
  nuovoDocumento,
  preventivoInFattura,
  schemaElencoDocumenti,
  schemaEmittente,
  type Contesto,
  type Documento,
  type Emittente,
  type TipoDocumento,
} from "@/lib/strumenti/documenti";
import { importo } from "@/lib/strumenti/numeri";
import { fonti, fontiStrumenti } from "@/data/svizzera";
import { NotaDatiLocali, PulsanteStampa } from "../dati-locali";
import { IconaCestino, IconaCopia, IconaFattura, IconaPiu, IconaSpunta } from "../icone";
import { nuovoId } from "../id";
import { NotaNonConsulenza } from "../intestazione";
import { cancellaArchivio, useArchivio } from "../usa-archivio";
import {
  Caricamento,
  classeLink,
  classePulsantePiccolo,
  classePulsantePrincipale,
  classePulsanteSecondario,
  FonteLink,
} from "../ui";
import { CaricamentoAccount, ErroreAccount, ImportaDalBrowser, NotaAccount } from "./account-documenti";
import { AnteprimaDocumento } from "./anteprima-documento";
import { ModuloDocumento } from "./modulo-documento";
import { RegistraNeiConti, type AccessoConti } from "./registra-conti";
import { useArchivioAccount } from "./usa-archivio-account";

const nessunDocumento = (): Documento[] => [];

function contesto(): Contesto {
  const adesso = new Date();
  return { id: nuovoId(), oggiIso: dataIsoLocale(adesso), adessoIso: adesso.toISOString(), idRiga: nuovoId };
}

function mostraNellUrl(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("doc", id);
  else url.searchParams.delete("doc");
  // I dati arrivati dopo il «#» (ore da fatturare) non restano nell'indirizzo.
  url.hash = "";
  window.history.replaceState(null, "", url);
}

/** Ore da fatturare arrivate nel link (#ore=…, da «Clienti e ore»): solo nel browser, letto una volta. */
function letturaDalLink(): LetturaLink | null {
  if (typeof window === "undefined") return null;
  return leggiPrecompilazione(window.location.hash);
}

type Aggiornamento<T> = (aggiornamento: (precedente: T) => T) => void;

export function GestioneDocumenti({
  tipo,
  idIniziale,
  accesso = null,
}: {
  tipo: TipoDocumento;
  idIniziale: string | null;
  /**
   * «collegato»: i documenti stanno nell'account (anche nell'app); «ospite»:
   * nel browser, con l'invito ad accedere; null (account non attivi): nel
   * browser. Per le fatture vale anche per «Registra in I tuoi conti».
   */
  accesso?: AccessoConti;
}) {
  const router = useRouter();
  // Se l'account non risponde, si può lavorare nel browser come senza accesso.
  const [soloBrowser, setSoloBrowser] = useState(false);
  const collegato = accesso === "collegato" && !soloBrowser;
  const [documentiLocali, aggiornaDocumentiLocali] = useArchivio(CHIAVI_ARCHIVIO.documenti, schemaElencoDocumenti, nessunDocumento);
  const [profiloLocale, aggiornaProfiloLocale] = useArchivio(CHIAVI_ARCHIVIO.emittente, schemaEmittente, emittenteVuoto);
  const { stato: conto, archivio } = useArchivioAccount(collegato);
  const contoPronto = collegato && conto?.caricamento === "pronto" ? conto : null;

  // Con l'accesso i dati vengono dall'account; senza, dal browser come prima.
  // Se l'account non ha ancora i tuoi dati, si parte da quelli del browser.
  const emittenteConto = contoPronto?.emittente ?? null;
  const profiloConto = useMemo(
    () => (emittenteConto ?? (emittenteCompilato(profiloLocale) ? profiloLocale : null) ?? emittenteVuoto()),
    [emittenteConto, profiloLocale],
  );
  const documenti = collegato ? (contoPronto?.documenti ?? null) : documentiLocali;
  const profilo = collegato ? (contoPronto ? profiloConto : null) : profiloLocale;
  const aggiornaDocumenti = useMemo<Aggiornamento<Documento[]>>(
    () => (collegato ? (modifica) => archivio?.aggiornaDocumenti(modifica) : aggiornaDocumentiLocali),
    [collegato, archivio, aggiornaDocumentiLocali],
  );
  const aggiornaProfilo: Aggiornamento<Emittente> = collegato
    ? (modifica) => archivio?.aggiornaEmittente((p) => modifica(p ?? profiloConto))
    : aggiornaProfiloLocale;
  // Fattura dalle ore: il documento ha l'id della precompilazione, quindi si apre subito quello.
  const [dalLink] = useState(() => (tipo === "fattura" ? letturaDalLink() : null));
  const daOre = dalLink?.ok ? dalLink.dati : null;
  const [selezionato, setSelezionato] = useState<string | null>(daOre?.id ?? idIniziale);
  const [daEliminare, setDaEliminare] = useState<string | null>(null);
  const [annuncio, setAnnuncio] = useState("");
  const importata = useRef(false);

  // Crea la fattura dalle ore (una volta sola: se c'è già, la riapre) e toglie i dati dall'indirizzo.
  useEffect(() => {
    if (!dalLink || !documenti || !profilo || importata.current) return;
    importata.current = true;
    if (dalLink.ok) {
      const p = dalLink.dati;
      aggiornaDocumenti((lista) =>
        lista.some((d) => d.id === p.id) ? lista : [...lista, documentoDaPrecompilazione(p, profilo, lista, contesto())],
      );
      mostraNellUrl(p.id);
    } else {
      mostraNellUrl(idIniziale);
    }
  }, [dalLink, documenti, profilo, aggiornaDocumenti, idIniziale]);

  const nomi = NOMI_TIPO[tipo];
  const titoloElenco = nomi.elenco;
  const elenco = useMemo(
    () => (documenti ?? []).filter((d) => d.tipo === tipo).sort((a, b) => b.aggiornatoIl.localeCompare(a.aggiornatoIl)),
    [documenti, tipo],
  );

  if (collegato && conto?.caricamento === "errore" && archivio) {
    return (
      <ErroreAccount
        stato={conto}
        tipo={tipo}
        onRiprova={() => void archivio.carica()}
        onSoloBrowser={() => setSoloBrowser(true)}
      />
    );
  }
  if (!documenti || !profilo) return collegato ? <CaricamentoAccount /> : <Caricamento />;

  const doc = documenti.find((d) => d.id === selezionato) ?? null;
  const docAltroTipo = doc && doc.tipo !== tipo ? doc : null;

  const apri = (id: string | null) => {
    setSelezionato(id);
    setDaEliminare(null);
    mostraNellUrl(id);
  };

  const crea = () => {
    const nuovo = nuovoDocumento(tipo, profilo, documenti, contesto());
    aggiornaDocumenti((lista) => [...lista, nuovo]);
    apri(nuovo.id);
    setAnnuncio(`${nomi.singolare} ${nuovo.numero} ${nomi.creato}.`);
  };

  const duplica = (origine: Documento) => {
    const copia = duplicaDocumento(origine, documenti, contesto());
    aggiornaDocumenti((lista) => [...lista, copia]);
    apri(copia.id);
    setAnnuncio(`Copia creata: ${copia.numero}.`);
  };

  const elimina = (id: string) => {
    const eliminato = documenti.find((d) => d.id === id);
    aggiornaDocumenti((lista) => lista.filter((d) => d.id !== id));
    if (selezionato === id) apri(null);
    setDaEliminare(null);
    setAnnuncio(eliminato ? `${NOMI_TIPO[eliminato.tipo].singolare} ${eliminato.numero} ${NOMI_TIPO[eliminato.tipo].eliminato}.` : "Documento eliminato.");
  };

  const inFattura = (preventivo: Documento) => {
    const fattura = preventivoInFattura(preventivo, documenti, contesto());
    aggiornaDocumenti((lista) => [...lista, fattura]);
    router.push(`/strumenti/fattura?doc=${encodeURIComponent(fattura.id)}`);
  };

  const aggiornaDoc = (id: string, modifica: (d: Documento) => Documento) =>
    aggiornaDocumenti((lista) =>
      lista.map((d) => (d.id === id ? { ...modifica(d), aggiornatoIl: new Date().toISOString() } : d)),
    );

  const aggiornaEmittente = (id: string, modifica: Partial<Emittente>) => {
    aggiornaDoc(id, (d) => ({ ...d, emittente: { ...d.emittente, ...modifica } }));
    aggiornaProfilo((p) => ({ ...p, ...modifica }));
  };

  return (
    <div className="mt-8 space-y-8 print:mt-0 print:space-y-0">
      {contoPronto && archivio ? (
        <>
          <NotaAccount stato={contoPronto} onRiprova={() => void archivio.salva()} />
          {documentiLocali ? (
            <ImportaDalBrowser
              stato={contoPronto}
              archivio={archivio}
              locali={documentiLocali}
              profiloLocale={profiloLocale}
              onTogliDalBrowser={(ids) => aggiornaDocumentiLocali((lista) => lista.filter((d) => !ids.has(d.id)))}
              onTogliProfilo={() => cancellaArchivio(CHIAVI_ARCHIVIO.emittente)}
            />
          ) : null}
        </>
      ) : (
        <div className="space-y-2 print:hidden">
          <NotaDatiLocali
            chiavi={[CHIAVI_ARCHIVIO.documenti, CHIAVI_ARCHIVIO.emittente]}
            etichettaCancella="Cancella preventivi, fatture e i tuoi dati"
          />
          {accesso === "ospite" ? (
            <p className="text-sm text-muted">
              Con un account li salvi nel tuo account e li ritrovi anche nell&apos;app Bleo sul telefono.{" "}
              <Link href={`/accedi?next=/strumenti/${tipo}`} className={classeLink}>
                Accedi
              </Link>
            </p>
          ) : null}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {annuncio}
      </p>

      {dalLink && !dalLink.ok ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-card p-4 font-medium text-danger print:hidden">
          Non riesco a leggere le ore da fatturare arrivate con il link. Torna a{" "}
          <Link href="/conti/clienti" className={classeLink}>
            Clienti e ore
          </Link>{" "}
          e crea di nuovo la fattura.
        </p>
      ) : null}
      {daOre && doc?.id === daOre.id ? (
        <p role="status" className="rounded-xl border border-brand bg-brand-soft p-4 print:hidden">
          <span className="font-semibold">Fattura preparata dalle ore di {daOre.cliente.nome}.</span> Controlla le voci e
          completa i tuoi dati se mancano: poi stampala o salvala in PDF. Le ore sono già segnate come fatturate in{" "}
          <Link href="/conti/clienti" className={classeLink}>
            Clienti e ore
          </Link>
          .
        </p>
      ) : null}

      <section aria-labelledby="titolo-elenco" className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titolo-elenco" className="text-xl font-semibold">
            {titoloElenco}
          </h2>
          <button type="button" className={classePulsantePrincipale} onClick={crea}>
            <IconaPiu className="size-4" />
            {nomi.nuovo}
          </button>
        </div>
        {elenco.length === 0 ? (
          <p className="mt-3 rounded-xl border border-border bg-card p-4 text-muted">
            Non hai ancora {nomi.plurale} {collegato ? "nel tuo account" : "su questo dispositivo"}.{" "}
            {tipo === "fattura" ? (
              <>
                Puoi partire da zero o da un <Link href="/strumenti/preventivo" className={classeLink}>preventivo</Link>.
              </>
            ) : null}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {elenco.map((d) => {
              const totale = calcolaTotali(d).totale;
              const attivo = d.id === selezionato;
              return (
                <li key={d.id} className={`flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between ${attivo ? "bg-brand-soft" : ""}`}>
                  <button type="button" onClick={() => apri(d.id)} className="min-w-0 text-left" aria-current={attivo ? "true" : undefined}>
                    <span className="block font-medium">
                      {d.numero || "Senza numero"}
                      <span className="font-normal text-muted"> · {d.cliente.nome || "cliente da scrivere"}</span>
                    </span>
                    <span className="block text-sm text-muted">
                      {dataIsoValida(d.data) ? dataSvizzera(d.data) : ""} · {importo(totale, 2, d.valuta)}
                      {d.daPreventivo ? ` · da ${d.daPreventivo}` : ""}
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" className={classePulsantePiccolo} onClick={() => apri(d.id)}>
                      {attivo ? NOMI_TIPO[d.tipo].aperto : "Apri"}
                      <span className="sr-only"> {d.numero}</span>
                    </button>
                    <button type="button" className={classePulsantePiccolo} onClick={() => duplica(d)}>
                      <IconaCopia className="size-4" />
                      Duplica<span className="sr-only"> {d.numero}</span>
                    </button>
                    {daEliminare === d.id ? (
                      <>
                        <button type="button" className={`${classePulsantePiccolo} border-danger text-danger`} onClick={() => elimina(d.id)}>
                          Sì, elimina<span className="sr-only"> {d.numero}</span>
                        </button>
                        <button type="button" className={classePulsantePiccolo} onClick={() => setDaEliminare(null)}>
                          Annulla
                        </button>
                      </>
                    ) : (
                      <button type="button" className={classePulsantePiccolo} onClick={() => setDaEliminare(d.id)}>
                        <IconaCestino className="size-4" />
                        Elimina<span className="sr-only"> {d.numero}</span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {docAltroTipo ? (
        <p className="rounded-xl border border-border bg-card p-4 print:hidden">
          Questo documento è {NOMI_TIPO[docAltroTipo.tipo].conUn}:{" "}
          <Link href={`/strumenti/${docAltroTipo.tipo}?doc=${encodeURIComponent(docAltroTipo.id)}`} className={classeLink}>
            aprilo nella pagina giusta
          </Link>
          .
        </p>
      ) : null}

      {doc && !docAltroTipo ? (
        <Editor
          key={doc.id}
          doc={doc}
          onCambia={(m) => aggiornaDoc(doc.id, m)}
          onEmittente={(m) => aggiornaEmittente(doc.id, m)}
          onDuplica={() => duplica(doc)}
          onInFattura={tipo === "preventivo" ? () => inFattura(doc) : undefined}
          accessoConti={tipo === "fattura" ? accesso : null}
          nellAccount={collegato}
        />
      ) : null}

      <NotaNonConsulenza className="print:hidden" />
    </div>
  );
}

function Editor({
  doc,
  onCambia,
  onEmittente,
  onDuplica,
  onInFattura,
  accessoConti,
  nellAccount,
}: {
  doc: Documento;
  onCambia: (m: (d: Documento) => Documento) => void;
  onEmittente: (m: Partial<Emittente>) => void;
  onDuplica: () => void;
  onInFattura?: () => void;
  accessoConti: AccessoConti;
  nellAccount: boolean;
}) {
  const problemi = controllaDocumento(doc);
  const nomi = NOMI_TIPO[doc.tipo];
  const elementiIva = doc.emittente.ivaIscritto ? elementiObbligatoriIva(doc) : null;

  return (
    <section aria-labelledby="titolo-editor" className="space-y-8 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 id="titolo-editor" className="text-2xl font-semibold">
          {nomi.singolare} {doc.numero}
        </h2>
        <div className="flex flex-wrap gap-2">
          {onInFattura ? (
            <button type="button" className={classePulsantePrincipale} onClick={onInFattura}>
              <IconaFattura className="size-4" />
              Trasforma in fattura
            </button>
          ) : null}
          <button type="button" className={classePulsanteSecondario} onClick={onDuplica}>
            <IconaCopia className="size-4" />
            Duplica
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <ModuloDocumento doc={doc} onCambia={onCambia} onEmittente={onEmittente} nellAccount={nellAccount} />
      </div>

      <section aria-labelledby="titolo-anteprima-doc" className="space-y-4 print:space-y-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h3 id="titolo-anteprima-doc" className="text-xl font-semibold">
            Anteprima
          </h3>
          <PulsanteStampa />
        </div>

        <div className="grid gap-4 print:hidden lg:grid-cols-2">
          <div className={`rounded-xl border p-4 text-sm ${problemi.length ? "border-accent bg-card" : "border-success bg-card"}`}>
            {problemi.length === 0 ? (
              <p className="flex items-center gap-2 font-medium text-success">
                <IconaSpunta className="size-5" />
                Pronto da stampare o salvare in PDF.
              </p>
            ) : (
              <>
                <p className="font-semibold">Da completare prima di inviarlo</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {problemi.map((p) => (
                    <li key={`${p.campo}-${p.messaggio}`}>{p.messaggio}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {elementiIva ? (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-semibold">Elementi obbligatori con l&apos;IVA</p>
              <ul className="mt-2 space-y-1.5">
                {elementiIva.map((el) => (
                  <li key={el.id} className="flex gap-2">
                    <span aria-hidden="true" className={el.ok ? "text-success" : "text-accent"}>
                      {el.ok ? "✓" : "•"}
                    </span>
                    <span>
                      {el.testo}
                      <span className="sr-only">{el.ok ? ": presente" : ": da completare"}</span>
                      {el.nota ? <span className="block text-xs text-muted">{el.nota}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                Fonte: <FonteLink fonte={fontiStrumenti.liva26} /> (cpv. 2).
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
              Senza iscrizione all&apos;IVA il documento non indica l&apos;IVA (<FonteLink fonte={fonti.liva27} />
              ). Conserva una copia di ogni fattura emessa: i documenti contabili vanno conservati per 10 anni (
              <FonteLink fonte={fonti.co958f} />
              ).
            </div>
          )}
        </div>

        {doc.tipo === "fattura" ? (
          <RegistraNeiConti key={JSON.stringify(fatturaPerConti(doc))} doc={doc} pronta={problemi.length === 0} accesso={accessoConti} />
        ) : null}

        <AnteprimaDocumento doc={doc} />
      </section>
    </section>
  );
}
