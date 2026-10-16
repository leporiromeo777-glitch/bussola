import Link from "next/link";
import type { ReactNode } from "react";
import { fonti } from "@/data/svizzera";
import { IconaAvviso, IconaCalendario, IconaInfo } from "@/components/strumenti/icone";
import { FonteLink, classePulsantePrincipale, classePulsanteSecondario } from "@/components/strumenti/ui";
import type { SpiegazioneLettera } from "@/lib/lettera/spiegazione";

type PropsIcona = { className?: string };

function Icona({ className = "size-5", children }: PropsIcona & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export const IconaFotocamera = (p: PropsIcona) => (
  <Icona {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icona>
);

export const IconaPdf = (p: PropsIcona) => (
  <Icona {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Icona>
);

const IconaMoneta = (p: PropsIcona) => (
  <Icona {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.5 9.5c-.4-.9-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2.1-.6-2.5-1.5M12 6.5V8M12 16v1.5" />
  </Icona>
);

function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">{titolo}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** Nota fissa: chi ha scritto la spiegazione e che non è una consulenza. */
function NotaInformazioneGenerale() {
  return (
    <p className="mt-6 text-sm text-muted">
      Questa spiegazione l&apos;ha scritta un&apos;intelligenza artificiale leggendo la tua foto e può sbagliare:
      controlla sempre date e importi sulla lettera. È un&apos;informazione generale, non una consulenza fiscale o
      giuridica. Per il tuo caso rivolgiti all&apos;ufficio che ha scritto o a un fiduciario autorizzato.
    </p>
  );
}

function Pulsanti({ onAltra }: { onAltra: () => void }) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={onAltra} className={`${classePulsantePrincipale} py-3`}>
        Fotografa un&apos;altra lettera
      </button>
      <Link href="/chat" className={`${classePulsanteSecondario} py-3`}>
        Chiedi a Bleo
      </Link>
    </div>
  );
}

/** La spiegazione della lettera: cos'è, in breve, scadenze e importi in evidenza, cosa fare, quando chiedere aiuto. */
export function RisultatoLettera({ spiegazione, onAltra }: { spiegazione: SpiegazioneLettera; onAltra: () => void }) {
  const s = spiegazione;

  if (s.stato !== "ok") {
    return (
      <section aria-labelledby="lettera-non-letta" className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <IconaInfo className="mt-1 size-6 shrink-0 text-accent" />
          <div>
            <h2 id="lettera-non-letta" className="text-xl font-semibold tracking-tight">
              {s.stato === "illeggibile" ? "Non riesco a leggere bene la lettera" : "Questa non sembra una lettera"}
            </h2>
            <p className="mt-2">{s.cosE}</p>
            {s.inBreve ? <p className="mt-1 text-muted">{s.inBreve}</p> : null}
          </div>
        </div>
        <ul className="mt-5 list-disc space-y-1 pl-5 text-sm">
          <li>Appoggia il foglio su un tavolo, con buona luce e senza ombre.</li>
          <li>Inquadra tutta la pagina, dritta, e aspetta che sia a fuoco.</li>
          <li>Se la lettera ha più pagine, fotografa quella con importi e date, o carica il PDF.</li>
        </ul>
        <Pulsanti onAltra={onAltra} />
      </section>
    );
  }

  return (
    <article aria-labelledby="lettera-cos-e" className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-7">
      {s.mittente ? <p className="text-sm font-semibold text-brand">Da: {s.mittente}</p> : null}
      <h2 className="mt-1 text-sm font-semibold tracking-wide text-muted uppercase">Cos&apos;è</h2>
      <p id="lettera-cos-e" className="mt-1 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
        {s.cosE}
      </p>

      <Sezione titolo="In breve">
        <p className="text-lg leading-relaxed">{s.inBreve}</p>
      </Sezione>

      {s.scadenze.length > 0 ? (
        <Sezione titolo={s.scadenze.length === 1 ? "Scadenza" : "Scadenze"}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.scadenze.map((scadenza) => (
              <li
                key={`${scadenza.data}-${scadenza.cosa}`}
                className="flex items-start gap-3 rounded-2xl border border-accent/50 bg-accent/10 p-4"
              >
                <IconaCalendario className="mt-1 size-6 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted uppercase">Entro</p>
                  <p
                    className={
                      scadenza.eData
                        ? "text-3xl font-bold tracking-tight tabular-nums"
                        : "text-lg font-semibold leading-snug"
                    }
                  >
                    {scadenza.data}
                  </p>
                  <p className="mt-1">{scadenza.cosa}</p>
                </div>
              </li>
            ))}
          </ul>
        </Sezione>
      ) : null}

      {s.importi.length > 0 ? (
        <Sezione titolo={s.importi.length === 1 ? "Importo" : "Importi"}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.importi.map((importo) => (
              <li
                key={`${importo.importo}-${importo.cosa}`}
                className="flex items-start gap-3 rounded-2xl border border-border bg-brand-soft p-4"
              >
                <IconaMoneta className="mt-1 size-6 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight tabular-nums">{importo.importo}</p>
                  <p className="mt-1">{importo.cosa}</p>
                </div>
              </li>
            ))}
          </ul>
        </Sezione>
      ) : null}

      {s.cosaFare.length > 0 ? (
        <Sezione titolo="Cosa fare">
          <ol className="space-y-3">
            {s.cosaFare.map((azione, i) => (
              <li key={azione} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-background"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{azione}</span>
              </li>
            ))}
          </ol>
        </Sezione>
      ) : null}

      <div className="mt-6 rounded-2xl border border-border bg-background p-4">
        <p className="flex items-start gap-2 font-semibold">
          <IconaAvviso className="mt-0.5 size-5 shrink-0 text-accent" />
          Quando chiedere aiuto
        </p>
        <p className="mt-2">
          {s.quandoChiedereAiuto ??
            "Se qualcosa non ti è chiaro, chiama l'ufficio che ha scritto la lettera: il numero è di solito in alto."}
        </p>
        <p className="mt-2 text-sm text-muted">
          Per reclami, ricorsi o conti che non ti tornano puoi rivolgerti a un fiduciario autorizzato: li trovi
          nell&apos;
          <FonteLink fonte={fonti.albofiduciari} />.
        </p>
      </div>

      <NotaInformazioneGenerale />
      <Pulsanti onAltra={onAltra} />
    </article>
  );
}
