import Link from "next/link";
import { contieneSegnaposto, luogoDatabase } from "@/lib/privacy";
import { Sezione } from "./sezione";

/** «I tuoi dati restano tuoi»: solo cose vere, con il rimando all'informativa. */
export function Dati() {
  const luogo = luogoDatabase(process.env.NEXT_PUBLIC_SUPABASE_REGIONE_DATI);
  const punti = [
    {
      titolo: "Restano sul tuo dispositivo",
      testo: "Questionario e strumenti salvano i dati nel tuo browser o nel telefono, finché non decidi di accedere con un account.",
    },
    ...(contieneSegnaposto(luogo)
      ? []
      : [{ titolo: `Database ${luogo}`, testo: "Se crei un account, risposte e passi fatti sono salvati lì, solo per te." }]),
    {
      titolo: "Non li vendiamo",
      testo: "Niente pubblicità e niente vendita di dati, a nessuno. Le statistiche del sito sono senza cookie.",
    },
    {
      titolo: "Li cancelli quando vuoi",
      testo: "Puoi eliminare l'account e tutti i suoi dati da solo, in qualsiasi momento.",
    },
  ];
  return (
    <Sezione
      id="dati"
      sopratitolo="Privacy"
      titolo={
        <>
          I tuoi piani sono <span className="testo-sfumato">tuoi</span>.
        </>
      }
      introduzione={
        <p>
          Un&apos;idea d&apos;impresa è una cosa personale. Ecco cosa succede ai tuoi dati, in breve: i dettagli sono
          nell&apos;{" "}
          <Link href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-strong">
            informativa sulla privacy
          </Link>
          .
        </p>
      }
    >
      <ul className={`grid gap-4 sm:grid-cols-2 ${punti.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {punti.map((p) => (
          <li key={p.titolo} className="rounded-2xl border border-border bg-card p-6">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-lg text-brand"
            >
              🔒
            </span>
            <h3 className="mt-4 font-bold" style={{ fontFamily: "var(--font-titoli)" }}>
              {p.titolo}
            </h3>
            <p className="mt-2 text-sm text-muted">{p.testo}</p>
          </li>
        ))}
      </ul>
    </Sezione>
  );
}
