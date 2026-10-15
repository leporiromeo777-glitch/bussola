import "./stampa.css";

/** Contenitore degli strumenti: larghezza come il resto del sito, stile di stampa pulito. */
export default function LayoutStrumenti({ children }: LayoutProps<"/strumenti">) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12 print:max-w-none print:p-0">{children}</div>;
}
