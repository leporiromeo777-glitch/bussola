import type { Metadata } from "next";
import { connection } from "next/server";
import { leggiDatiAccount } from "@/lib/percorso/account";
import { annoScadenzario } from "@/lib/percorso/calendario";
import { supabaseConfigured } from "@/lib/supabase/env";
import { Percorso } from "./percorso";
import "./stampa.css";

export const metadata: Metadata = {
  title: "Il tuo percorso",
  description:
    "I passi per aprire la tua ditta individuale in Ticino e nel Grigioni italiano, nell'ordine giusto, con i link ufficiali e le scadenze da ricordare.",
};

export default async function PaginaPercorso() {
  // Sempre al momento della richiesta: dipende dall'utente collegato.
  await connection();
  const account = await leggiDatiAccount();
  return (
    <Percorso account={account} accessoDisponibile={supabaseConfigured()} annoScadenze={annoScadenzario(new Date())} />
  );
}
