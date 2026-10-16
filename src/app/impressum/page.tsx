import type { Metadata } from "next";
import Link from "next/link";
import { Avviso, PaginaLegale } from "@/components/landing/pagina-legale";
import { DatiTitolare, titolareIncompleto } from "@/components/landing/titolare";
import { indirizzoTitolareMancante } from "@/lib/sito";
import { sito } from "@/lib/sito";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Chi gestisce ${sito.nome}, come contattarci e i limiti delle informazioni pubblicate.`,
  alternates: { canonical: "/impressum" },
};

export default function PaginaImpressum() {
  return (
    <PaginaLegale
      titolo="Impressum"
      prima={
        titolareIncompleto || indirizzoTitolareMancante ? (
          <Avviso>
            <p className="mt-0! font-semibold">Nessuna ditta iscritta per ora: {sito.nome} è in fase di prova.</p>
            <p className="mt-1!">
              {titolareIncompleto
                ? "I dati del titolare tra parentesi quadre saranno completati prima del lancio."
                : "L'indirizzo postale sarà pubblicato qui prima di offrire servizi a pagamento. Nel frattempo puoi scriverci via email."}
            </p>
          </Avviso>
        ) : null
      }
    >
      <section aria-labelledby="gestore">
        <h2 id="gestore">Chi gestisce questo sito</h2>
        <p>
          {sito.nome} è gestito da:
        </p>
        <DatiTitolare />
        <p>Per qualsiasi domanda puoi scriverci a questo indirizzo email.</p>
      </section>

      <section aria-labelledby="informazioni">
        <h2 id="informazioni">Informazioni generali, non consulenza</h2>
        <p>
          Le informazioni su {sito.nome} sono generali e indicano sempre la fonte ufficiale da cui vengono. Non sono una
          consulenza personalizzata di tipo fiscale, giuridico o fiduciario e non sostituiscono il parere di un
          professionista.
        </p>
        <p>
          Controlliamo le fonti con cura e le ricontrolliamo regolarmente, ma le regole cambiano: fa sempre fede il
          testo ufficiale. Per il tuo caso concreto rivolgiti all&apos;ufficio competente o a un fiduciario
          autorizzato. Non rispondiamo di danni dovuti all&apos;uso delle informazioni pubblicate, nei limiti
          consentiti dalla legge.
        </p>
      </section>

      <section aria-labelledby="link-esterni">
        <h2 id="link-esterni">Link ad altri siti</h2>
        <p>
          {sito.nome} rimanda spesso a siti di terzi, per esempio EasyGov, le casse di compensazione AVS o il Cantone.
          Non abbiamo controllo sul loro contenuto e non ne rispondiamo: la responsabilità è di chi li gestisce.
        </p>
      </section>

      <section aria-labelledby="diritti-autore">
        <h2 id="diritti-autore">Diritti d&apos;autore</h2>
        <p>
          Testi, grafica e codice di {sito.nome} appartengono al titolare, salvo diversa indicazione. I testi ufficiali
          citati restano degli enti che li pubblicano.
        </p>
      </section>

      <section aria-labelledby="dati-personali">
        <h2 id="dati-personali">Dati personali</h2>
        <p>
          Come trattiamo i tuoi dati è spiegato nell&apos;<Link href="/privacy">informativa sulla privacy</Link>.
        </p>
      </section>
    </PaginaLegale>
  );
}
