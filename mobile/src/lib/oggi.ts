/**
 * «Oggi» nella schermata Inizio: legge dall'account, in parallelo, conti, ore
 * e documenti con le funzioni che usano già le altre schermate (conti.ts,
 * ore.ts, cassetto.ts). Ogni lettura arriva per conto suo: le schede si
 * mostrano appena i loro dati ci sono, e se una lettura non riesce le altre
 * restano. Quali schede mostrare lo decide src/lib/oggi/carte.ts.
 *
 * Si rilegge quando la schermata torna in primo piano e con «tira giù per
 * aggiornare». Leggendo i conti si aggiornano anche il pallino delle voci da
 * confermare e i promemoria delle fatture (come fa la scheda Conti); leggendo
 * i documenti, le scadenze salvate sul telefono per i promemoria (come il
 * cassetto).
 */
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import type { DocumentoCassetto } from "@/lib/cassetto/tipi";
import { meseDi } from "@/lib/clienti/ore";
import type { RispostaOre } from "@/lib/clienti/tipi";
import type { RispostaConti } from "@/lib/conti/tipi";
import type { FonteDati } from "@/lib/oggi/carte";
import { caricaDocumenti, salvaScadenzeDocumenti } from "./cassetto";
import { caricaConti, contaDaConfermare, impostaDaConfermare } from "./conti";
import { aggiornaPromemoriaFatture, riprogrammaNotifiche } from "./notifiche";
import { caricaOre } from "./ore";
import { useSessione } from "./sessione";
import { oggiLocale } from "./stato";
import { supabase } from "./supabase";

export type Lettura<T> =
  | { stato: "attesa" }
  | { stato: "pronta"; dati: T }
  /** codice: lo stato HTTP (401 accesso scaduto, 503 funzione non attiva), null senza rete. */
  | { stato: "errore"; messaggio: string; codice: number | null };

/** demo: senza Supabase; attesa: la sessione non è ancora letta; fuori: senza accesso; dentro: con l'accesso. */
export type Account = "demo" | "attesa" | "fuori" | "dentro";

export type StatoOggi = {
  account: Account;
  conti: Lettura<RispostaConti>;
  ore: Lettura<RispostaOre>;
  documenti: Lettura<DocumentoCassetto[]>;
  /** true durante «tira giù per aggiornare». */
  aggiornando: boolean;
  aggiorna: () => void;
};

type Letture = {
  /** Di chi sono i dati: cambiando account quelli di prima non si mostrano più. */
  utente: string | null;
  conti: Lettura<RispostaConti>;
  ore: Lettura<RispostaOre>;
  documenti: Lettura<DocumentoCassetto[]>;
};

const ATTESA = { stato: "attesa" } as const;

type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string; stato: number | null };

function lettura<T>(esito: Esito<T>): Lettura<T> {
  return esito.ok ? { stato: "pronta", dati: esito.dati } : { stato: "errore", messaggio: esito.messaggio, codice: esito.stato };
}

export function useOggi(): StatoOggi {
  const { pronta, sessione } = useSessione();
  const utente = sessione?.user.id ?? null;
  const [letture, setLetture] = useState<Letture>({ utente: null, conti: ATTESA, ore: ATTESA, documenti: ATTESA });
  const [aggiornando, setAggiornando] = useState(false);
  const richiesta = useRef(0);

  const carica = useCallback(
    async (tirato: boolean) => {
      if (!utente) return;
      const numero = ++richiesta.current;
      const attuale = () => numero === richiesta.current;
      if (tirato) setAggiornando(true);
      /** Mette una lettura al suo posto, solo se è ancora la richiesta più recente. */
      const metti = <K extends "conti" | "ore" | "documenti">(chiave: K, valore: Letture[K]) => {
        if (!attuale()) return;
        setLetture((l) =>
          l.utente === utente ? { ...l, [chiave]: valore } : { utente, conti: ATTESA, ore: ATTESA, documenti: ATTESA, [chiave]: valore },
        );
      };
      const oggi = oggiLocale();
      await Promise.allSettled([
        caricaConti(Number(oggi.slice(0, 4))).then((esito) => {
          metti("conti", lettura(esito));
          if (!esito.ok || !attuale()) return;
          impostaDaConfermare(contaDaConfermare(esito.dati.movimenti));
          void aggiornaPromemoriaFatture(esito.dati.fatture).catch(() => {});
        }),
        caricaOre(meseDi(oggi)).then((esito) => metti("ore", lettura(esito))),
        caricaDocumenti().then((esito) => {
          metti("documenti", lettura(esito));
          if (esito.ok && attuale() && salvaScadenzeDocumenti(esito.dati)) void riprogrammaNotifiche().catch(() => {});
        }),
      ]);
      if (attuale()) setAggiornando(false);
    },
    [utente],
  );

  // Ogni volta che Inizio torna in primo piano (e quando cambia l'account).
  useFocusEffect(
    useCallback(() => {
      void carica(false);
    }, [carica]),
  );

  const aggiorna = useCallback(() => void carica(true), [carica]);
  const account: Account = supabase() === null ? "demo" : !pronta ? "attesa" : utente ? "dentro" : "fuori";
  const mie = account === "dentro" && letture.utente === utente;
  return {
    account,
    conti: mie ? letture.conti : ATTESA,
    ore: mie ? letture.ore : ATTESA,
    documenti: mie ? letture.documenti : ATTESA,
    aggiornando: account === "dentro" && aggiornando,
    aggiorna,
  };
}

/** Le letture ancora in corso e quelle non riuscite (senza «funzione non attiva»: lì non c'è niente da dire). */
export function riassuntoLetture(stato: StatoOggi): { inAttesa: FonteDati[]; errori: FonteDati[]; accessoScaduto: boolean } {
  if (stato.account !== "dentro") return { inAttesa: [], errori: [], accessoScaduto: false };
  const fonti = [
    ["conti", stato.conti],
    ["ore", stato.ore],
    ["documenti", stato.documenti],
  ] as const;
  const inAttesa = fonti.filter(([, l]) => l.stato === "attesa").map(([f]) => f);
  const falliti = fonti.filter(([, l]) => l.stato === "errore" && l.codice !== 503);
  const accessoScaduto = falliti.some(([, l]) => l.stato === "errore" && l.codice === 401);
  return { inAttesa, errori: accessoScaduto ? [] : falliti.map(([f]) => f), accessoScaduto };
}
