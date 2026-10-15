import type { Metadata } from "next";
import { PaginaMessaggio } from "@/components/landing/pagina-messaggio";
import { archivioListaAttesa } from "@/lib/lista-attesa/archivio";
import { MESSAGGIO_DEMO } from "@/lib/lista-attesa/messaggi";
import { leggiToken } from "@/lib/lista-attesa/validazione";
import { ModuloDisiscrizione } from "./modulo-disiscrizione";

export const metadata: Metadata = {
  title: "Disiscriviti dalla lista d'attesa",
  robots: { index: false, follow: false },
};

type Ricerca =
  | { tipo: "trovata"; token: string; email: string }
  | { tipo: "non_trovata" | "token_non_valido" | "demo" | "errore" };

async function cerca(tokenGrezzo: unknown): Promise<Ricerca> {
  const token = leggiToken(tokenGrezzo);
  if (!token) return { tipo: "token_non_valido" };
  const archivio = archivioListaAttesa();
  if (!archivio) return { tipo: "demo" };
  try {
    const iscrizione = await archivio.trova(token);
    return iscrizione ? { tipo: "trovata", token, email: iscrizione.email } : { tipo: "non_trovata" };
  } catch (errore) {
    console.error("[lista-attesa] ricerca non riuscita:", errore instanceof Error ? errore.message : errore);
    return { tipo: "errore" };
  }
}

/**
 * Link "disiscriviti" delle email. Aprire la pagina (GET) mostra solo la
 * domanda; a cancellare è il pulsante (POST con Server Action), così
 * un'anteprima del link o un filtro antispam non cancella nessuno.
 */
export default async function PaginaDisiscriviti({ searchParams }: PageProps<"/lista-attesa/disiscriviti">) {
  const { token, fatto } = await searchParams;
  if (fatto === "1") {
    return (
      <PaginaMessaggio tono="ok" titolo="Fatto, sei fuori dalla lista">
        <p>Il tuo indirizzo non è più nella lista d&apos;attesa e non riceverai altre email da noi.</p>
        <p>Grazie per l&apos;interesse, e in bocca al lupo con la tua attività.</p>
      </PaginaMessaggio>
    );
  }

  const ricerca = await cerca(token);

  switch (ricerca.tipo) {
    case "trovata":
      return <ModuloDisiscrizione token={ricerca.token} email={ricerca.email} />;
    case "non_trovata":
      return (
        <PaginaMessaggio tono="info" titolo="Non sei nella lista d'attesa">
          <p>Non troviamo questa iscrizione: probabilmente è già stata cancellata. Non riceverai altre email.</p>
        </PaginaMessaggio>
      );
    case "token_non_valido":
      return (
        <PaginaMessaggio tono="errore" titolo="Questo link non funziona">
          <p>Forse è stato copiato a metà. Riaprilo dall&apos;email, copiandolo per intero.</p>
        </PaginaMessaggio>
      );
    case "demo":
      return (
        <PaginaMessaggio tono="info" titolo="Lista d'attesa non ancora attiva">
          <p>{MESSAGGIO_DEMO}</p>
        </PaginaMessaggio>
      );
    case "errore":
      return (
        <PaginaMessaggio tono="errore" titolo="Qualcosa non ha funzionato">
          <p>Non riusciamo a leggere l&apos;iscrizione in questo momento. Riprova tra qualche minuto.</p>
        </PaginaMessaggio>
      );
  }
}
