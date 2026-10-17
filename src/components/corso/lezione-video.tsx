import Link from "next/link";
import { durataBreve, type Approfondimento, type LezioneCorso, type VideoCorso } from "@/data/corso";
import { IconaFreccia } from "@/components/landing/icone";
import { ElencoFonti } from "@/components/percorso/elenco-fonti";
import { IconaPlay } from "@/components/percorso/icone";

/**
 * La lezione video di Bleo: lettore nativo, che parte solo quando lo avvii.
 * Con preload="none" il telefono scarica solo la copertina finché non premi play.
 * I sottotitoli sono già nel video; la traccia WebVTT serve a lettori di schermo
 * e a chi li attiva dal lettore. Sotto, gli eventuali video facoltativi.
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
      <LettoreVideo video={lezione} etichetta={`Lezione ${lezione.numero}: ${lezione.titolo}`} className="mt-2" />
      {lezione.approfondimenti?.length ? <VideoFacoltativi approfondimenti={lezione.approfondimenti} /> : null}
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

/** Il lettore di un video del corso, con la copertina e i sottotitoli. */
function LettoreVideo({ video, etichetta, className = "" }: { video: VideoCorso; etichetta: string; className?: string }) {
  return (
    <video
      controls
      playsInline
      preload="none"
      poster={video.poster}
      width={1080}
      height={1080}
      aria-label={etichetta}
      className={`aspect-square h-auto w-full rounded-2xl border border-border bg-[#fbfaf7] shadow-sm ${className}`}
    >
      <source src={video.video} type="video/mp4" />
      <track kind="captions" src={video.sottotitoli} srcLang="it" label="Italiano" />
      Il tuo browser non riesce a mostrare il video:{" "}
      <a href={video.video} className="underline">
        scaricalo qui
      </a>
      .
    </video>
  );
}

/**
 * I video facoltativi della lezione, per chi vuole sapere di più: chiusi,
 * si aprono uno alla volta (senza JavaScript, con <details>).
 */
function VideoFacoltativi({ approfondimenti }: { approfondimenti: readonly Approfondimento[] }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold">Video facoltativi</p>
      <p className="text-sm text-muted">Per chi vuole sapere di più.</p>
      <ul className="mt-2 space-y-2">
        {approfondimenti.map((a) => (
          <li key={a.id}>
            <details className="rounded-2xl border border-border px-3 py-2">
              <summary className="flex min-h-8 cursor-pointer items-center gap-2 font-medium text-brand">
                <IconaPlay className="size-4 shrink-0" />
                <span>
                  {a.titolo} <span className="text-sm font-normal text-muted">· {durataBreve(a.durataSecondi)}</span>
                </span>
              </summary>
              <LettoreVideo video={a} etichetta={`Video facoltativo: ${a.titolo}`} className="mt-2" />
              <div className="mt-2">
                <ElencoFonti fonti={a.fonti} verificatoIl={a.verificatoIl} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
