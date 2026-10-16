import type { Metadata } from "next";
import { connection } from "next/server";
import { IntestazioneStrumento, NotaNonConsulenza } from "@/components/strumenti/intestazione";
import { Fonti } from "@/components/strumenti/ui";
import { REGOLE_NOME_DITTA } from "@/data/nome-ditta";
import { dataSvizzera } from "@/data/svizzera";
import { anthropicConfigurato } from "@/lib/chat/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NomeDitta } from "./nome-ditta";

export const metadata: Metadata = {
  title: "Nome della ditta",
  description:
    "Idee per il nome della tua ditta individuale con il tuo cognome, come vuole la legge, e un primo controllo dei nomi simili nel registro di commercio (Zefix).",
};

export default async function PaginaNomeDitta() {
  // Al momento della richiesta: dipende dalle variabili d'ambiente del server.
  await connection();
  // Le proposte servono Claude e il limite per connessione (chiave segreta di Supabase).
  const proposteDisponibili = anthropicConfigurato() && createAdminClient() !== null;
  const verificatoIl = REGOLE_NOME_DITTA.map((r) => r.verificatoIl).sort()[0];

  return (
    <>
      <IntestazioneStrumento
        titolo="Nome della ditta"
        introduzione={
          <p>
            Bleo ti propone nomi per la tua ditta individuale che rispettano la regola del cognome e cerca se nel
            registro di commercio esistono già nomi simili. Puoi anche controllare un nome che hai già in mente.
          </p>
        }
      />

      <section aria-labelledby="regole-nome" className="mt-8 max-w-3xl rounded-xl border border-border bg-brand-soft p-4 sm:p-6">
        <h2 id="regole-nome" className="text-lg font-semibold">
          Le regole per il nome
        </h2>
        <ul className="mt-3 space-y-3">
          {REGOLE_NOME_DITTA.map((regola) => (
            <li key={regola.id} className="text-sm">
              <p>{regola.testo}</p>
              <Fonti fonti={regola.fonti} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Fonti controllate il {dataSvizzera(verificatoIl)}.</p>
      </section>

      <NomeDitta proposteDisponibili={proposteDisponibili} />

      <NotaNonConsulenza className="mt-10 max-w-3xl" />
    </>
  );
}
