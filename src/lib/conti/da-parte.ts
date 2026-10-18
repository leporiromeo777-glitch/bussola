/**
 * «Quanto mettere da parte» in «I tuoi conti»: dai movimenti confermati
 * dell'anno, quanto tenere da parte per i contributi AVS e per le imposte,
 * che si pagano dopo. Logica pura: la usano la pagina /conti e l'app.
 *
 * Come stimiamo (detto anche nell'interfaccia):
 * 1. Utile finora = entrate − uscite confermate dell'anno: è il «Risultato»
 *    del riepilogo (le voci private e quelle da confermare non contano).
 * 2. Media al mese = utile finora ÷ mesi passati, dal mese in cui lavori in
 *    proprio (gennaio, o il mese in cui hai iniziato nell'anno) a questo mese
 *    compreso.
 * 3. Utile stimato dell'anno = utile finora + media × mesi che mancano a
 *    dicembre. Se lavori da gennaio è utile finora ÷ mesi passati × 12. Se hai
 *    iniziato durante l'anno contano solo i mesi di attività: la cassa
 *    calcola i contributi sul reddito dell'anno civile e non lo riporta su un
 *    anno intero (art. 22 cpv. 1 e 5 OAVS).
 * 4. Contributi = stimaContributi (tavola scalare + supplementi della cassa
 *    ticinese) su quell'utile. Gli acconti dell'anno che scrivi tu si
 *    tolgono: resta la parte che arriverà con il conguaglio.
 * 5. Imposte = una percentuale scelta da te dell'utile dopo i contributi, come
 *    nel «Budget del primo anno». Bleo non calcola le imposte.
 * 6. Al mese = totale dell'anno ÷ mesi di attività nell'anno; finora = al
 *    mese × mesi passati.
 *
 * È una stima indicativa: i contributi veri li decide la cassa di
 * compensazione sulla tassazione fiscale (promemoria 2.02, punto 9).
 */
import { z } from "zod";
import { tavoleScalari, type AnnoAvs } from "@/data/avs-tavola-scalare";
import { lezionePerPasso } from "@/data/corso";
import {
  avsIndipendenti,
  dataSvizzera,
  datiStrumenti,
  fonti,
  fontiPercorso,
  fontiStrumenti,
  percentuale,
  regoleAccontiAvs,
  regolePercorso,
  supplementiTicino,
  VERIFICATO_DA_PARTE,
  type Fonte,
} from "@/data/svizzera";
import { stimaContributi, type SituazioneAvs, type StimaContributi } from "@/lib/strumenti/avs";
import { annoAvsPerPeriodo, MESI } from "@/lib/strumenti/budget";
import { arrotonda, importo, leggiNumero } from "@/lib/strumenti/numeri";
import type { Riepilogo } from "./tipi";

/**
 * Con meno mesi di così la media è poco affidabile e lo diciamo. Non è un
 * valore di legge: è solo quando Bleo smette di avvisarti.
 */
export const MESI_PER_UNA_MEDIA_STABILE = 3;

/** Percentuale massima per le imposte, come nel «Budget del primo anno». */
export const RISERVA_MASSIMA_PERCENTO = 80;

/** Limite di controllo per gli acconti scritti a mano (non è un valore di legge). */
export const ACCONTI_MASSIMI = 1_000_000;

/** Anni tenuti nelle impostazioni salvate (i più recenti). */
const ANNI_SALVATI = 10;

/** Scelte di un anno: il mese da cui lavori in proprio e gli acconti AVS dell'anno. */
export type ImpostazioniAnno = {
  /** 1-12: il mese in cui hai iniziato a lavorare in proprio nell'anno (1 = da gennaio o da prima); null = scegli tu, Bleo. */
  meseInizio: number | null;
  /** Totale degli acconti AVS dell'anno, come lo scrivi; "" = non indicato. */
  accontiAvs: string;
};

/** Quello che l'utente sceglie: resta solo sul suo dispositivo (localStorage o memoria dell'app). */
export type ImpostazioniDaParte = {
  situazione: SituazioneAvs;
  /** Percentuale dell'utile dopo i contributi per le imposte, scelta da te; "" = non ancora scelta. */
  riservaImpostePercento: string;
  /** Per anno ("2026"). */
  anni: Record<string, ImpostazioniAnno>;
};

export function impostazioniIniziali(): ImpostazioniDaParte {
  return { situazione: "principale", riservaImpostePercento: "", anni: {} };
}

const testoBreve = z.string().max(40).catch("");
const schemaAnno = z.object({
  meseInizio: z.number().int().min(1).max(12).nullable().catch(null),
  accontiAvs: testoBreve,
});

/** Lettura sicura delle impostazioni salvate: quello che non va torna al valore iniziale. */
export const schemaImpostazioniDaParte = z.object({
  situazione: z.enum(["principale", "accessoria"]).catch("principale"),
  riservaImpostePercento: testoBreve,
  anni: z
    .record(z.string(), z.unknown())
    .catch({})
    .transform((grezzi) => {
      const anni: Record<string, ImpostazioniAnno> = {};
      for (const [anno, valore] of Object.entries(grezzi)) {
        if (!/^\d{4}$/.test(anno)) continue;
        const esito = schemaAnno.safeParse(valore);
        if (esito.success) anni[anno] = esito.data;
      }
      return anni;
    }),
});

/** Le scelte di un anno (vuote se non ci sono). */
export function impostazioniAnno(impostazioni: ImpostazioniDaParte, anno: number): ImpostazioniAnno {
  return impostazioni.anni[String(anno)] ?? { meseInizio: null, accontiAvs: "" };
}

/** Cambia le scelte di un anno; tiene solo gli ultimi anni. */
export function conAnno(impostazioni: ImpostazioniDaParte, anno: number, modifiche: Partial<ImpostazioniAnno>): ImpostazioniDaParte {
  const anni = { ...impostazioni.anni, [String(anno)]: { ...impostazioniAnno(impostazioni, anno), ...modifiche } };
  const tenuti = Object.keys(anni)
    .sort()
    .slice(-ANNI_SALVATI);
  return { ...impostazioni, anni: Object.fromEntries(tenuti.map((a) => [a, anni[a]])) };
}

export type CampoDaParte = "accontiAvs" | "riservaImpostePercento";

export type AvvisoDaParte = {
  id: "perdita" | "acconti-bassi" | "acconti-coprono";
  livello: "info" | "attenzione";
  titolo: string;
  testo: string;
  fonti: Fonte[];
};

export type StimaDaParte = {
  anno: number;
  /** true per l'anno di oggi: si parla di «questo mese». */
  annoInCorso: boolean;
  /** Nessuna entrata e nessuna uscita confermata nell'anno: niente da stimare. */
  vuoto: boolean;
  /** Mese da cui contiamo (1-12). */
  meseInizio: number;
  /** true se il mese di inizio l'ha scelto Bleo (mese della prima voce dell'anno). */
  meseInizioAutomatico: boolean;
  /** Ultimo mese contato: questo mese, o dicembre per un anno passato. */
  meseFine: number;
  /** Mesi da meseInizio a meseFine compresi (almeno 1). */
  mesiPassati: number;
  /** Mesi che mancano a dicembre (0 per un anno passato). */
  mesiMancanti: number;
  /** mesiPassati + mesiMancanti. */
  mesiAttivita: number;
  utileFinora: number;
  mediaMensile: number;
  utileAnno: number;
  /** Media su meno di MESI_PER_UNA_MEDIA_STABILE mesi nell'anno in corso. */
  pocoAffidabile: boolean;
  annoAvs: AnnoAvs;
  /** L'anno non ha una tavola: usiamo la più vicina. */
  annoAvsApprossimato: boolean;
  contributi: StimaContributi;
  /** Acconti dell'anno scritti dall'utente; null se non indicati (o non validi). */
  accontiAvs: number | null;
  /** Contributi stimati meno acconti, mai sotto zero (senza acconti: tutti i contributi). */
  avsAnno: number;
  riservaPercento: number | null;
  /** Utile dopo i contributi, mai sotto zero: la base della riserva per le imposte. */
  baseImposte: number;
  imposteAnno: number;
  totaleAnno: number;
  alMese: { avs: number; imposte: number; totale: number };
  finora: { avs: number; imposte: number; totale: number };
  avvisi: AvvisoDaParte[];
};

export type EsitoDaParte = { errori: Partial<Record<CampoDaParte, string>>; stima: StimaDaParte };

export type DatiConti = Pick<Riepilogo, "anno" | "entrate" | "uscite" | "risultato" | "perMese">;

function limita(n: number, minimo: number, massimo: number): number {
  return Math.min(massimo, Math.max(minimo, n));
}

/** Primo mese dell'anno con un'entrata o un'uscita confermata, o null. */
export function primoMeseConVoci(perMese: Riepilogo["perMese"]): number | null {
  const mesi = perMese.filter((m) => m.entrate !== 0 || m.uscite !== 0).map((m) => m.mese);
  return mesi.length > 0 ? Math.min(...mesi) : null;
}

/** I nomi dei mesi (gli stessi del «Budget del primo anno»). */
export const NOMI_MESI = MESI;

export function calcolaDaParte(conti: DatiConti, oggi: string, impostazioni: ImpostazioniDaParte): EsitoDaParte {
  const errori: Partial<Record<CampoDaParte, string>> = {};
  const annoOggi = Number(oggi.slice(0, 4));
  const meseOggi = limita(Number(oggi.slice(5, 7)) || 1, 1, 12);
  const anno = conti.anno;
  const annoInCorso = anno === annoOggi;
  // Un anno passato si conta tutto; uno futuro (non dovrebbe capitare) come gennaio.
  const meseFine = anno < annoOggi ? 12 : anno > annoOggi ? 1 : meseOggi;

  const scelte = impostazioniAnno(impostazioni, anno);
  const automatico = scelte.meseInizio === null;
  const meseInizio = limita(scelte.meseInizio ?? primoMeseConVoci(conti.perMese) ?? 1, 1, meseFine);
  const mesiPassati = meseFine - meseInizio + 1;
  const mesiMancanti = 12 - meseFine;
  const mesiAttivita = mesiPassati + mesiMancanti;

  const utileFinora = arrotonda(conti.risultato);
  const mediaMensile = arrotonda(utileFinora / mesiPassati);
  const utileAnno = arrotonda(utileFinora + (utileFinora / mesiPassati) * mesiMancanti);

  const { anno: annoAvs, approssimato } = annoAvsPerPeriodo(`${anno}-01`);
  const contributi = stimaContributi(utileAnno, annoAvs, impostazioni.situazione);

  let accontiAvs: number | null = null;
  if (scelte.accontiAvs.trim() !== "") {
    const n = leggiNumero(scelte.accontiAvs);
    if (n === null || n < 0 || n > ACCONTI_MASSIMI) errori.accontiAvs = "Scrivi un importo, per esempio 1'200, o lascia vuoto.";
    else accontiAvs = arrotonda(n);
  }
  const avsAnno = accontiAvs === null ? contributi.totale : arrotonda(Math.max(0, contributi.totale - accontiAvs));

  let riservaPercento: number | null = null;
  if (impostazioni.riservaImpostePercento.trim() !== "") {
    const n = leggiNumero(impostazioni.riservaImpostePercento);
    if (n === null || n < 0 || n > RISERVA_MASSIMA_PERCENTO) {
      errori.riservaImpostePercento = `Scrivi una percentuale da 0 a ${RISERVA_MASSIMA_PERCENTO}, o lascia vuoto.`;
    } else riservaPercento = n;
  }
  const baseImposte = arrotonda(Math.max(0, utileAnno - contributi.totale));
  const imposteAnno = riservaPercento === null ? 0 : arrotonda((baseImposte * riservaPercento) / 100);
  const totaleAnno = arrotonda(avsAnno + imposteAnno);

  const quota = (totale: number, mesi: number) => arrotonda((totale * mesi) / mesiAttivita);
  const alMese = { avs: quota(avsAnno, 1), imposte: quota(imposteAnno, 1), totale: quota(totaleAnno, 1) };
  const finora = {
    avs: quota(avsAnno, mesiPassati),
    imposte: quota(imposteAnno, mesiPassati),
    totale: quota(totaleAnno, mesiPassati),
  };

  const vuoto = conti.entrate === 0 && conti.uscite === 0;
  const stima: StimaDaParte = {
    anno,
    annoInCorso,
    vuoto,
    meseInizio,
    meseInizioAutomatico: automatico,
    meseFine,
    mesiPassati,
    mesiMancanti,
    mesiAttivita,
    utileFinora,
    mediaMensile,
    utileAnno,
    pocoAffidabile: annoInCorso && mesiPassati < MESI_PER_UNA_MEDIA_STABILE,
    annoAvs,
    annoAvsApprossimato: approssimato,
    contributi,
    accontiAvs,
    avsAnno,
    riservaPercento,
    baseImposte,
    imposteAnno,
    totaleAnno,
    alMese,
    finora,
    avvisi: [],
  };
  stima.avvisi = vuoto ? [] : avvisiDaParte(stima);
  return { errori, stima };
}

function avvisiDaParte(s: StimaDaParte): AvvisoDaParte[] {
  const avvisi: AvvisoDaParte[] = [];
  const p = avsIndipendenti[s.annoAvs].valore;

  if (s.utileAnno <= 0 && s.contributi.caso === "minimo") {
    avvisi.push({
      id: "perdita",
      livello: "info",
      titolo: s.annoInCorso ? "Per ora le uscite superano le entrate" : `Nel ${s.anno} le uscite hanno superato le entrate`,
      testo: `Anche con una perdita, di regola la cassa AVS chiede almeno il contributo minimo (${importo(p.contributoMinimo, 0)} nel ${s.annoAvs}): l'abbiamo contato. Per le imposte non mettiamo da parte niente.`,
      fonti: [fonti.avsPromemoria202],
    });
  }

  if (s.accontiAvs !== null && s.contributi.totale > 0) {
    const soglia = regolePercorso.sogliaAccontiAvs.valore;
    if (s.accontiAvs >= s.contributi.totale) {
      avvisi.push({
        id: "acconti-coprono",
        livello: "info",
        titolo: "Gli acconti coprono la stima dei contributi",
        testo: `Gli acconti che hai scritto (${importo(s.accontiAvs, 0)}) sono almeno quanto i contributi stimati (${importo(s.contributi.totale, 0)}): per l'AVS non serve mettere da parte altro. Se gli acconti sono più alti dei contributi definitivi, la cassa ti rimborsa la differenza.`,
        fonti: [fonti.avsPromemoria202, fontiPercorso.iasAdeguamentoIndipendenti],
      });
    } else if (s.accontiAvs < soglia * s.contributi.totale) {
      const inizioMora = dataSvizzera(`${s.anno + regoleAccontiAvs.anniInizioMoraAccontiBassi.valore}-01-01`);
      avvisi.push({
        id: "acconti-bassi",
        livello: "attenzione",
        titolo: `Gli acconti sono meno del ${percentuale(soglia, 0)} dei contributi stimati`,
        testo:
          `Gli acconti che hai scritto (${importo(s.accontiAvs, 0)}) sono meno del ${percentuale(soglia, 0)} dei contributi stimati (${importo(s.contributi.totale, 0)}). ` +
          `Se gli acconti restano sotto il ${percentuale(soglia, 0)} dei contributi definitivi, sulla differenza paghi interessi di mora del ${percentuale(regolePercorso.interesseMoraAvs.valore, 0)} l'anno, per il ${s.anno} dal ${inizioMora}. ` +
          `Se il tuo utile cambia di più o meno il ${percentuale(regolePercorso.variazioneRedditoIas.valore, 0)} rispetto a quello su cui paghi gli acconti, l'IAS chiede di segnalarlo, per iscritto o con la richiesta online di adeguamento.`,
        fonti: [fontiPercorso.oavs41bis, fonti.avsPromemoria202, fontiPercorso.iasAcconti, fontiPercorso.iasAdeguamentoIndipendenti],
      });
    }
  }
  return avvisi;
}

/** Le fonti della stima, senza doppioni: contributi, acconti, imposte. */
export function fontiDaParte(annoAvs: AnnoAvs): Fonte[] {
  const tutte: Fonte[] = [
    tavoleScalari[annoAvs].fonte,
    fonti.avsPromemoria202,
    fontiStrumenti.oavs22,
    fontiPercorso.oavs24,
    datiStrumenti.arrotondamentoRedditoAvs.fonte,
    supplementiTicino.speseAmministrative.fonte,
    supplementiTicino.assegniFamiliari.fonte,
    supplementiTicino.assegnoIntegrativo.fonte,
    fontiPercorso.iasAcconti,
    fontiPercorso.iasAdeguamentoIndipendenti,
    fontiStrumenti.afcCalcolatoreImposte,
    fonti.albofiduciari,
  ];
  return tutte.filter((f, i) => tutte.findIndex((g) => g.url === f.url) === i);
}

/** Data (ISO) del controllo più vecchio tra i dati usati dalla stima. */
export function verificatoDaParte(annoAvs: AnnoAvs): string {
  const date = [
    VERIFICATO_DA_PARTE,
    tavoleScalari[annoAvs].verificatoIl,
    avsIndipendenti[annoAvs].verificatoIl,
    supplementiTicino.speseAmministrative.verificatoIl,
    supplementiTicino.assegniFamiliari.verificatoIl,
    supplementiTicino.assegnoIntegrativo.verificatoIl,
    datiStrumenti.arrotondamentoRedditoAvs.verificatoIl,
    datiStrumenti.guadagnoMassimoAssegniFamiliari.verificatoIl,
    regolePercorso.sogliaAccontiAvs.verificatoIl,
    regolePercorso.interesseMoraAvs.verificatoIl,
    regolePercorso.variazioneRedditoIas.verificatoIl,
  ];
  return [...date].sort()[0];
}

/** Le lezioni del corso su acconti AVS e imposte (19 e 20), dai dati del corso. */
export function lezioniDaParte(): { passoId: "acconti-avs" | "acconti-imposte"; numero: number; titolo: string }[] {
  return (["acconti-avs", "acconti-imposte"] as const).flatMap((passoId) => {
    const lezione = lezionePerPasso(passoId);
    return lezione ? [{ passoId, numero: lezione.numero, titolo: lezione.titolo }] : [];
  });
}

/** «a ottobre», «ad agosto» (la d solo davanti alla a). */
function aMese(mese: number): string {
  const nome = NOMI_MESI[mese - 1];
  return `${nome.startsWith("a") ? "ad" : "a"} ${nome}`;
}

/** «da gennaio a ottobre», «ad agosto». */
export function periodo(s: Pick<StimaDaParte, "meseInizio" | "meseFine">): string {
  if (s.meseInizio === s.meseFine) return aMese(s.meseFine);
  return `da ${NOMI_MESI[s.meseInizio - 1]} ${aMese(s.meseFine)}`;
}

/** Come abbiamo stimato l'utile dell'anno, in una frase. */
export function spiegazioneUtile(s: StimaDaParte): string {
  const mesi = (n: number) => (n === 1 ? "1 mese" : `${n} mesi`);
  const quando = periodo(s);
  const finora = `${quando.charAt(0).toUpperCase()}${quando.slice(1)} (${mesi(s.mesiPassati)}) il risultato è ${importo(s.utileFinora, 0)}`;
  if (s.mesiMancanti === 0) return `${finora}: è l'utile del ${s.anno} su cui facciamo la stima.`;
  const mancano = s.mesiMancanti === 1 ? "con il mese che manca" : `con i ${s.mesiMancanti} mesi che mancano`;
  return (
    `${finora}: in media ${importo(s.mediaMensile, 0)} al mese. ` +
    `Se continua così, ${mancano} a dicembre nel ${s.anno} arrivi a circa ${importo(s.utileAnno, 0)}.`
  );
}

/** La frase sotto la cifra grande: a cosa servono i soldi da mettere da parte. */
export function sottotitoloDaParte(s: StimaDaParte): string {
  const chf = (n: number) => importo(n, 0);
  const oltre = s.accontiAvs !== null ? " oltre agli acconti" : "";
  if (!s.annoInCorso) {
    return `circa ${chf(s.alMese.totale)} al mese, per i contributi AVS${oltre}${s.imposteAnno > 0 ? " e per le imposte" : ""}`;
  }
  if (s.riservaPercento === null) return `per i contributi AVS${oltre}: le imposte non sono ancora incluse`;
  if (s.alMese.imposte === 0) return `per i contributi AVS${oltre}`;
  return `${chf(s.alMese.avs)} per i contributi AVS${oltre ? ` (${oltre.trim()})` : ""} e ${chf(s.alMese.imposte)} per le imposte`;
}
