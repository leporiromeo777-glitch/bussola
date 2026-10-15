import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { PulsanteEsci } from "./pulsante-esci";

export const metadata: Metadata = { title: "Il tuo account" };

export default async function PaginaAccount() {
  const user = await getUser();
  if (!user) redirect("/accedi?next=/account");

  const supabase = await createClient();
  const { data: profilo } = (await supabase?.from("profili").select("piano, piano_scade_il").single()) ?? {
    data: null,
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Il tuo account</h1>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted">Piano</dt>
        <dd className="capitalize">{profilo?.piano ?? "gratis"}</dd>
      </dl>
      <PulsanteEsci />
    </div>
  );
}
