"use client";

import { useState } from "react";
import { CampoTesto } from "@/components/strumenti/ui";
import { LUNGHEZZE_ORE } from "@/lib/clienti/limiti";
import type { Cliente } from "@/lib/clienti/tipi";
import { numeroSvizzero } from "@/lib/strumenti/numeri";
import { indirizzoCompleto, LUNGHEZZE_INDIRIZZO_QR } from "@/lib/strumenti/qr";
import { chiama } from "../api";
import { Messaggio, classeNo, classePiccolo, classeSi, importo, leggiImporto } from "../ui-conti";

type Campi = { nome: string; via: string; numero: string; npa: string; localita: string; paese: string; email: string; tariffa: string };

function campiDa(c?: Cliente): Campi {
  return {
    nome: c?.nome ?? "",
    via: c?.via ?? "",
    numero: c?.numero ?? "",
    npa: c?.npa ?? "",
    localita: c?.localita ?? "",
    paese: c?.paese ?? "CH",
    email: c?.email ?? "",
    tariffa: c?.tariffa === null || c?.tariffa === undefined ? "" : numeroSvizzero(c.tariffa, 2).replace(/'/g, ""),
  };
}

/** Indirizzo su una riga: «Via Nassa 5, 6900 Lugano». Il paese solo se non è la Svizzera. */
export function indirizzoBreve(c: Pick<Cliente, "via" | "numero" | "npa" | "localita" | "paese">): string {
  const via = [c.via, c.numero].filter(Boolean).join(" ");
  const luogo = [c.npa, c.localita].filter(Boolean).join(" ");
  return [via, luogo, c.paese !== "CH" ? c.paese : ""].filter(Boolean).join(", ");
}

/** Modulo di un cliente: indirizzo strutturato come nella QR-fattura, email e tariffa facoltative. */
export function ModuloCliente({
  id,
  cliente,
  onSalvato,
  onAnnulla,
}: {
  id: string;
  cliente?: Cliente;
  onSalvato: (cliente: Cliente) => void;
  onAnnulla?: () => void;
}) {
  const [campi, setCampi] = useState<Campi>(() => campiDa(cliente));
  const [errori, setErrori] = useState<Partial<Record<"nome" | "tariffa", string>>>({});
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const cambia = <K extends keyof Campi>(campo: K, valore: Campi[K]) => setCampi((c) => ({ ...c, [campo]: valore }));

  async function salva() {
    const nuovi: typeof errori = {};
    if (!campi.nome.trim()) nuovi.nome = "Scrivi il nome del cliente.";
    const tariffa = campi.tariffa.trim() ? leggiImporto(campi.tariffa) : null;
    if (campi.tariffa.trim() && tariffa === null) nuovi.tariffa = "Scrivi la tariffa in franchi, per esempio 80 o 92.50.";
    setErrori(nuovi);
    if (Object.keys(nuovi).length > 0) return;
    setInCorso(true);
    setMessaggio(null);
    const corpo = { ...campi, email: campi.email.trim() || null, tariffa };
    const esito = cliente
      ? await chiama<{ cliente: Cliente }>(`/api/conti/clienti/${encodeURIComponent(cliente.id)}`, { metodo: "PATCH", corpo })
      : await chiama<{ cliente: Cliente }>("/api/conti/clienti", { metodo: "POST", corpo });
    setInCorso(false);
    if (!esito.ok) {
      setMessaggio(esito.messaggio);
      return;
    }
    if (!cliente) setCampi(campiDa());
    onSalvato(esito.dati.cliente);
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void salva();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-6">
        <CampoTesto
          id={`${id}-nome`}
          etichetta="Nome del cliente"
          valore={campi.nome}
          onCambia={(v) => cambia("nome", v)}
          errore={errori.nome}
          aiuto="Persona o ditta, come va scritto in fattura."
          maxLength={LUNGHEZZE_INDIRIZZO_QR.nome}
          obbligatorio
          className="sm:col-span-6"
        />
        <CampoTesto
          id={`${id}-via`}
          etichetta="Via"
          valore={campi.via}
          onCambia={(v) => cambia("via", v)}
          maxLength={LUNGHEZZE_INDIRIZZO_QR.via}
          className="sm:col-span-4"
        />
        <CampoTesto
          id={`${id}-numero`}
          etichetta="Numero"
          valore={campi.numero}
          onCambia={(v) => cambia("numero", v)}
          maxLength={LUNGHEZZE_INDIRIZZO_QR.numero}
          className="sm:col-span-2"
        />
        <CampoTesto
          id={`${id}-npa`}
          etichetta="NPA"
          valore={campi.npa}
          onCambia={(v) => cambia("npa", v)}
          maxLength={LUNGHEZZE_INDIRIZZO_QR.npa}
          className="sm:col-span-2"
        />
        <CampoTesto
          id={`${id}-localita`}
          etichetta="Località"
          valore={campi.localita}
          onCambia={(v) => cambia("localita", v)}
          maxLength={LUNGHEZZE_INDIRIZZO_QR.localita}
          className="sm:col-span-3"
        />
        <CampoTesto
          id={`${id}-paese`}
          etichetta="Paese"
          valore={campi.paese}
          onCambia={(v) => cambia("paese", v.toUpperCase().slice(0, 2))}
          aiuto="CH, IT…"
          maxLength={2}
          className="sm:col-span-1"
        />
        <CampoTesto
          id={`${id}-email`}
          etichetta="Email"
          tipo="email"
          valore={campi.email}
          onCambia={(v) => cambia("email", v)}
          placeholder="Facoltativa"
          maxLength={LUNGHEZZE_ORE.email}
          className="sm:col-span-3"
        />
        <CampoTesto
          id={`${id}-tariffa`}
          etichetta="Tariffa oraria"
          prefisso="CHF"
          numerico
          valore={campi.tariffa}
          onCambia={(v) => cambia("tariffa", v)}
          errore={errori.tariffa}
          placeholder="Facoltativa"
          aiuto="La proponiamo quando segni le ore."
          className="sm:col-span-3"
        />
      </div>
      <p className="mt-3 text-sm text-muted">
        Perché l&apos;indirizzo del cliente vada nella QR-fattura servono almeno NPA, località e paese.
      </p>
      <Messaggio testo={messaggio} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="submit" className={classeSi} disabled={inCorso}>
          {inCorso ? "Salvo…" : cliente ? "Salva le modifiche" : "Aggiungi il cliente"}
        </button>
        {onAnnulla ? (
          <button type="button" className={classeNo} onClick={onAnnulla} disabled={inCorso}>
            Annulla
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** La rubrica: elenco dei clienti, con modifica, cancellazione e aggiunta. */
export function Rubrica({ clienti, onCambiato }: { clienti: readonly Cliente[]; onCambiato: (annuncio: string) => void }) {
  const [nuovo, setNuovo] = useState(false);
  return (
    <div className="space-y-4">
      {clienti.length > 0 ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {clienti.map((c) => (
            <li key={c.id} className="p-4">
              <RigaCliente cliente={c} onCambiato={onCambiato} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        {nuovo ? (
          <>
            <h3 className="mb-4 font-semibold">Nuovo cliente</h3>
            <ModuloCliente
              id="nuovo-cliente"
              onSalvato={(c) => {
                setNuovo(false);
                onCambiato(`${c.nome} aggiunto ai tuoi clienti.`);
              }}
              onAnnulla={() => setNuovo(false)}
            />
          </>
        ) : (
          <button type="button" className={`${classeNo} w-full sm:w-auto`} onClick={() => setNuovo(true)}>
            Aggiungi un cliente
          </button>
        )}
      </div>
    </div>
  );
}

function RigaCliente({ cliente: c, onCambiato }: { cliente: Cliente; onCambiato: (annuncio: string) => void }) {
  const [modifica, setModifica] = useState(false);
  const [eliminare, setEliminare] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);

  async function elimina() {
    setInCorso(true);
    const esito = await chiama(`/api/conti/clienti/${encodeURIComponent(c.id)}`, { metodo: "DELETE" });
    setInCorso(false);
    if (!esito.ok) return setMessaggio(esito.messaggio);
    onCambiato(`${c.nome} tolto dai tuoi clienti, con le sue ore.`);
  }

  if (modifica) {
    return (
      <ModuloCliente
        id={`cliente-${c.id}`}
        cliente={c}
        onSalvato={(nuovo) => {
          setModifica(false);
          onCambiato(`Dati di ${nuovo.nome} salvati.`);
        }}
        onAnnulla={() => setModifica(false)}
      />
    );
  }

  const indirizzo = indirizzoBreve(c);
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold break-words">{c.nome}</p>
          <p className="text-sm text-muted break-words">{indirizzo || "Senza indirizzo"}</p>
          {c.email ? <p className="text-sm text-muted break-all">{c.email}</p> : null}
        </div>
        <p className="text-sm font-medium tabular-nums">{c.tariffa !== null ? `${importo(c.tariffa)} all'ora` : "Senza tariffa"}</p>
      </div>
      {!indirizzoCompleto(c) ? (
        <p className="mt-2 text-sm text-accent">
          Indirizzo incompleto: nella QR-fattura il riquadro del cliente resterà da compilare a mano.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={classePiccolo} onClick={() => setModifica(true)} disabled={inCorso}>
          Modifica<span className="sr-only"> {c.nome}</span>
        </button>
        {eliminare ? (
          <>
            <button type="button" className={`${classePiccolo} border-danger text-danger`} onClick={elimina} disabled={inCorso}>
              Sì, elimina anche le sue ore
            </button>
            <button type="button" className={classePiccolo} onClick={() => setEliminare(false)}>
              Annulla
            </button>
          </>
        ) : (
          <button type="button" className={classePiccolo} onClick={() => setEliminare(true)} disabled={inCorso}>
            Elimina<span className="sr-only"> {c.nome}</span>
          </button>
        )}
      </div>
      {eliminare ? (
        <p className="mt-2 text-sm text-muted" role="status">
          Si cancellano il cliente e tutte le ore segnate per lui, anche quelle già fatturate. Le fatture salvate nel
          browser restano.
        </p>
      ) : null}
      <Messaggio testo={messaggio} />
    </div>
  );
}
