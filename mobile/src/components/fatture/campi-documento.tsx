import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { aliquoteIva, dataSvizzera, datiStrumenti, fonti, fontiStrumenti, percentuale, regolePercorso } from "@/data/svizzera";
import { normalizzaData } from "@/lib/lettera/spiegazione";
import {
  aggiungiGiorni,
  ALIQUOTE,
  calcolaRiga,
  calcolaTotali,
  controllaDocumento,
  dataIsoValida,
  elementiObbligatoriIva,
  LUNGHEZZE_DOCUMENTO,
  riferimentoPerFattura,
  rigaVuota,
  type Documento,
  type Riga,
  type SceltaRiferimento,
} from "@/lib/strumenti/documenti";
import { importo } from "@/lib/strumenti/numeri";
import { formattaRiferimento, validaIbanPerQr } from "@/lib/strumenti/qr";
import { CampoTesto, RigaValore, Scelta } from "~/components/campi";
import { RigaChip } from "~/components/ore/chip";
import { ElencoFonti, Pulsante, Scheda, Testo } from "~/components/ui";
import { nuovoId } from "~/lib/fatture";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export type Modifica = (modifica: (d: Documento) => Documento) => void;

/** «19.10.2026» → «2026-10-19»; null se non è una data valida. */
function inIso(testo: string): string | null {
  const data = normalizzaData(testo);
  if (!data) return null;
  const [g, m, a] = data.split(".");
  return `${a}-${m}-${g}`;
}

const inTesto = (iso: string) => (dataIsoValida(iso) ? dataSvizzera(iso) : iso);

/** Data scritta alla svizzera (19.10.2026), salvata come AAAA-MM-GG. */
export function CampoData({
  etichetta,
  iso,
  onCambia,
  aiuto,
  facoltativa,
}: {
  etichetta: string;
  iso: string;
  onCambia: (iso: string) => void;
  aiuto?: string;
  facoltativa?: boolean;
}) {
  const [testo, setTesto] = useState(() => inTesto(iso));
  const [ultima, setUltima] = useState(iso);
  // La data è cambiata da fuori (per esempio con una scelta rapida): si riscrive il campo.
  if (iso !== ultima) {
    setUltima(iso);
    setTesto(inTesto(iso));
  }
  const vuota = !testo.trim();
  const errore =
    vuota && !facoltativa ? "Scrivi la data così: 19.10.2026." : !vuota && !inIso(testo) ? "Scrivi la data così: 19.10.2026." : undefined;
  return (
    <CampoTesto
      etichetta={etichetta}
      valore={testo}
      onCambia={(v) => {
        setTesto(v);
        const nuova = inIso(v);
        if (nuova) {
          setUltima(nuova);
          onCambia(nuova);
        } else if (!v.trim() && facoltativa) {
          setUltima("");
          onCambia("");
        }
      }}
      tastiera="numbers-and-punctuation"
      segnaposto="19.10.2026"
      aiuto={aiuto}
      errore={errore}
      massimo={10}
    />
  );
}

/** Le voci del documento: descrizione, quantità, unità, prezzo e (con l'IVA) aliquota. */
export function VociDocumento({ doc, onCambia }: { doc: Documento; onCambia: Modifica }) {
  const c = useColori();
  const conIva = doc.emittente.ivaIscritto;
  const cambiaRiga = (id: string, modifica: Partial<Riga>) =>
    onCambia((d) => ({ ...d, righe: d.righe.map((r) => (r.id === id ? { ...r, ...modifica } : r)) }));
  const L = LUNGHEZZE_DOCUMENTO;

  return (
    <View style={{ gap: SPAZIO.m }}>
      <Testo variante="piccolo" attenuato>
        {conIva ? "Prezzi unitari senza IVA." : "Prezzi unitari."} Per i decimali usa il punto o la virgola (12.50 o 12,50).
      </Testo>
      {doc.righe.map((r, i) => {
        const calcolo = calcolaRiga(r);
        const compilata = Boolean(r.descrizione.trim() || r.prezzo.trim());
        return (
          <View
            key={r.id}
            style={{ gap: SPAZIO.m, borderWidth: 1, borderColor: c.bordo, borderRadius: RAGGIO.m, padding: SPAZIO.m }}
          >
            <CampoTesto
              etichetta={`Voce ${i + 1}: descrizione`}
              valore={r.descrizione}
              onCambia={(v) => cambiaRiga(r.id, { descrizione: v })}
              segnaposto="Che cosa hai fatto o venduto"
              righe={2}
              massimo={L.descrizione}
            />
            <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
              <View style={{ flex: 1 }}>
                <CampoTesto
                  etichetta="Quantità"
                  valore={r.quantita}
                  onCambia={(v) => cambiaRiga(r.id, { quantita: v })}
                  tastiera="decimal-pad"
                  errore={compilata && !calcolo.valida && r.quantita.trim() ? "Non valida" : undefined}
                  massimo={L.quantita}
                />
              </View>
              <View style={{ flex: 1 }}>
                <CampoTesto
                  etichetta="Unità"
                  valore={r.unita}
                  onCambia={(v) => cambiaRiga(r.id, { unita: v })}
                  segnaposto="h, pz…"
                  maiuscole="none"
                  massimo={L.unita}
                />
              </View>
            </View>
            <CampoTesto
              etichetta={`${conIva ? "Prezzo senza IVA" : "Prezzo"} in ${doc.valuta}`}
              valore={r.prezzo}
              onCambia={(v) => cambiaRiga(r.id, { prezzo: v })}
              tastiera="numbers-and-punctuation"
              segnaposto="0.00"
              errore={compilata && r.prezzo.trim() && !calcolo.valida ? "Prezzo non valido" : undefined}
              massimo={L.prezzo}
            />
            {conIva ? (
              <Scelta
                etichetta="IVA"
                valore={r.aliquota}
                onCambia={(v) => cambiaRiga(r.id, { aliquota: v })}
                opzioni={ALIQUOTE.map((a) => ({
                  valore: a.id,
                  etichetta: `${percentuale(aliquoteIva.valore[a.id])} ${a.etichetta.replace("Aliquota ", "")}`,
                }))}
              />
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPAZIO.m }}>
              <Testo>
                Importo <Testo variante="forte">{importo(calcolo.importo, 2, doc.valuta)}</Testo>
              </Testo>
              <Pressable
                onPress={() => onCambia((d) => ({ ...d, righe: d.righe.filter((x) => x.id !== r.id) }))}
                accessibilityRole="button"
                accessibilityLabel={`Togli la voce ${i + 1}`}
                hitSlop={6}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: SPAZIO.s }}
              >
                <Ionicons name="trash-outline" size={18} color={c.pericolo} />
                <Testo colore={c.pericolo}>Togli</Testo>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Pulsante
        titolo="Aggiungi una voce"
        variante="secondario"
        icona="add"
        disabilitato={doc.righe.length >= L.righe}
        onPress={() => onCambia((d) => ({ ...d, righe: [...d.righe, rigaVuota(nuovoId())] }))}
      />
      {conIva ? (
        <View style={{ gap: SPAZIO.xs }}>
          <Testo variante="piccolo" attenuato>
            {aliquoteIva.nota}
          </Testo>
          <ElencoFonti fonti={[aliquoteIva.fonte]} verificatoIl={aliquoteIva.verificatoIl} />
        </View>
      ) : null}
    </View>
  );
}

/** Totali come nel documento (imponibile, IVA per aliquota, arrotondamento, totale). */
export function TotaliDocumento({ doc }: { doc: Documento }) {
  const t = calcolaTotali(doc);
  const valuta = doc.valuta;
  return (
    <View>
      {doc.emittente.ivaIscritto ? (
        <>
          <RigaValore etichetta="Totale senza IVA" valore={importo(t.imponibile, 2, valuta)} />
          {t.iva.map((v) => (
            <RigaValore key={v.aliquota} etichetta={`IVA ${percentuale(v.tasso)}`} valore={importo(v.imposta, 2, valuta)} />
          ))}
        </>
      ) : null}
      {t.arrotondamento !== 0 ? <RigaValore etichetta="Arrotondamento" valore={importo(t.arrotondamento, 2, valuta)} /> : null}
      <RigaValore etichetta={doc.emittente.ivaIscritto ? "Totale IVA inclusa" : "Totale"} valore={importo(t.totale, 2, valuta)} forte />
    </View>
  );
}

/** Scadenza veloce: tra 10 o 30 giorni dalla data del documento. */
export function SceltaScadenza({ doc, onCambia }: { doc: Documento; onCambia: Modifica }) {
  if (!dataIsoValida(doc.data)) return null;
  const opzioni = [10, 30].map((giorni) => ({ chiave: aggiungiGiorni(doc.data, giorni), testo: `Tra ${giorni} giorni` }));
  return <RigaChip etichetta="Scadenza" opzioni={opzioni} attiva={doc.scadenza} onScegli={(iso) => onCambia((d) => ({ ...d, scadenza: iso }))} />;
}

/** Il riferimento di pagamento della QR-fattura (come sul sito). */
export function SceltaRiferimentoQr({ doc, onCambia }: { doc: Documento; onCambia: Modifica }) {
  const c = useColori();
  const iban = validaIbanPerQr(doc.emittente.iban);
  const qrIban = iban.ok && iban.qrIban;
  const opzioni: { valore: SceltaRiferimento; etichetta: string }[] = qrIban
    ? [
        { valore: "automatico", etichetta: "Riferimento QR dal numero" },
        { valore: "manuale", etichetta: "Lo scrivo io (27 cifre)" },
      ]
    : [
        { valore: "automatico", etichetta: "Riferimento RF dal numero" },
        { valore: "nessuno", etichetta: "Nessun riferimento" },
        { valore: "manuale", etichetta: "Lo scrivo io (RF…)" },
      ];
  const scelta = opzioni.some((o) => o.valore === doc.riferimento) ? doc.riferimento : "automatico";
  const rif = riferimentoPerFattura({ ...doc, riferimento: scelta });

  return (
    <View style={{ gap: SPAZIO.m }}>
      <Testo variante="piccolo" attenuato>
        Il riferimento aiuta a riconoscere il pagamento sul conto. Con un QR-IBAN serve il riferimento QR; con un IBAN normale
        il Creditor Reference (RF) oppure nessun riferimento.
      </Testo>
      <Scelta etichetta="Riferimento" valore={scelta} opzioni={opzioni} onCambia={(v) => onCambia((d) => ({ ...d, riferimento: v }))} />
      {scelta === "manuale" ? (
        <CampoTesto
          etichetta={qrIban ? "Riferimento QR" : "Creditor Reference"}
          valore={doc.riferimentoManuale}
          onCambia={(v) => onCambia((d) => ({ ...d, riferimentoManuale: v }))}
          segnaposto={qrIban ? "21 00000 00003 13947 14300 09017" : "RF18 5390 0754 7034"}
          maiuscole="characters"
          massimo={LUNGHEZZE_DOCUMENTO.riferimentoManuale}
        />
      ) : null}
      {rif.ok && rif.tipo !== "NON" && scelta !== "manuale" ? (
        <Testo>
          Riferimento: <Testo variante="forte">{formattaRiferimento(rif.tipo, rif.valore)}</Testo>
        </Testo>
      ) : null}
      {!rif.ok && iban.ok ? <Testo colore={c.pericolo}>{rif.errore.messaggio}</Testo> : null}
      <Testo variante="piccolo" attenuato>
        Dal {dataSvizzera(datiStrumenti.indirizzoStrutturatoQr.valore)} la QR-fattura accetta solo indirizzi strutturati: per
        questo via, numero, NPA e località sono campi separati.
      </Testo>
      <ElencoFonti
        fonti={[fontiStrumenti.sixLineeGuidaQr, datiStrumenti.indirizzoStrutturatoQr.fonte]}
        verificatoIl={datiStrumenti.indirizzoStrutturatoQr.verificatoIl}
      />
    </View>
  );
}

/** Cosa manca prima di mandarlo e, con l'IVA, gli elementi obbligatori della fattura. */
export function ControlliDocumento({ doc }: { doc: Documento }) {
  const c = useColori();
  const problemi = controllaDocumento(doc);
  const elementiIva = doc.emittente.ivaIscritto ? elementiObbligatoriIva(doc) : null;
  return (
    <View style={{ gap: SPAZIO.m }}>
      <Scheda style={{ borderColor: problemi.length ? c.accento : c.successo, borderWidth: 2 }}>
        {problemi.length === 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s }}>
            <Ionicons name="checkmark-circle" size={22} color={c.successo} />
            <Testo variante="forte" colore={c.successo} style={{ flex: 1 }}>
              Pronto da mandare: crea il PDF.
            </Testo>
          </View>
        ) : (
          <>
            <Testo variante="forte">Da completare prima di mandarlo</Testo>
            {problemi.map((p) => (
              <Testo key={`${p.campo}-${p.messaggio}`}>• {p.messaggio}</Testo>
            ))}
          </>
        )}
      </Scheda>
      {elementiIva ? (
        <Scheda>
          <Testo variante="forte">Elementi obbligatori con l&apos;IVA</Testo>
          {elementiIva.map((el) => (
            <View key={el.id} style={{ flexDirection: "row", gap: SPAZIO.s }} accessible accessibilityLabel={`${el.testo}: ${el.ok ? "presente" : "da completare"}`}>
              <Testo colore={el.ok ? c.successo : c.accento}>{el.ok ? "✓" : "•"}</Testo>
              <View style={{ flex: 1 }}>
                <Testo variante="piccolo">{el.testo}</Testo>
                {el.nota ? (
                  <Testo variante="piccolo" attenuato>
                    {el.nota}
                  </Testo>
                ) : null}
              </View>
            </View>
          ))}
          <ElencoFonti fonti={[fontiStrumenti.liva26]} />
        </Scheda>
      ) : (
        <Testo variante="piccolo" attenuato>
          Senza iscrizione all&apos;IVA il documento non indica l&apos;IVA. Conserva una copia di ogni fattura emessa: i documenti
          contabili vanno conservati per {regolePercorso.conservazioneDocumentiAnni.valore} anni.
        </Testo>
      )}
      {!elementiIva ? <ElencoFonti fonti={[fonti.liva27, fonti.co958f]} verificatoIl={regolePercorso.conservazioneDocumentiAnni.verificatoIl} /> : null}
    </View>
  );
}
