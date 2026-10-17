/**
 * Strumento «Fondare una Sagl»: i dati che servono al notaio e al fiduciario
 * (società, capitale e quote, soci, chi dirige, banca, revisione) e i
 * controlli sulle regole della legge. Logica pura, senza browser: la usano
 * la pagina /strumenti/sagl e i PDF (documenti.ts).
 *
 * Fonti (Codice delle obbligazioni, testo in vigore dal 01.10.2026,
 * ricontrollato il 17.10.2026): capitale minimo art. 773 (regole in
 * src/data), quote di valore superiore a zero art. 774, ogni socio almeno
 * una quota art. 772, forma giuridica nella ditta art. 950, gestione art.
 * 809, rappresentante domiciliato in Svizzera art. 814 cpv. 3, conferimenti
 * in natura art. 777b, rinuncia alla revisione artt. 727a e 818.
 */
import { z } from "zod";
import { chf, fonti, fontiPercorso, regole, type Fonte } from "../../data/svizzera";

export const schemaSocio = z.object({
  id: z.string().max(40),
  nome: z.string().max(120),
  domicilio: z.string().max(120),
  quote: z.number().int().min(0).max(10_000_000),
  /** Porta dei beni (conferimento in natura) invece dei soldi. */
  inNatura: z.boolean(),
  /** Nella direzione «gerenti»: è uno dei gerenti. */
  gerente: z.boolean(),
  domiciliatoInSvizzera: z.boolean(),
});

/** Un gerente che non è socio (la legge lo permette). */
export const schemaGerenteEsterno = z.object({
  id: z.string().max(40),
  nome: z.string().max(120),
  domicilio: z.string().max(120),
  domiciliatoInSvizzera: z.boolean(),
});

export const schemaDatiFondazione = z.object({
  ditta: z.string().max(120),
  /** Il Comune della sede. */
  sede: z.string().max(80),
  scopo: z.string().max(800),
  capitale: z.number().min(0).max(1_000_000_000),
  valoreQuota: z.number().min(0).max(1_000_000_000),
  soci: z.array(schemaSocio).max(20),
  /** «tutti»: per legge dirigono tutti i soci insieme; «gerenti»: lo statuto affida la gestione a gerenti. */
  direzione: z.enum(["tutti", "gerenti"]),
  gerentiEsterni: z.array(schemaGerenteEsterno).max(10),
  banca: z.string().max(120),
  comunicazioni: z.enum(["scritto-email", "scritto"]),
  revisione: z.enum(["da-decidere", "ufficio", "rinuncia"]),
});

export type Socio = z.infer<typeof schemaSocio>;
export type GerenteEsterno = z.infer<typeof schemaGerenteEsterno>;
export type DatiFondazione = z.infer<typeof schemaDatiFondazione>;

export function nuovoSocio(id: string): Socio {
  return { id, nome: "", domicilio: "", quote: 0, inNatura: false, gerente: false, domiciliatoInSvizzera: true };
}

export function nuovoGerenteEsterno(id: string): GerenteEsterno {
  return { id, nome: "", domicilio: "", domiciliatoInSvizzera: true };
}

/** Il punto di partenza: capitale minimo di legge, due soci vuoti. */
export function datiFondazioneIniziali(): DatiFondazione {
  return {
    ditta: "",
    sede: "",
    scopo: "",
    capitale: regole.capitaleMinimoSagl.valore,
    valoreQuota: 100,
    soci: [nuovoSocio("socio-1"), nuovoSocio("socio-2")],
    direzione: "tutti",
    gerentiEsterni: [],
    banca: "",
    comunicazioni: "scritto-email",
    revisione: "da-decidere",
  };
}

export type Controllo = { id: string; testo: string; fonte?: Fonte };

/**
 * Cosa manca o non va. `errori`: senza correggerli i PDF non si possono
 * scaricare (i dati non tornano con la legge); `avvisi`: da sapere o da
 * chiarire con il notaio.
 */
export function controllaFondazione(d: DatiFondazione): { errori: Controllo[]; avvisi: Controllo[] } {
  const errori: Controllo[] = [];
  const avvisi: Controllo[] = [];
  const minimo = regole.capitaleMinimoSagl.valore;

  if (!d.ditta.trim()) errori.push({ id: "ditta", testo: "Scrivi il nome della società (la ditta)." });
  else if (!/\b(Sagl|GmbH|Sàrl)\b|società a garanzia limitata/i.test(d.ditta)) {
    avvisi.push({ id: "forma", testo: "Nella ditta deve esserci la forma giuridica, per esempio «Sagl».", fonte: fontiPercorso.co950 });
  }
  if (!d.sede.trim()) errori.push({ id: "sede", testo: "Scrivi il Comune della sede." });
  if (!d.scopo.trim()) errori.push({ id: "scopo", testo: "Descrivi lo scopo: cosa fa la società." });

  if (d.capitale < minimo) {
    errori.push({ id: "capitale", testo: `Il capitale deve essere di almeno ${chf(minimo)}.`, fonte: regole.capitaleMinimoSagl.fonte });
  }
  if (!(d.valoreQuota > 0)) {
    errori.push({ id: "valore", testo: "Ogni quota deve valere più di zero.", fonte: fontiPercorso.co774 });
  } else if (!Number.isInteger(d.capitale / d.valoreQuota)) {
    errori.push({ id: "divisione", testo: `Il capitale deve essere un numero intero di quote da ${chf(d.valoreQuota, 2)}.` });
  }

  if (d.soci.length === 0) errori.push({ id: "soci", testo: "Aggiungi almeno un socio.", fonte: fontiPercorso.co772 });
  d.soci.forEach((s, i) => {
    const chi = s.nome.trim() || `Socio ${i + 1}`;
    if (!s.nome.trim()) errori.push({ id: `nome-${s.id}`, testo: `Scrivi il nome del socio ${i + 1}.` });
    if (s.quote < 1) errori.push({ id: `quote-${s.id}`, testo: `${chi}: ogni socio ha almeno una quota.`, fonte: fontiPercorso.co772 });
  });
  const totale = totaleQuote(d);
  if (d.soci.length > 0 && d.valoreQuota > 0 && totale * d.valoreQuota !== d.capitale) {
    errori.push({
      id: "totale",
      testo: `Le quote dei soci fanno ${chf(totale * d.valoreQuota, 2)}, ma il capitale è ${chf(d.capitale, 2)}.`,
    });
  }

  const dirigenti = chiDirige(d);
  if (d.direzione === "gerenti" && dirigenti.length === 0) {
    errori.push({ id: "gerenti", testo: "Scegli almeno un gerente: un socio o una persona esterna.", fonte: fontiPercorso.co809 });
  }
  d.gerentiEsterni.forEach((g, i) => {
    if (!g.nome.trim()) errori.push({ id: `gerente-${g.id}`, testo: `Scrivi il nome del gerente esterno ${i + 1}.` });
  });
  if (dirigenti.length > 0 && !dirigenti.some((p) => p.domiciliatoInSvizzera)) {
    avvisi.push({
      id: "domicilio",
      testo: "La società deve poter essere rappresentata da una persona domiciliata in Svizzera, che sia gerente o direttore.",
      fonte: fontiPercorso.co814,
    });
  }

  if (d.soci.some((s) => s.inNatura)) {
    avvisi.push({
      id: "natura",
      testo: "Chi porta dei beni invece dei soldi (conferimento in natura): all'atto di fondazione servono altri documenti.",
      fonte: fontiPercorso.co777b,
    });
  }
  if (d.revisione === "rinuncia") {
    avvisi.push({
      id: "revisione",
      testo:
        "Rinunciare alla revisione limitata è possibile solo con il consenso di tutti i soci e con al massimo 10 posti a tempo pieno in media all'anno.",
      fonte: fontiPercorso.co727a,
    });
  }
  if (!d.banca.trim()) avvisi.push({ id: "banca", testo: "Scegliete la banca per il conto vincolato delle quote.", fonte: fonti.pmiChecklist });
  return { errori, avvisi };
}

export function totaleQuote(d: DatiFondazione): number {
  return d.soci.reduce((s, socio) => s + socio.quote, 0);
}

/** Chi dirige: tutti i soci (per legge) o i gerenti scelti, soci ed esterni. */
export function chiDirige(d: DatiFondazione): { nome: string; domicilio: string; domiciliatoInSvizzera: boolean; socio: boolean }[] {
  const soci = d.soci
    .filter((s) => d.direzione === "tutti" || s.gerente)
    .map((s) => ({ nome: s.nome, domicilio: s.domicilio, domiciliatoInSvizzera: s.domiciliatoInSvizzera, socio: true }));
  if (d.direzione === "tutti") return soci;
  return [...soci, ...d.gerentiEsterni.map((g) => ({ ...g, socio: false }))];
}
