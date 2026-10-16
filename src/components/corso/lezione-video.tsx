import Link from "next/link";
import { durataBreve, type LezioneCorso } from "@/data/corso";
import { IconaFreccia } from "@/components/landing/icone";
import { IconaPlay } from "@/components/percorso/icone";

/**
 * La lezione video di Bleo: lettore nativo, che parte solo quando lo avvii.
 * Con preload="none" il telefono scarica solo la copertina finché non premi play.
 * I sottotitoli sono già nel video; la traccia WebVTT serve a lettori di schermo
 * e a chi li attiva dal lettore.
 */
export function LezioneVideo({
  lezione,
  conLinkCorso = false,
  className = "",
}: {
  lezione: LezioneCorso;
  /** Mostra sotto il video il link a /corso. */
  conLinkCorso?: boolean;
  className?: string;
}) {
  const etichetta = `Guarda la lezione di Bleo (${durataBreve(lezione.durataSecondi)})`;
  return (
    <figure className={`print:hidden ${className}`}>
      <figcaption className="inline-flex items-center gap-2 font-semibold text-brand">
        <IconaPlay className="size-5 shrink-0" />
        {etichetta}
      </figcaption>
      <video
        controls
        playsInline
        preload="none"
        poster={lezione.poster}
        width={1080}
        height={1080}
        aria-label={`Lezione ${lezione.numero}: ${lezione.titolo}`}
        className="mt-2 aspect-square h-auto w-full rounded-2xl border border-border bg-[#fbfaf7] shadow-sm"
      >
        <source src={lezione.video} type="video/mp4" />
        <track kind="captions" src={lezione.sottotitoli} srcLang="it" label="Italiano" />
        Il tuo browser non riesce a mostrare il video:{" "}
        <a href={lezione.video} className="underline">
          scaricalo qui
        </a>
        .
      </video>
      {conLinkCorso ? (
        <Link
          href="/corso"
          className="mt-2 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-muted hover:text-brand"
        >
          Tutte le lezioni del corso di Bleo
          <IconaFreccia className="size-4" />
        </Link>
      ) : null}
    </figure>
  );
}
