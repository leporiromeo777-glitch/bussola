import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { navigazione, sito } from "@/lib/sito";
import { supabaseConfigured } from "@/lib/supabase/env";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
    <html lang="it-CH" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-card focus:px-3 focus:py-2"
        >
          Vai al contenuto
        </a>
        {/*
          Su telefono: prima riga con il nome e «Accedi», seconda riga con il
          menu (scorre di lato se non ci sta). Da sm in su tutto su una riga.
          Ogni link è alto almeno 40 px, per toccarlo bene con il dito.
        */}
        <header className="border-b border-border bg-card/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 px-4 py-1 sm:flex-nowrap sm:py-2">
            <Link
              href="/"
              className="mr-auto inline-flex min-h-10 items-center text-lg font-semibold tracking-tight text-brand"
            >
              {sito.nome}
            </Link>
            <nav
              aria-label="Principale"
              className="order-last -mx-2 flex w-[calc(100%+1rem)] items-center overflow-x-auto text-sm sm:order-none sm:mx-0 sm:w-auto sm:gap-x-1 sm:overflow-visible"
            >
              {navigazione.map((voce) => (
                <Link
                  key={voce.href}
                  href={voce.href}
                  className="inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-muted hover:text-foreground"
                >
                  {voce.etichetta}
                </Link>
              ))}
            </nav>
            {accessoAttivo ? (
              <Link
                href="/accedi"
                className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border px-4 text-sm text-foreground hover:border-brand"
              >
                Accedi
              </Link>
            ) : null}
          </div>
        </header>
        <main id="contenuto" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border text-sm text-muted">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl">
              {sito.nome} offre informazioni generali con le fonti ufficiali, non consulenza fiscale o
              giuridica personalizzata. Per i casi particolari rivolgiti a un fiduciario autorizzato.
            </p>
            <nav aria-label="Note legali" className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
            </nav>
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
