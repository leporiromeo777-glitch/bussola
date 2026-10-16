import { Sezione } from "./sezione";

type Valore = "si" | "no" | "dipende";

const COLONNE = ["Bleo", "Cercare da solo", "Chatbot generico"] as const;

// Confronto con quello che fa chi parte da solo (come la tabella di
// tryholo.ai, ma senza nomi di altri prodotti). Il fiduciario non è un
// concorrente: è a chi Bleo ti manda per i casi personali (vedi «Cosa Bleo
// non è»), e il suo costo non ha una fonte ufficiale da citare.
const RIGHE: { voce: string; valori: [Valore, Valore, Valore] }[] = [
  { voce: "I passi nell'ordine giusto per la tua situazione", valori: ["si", "no", "dipende"] },
  { voce: "Il link alla fonte ufficiale per ogni informazione", valori: ["si", "dipende", "dipende"] },
  { voce: "Regole del Ticino e del Grigioni italiano", valori: ["si", "dipende", "dipende"] },
  { voce: "Ti dice quando non sa la risposta", valori: ["si", "no", "dipende"] },
  { voce: "Ti dice quando ti serve un fiduciario", valori: ["si", "no", "dipende"] },
];

const TESTI: Record<Valore, string> = { si: "Sì", no: "No", dipende: "Dipende" };

function Segno({ valore }: { valore: Valore }) {
  if (valore === "dipende") {
    return <span className="text-sm font-medium text-muted">Dipende</span>;
  }
  const si = valore === "si";
  return (
    <span
      className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-bold ${
        si ? "bg-success/15 text-success" : "bg-danger/10 text-danger"
      }`}
    >
      <span aria-hidden="true">{si ? "✓" : "✕"}</span>
      <span className="sr-only">{TESTI[valore]}</span>
    </span>
  );
}

export function Confronto() {
  return (
    <Sezione
      id="confronto"
      sopratitolo="Confronto"
      titolo="Perché non basta cercare su internet"
      introduzione={
        <p>
          Bleo ti risparmia ore di ricerche. E quando il tuo caso è particolare ti dice che è il momento di sentire un
          fiduciario, così ci arrivi preparato.
        </p>
      }
    >
      <div className="relative overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">Confronto tra Bleo e le alternative</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="p-4 text-sm font-medium text-muted">
                <span className="sr-only">Cosa offre</span>
              </th>
              {COLONNE.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`p-4 text-center text-sm font-bold ${i === 0 ? "bg-brand-soft text-brand" : ""}`}
                  style={i === 0 ? { fontFamily: "var(--font-titoli)" } : undefined}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RIGHE.map((r) => (
              <tr key={r.voce} className="border-b border-border last:border-b-0">
                <th scope="row" className="p-4 text-sm font-medium">
                  {r.voce}
                </th>
                {r.valori.map((v, i) => (
                  <td key={COLONNE[i]} className={`p-4 text-center ${i === 0 ? "bg-brand-soft/60" : ""}`}>
                    <Segno valore={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        «Dipende»: dal sito che trovi o dal chatbot che usi.
      </p>
    </Sezione>
  );
}
