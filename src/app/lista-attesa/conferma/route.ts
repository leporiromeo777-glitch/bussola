import { NextResponse, type NextRequest } from "next/server";
import { archivioListaAttesa } from "@/lib/lista-attesa/archivio";
import { leggiToken } from "@/lib/lista-attesa/validazione";
import type { EsitoPaginaConferma } from "@/lib/lista-attesa/esiti-conferma";

/**
 * Link dell'email di conferma (double opt-in): imposta confermato_il e
 * porta alla pagina di ringraziamento. È un Route Handler e non una pagina
 * perché in Next.js le pagine non devono modificare dati mentre si
 * disegnano. Idempotente: riaprire il link non cambia la data di conferma.
 */
export async function GET(request: NextRequest) {
  const esito = await conferma(request.nextUrl.searchParams.get("token"));
  const destinazione = new URL("/lista-attesa/confermata", request.url);
  destinazione.searchParams.set("esito", esito);
  const risposta = NextResponse.redirect(destinazione, 303);
  risposta.headers.set("Cache-Control", "no-store");
  // Il token resta fuori dall'intestazione Referer delle pagine successive.
  risposta.headers.set("Referrer-Policy", "no-referrer");
  return risposta;
}

async function conferma(tokenGrezzo: string | null): Promise<EsitoPaginaConferma> {
  const token = leggiToken(tokenGrezzo);
  if (!token) return "link_non_valido";
  const archivio = archivioListaAttesa();
  if (!archivio) return "demo";
  try {
    const esito = await archivio.conferma(token);
    return esito === "non_trovata" ? "link_non_valido" : esito;
  } catch (errore) {
    console.error("[lista-attesa] conferma non riuscita:", errore instanceof Error ? errore.message : errore);
    return "errore";
  }
}
