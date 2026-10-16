import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { navigazione, sito } from "@/lib/sito";
import { supabaseConfigured } from "@/lib/supabase/env";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const titoli = Plus_Jakarta_Sans({ variable: "--font-titoli-caricato", subsets: ["latin"], weight: ["700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(sito.url),
  title: { default: `${sito.nome}: ${sito.slogan}`, template: `%s · ${sito.nome}` },
  description: sito.descrizione,
};

// In modalità demo (Supabase non configurato) l'accesso non funziona: niente link nell'header.
const accessoAttivo = supabaseConfigured();

// Statistiche senza cookie (Plausible), solo se il dominio è configurato.
const dominioPlausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it-CH" className={`${geistSans.variable} ${geistMono.variable} ${titoli.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-card focus:px-3 focus:py-2"
        >
          Vai al contenuto
        </a>
        {/*
          Menu a pillole che resta in alto. Su telefono: prima riga con il nome
          e il pulsante, seconda riga con il menu (scorre di lato se non ci
          sta). Da md in su tutto su una riga, centrato. Ogni link è alto
          almeno 40 px, per toccarlo bene con il dito.
        */}
        <header className="sticky top-0 z-40 px-3 pt-3">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 md:flex-nowrap">
            <Link
              href="/"
              className="mr-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card/90 px-4 text-lg font-extrabold tracking-tight text-brand shadow-sm backdrop-blur md:mr-0"
              style={{ fontFamily: "var(--font-titoli)" }}
            >
              <Image src="/mascotte/bussolina.webp" alt="" width={540} height={720} className="h-7 w-auto" priority />
              {sito.nome}
            </Link>
            <nav
              aria-label="Principale"
              className="order-last flex w-full items-center overflow-x-auto rounded-full border border-border bg-card/90 px-2 text-sm shadow-sm backdrop-blur md:order-none md:w-auto md:overflow-visible"
            >
              {navigazione.map((voce) => (
                <Link
                  key={voce.href}
                  href={voce.href}
                  className="inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 font-medium text-muted hover:text-foreground"
                >
                  {voce.etichetta}
                </Link>
              ))}
              {accessoAttivo ? (
                <Link
                  href="/accedi"
                  className="inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 font-medium text-muted hover:text-foreground"
                >
                  Accedi
                </Link>
              ) : null}
            </nav>
            <Link
              href="/questionario"
              className="bordo-sfumato inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-foreground shadow-sm"
            >
              Inizia ora
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>
        <main id="contenuto" className="flex-1">
          {children}
        </main>
        <footer className="mt-16 border-t border-border text-sm text-muted">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-lg font-extrabold text-brand" style={{ fontFamily: "var(--font-titoli)" }}>
                <Image src="/mascotte/bussolina.webp" alt="" width={540} height={720} className="h-7 w-auto" />
                {sito.nome}
              </p>
              <p className="mt-3 max-w-xs">
                {sito.nome} offre informazioni generali con le fonti ufficiali, non consulenza fiscale o giuridica
                personalizzata. Per i casi particolari rivolgiti a un fiduciario autorizzato.
              </p>
            </div>
            <ColonnaPiede
              titolo="Prodotto"
              voci={[
                { href: "/questionario", etichetta: "Questionario" },
                ...navigazione,
              ]}
            />
            <ColonnaPiede
              titolo={sito.nome}
              voci={[
                { href: "/#come-funziona", etichetta: "Come funziona" },
                { href: "/#cosa-non-e", etichetta: "Cosa Bleo non è" },
                { href: "/#domande", etichetta: "Domande frequenti" },
                { href: "/#lista-attesa", etichetta: "Lista d'attesa" },
              ]}
            />
            <ColonnaPiede
              titolo="Note legali"
              voci={[
                { href: "/privacy", etichetta: "Privacy" },
                { href: "/impressum", etichetta: "Impressum" },
              ]}
            />
          </div>
          <div className="mx-auto flex max-w-5xl flex-col gap-1 border-t border-border px-4 py-5 sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} {sito.nome}</p>
            <p>Fatto con cura in Ticino 🇨🇭</p>
          </div>
        </footer>
        {dominioPlausible ? (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={dominioPlausible}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}

function ColonnaPiede({ titolo, voci }: { titolo: string; voci: readonly { href: string; etichetta: string }[] }) {
  return (
    <nav aria-label={titolo}>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{titolo}</p>
      <ul className="mt-3 space-y-1">
        {voci.map((v) => (
          <li key={v.href}>
            <Link href={v.href} className="inline-flex min-h-8 items-center hover:text-foreground">
              {v.etichetta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
