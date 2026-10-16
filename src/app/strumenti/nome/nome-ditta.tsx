"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { PulsanteDettatura } from "@/components/dettatura";
import { IconaAvviso, IconaCopia, IconaCroce, IconaInfo, IconaSpunta } from "@/components/strumenti/icone";
import {
  CampoArea,
  CampoTesto,
  FonteLink,
  Fonti,
  classeLink,
  classePulsantePiccolo,
  classePulsantePrincipale,
  classePulsanteSecondario,
} from "@/components/strumenti/ui";
import { NOTA_MARCHI, NOTA_REGISTRO, REGOLE_NOME_DITTA } from "@/data/nome-ditta";
import { fontiPercorso } from "@/data/svizzera";
import { aggiungiDettato } from "@/lib/dettatura/testo";
import {
  ETICHETTE_STILI,
  LUNGHEZZA_MASSIMA_ATTIVITA,
  LUNGHEZZA_MASSIMA_COGNOME,
  LUNGHEZZA_MASSIMA_NOME_PERSONA,
  LUNGHEZZA_MASSIMA_PAROLE,
  STILI,
  leggiRichiestaNomi,
  leggiRichiestaVerifica,
  type Stile,
} from "@/lib/nome-ditta/proposte";
import { LUNGHEZZA_MASSIMA_NOME_DITTA, controllaNome, type ControlloNome } from "@/lib/nome-ditta/regole";
import type { EsitoRegistro } from "@/lib/nome-ditta/zefix";

type Proposta = { nome: string; perche: string; registro: EsitoRegistro };

const NON_RAGGIUNGIBILE = "Non riesco a raggiungere Bleo: controlla la connessione e riprova.";
const REGOLA = Object.fromEntries(REGOLE_NOME_DITTA.map((r) => [r.id, r])) as Record<
  (typeof REGOLE_NOME_DITTA)[number]["id"],
  (typeof REGOLE_NOME_DITTA)[number]
>;

function eEsitoRegistro(valore: unknown): valore is EsitoRegistro {
  const stato = (valore as { stato?: unknown } | null)?.stato;
  return stato === "trovati" || stato === "nessuno" || stato === "non_disponibile";
}

async function inviaJson(url: string, corpo: unknown): Promise<{ ok: boolean; corpo: Record<string, unknown> | null }> {
  const risposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const json = (await risposta.json().catch(() => null)) as Record<string, unknown> | null;
  return { ok: risposta.ok, corpo: json };
}

/**
 * Strumento «Nome della ditta»: dati della persona, proposte di Bleo (se
 * attive) e controllo di un nome scritto a mano. Le regole del cognome si
 * controllano nel browser; Zefix lo interroga il server.
 */
export function NomeDitta({ proposteDisponibili }: { proposteDisponibili: boolean }) {
  const id = useId();
  const [cognome, setCognome] = useState("");
  const [nomePersona, setNomePersona] = useState("");
  const [attivita, setAttivita] = useState("");
  const [paroleAmate, setParoleAmate] = useState("");
  const [stile, setStile] = useState<Stile>("semplice");
  const [errori, setErrori] = useState<{ cognome?: string; nome?: string; attivita?: string; parole?: string; generale?: string }>({});
  const [inCorso, setInCorso] = useState(false);
  const [proposte, setProposte] = useState<Proposta[] | null>(null);
  const titoloRisultati = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (proposte?.length) titoloRisultati.current?.focus();
  }, [proposte]);

  async function proponi(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // Senza proposte attive il modulo serve solo per il cognome (Invio non manda niente).
    if (!proposteDisponibili) return;
    const richiesta = { cognome, nome: nomePersona, attivita, parole: paroleAmate, stile };
    // Stessi controlli del server, per dire subito cosa manca.
    const controllo = leggiRichiestaNomi(richiesta);
    if (!controllo.ok) {
      const campo = controllo.campo;
      setErrori(
        campo === "cognome" || campo === "nome" || campo === "attivita" || campo === "parole"
          ? { [campo]: controllo.messaggio }
          : { generale: controllo.messaggio },
      );
      return;
    }
    setErrori({});
    setInCorso(true);
    try {
      const { ok, corpo } = await inviaJson("/api/nome-ditta", controllo.dati);
      const lista = corpo?.proposte;
      if (!ok || !Array.isArray(lista)) {
        setErrori({
          generale: typeof corpo?.messaggio === "string" ? corpo.messaggio : "Non sono riuscito a proporti nomi. Riprova tra poco.",
        });
        return;
      }
      setProposte(
        lista.filter(
          (p): p is Proposta =>
            typeof p?.nome === "string" && typeof p?.perche === "string" && eEsitoRegistro(p?.registro),
        ),
      );
    } catch {
      setErrori({ generale: NON_RAGGIUNGIBILE });
    } finally {
      setInCorso(false);
    }
  }

  return (
    <div className="mt-8 max-w-3xl space-y-8">
      <form onSubmit={proponi} noValidate className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">{proposteDisponibili ? "Bleo ti propone dei nomi" : "Il tuo cognome"}</h2>
        <p className="mt-1 text-sm text-muted">
          {proposteDisponibili
            ? "Scrivi il cognome come è sul tuo documento d'identità e racconta in poche parole cosa fai."
            : "Scrivi il cognome come è sul tuo documento d'identità: serve per controllare il nome che hai in mente."}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CampoTesto
            id={`${id}-cognome`}
            etichetta="Cognome"
            obbligatorio
            valore={cognome}
            onCambia={setCognome}
            errore={errori.cognome}
            autoComplete="family-name"
            maxLength={LUNGHEZZA_MASSIMA_COGNOME}
            placeholder="Rossi"
          />
          <CampoTesto
            id={`${id}-nome`}
            etichetta="Nome (se vuoi)"
            valore={nomePersona}
            onCambia={setNomePersona}
            errore={errori.nome}
            autoComplete="given-name"
            maxLength={LUNGHEZZA_MASSIMA_NOME_PERSONA}
            placeholder="Giulia"
          />
        </div>

        {proposteDisponibili ? (
          <>
            <CampoArea
              id={`${id}-attivita`}
              className="mt-4"
              etichetta="Cosa fai?"
              valore={attivita}
              onCambia={setAttivita}
              errore={errori.attivita}
              aiuto="Per esempio: «faccio torte su ordinazione per feste e matrimoni»."
              righe={3}
              maxLength={LUNGHEZZA_MASSIMA_ATTIVITA}
              dopo={
                <div className="mt-2">
                  <PulsanteDettatura
                    onTesto={(dettato) => setAttivita((t) => aggiungiDettato(t, dettato, LUNGHEZZA_MASSIMA_ATTIVITA))}
                    disabilitato={inCorso}
                  />
                </div>
              }
            />
            <CampoTesto
              id={`${id}-parole`}
              className="mt-4"
              etichetta="Parole che ti piacciono (se vuoi)"
              valore={paroleAmate}
              onCambia={setParoleAmate}
              errore={errori.parole}
              maxLength={LUNGHEZZA_MASSIMA_PAROLE}
              placeholder="dolce, casa, sole"
            />
            <fieldset className="mt-4">
              <legend className="text-sm font-medium">Stile</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {STILI.map((s) => (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      stile === s ? "border-brand bg-brand-soft" : "border-border hover:border-brand"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${id}-stile`}
                      value={s}
                      checked={stile === s}
                      onChange={() => setStile(s)}
                      className="mt-0.5 accent-[var(--brand)]"
                    />
                    <span>
                      <span className="block font-medium">{ETICHETTE_STILI[s].etichetta}</span>
                      <span className="text-muted">{ETICHETTE_STILI[s].aiuto}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {errori.generale ? (
              <p role="alert" className="mt-4 font-medium text-danger">
                {errori.generale}
              </p>
            ) : null}
            <button type="submit" disabled={inCorso} className={`${classePulsantePrincipale} mt-5 w-full sm:w-auto`}>
              {inCorso ? "Bleo sta pensando ai nomi…" : "Proponi nomi"}
            </button>
            <p className="mt-4 text-xs text-muted">
              Cognome, nome e quello che scrivi qui li legge l&apos;intelligenza artificiale che usa Bleo (Claude, di
              Anthropic) solo per proporti i nomi; i nomi proposti li cerchiamo su Zefix. Noi non salviamo niente.
            </p>
            <p role="status" aria-live="polite" className="sr-only">
              {inCorso ? "Bleo sta pensando ai nomi e li cerca nel registro di commercio." : ""}
            </p>
          </>
        ) : (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-sm">
            <IconaInfo className="mt-0.5 size-5 shrink-0 text-brand" />
            <span>
              Le proposte di nomi di Bleo non sono ancora attive. Intanto puoi controllare qui sotto un nome che hai già
              in mente.
            </span>
          </p>
        )}
      </form>

      {proposte ? (
        <section aria-labelledby={`${id}-risultati`}>
          <h2 id={`${id}-risultati`} ref={titoloRisultati} tabIndex={-1} className="text-xl font-semibold outline-none">
            {proposte.length ? `${proposte.length} idee per il nome` : "Nessuna idea valida"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tutte contengono il tuo cognome. Prima di scegliere, cerca il nome anche su Google e controlla i marchi.
          </p>
          <ul className="mt-4 grid gap-4">
            {proposte.map((p) => (
              <li key={p.nome}>
                <SchedaNome nome={p.nome} perche={p.perche} registro={p.registro} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setProposte(null)}
            className={`${classePulsanteSecondario} mt-4`}
          >
            Cambia i dati e chiedi altri nomi
          </button>
        </section>
      ) : null}

      <ControlloNomeProprio cognome={cognome} />

      <section aria-label="Note sul controllo" className="space-y-3">
        <Nota testo={NOTA_REGISTRO.testo} fonti={NOTA_REGISTRO.fonti} />
        <Nota testo={NOTA_MARCHI.testo} fonti={NOTA_MARCHI.fonti} />
      </section>
    </div>
  );
}

function Nota({ testo, fonti }: { testo: string; fonti: Parameters<typeof Fonti>[0]["fonti"] }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
      <IconaInfo className="mt-0.5 size-5 shrink-0 text-brand" />
      <div>
        <p>{testo}</p>
        <Fonti fonti={fonti} />
      </div>
    </div>
  );
}

/** «Hai già un nome in mente? Controllalo»: regole nel browser, registro dal server. */
function ControlloNomeProprio({ cognome }: { cognome: string }) {
  const id = useId();
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);
  const [esito, setEsito] = useState<{ nome: string; cognome: string; controllo: ControlloNome; registro: EsitoRegistro } | null>(
    null,
  );

  async function controlla(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const richiesta = leggiRichiestaVerifica({ nome });
    if (!richiesta.ok) {
      setErrore(richiesta.messaggio);
      return;
    }
    setErrore(null);
    setInCorso(true);
    const daControllare = richiesta.dati.nome;
    let registro: EsitoRegistro = { stato: "non_disponibile" };
    let messaggio: string | null = null;
    try {
      const { ok, corpo } = await inviaJson("/api/nome-ditta/verifica", { nome: daControllare });
      if (ok && eEsitoRegistro(corpo?.registro)) registro = corpo.registro;
      else if (typeof corpo?.messaggio === "string") messaggio = corpo.messaggio;
    } catch {
      messaggio = NON_RAGGIUNGIBILE;
    } finally {
      setInCorso(false);
    }
    setErrore(messaggio);
    setEsito({ nome: daControllare, cognome: cognome.trim(), controllo: controllaNome(daControllare, cognome), registro });
  }

  return (
    <section aria-labelledby={`${id}-titolo`} className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 id={`${id}-titolo`} className="text-lg font-semibold">
        Hai già un nome in mente? Controllalo
      </h2>
      <form onSubmit={controlla} noValidate className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <CampoTesto
          id={`${id}-nome`}
          className="flex-1"
          etichetta="Il nome che hai in mente"
          valore={nome}
          onCambia={setNome}
          maxLength={LUNGHEZZA_MASSIMA_NOME_DITTA}
          placeholder="Torte di Giulia Rossi"
        />
        <button type="submit" disabled={inCorso} className={classePulsantePrincipale}>
          {inCorso ? "Controllo…" : "Controlla"}
        </button>
      </form>
      {errore ? (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {errore}
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {inCorso ? "Sto cercando il nome nel registro di commercio." : ""}
      </p>
      {esito ? (
        <div className="mt-4">
          <SchedaNome nome={esito.nome} registro={esito.registro}>
            <ControlliRegole controllo={esito.controllo} cognome={esito.cognome} />
          </SchedaNome>
        </div>
      ) : null}
    </section>
  );
}

function RigaControllo({ ok, children }: { ok: boolean | "avviso"; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok === true ? (
        <IconaSpunta className="mt-0.5 size-4 shrink-0 text-brand" />
      ) : ok === "avviso" ? (
        <IconaAvviso className="mt-0.5 size-4 shrink-0 text-accent" />
      ) : (
        <IconaCroce className="mt-0.5 size-4 shrink-0 text-danger" />
      )}
      <span>{children}</span>
    </li>
  );
}

function ControlliRegole({ controllo, cognome }: { controllo: ControlloNome; cognome: string }) {
  return (
    <ul className="mt-3 space-y-2">
      {!cognome ? (
        <RigaControllo ok="avviso">
          Scrivi il tuo cognome qui sopra: così controllo se il nome lo contiene, come vuole la legge (
          <FonteLink fonte={REGOLA.cognome.fonti[0]} />
          ).
        </RigaControllo>
      ) : controllo.conCognome ? (
        <RigaControllo ok>Contiene il tuo cognome «{cognome}».</RigaControllo>
      ) : (
        <RigaControllo ok={false}>
          Non contiene il tuo cognome «{cognome}» come parola intera: per una ditta individuale è obbligatorio (
          <FonteLink fonte={REGOLA.cognome.fonti[0]} />
          ).
        </RigaControllo>
      )}
      {controllo.societa ? (
        <RigaControllo ok={false}>
          «{controllo.societa}» fa pensare a una società: in una ditta individuale non è permesso (
          <FonteLink fonte={REGOLA.societa.fonti[0]} />
          ).
        </RigaControllo>
      ) : (
        <RigaControllo ok>Nessuna parola che fa pensare a una società.</RigaControllo>
      )}
      {controllo.territorio ? (
        <RigaControllo ok="avviso">
          «{controllo.territorio}» è una parola nazionale o territoriale: valgono regole speciali, chiedi
          all&apos;Ufficio del registro di commercio (<FonteLink fonte={REGOLA.verita.fonti[0]} />
          ).
        </RigaControllo>
      ) : null}
    </ul>
  );
}

/** Un nome: grande, il perché, i controlli e il risultato del registro, con «Copia». */
function SchedaNome({
  nome,
  perche,
  registro,
  children,
}: {
  nome: string;
  perche?: string;
  registro: EsitoRegistro;
  children?: ReactNode;
}) {
  const [copiato, setCopiato] = useState(false);
  useEffect(() => {
    if (!copiato) return;
    const t = setTimeout(() => setCopiato(false), 2000);
    return () => clearTimeout(t);
  }, [copiato]);

  async function copia() {
    try {
      await navigator.clipboard.writeText(nome);
      setCopiato(true);
    } catch {
      setCopiato(false);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-2xl font-bold tracking-tight break-words">{nome}</h3>
        <button type="button" onClick={copia} className={`${classePulsantePiccolo} shrink-0`}>
          {copiato ? <IconaSpunta className="size-4" /> : <IconaCopia className="size-4" />}
          {copiato ? "Copiato" : "Copia"}
          <span className="sr-only"> il nome {nome}</span>
        </button>
      </div>
      {perche ? <p className="mt-1 text-muted">{perche}</p> : null}
      {children}
      <Registro registro={registro} />
    </article>
  );
}

function Registro({ registro }: { registro: EsitoRegistro }) {
  const zefix = (
    <a href={fontiPercorso.zefix.url} target="_blank" rel="noopener noreferrer" className={classeLink}>
      Cerca tu su Zefix<span className="sr-only"> (si apre in una nuova scheda)</span>
    </a>
  );
  if (registro.stato === "non_disponibile") {
    return (
      <p className="mt-3 rounded-lg bg-background p-3 text-sm">
        Ora non riesco a controllare il registro di commercio. {zefix}.
      </p>
    );
  }
  if (registro.stato === "nessuno") {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-brand-soft p-3 text-sm">
        <IconaSpunta className="mt-0.5 size-4 shrink-0 text-brand" />
        <span>Nessun nome uguale trovato nel registro di commercio.</span>
      </p>
    );
  }
  return (
    <div className={`mt-3 rounded-lg p-3 text-sm ${registro.uguale ? "border border-accent" : "bg-background"}`}>
      <p className="font-medium">
        {registro.uguale
          ? "Esiste già una ditta attiva con questo nome:"
          : "Nomi simili già nel registro di commercio:"}
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {registro.ditte.map((d) => (
          <li key={`${d.nome}-${d.sede}`}>
            <span className="font-medium">{d.nome}</span>
            {d.forma || d.sede ? <span className="text-muted"> ({[d.forma, d.sede].filter(Boolean).join(", ")})</span> : null}
          </li>
        ))}
      </ul>
      {registro.altre ? <p className="mt-1 text-muted">E ce ne sono altre. {zefix}.</p> : null}
      {registro.uguale ? (
        <p className="mt-2">
          {REGOLA["stesso-luogo"].testo} (<FonteLink fonte={REGOLA["stesso-luogo"].fonti[0]} />)
        </p>
      ) : null}
    </div>
  );
}
