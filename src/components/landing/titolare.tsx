import { sito } from "@/lib/sito";

/** I valori di sito.titolare non ancora completati sono scritti tra parentesi quadre. */
export function valoreSegnaposto(valore: string): boolean {
  return /^\[.*\]$/.test(valore.trim());
}

/** true se almeno un dato del titolare (nome, indirizzo, email) è ancora da completare. */
export const titolareIncompleto = Object.values(sito.titolare).some(valoreSegnaposto);

/** Nome, indirizzo ed email del titolare, come blocco <address>. */
export function DatiTitolare() {
  const { nome, indirizzo, email } = sito.titolare;
  return (
    <address className="mt-3 not-italic">
      {nome}
      <br />
      {indirizzo}
      <br />
      {valoreSegnaposto(email) ? email : <a href={`mailto:${email}`}>{email}</a>}
    </address>
  );
}

/** Email del titolare come link (o testo, se è ancora un segnaposto). */
export function EmailTitolare() {
  const { email } = sito.titolare;
  return valoreSegnaposto(email) ? <>{email}</> : <a href={`mailto:${email}`}>{email}</a>;
}
