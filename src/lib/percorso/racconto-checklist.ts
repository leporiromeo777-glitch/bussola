/**
 * «Cosa dire a Bleo»: la lista sotto il riquadro di «Racconta a Bleo». Ogni
 * voce corrisponde a una domanda del questionario e si spunta da sola quando
 * il testo sembra parlarne. È solo un aiuto a scrivere: le risposte vere le
 * capisce Claude (racconto.ts), quindi una voce spuntata non è una risposta.
 * Logica pura, senza dipendenze: la può usare anche l'app.
 */
import type { IdDomanda } from "./risposte";

export type VoceRacconto = {
  id: IdDomanda;
  titolo: string;
  esempio: string;
  /** Le prime voci: senza queste Bleo capisce poco. */
  importante: boolean;
  segnali: RegExp;
};

export const VOCI_RACCONTO: readonly VoceRacconto[] = [
  {
    id: "attivita",
    titolo: "Che lavoro vuoi fare",
    esempio: "«faccio siti web», «vorrei aprire un bar»",
    importante: true,
    segnali:
      /\b(faccio|fare|vorrei|voglio|aprire|apro|vendo|vendere|creare|creo|offro|offrire|lavoro come|mi occupo|insegn\w*|ripar\w*|produc\w*|organizz\w*)\b/,
  },
  {
    id: "cantone",
    titolo: "Dove: città o Cantone",
    esempio: "«a Lugano», «in Ticino»",
    importante: true,
    segnali:
      /\b(ticino|lugano|bellinzona|locarno|mendrisio|chiasso|biasca|ascona|massagno|giubiasco|grigioni|mesolcina|poschiavo|cantone|zurigo|berna|ginevra|basilea|lucerna|vaud|vallese|friburgo|neuchatel|san gallo|argovia|turgovia|svitto|uri|zugo|soletta|sciaffusa|appenzello|glarona|giura|obvaldo|nidvaldo|coira)\b/,
  },
  {
    id: "soci",
    titolo: "Da solo o con altre persone",
    esempio: "«da solo», «con mio fratello»",
    importante: true,
    segnali: /\b(da sol[oa]|con (mi[oa]|il mio|la mia|un |una |due |tre |altr\w*|amic\w*)|insieme a|soci[oa]?|in due|in tre)\b/,
  },
  {
    id: "impiego",
    titolo: "Se hai già un lavoro da dipendente",
    esempio: "«lavoro al 60% come impiegato», «studio ancora»",
    importante: true,
    segnali:
      /(\d+\s?%|percento|\bdipendent\w*|\bpart.?time|\bfull.?time|\btempo pieno|\bimpiegat\w*|\bho (gia |gia' )?un lavoro|\bnon lavoro|\bstudi[oa]\b|\bstudent\w*|\bdisoccupat\w*|\bapprendist\w*)/,
  },
  {
    id: "fatturato",
    titolo: "Quanto pensi di incassare il primo anno",
    esempio: "«circa 30'000 franchi»",
    importante: false,
    segnali: /(\d[\d'’.\s]*\s?(franchi|chf|fr\b|mila|k\b)|\bfranchi\b|\bchf\b|\bincass\w*|\bfattur\w*|\bguadagn\w*)/,
  },
  {
    id: "clienti",
    titolo: "Chi sono i tuoi clienti",
    esempio: "«privati», «piccole aziende»",
    importante: false,
    segnali: /\b(client\w*|privat\w*|aziend\w*|ditte|negozi|turist\w*|famiglie|scuole|ristoranti)\b/,
  },
  {
    id: "avviata",
    titolo: "Se hai già iniziato",
    esempio: "«ho già i primi clienti», «parto a gennaio»",
    importante: false,
    segnali:
      /\b(ho gia (iniziato|cominciato|fatto|i primi|qualche|dei|lavorato)|non ho ancora|devo ancora|inizio|comincio|parto|partire|dal prossimo|da gennaio|tra (un|due|tre|qualche) mes\w*)\b/,
  },
  {
    id: "permesso",
    titolo: "Nazionalità o permesso",
    esempio: "«sono svizzero», «ho il permesso B»",
    importante: false,
    segnali: /\b(svizzer\w*|permesso|cittadin\w*|italian[oa]|frontalier\w*|nazionalita)\b/,
  },
  {
    id: "locali",
    titolo: "Dove lavori: da casa, dai clienti o in un locale",
    esempio: "«lavoro da casa», «affitto un negozio»",
    importante: false,
    segnali: /\b(da casa|a casa|locale|negozio|ufficio|laboratorio|atelier|a domicilio|dai clienti|furgone)\b/,
  },
  {
    id: "venditaOnline",
    titolo: "Se vendi online",
    esempio: "«vendo anche su internet», «solo di persona»",
    importante: false,
    segnali: /\b(online|on line|internet|e-?commerce|shop|etsy|ricardo|di persona)\b/,
  },
];

/** Minuscole e senza accenti: «Già» e «gia» valgono uguale. */
function normalizza(testo: string): string {
  return testo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Gli id delle voci di cui il testo sembra già parlare. */
export function vociToccate(testo: string): Set<IdDomanda> {
  const t = normalizza(testo);
  return new Set(VOCI_RACCONTO.filter((v) => v.segnali.test(t)).map((v) => v.id));
}
