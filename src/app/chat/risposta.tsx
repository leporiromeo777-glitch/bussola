import { formattaData } from "@/lib/chat/formato";
import { strutturaRisposta, type Parte } from "@/lib/chat/testo-risposta";
import type { BloccoRisposta, CitazioneMappata, FonteCitata } from "@/lib/chat/tipi";

const idFonte = (idMessaggio: string, numero: number) => `fonte-${idMessaggio}-${numero}`;

/** Solo link web: una risposta riletta dal database non apre mai altri tipi di indirizzo. */
const linkWeb = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined);

/** Testo della risposta con paragrafi, elenchi e i numeri delle fonti accanto alle frasi citate. */
export function TestoRisposta({ blocchi, idMessaggio }: { blocchi: BloccoRisposta[]; idMessaggio: string }) {
  const elementi = strutturaRisposta(blocchi);
  return (
    <div className="space-y-3 leading-relaxed">
      {elementi.map((elemento, i) =>
        elemento.tipo === "elenco" ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {elemento.punti.map((punto, j) => (
              <li key={j}>
                <Parti parti={punto} idMessaggio={idMessaggio} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Parti parti={elemento.parti} idMessaggio={idMessaggio} />
          </p>
        ),
      )}
    </div>
  );
}

function Parti({ parti, idMessaggio }: { parti: Parte[]; idMessaggio: string }) {
  return parti.map((parte, i) => {
    if (parte.tipo === "citazioni") return <Rimandi key={i} citazioni={parte.citazioni} idMessaggio={idMessaggio} />;
    return parte.grassetto ? <strong key={i}>{parte.testo}</strong> : <span key={i}>{parte.testo}</span>;
  });
}

/** I numeri [1] [2] dopo una frase: portano alla fonte nell'elenco sotto la risposta. */
function Rimandi({ citazioni, idMessaggio }: { citazioni: CitazioneMappata[]; idMessaggio: string }) {
  return (
    <sup className="ml-0.5 whitespace-nowrap">
      {citazioni.map((c) => (
        <a
          key={c.numero}
          href={`#${idFonte(idMessaggio, c.numero)}`}
          title={c.citato ? `${c.titolo}: «${c.citato}»` : c.titolo}
          className="mx-px rounded px-0.5 font-semibold text-brand no-underline hover:bg-brand-soft"
        >
          <span aria-hidden="true">[{c.numero}]</span>
          <span className="sr-only">fonte {c.numero}</span>
        </a>
      ))}
    </sup>
  );
}

/** Elenco delle fonti citate sotto una risposta. */
export function ElencoFonti({ fonti, idMessaggio }: { fonti: FonteCitata[]; idMessaggio: string }) {
  if (fonti.length === 0) return null;
  return (
    <section aria-labelledby={`titolo-fonti-${idMessaggio}`} className="mt-4 border-t border-border pt-3">
      <h3 id={`titolo-fonti-${idMessaggio}`} className="text-sm font-semibold">
        Fonti
      </h3>
      <ol className="mt-2 space-y-2 text-sm">
        {fonti.map((fonte) => (
          <li key={fonte.numero} id={idFonte(idMessaggio, fonte.numero)} className="flex scroll-mt-24 gap-2">
            <span className="font-semibold text-brand" aria-hidden="true">
              [{fonte.numero}]
            </span>
            <div>
              <a
                href={linkWeb(fonte.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-brand"
              >
                {fonte.titolo}
                <span className="sr-only"> (si apre in una nuova scheda)</span>
              </a>
              <p className="text-muted">
                {fonte.ente} · verificata il {formattaData(fonte.verificato_il)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
