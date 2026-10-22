/**
 * Il primo passo del workflow pianificato: scrive in GITHUB_OUTPUT
 * `formato=video`, `formato=carosello` o `formato=niente` (scripts/social/turno.ts).
 *
 *   npm run social:turno
 *
 * Con HA_LINKEDIN=true il carosello deve uscire anche su LinkedIn.
 */
import { appendFileSync } from "node:fs";
import { leggiStorico } from "./storico";
import { cosaPubblicare } from "./turno";

const linkedin = process.env.HA_LINKEDIN === "true";
const formato = cosaPubblicare(leggiStorico(), new Date(), { video: 2, carosello: linkedin ? 3 : 2 }) ?? "niente";
console.log(formato === "niente" ? "Niente da pubblicare adesso." : `Adesso: ${formato}.`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `formato=${formato}\n`);
