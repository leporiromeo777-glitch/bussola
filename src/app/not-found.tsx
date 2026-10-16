import type { Metadata } from "next";
import Link from "next/link";
import { PaginaMessaggio } from "@/components/landing/pagina-messaggio";
import { ImmagineMascotte } from "@/components/mascotte/immagine";

export const metadata: Metadata = { title: "Pagina non trovata" };

const LINK = [
  { href: "/", etichetta: "Pagina iniziale" },
  { href: "/percorso", etichetta: "Il tuo percorso" },
  { href: "/strumenti", etichetta: "Strumenti" },
] as const;

/** Pagina 404: link sbagliati e indirizzi che non esistono più. */
export default function PaginaNonTrovata() {
  return (
    <PaginaMessaggio tono="info" titolo="Pagina non trovata" azioni={false}>
      <ImmagineMascotte nome="pensa" sizes="160px" className="h-auto w-36" />
      <p>Il link che hai aperto non esiste o è cambiato. Puoi ripartire da qui:</p>
      <ul className="space-y-2">
        {LINK.map(({ href, etichetta }) => (
          <li key={href}>
            <Link href={href} className="font-medium text-brand underline underline-offset-2 hover:text-brand-strong">
              {etichetta}
            </Link>
          </li>
        ))}
      </ul>
    </PaginaMessaggio>
  );
}
