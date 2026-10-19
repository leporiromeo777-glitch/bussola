"use client";

import { useState } from "react";
import { chf, fonti, fontiPercorso, regole } from "@/data/svizzera";
import { CHIAVI_ARCHIVIO } from "@/lib/strumenti/archivio";
import { leggiNumero } from "@/lib/strumenti/numeri";
import {
  controllaFondazione,
  datiFondazioneIniziali,
  nuovoGerenteEsterno,
  nuovoSocio,
  schemaDatiFondazione,
  totaleQuote,
  type DatiFondazione,
  type GerenteEsterno,
  type Socio,
} from "@/lib/fondazione-sagl/dati";
import { NotaDatiLocali } from "../dati-locali";
import { nuovoId } from "../id";
import { IconaAvviso, IconaCestino, IconaInfo, IconaPiu, IconaScarica } from "../icone";
import { NotaNonConsulenza } from "../intestazione";
import { useArchivio, useOggi } from "../usa-archivio";
import {
  CampoArea,
  CampoScelta,
  CampoTesto,
  Caricamento,
  Casella,
  classePulsantePiccolo,
  classePulsantePrincipale,
  classePulsanteSecondario,
  FonteLink,
  Gruppo,
} from "../ui";

/**
 * Lo strumento «Fondare una Sagl»: i dati per il notaio e il fiduciario, i
 * controlli sulle regole della legge e due PDF da scaricare (la scheda di
 * preparazione e la bozza dello statuto). Tutto resta nel browser.
 */
export function ModuloSagl() {
  const [dati, aggiorna] = useArchivio(CHIAVI_ARCHIVIO.fondazioneSagl, schemaDatiFondazione, datiFondazioneIniziali);
  const oggi = useOggi();
  const [stato, setStato] = useState("");

  if (!dati || !oggi) return <Caricamento />;

  const imposta = <K extends keyof DatiFondazione>(chiave: K, valore: DatiFondazione[K]) => aggiorna((d) => ({ ...d, [chiave]: valore }));
  const socio = (id: string, modifica: Partial<Socio>) =>
    aggiorna((d) => ({ ...d, soci: d.soci.map((s) => (s.id === id ? { ...s, ...modifica } : s)) }));
  const gerente = (id: string, modifica: Partial<GerenteEsterno>) =>
    aggiorna((d) => ({ ...d, gerentiEsterni: d.gerentiEsterni.map((g) => (g.id === id ? { ...g, ...modifica } : g)) }));

  const { errori, avvisi } = controllaFondazione(dati);
  const nQuote = dati.valoreQuota > 0 ? dati.capitale / dati.valoreQuota : 0;
  const totale = totaleQuote(dati);

  const scarica = async (quale: "scheda" | "statuto") => {
    setStato("Preparo il PDF…");
    try {
      const [{ creaPdf }, documenti] = await Promise.all([import("@/lib/pdf/crea-pdf"), import("@/lib/fondazione-sagl/documenti")]);
      const doc = quale === "scheda" ? documenti.schedaPreparazione(dati, oggi) : documenti.bozzaStatuto(dati, oggi);
      const byte = await creaPdf(doc);
      const url = URL.createObjectURL(new Blob([byte as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = documenti.nomeFilePdfFondazione(quale, dati.ditta);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStato(quale === "scheda" ? "Scheda scaricata." : "Bozza dello statuto scaricata.");
    } catch {
      setStato("Non sono riuscito a creare il PDF. Riprova.");
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <NotaDatiLocali chiavi={[CHIAVI_ARCHIVIO.fondazioneSagl]} />

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
        <Gruppo legenda="La società">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTesto
              id="ditta"
              etichetta="Nome (ditta)"
              valore={dati.ditta}
              onCambia={(v) => imposta("ditta", v)}
              placeholder="Rossi & Bianchi Sagl"
              aiuto={
                <>
                  Con la forma giuridica, per esempio «Sagl» (<FonteLink fonte={fontiPercorso.co950} />
                  ). Prima di decidere, verificatelo al registro di commercio.
                </>
              }
              maxLength={120}
            />
            <CampoTesto id="sede" etichetta="Sede (Comune)" valore={dati.sede} onCambia={(v) => imposta("sede", v)} placeholder="Bellinzona" maxLength={80} />
          </div>
          <CampoArea
            id="scopo"
            etichetta="Scopo: cosa fa la società"
            valore={dati.scopo}
            onCambia={(v) => imposta("scopo", v)}
            placeholder="Riparazione e vendita di biciclette, accessori e ricambi."
            aiuto="Una descrizione breve e precisa dell'attività."
            maxLength={800}
            className="mt-4"
          />
        </Gruppo>

        <Gruppo
          legenda="Capitale e quote"
          descrizione={
            <>
              Almeno {chf(regole.capitaleMinimoSagl.valore)} (<FonteLink fonte={regole.capitaleMinimoSagl.fonte} />
              ), da versare per intero alla fondazione (<FonteLink fonte={fontiPercorso.co777c} />
              ). Ogni quota vale più di zero (<FonteLink fonte={fontiPercorso.co774} />
              ).
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoNumero id="capitale" etichetta="Capitale sociale" valore={dati.capitale} onCambia={(n) => imposta("capitale", n)} />
            <CampoNumero id="valore-quota" etichetta="Valore di una quota" valore={dati.valoreQuota} onCambia={(n) => imposta("valoreQuota", n)} />
          </div>
          <p className="mt-3 text-sm text-muted" aria-live="polite">
            {Number.isInteger(nQuote) && nQuote > 0
              ? `Sono ${nQuote.toLocaleString("de-CH")} quote da ${chf(dati.valoreQuota, 2)}. I soci ne hanno ${totale.toLocaleString("de-CH")}.`
              : "Il capitale deve essere un numero intero di quote."}
          </p>
        </Gruppo>

        <Gruppo
          legenda="I soci"
          descrizione={
            <>
              Ogni socio ha almeno una quota (<FonteLink fonte={fontiPercorso.co772} />
              ). Chi porta dei beni invece dei soldi fa un conferimento «in natura».
            </>
          }
        >
          <ul className="space-y-4">
            {dati.soci.map((s, i) => (
              <li key={s.id} className="rounded-lg border border-border p-3">
                <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr]">
                  <CampoTesto id={`nome-${s.id}`} etichetta={`Socio ${i + 1}: nome e cognome`} valore={s.nome} onCambia={(v) => socio(s.id, { nome: v })} maxLength={120} />
                  <CampoTesto id={`domicilio-${s.id}`} etichetta="Domicilio" valore={s.domicilio} onCambia={(v) => socio(s.id, { domicilio: v })} maxLength={120} />
                  <CampoNumero id={`quote-${s.id}`} etichetta="Quote" valore={s.quote} onCambia={(n) => socio(s.id, { quote: Math.max(0, Math.round(n)) })} senzaChf />
                </div>
                <p className="mt-2 text-sm text-muted">Importo: {chf(s.quote * dati.valoreQuota, 2)}</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  <Casella id={`natura-${s.id}`} etichetta="Porta dei beni (in natura)" selezionata={s.inNatura} onCambia={(v) => socio(s.id, { inNatura: v })} />
                  <Casella id={`svizzera-${s.id}`} etichetta="Domiciliato in Svizzera" selezionata={s.domiciliatoInSvizzera} onCambia={(v) => socio(s.id, { domiciliatoInSvizzera: v })} />
                  {dati.direzione === "gerenti" ? (
                    <Casella id={`gerente-${s.id}`} etichetta="È gerente" selezionata={s.gerente} onCambia={(v) => socio(s.id, { gerente: v })} />
                  ) : null}
                </div>
                {dati.soci.length > 1 ? (
                  <button type="button" className={`${classePulsantePiccolo} mt-3`} onClick={() => aggiorna((d) => ({ ...d, soci: d.soci.filter((x) => x.id !== s.id) }))}>
                    <IconaCestino className="size-4" />
                    Togli il socio {i + 1}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {dati.soci.length < 20 ? (
            <button type="button" className={`${classePulsanteSecondario} mt-4`} onClick={() => aggiorna((d) => ({ ...d, soci: [...d.soci, nuovoSocio(nuovoId())] }))}>
              <IconaPiu className="size-4" />
              Aggiungi un socio
            </button>
          ) : null}
        </Gruppo>

        <Gruppo
          legenda="Chi dirige"
          descrizione={
            <>
              Per legge i soci dirigono tutti insieme; lo statuto può affidare la gestione a dei gerenti, anche non soci (
              <FonteLink fonte={fontiPercorso.co809} />
              ). Almeno una persona che rappresenta la società deve essere domiciliata in Svizzera (
              <FonteLink fonte={fontiPercorso.co814} />
              ).
            </>
          }
        >
          <CampoScelta
            id="direzione"
            etichetta="Chi dirige la società"
            valore={dati.direzione}
            onCambia={(v) => imposta("direzione", v)}
            opzioni={[
              { valore: "tutti", etichetta: "Tutti i soci insieme (regola della legge)" },
              { valore: "gerenti", etichetta: "Uno o più gerenti, scelti tra i soci o fuori" },
            ]}
          />
          {dati.direzione === "gerenti" ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted">Tra i soci, spunta «È gerente». Qui puoi aggiungere gerenti che non sono soci.</p>
              {dati.gerentiEsterni.map((g, i) => (
                <div key={g.id} className="rounded-lg border border-border p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CampoTesto id={`gerente-nome-${g.id}`} etichetta={`Gerente esterno ${i + 1}: nome e cognome`} valore={g.nome} onCambia={(v) => gerente(g.id, { nome: v })} maxLength={120} />
                    <CampoTesto id={`gerente-domicilio-${g.id}`} etichetta="Domicilio" valore={g.domicilio} onCambia={(v) => gerente(g.id, { domicilio: v })} maxLength={120} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <Casella
                      id={`gerente-svizzera-${g.id}`}
                      etichetta="Domiciliato in Svizzera"
                      selezionata={g.domiciliatoInSvizzera}
                      onCambia={(v) => gerente(g.id, { domiciliatoInSvizzera: v })}
                    />
                    <button
                      type="button"
                      className={classePulsantePiccolo}
                      onClick={() => aggiorna((d) => ({ ...d, gerentiEsterni: d.gerentiEsterni.filter((x) => x.id !== g.id) }))}
                    >
                      <IconaCestino className="size-4" />
                      Togli il gerente {i + 1}
                    </button>
                  </div>
                </div>
              ))}
              {dati.gerentiEsterni.length < 10 ? (
                <button
                  type="button"
                  className={classePulsanteSecondario}
                  onClick={() => aggiorna((d) => ({ ...d, gerentiEsterni: [...d.gerentiEsterni, nuovoGerenteEsterno(nuovoId())] }))}
                >
                  <IconaPiu className="size-4" />
                  Aggiungi un gerente esterno
                </button>
              ) : null}
            </div>
          ) : null}
        </Gruppo>

        <Gruppo legenda="Banca, revisione e comunicazioni">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTesto
              id="banca"
              etichetta="Banca per il conto vincolato"
              valore={dati.banca}
              onCambia={(v) => imposta("banca", v)}
              aiuto={
                <>
                  Ci versate il capitale; dopo l&apos;iscrizione la banca lo rilascia (<FonteLink fonte={fonti.pmiChecklist} />
                  ).
                </>
              }
              maxLength={120}
            />
            <CampoScelta
              id="revisione"
              etichetta="Revisione dei conti"
              valore={dati.revisione}
              onCambia={(v) => imposta("revisione", v)}
              opzioni={[
                { valore: "da-decidere", etichetta: "Da decidere con il fiduciario" },
                { valore: "ufficio", etichetta: "Con un ufficio di revisione" },
                { valore: "rinuncia", etichetta: "Rinuncia alla revisione limitata" },
              ]}
              aiuto={
                <>
                  La rinuncia richiede il consenso di tutti i soci e al massimo 10 posti a tempo pieno (<FonteLink fonte={fontiPercorso.co727a} />,{" "}
                  <FonteLink fonte={fontiPercorso.co818} />
                  ).
                </>
              }
            />
            <CampoScelta
              id="comunicazioni"
              etichetta="Comunicazioni della società ai soci"
              valore={dati.comunicazioni}
              onCambia={(v) => imposta("comunicazioni", v)}
              opzioni={[
                { valore: "scritto-email", etichetta: "Per iscritto o per e-mail" },
                { valore: "scritto", etichetta: "Per iscritto" },
              ]}
              aiuto={
                <>
                  Lo statuto deve dirlo (<FonteLink fonte={fontiPercorso.co776} />
                  ).
                </>
              }
            />
          </div>
        </Gruppo>
      </form>

      <section aria-labelledby="titolo-controlli" className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 id="titolo-controlli" className="text-lg font-semibold">
          {errori.length === 0 ? "I dati tornano con la legge" : `Da completare (${errori.length})`}
        </h2>
        {errori.length + avvisi.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nessun problema trovato. Fate comunque controllare tutto al notaio.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {[...errori.map((c) => ({ ...c, errore: true })), ...avvisi.map((c) => ({ ...c, errore: false }))].map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                {c.errore ? <IconaAvviso className="mt-0.5 size-4 shrink-0 text-danger" /> : <IconaInfo className="mt-0.5 size-4 shrink-0 text-brand" />}
                <span>
                  {c.testo}
                  {c.fonte ? (
                    <>
                      {" "}
                      (<FonteLink fonte={c.fonte} />)
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" className={classePulsantePrincipale} onClick={() => scarica("scheda")}>
            <IconaScarica className="size-5" />
            Scarica la scheda (PDF)
          </button>
          <button type="button" className={classePulsanteSecondario} disabled={errori.length > 0} onClick={() => scarica("statuto")}>
            <IconaScarica className="size-5" />
            Scarica la bozza dello statuto (PDF)
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          La scheda si può scaricare anche incompleta: segna cosa manca. La bozza dello statuto si scarica quando i dati tornano.
        </p>
        <p className="mt-1 text-sm font-medium" role="status" aria-live="polite">
          {stato}
        </p>
      </section>

      <NotaNonConsulenza />
    </div>
  );
}

/** Un campo per un importo (o un numero di quote): si scrive libero, si salva quando è un numero. */
function CampoNumero({
  id,
  etichetta,
  valore,
  onCambia,
  senzaChf = false,
}: {
  id: string;
  etichetta: string;
  valore: number;
  onCambia: (n: number) => void;
  senzaChf?: boolean;
}) {
  const [testo, setTesto] = useState<string | null>(null);
  const mostrato = testo ?? (senzaChf ? String(valore) : valore.toLocaleString("de-CH"));
  return (
    <CampoTesto
      id={id}
      etichetta={etichetta}
      valore={mostrato}
      numerico
      prefisso={senzaChf ? undefined : "CHF"}
      onCambia={(v) => {
        setTesto(v);
        const n = leggiNumero(v);
        if (n !== null && n >= 0) onCambia(n);
      }}
      onBlur={() => setTesto(null)}
    />
  );
}
