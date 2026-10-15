"use client";

import Link from "next/link";
import { useActionState, useSyncExternalStore, type ReactNode } from "react";
import { iscriviListaAttesa, type StatoIscrizione } from "@/app/lista-attesa/azioni";
import {
  CAMPO_TRAPPOLA,
  CANTONI,
  LIMITI,
  SITUAZIONI,
  VALORE_CONSENSO,
  type CampoModulo,
  type ErroriModulo,
  type ValoriModulo,
} from "@/lib/lista-attesa/opzioni";
import { provenienzaDaParametri } from "@/lib/lista-attesa/provenienza";
import { IconaAvviso, IconaInfo, IconaSpunta } from "./icone";

const STATO_INIZIALE: StatoIscrizione = { stato: "iniziale" };
const VALORI_VUOTI: ValoriModulo = { email: "", nome: "", cantone: "", situazione: "", consenso: false };
const ORDINE_CAMPI: CampoModulo[] = ["email", "nome", "cantone", "situazione", "consenso"];

const classeCampo =
  "mt-1.5 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground aria-[invalid=true]:border-danger";

// La query string si legge solo nel browser: la pagina resta statica e,
// senza JavaScript, il server ricava la provenienza dall'intestazione Referer.
const nessunaSottoscrizione = () => () => {};
const leggiQuery = () => window.location.search;
const queryServer = () => "";

/** Porta il focus sul messaggio finale (il modulo sparisce). Funzione stabile: gira solo al montaggio. */
const mettiFocus = (el: HTMLElement | null) => el?.focus();

export function ModuloListaAttesa() {
  const [stato, azione, inCorso] = useActionState(iscriviListaAttesa, STATO_INIZIALE);
  const query = useSyncExternalStore(nessunaSottoscrizione, leggiQuery, queryServer);
  const provenienza = provenienzaDaParametri(new URLSearchParams(query)) ?? "";

  const concluso = stato.stato === "ok" || stato.stato === "demo";
  const errori: ErroriModulo = stato.stato === "errore" ? stato.errori : {};
  const valori = stato.stato === "errore" ? stato.valori : VALORI_VUOTI;
  const primoErrore = ORDINE_CAMPI.find((campo) => errori[campo]);

  return (
    <div>
      <div role="status" aria-live="polite" aria-atomic="true">
        {stato.stato === "ok" ? (
          <Esito titolo={stato.titolo} icona={<IconaSpunta className="size-5" />} tono="ok">
            {stato.messaggio}
          </Esito>
        ) : null}
        {stato.stato === "demo" ? (
          <Esito titolo={stato.titolo} icona={<IconaInfo className="size-5" />} tono="info">
            {stato.messaggio}
          </Esito>
        ) : null}
      </div>

      {concluso ? null : (
        // La key cambia a ogni errore: il modulo si rimonta con i valori scritti
        // (React svuota i campi dopo l'invio, anche quando il server rifiuta).
        <form
          key={stato.stato === "errore" ? stato.tentativo : 0}
          action={azione}
          aria-describedby={stato.stato === "errore" ? "modulo-errore" : undefined}
          className="relative space-y-5"
        >
          {stato.stato === "errore" ? (
            <p
              id="modulo-errore"
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-danger/40 bg-background p-3 text-sm text-danger"
            >
              <IconaAvviso className="mt-0.5 size-4 shrink-0" />
              {stato.messaggio}
            </p>
          ) : null}

          <div>
            <label htmlFor="lista-email" className="font-medium">
              La tua email
            </label>
            <input
              id="lista-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={LIMITI.email}
              defaultValue={valori.email}
              autoFocus={primoErrore === "email"}
              aria-invalid={errori.email ? true : undefined}
              aria-describedby={errori.email ? "lista-email-errore" : undefined}
              className={classeCampo}
            />
            <ErroreCampo id="lista-email-errore" testo={errori.email} />
          </div>

          <div>
            <label htmlFor="lista-nome" className="font-medium">
              Come ti chiami? <span className="font-normal text-muted">(facoltativo)</span>
            </label>
            <input
              id="lista-nome"
              name="nome"
              type="text"
              autoComplete="given-name"
              maxLength={LIMITI.nome}
              defaultValue={valori.nome}
              autoFocus={primoErrore === "nome"}
              aria-invalid={errori.nome ? true : undefined}
              aria-describedby={errori.nome ? "lista-nome-errore" : undefined}
              className={classeCampo}
            />
            <ErroreCampo id="lista-nome-errore" testo={errori.nome} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="lista-cantone" className="font-medium">
                Dove apri l&apos;attività? <span className="font-normal text-muted">(facoltativo)</span>
              </label>
              <select
                id="lista-cantone"
                name="cantone"
                defaultValue={valori.cantone}
                autoFocus={primoErrore === "cantone"}
                aria-invalid={errori.cantone ? true : undefined}
                aria-describedby={errori.cantone ? "lista-cantone-errore" : undefined}
                className={classeCampo}
              >
                <option value="">Scegli…</option>
                {Object.entries(CANTONI).map(([valore, etichetta]) => (
                  <option key={valore} value={valore}>
                    {etichetta}
                  </option>
                ))}
              </select>
              <ErroreCampo id="lista-cantone-errore" testo={errori.cantone} />
            </div>

            <div>
              <label htmlFor="lista-situazione" className="font-medium">
                A che punto sei? <span className="font-normal text-muted">(facoltativo)</span>
              </label>
              <select
                id="lista-situazione"
                name="situazione"
                defaultValue={valori.situazione}
                autoFocus={primoErrore === "situazione"}
                aria-invalid={errori.situazione ? true : undefined}
                aria-describedby={errori.situazione ? "lista-situazione-errore" : undefined}
                className={classeCampo}
              >
                <option value="">Scegli…</option>
                {Object.entries(SITUAZIONI).map(([valore, etichetta]) => (
                  <option key={valore} value={valore}>
                    {etichetta}
                  </option>
                ))}
              </select>
              <ErroreCampo id="lista-situazione-errore" testo={errori.situazione} />
            </div>
          </div>

          <div>
            <div className="flex gap-3">
              <input
                id="lista-consenso"
                name="consenso"
                type="checkbox"
                value={VALORE_CONSENSO}
                required
                defaultChecked={valori.consenso}
                autoFocus={primoErrore === "consenso"}
                aria-invalid={errori.consenso ? true : undefined}
                aria-describedby={`lista-consenso-privacy${errori.consenso ? " lista-consenso-errore" : ""}`}
                className="mt-0.5 size-5 shrink-0 accent-brand"
              />
              <div>
                <label htmlFor="lista-consenso">
                  Voglio ricevere un&apos;email quando apre la beta e al massimo due aggiornamenti al mese. Posso
                  disiscrivermi in ogni momento.
                </label>
                <p id="lista-consenso-privacy" className="mt-1 text-sm text-muted">
                  Come usiamo i tuoi dati:{" "}
                  <Link href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-strong">
                    informativa sulla privacy
                  </Link>
                  .
                </p>
              </div>
            </div>
            <ErroreCampo id="lista-consenso-errore" testo={errori.consenso} />
          </div>

          {/* Trappola per i bot: fuori schermo e nascosta ai lettori di schermo. */}
          <div aria-hidden="true" className="absolute -left-[9999px] top-0 size-px overflow-hidden">
            <label htmlFor={`lista-${CAMPO_TRAPPOLA}`}>Lascia vuoto questo campo</label>
            <input
              id={`lista-${CAMPO_TRAPPOLA}`}
              name={CAMPO_TRAPPOLA}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>
          <input type="hidden" name="provenienza" value={provenienza} />

          <button
            type="submit"
            disabled={inCorso}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 font-medium text-background shadow-sm transition-colors hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {inCorso ? "Invio in corso…" : "Entra nella lista d'attesa"}
          </button>
        </form>
      )}
    </div>
  );
}

function ErroreCampo({ id, testo }: { id: string; testo?: string }) {
  if (!testo) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {testo}
    </p>
  );
}

function Esito({
  titolo,
  icona,
  tono,
  children,
}: {
  titolo: string;
  icona: ReactNode;
  tono: "ok" | "info";
  children: ReactNode;
}) {
  return (
    <div
      ref={mettiFocus}
      tabIndex={-1}
      className={`rounded-xl border p-5 outline-none ${tono === "ok" ? "border-brand/30 bg-brand-soft" : "border-border bg-background"}`}
    >
      <p className={`flex items-center gap-2 font-semibold ${tono === "ok" ? "text-brand" : ""}`}>
        {icona}
        {titolo}
      </p>
      <p className="mt-2">{children}</p>
    </div>
  );
}
