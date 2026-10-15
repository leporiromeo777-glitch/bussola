import type { Metadata } from "next";
import { ModuloAccesso } from "./modulo-accesso";

export const metadata: Metadata = { title: "Accedi" };

export default async function PaginaAccedi({ searchParams }: PageProps<"/accedi">) {
  const { next, errore } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Accedi</h1>
      <p className="mt-2 text-muted">
        Niente password: ricevi un link via email. Con l&apos;accesso salvi il percorso e usi la chat.
      </p>
      {errore ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          Il link non è valido o è scaduto. Richiedine uno nuovo.
        </p>
      ) : null}
      <div className="mt-6">
        <ModuloAccesso next={typeof next === "string" ? next : undefined} />
      </div>
    </div>
  );
}
