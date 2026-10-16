import { avsIndipendenti, chf, dataSvizzera, regole, tasseRegistroCommercio, type Fonte } from "@/data/svizzera";
import { Sezione } from "./sezione";

type Numero = { cifra: string; testo: string; fonti: Fonte[]; verificatoIl: string };

// Numeri grandi come su tryholo.ai, ma solo dati ufficiali con la fonte
// (src/data/svizzera.ts), niente statistiche di marketing.
const avs = avsIndipendenti[2026];
const NUMERI: Numero[] = [
  {
    cifra: chf(regole.sogliaIva.valore),
    testo: "di cifra d'affari all'anno: da qui servono l'IVA e l'iscrizione al registro di commercio",
    fonti: [regole.sogliaIva.fonte, regole.sogliaRegistroCommercio.fonte],
    verificatoIl: regole.sogliaIva.verificatoIl,
  },
  {
    cifra: `${regole.termineAnnuncioIvaGiorni.valore} giorni`,
    testo: "per annunciarti all'IVA da quando l'obbligo comincia",
    fonti: [regole.termineAnnuncioIvaGiorni.fonte],
    verificatoIl: regole.termineAnnuncioIvaGiorni.verificatoIl,
  },
  {
    cifra: chf(avs.valore.contributoMinimo),
    testo: `contributo minimo AVS/AI/IPG all'anno da indipendente nel ${avs.valore.anno}, senza i supplementi cantonali`,
    fonti: [avs.fonte],
    verificatoIl: avs.verificatoIl,
  },
  {
    cifra: chf(tasseRegistroCommercio.valore.stimaTitolareConFirma),
    testo: "di tasse federali per iscrivere la ditta individuale, più l'autenticazione della firma",
    fonti: [tasseRegistroCommercio.fonte],
    verificatoIl: tasseRegistroCommercio.verificatoIl,
  },
];

export function Numeri() {
  return (
    <Sezione
      id="numeri"
      sopratitolo="I numeri da conoscere"
      titolo="Pochi numeri, tutti con la fonte ufficiale"
      sfondo="card"
      introduzione={<p>Bleo te li mostra quando servono, nel tuo percorso, con il link alla legge o all&apos;ufficio.</p>}
    >
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {NUMERI.map((n) => (
          <li key={n.cifra} className="flex flex-col rounded-2xl border border-border bg-background p-6 text-center">
            <p
              className="testo-sfumato text-3xl font-extrabold tracking-tight whitespace-nowrap sm:text-4xl lg:text-[2rem]"
              style={{ fontFamily: "var(--font-titoli)" }}
            >
              {n.cifra}
            </p>
            <p className="mt-3 flex-1 text-sm text-muted">{n.testo}</p>
            <p className="mt-4 text-xs text-muted">
              Fonte:{" "}
              {n.fonti.map((f, i) => (
                <span key={f.url}>
                  {i > 0 ? ", " : null}
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand underline underline-offset-2 hover:text-brand-strong"
                  >
                    {f.titolo}
                    <span className="sr-only"> (si apre in una nuova scheda)</span>
                  </a>
                </span>
              ))}
              . Controllato il {dataSvizzera(n.verificatoIl)}.
            </p>
          </li>
        ))}
      </ul>
    </Sezione>
  );
}
