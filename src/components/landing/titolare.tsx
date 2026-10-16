import { sito, titolareIncompleto, valoreSegnaposto } from "@/lib/sito";

// Definiti in src/lib/sito.ts perché servono anche lato server (email della lista d'attesa).
export { titolareIncompleto, valoreSegnaposto };

/** Nome, indirizzo ed email del titolare, come blocco <address>. */
export function DatiTitolare() {
  const { nome, indirizzo, email } = sito.titolare;
  return (
    <address className="mt-3 not-italic">
      {nome}
      <br />
      {valoreSegnaposto(indirizzo) ? null : (
        <>
          {indirizzo}
          <br />
        </>
      )}
      {valoreSegnaposto(email) ? email : <a href={`mailto:${email}`}>{email}</a>}
    </address>
  );
}

/** Email del titolare come link (o testo, se è ancora un segnaposto). */
export function EmailTitolare() {
  const { email } = sito.titolare;
  return valoreSegnaposto(email) ? <>{email}</> : <a href={`mailto:${email}`}>{email}</a>;
}
