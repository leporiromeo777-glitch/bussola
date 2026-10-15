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
        <header className="border-b border-border bg-card/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight text-brand">
              {sito.nome}
            </Link>
            <nav aria-label="Principale" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              {navigazione.map((voce) => (
                <Link key={voce.href} href={voce.href} className="text-muted hover:text-foreground">
                  {voce.etichetta}
                </Link>
              ))}
              {accessoAttivo ? (
                <Link
                  href="/accedi"
                  className="rounded-full border border-border px-3 py-1 text-foreground hover:border-brand"
                >
                  Accedi
                </Link>
              ) : null}
            </nav>
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
