import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { classeLink } from "@/components/strumenti/ui";
import { contaDaGuardare } from "@/lib/cassetto/scadenze";
import { oggiZurigo } from "@/lib/conti/importi";
import { createClient, getUser } from "@/lib/supabase/server";
import { EliminaAccount } from "./elimina-account";
import { PulsanteEsci } from "./pulsante-esci";

export const metadata: Metadata = { title: "Il tuo account" };

export default async function PaginaAccount() {
  const user = await getUser();
  if (!user) redirect("/accedi?next=/account");

  const supabase = await createClient();
  const { data: profilo } = (await supabase?.from("profili").select("piano, piano_scade_il").single()) ?? {
    data: null,
  };
  // Documenti del cassetto scaduti o in scadenza, per il pallino (0 se la tabella non c'è ancora).
  const { data: scadenze } = (await supabase
    ?.from("cassetto_documenti")
    .select("scade_il")
    .not("scade_il", "is", null)
    .overrideTypes<{ scade_il: string }[], { merge: false }>()) ?? { data: null };
  const daGuardare = contaDaGuardare(
    (scadenze ?? []).map((r) => ({ scadeIl: r.scade_il })),
    oggiZurigo(),
  );

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Il tuo account</h1>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted">Piano</dt>
        <dd className="capitalize">{profilo?.piano ?? "gratis"}</dd>
      </dl>
      <section aria-labelledby="i-tuoi-dati" className="mt-8">
        <h2 id="i-tuoi-dati" className="text-lg font-semibold">
          I tuoi dati su Bleo
        </h2>
        <ul className="mt-2 space-y-2">
          <li>
            <Link href="/conti" className={classeLink}>
              I tuoi conti
            </Link>
          </li>
          <li>
            <Link href="/documenti" className={classeLink}>
              Cassetto dei documenti
            </Link>
            {daGuardare > 0 ? (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-sm font-bold text-background">
                {daGuardare === 1 ? "1 da guardare" : `${daGuardare} da guardare`}
              </span>
            ) : null}
          </li>
        </ul>
      </section>
      <PulsanteEsci />
      <EliminaAccount />
    </div>
  );
}
