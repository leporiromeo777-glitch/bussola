import { redirect } from "next/navigation";
import { provenienzaDaParametri } from "@/lib/lista-attesa/provenienza";

/**
 * Indirizzo corto da condividere (es. nella bio: /lista-attesa?ref=instagram):
 * porta al modulo nella pagina iniziale, conservando la provenienza.
 */
export default async function PaginaListaAttesa({ searchParams }: PageProps<"/lista-attesa">) {
  const parametri = await searchParams;
  const query = new URLSearchParams();
  for (const [chiave, valore] of Object.entries(parametri)) {
    if (typeof valore === "string") query.set(chiave, valore);
  }
  const provenienza = provenienzaDaParametri(query);
  redirect(provenienza ? `/?ref=${encodeURIComponent(provenienza)}#lista-attesa` : "/#lista-attesa");
}
