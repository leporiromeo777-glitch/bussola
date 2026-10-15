"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { sito } from "@/lib/sito";
import { archivioListaAttesa } from "@/lib/lista-attesa/archivio";
import { confermaIscrizione } from "@/lib/lista-attesa/esiti-conferma";
import { esitoFinto, registraIscrizione } from "@/lib/lista-attesa/iscrizione";
import { MESSAGGIO_DEMO, messaggioIscrizione } from "@/lib/lista-attesa/messaggi";
import { provenienzaDaUrl } from "@/lib/lista-attesa/provenienza";
import { creaInvioEmail, emailConfigurata } from "@/lib/lista-attesa/resend";
import { richiestaConsentita } from "@/lib/limiti/server";
import {
  leggiToken,
  trappolaCompilata,
  validaIscrizione,
  type ErroriModulo,
  type ValoriModulo,
} from "@/lib/lista-attesa/validazione";

export type StatoIscrizione =
  | { stato: "iniziale" }
  | { stato: "ok"; titolo: string; messaggio: string }
  | { stato: "demo"; titolo: string; messaggio: string }
  | {
      stato: "errore";
      messaggio: string;
      errori: ErroriModulo;
      valori: ValoriModulo;
      /** Cambia a ogni errore: il modulo si rimonta con i valori scritti. */
      tentativo: number;
    };

/** Iscrizione alla lista d'attesa (modulo della landing page). */
export async function iscriviListaAttesa(prev: StatoIscrizione, form: FormData): Promise<StatoIscrizione> {
  const tentativo = prev.stato === "errore" ? prev.tentativo + 1 : 1;

  // Bot: fingiamo che sia andato tutto bene e non salviamo nulla.
  if (trappolaCompilata(form)) {
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const { titolo, testo } = messaggioIscrizione(esitoFinto(emailConfigurata()), email);
    return { stato: "ok", titolo, messaggio: testo };
  }

  const validazione = validaIscrizione(form);
  if (!validazione.ok) {
    return {
      stato: "errore",
      messaggio: "Controlla i campi segnati qui sotto.",
      errori: validazione.errori,
      valori: validazione.valori,
      tentativo,
    };
  }

  const dati = validazione.dati;
  if (!dati.provenienza) {
    // Senza JavaScript il campo nascosto è vuoto: proviamo con la pagina di partenza.
    dati.provenienza = provenienzaDaUrl((await headers()).get("referer"));
  }

  const esito = await registraIscrizione(dati, {
    archivio: archivioListaAttesa(),
    inviaEmail: creaInvioEmail(),
    mittente: { nomeSito: sito.nome, urlSito: sito.url, titolare: sito.titolare },
    richiestaConsentita: () => richiestaConsentita("listaAttesa"),
    // L'email parte dopo la risposta: stessi tempi per indirizzi nuovi e già in lista.
    pianifica: after,
  });
  const { titolo, testo } = messaggioIscrizione(esito, dati.email);

  switch (esito.tipo) {
    case "ok":
      return { stato: "ok", titolo, messaggio: testo };
    case "demo":
      return { stato: "demo", titolo, messaggio: testo };
    case "errore":
    case "troppe_richieste":
      return {
        stato: "errore",
        messaggio: testo,
        errori: {},
        valori: {
          email: dati.email,
          nome: dati.nome ?? "",
          cantone: dati.cantone ?? "",
          situazione: dati.situazione ?? "",
          consenso: true,
        },
        tentativo,
      };
  }
}

/**
 * Conferma l'iscrizione (pulsante della pagina /lista-attesa/conferma), poi
 * porta alla pagina di ringraziamento. È una POST: aprire il link dell'email
 * da solo non conferma nulla.
 */
export async function confermaListaAttesa(form: FormData): Promise<void> {
  const esito = await confermaIscrizione(form.get("token"), archivioListaAttesa());
  redirect(`/lista-attesa/confermata?esito=${esito}`);
}

export type StatoDisiscrizione = { stato: "iniziale" } | { stato: "errore"; messaggio: string };

/**
 * Cancella l'iscrizione legata al token (pulsante nella pagina di
 * disiscrizione), poi reindirizza alla pagina di saluto: funziona uguale con
 * e senza JavaScript.
 */
export async function disiscriviListaAttesa(_prev: StatoDisiscrizione, form: FormData): Promise<StatoDisiscrizione> {
  const token = leggiToken(form.get("token"));
  if (!token) {
    return { stato: "errore", messaggio: "Il link non è valido. Aprilo di nuovo dall'email, copiandolo per intero." };
  }

  const archivio = archivioListaAttesa();
  if (!archivio) return { stato: "errore", messaggio: MESSAGGIO_DEMO };

  try {
    // Anche se la riga non c'è più il risultato è lo stesso: non sei in lista.
    await archivio.cancella(token);
  } catch (errore) {
    console.error("[lista-attesa] disiscrizione non riuscita:", errore instanceof Error ? errore.message : errore);
    return { stato: "errore", messaggio: "Non siamo riusciti a cancellare l'iscrizione. Riprova tra qualche minuto." };
  }
  redirect("/lista-attesa/disiscriviti?fatto=1");
}
