/**
 * Parti dell'informativa sulla privacy (src/app/privacy/page.tsx) che
 * dipendono dalla configurazione. Le parti ancora da completare sono scritte
 * tra parentesi quadre, come i dati del titolare.
 */

/**
 * Dove sono salvati i dati del database, secondo la regione del progetto
 * Supabase: "svizzera" = eu-central-2 (Zurigo), "ue" = eu-central-1
 * (Francoforte). Senza valore resta da indicare.
 */
export function luogoDatabase(regione: string | undefined): string {
  switch (regione?.trim().toLowerCase()) {
    case "svizzera":
      return "in Svizzera (Zurigo)";
    case "ue":
      return "nell'Unione europea (Francoforte, Germania)";
    default:
      return "in Svizzera o nell'Unione europea [da indicare prima del lancio]";
  }
}
