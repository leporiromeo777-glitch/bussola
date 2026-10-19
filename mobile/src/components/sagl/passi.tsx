/**
 * I passi di «Fondare una Sagl» nell'app: gli stessi campi, testi e fonti
 * della pagina del sito (src/components/strumenti/fondazione-sagl/modulo-sagl.tsx),
 * divisi in schermate brevi. Ogni modifica si salva subito sul telefono.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { chf, fonti, fontiPercorso, regole } from "@/data/svizzera";
import {
  nuovoGerenteEsterno,
  nuovoSocio,
  type DatiFondazione,
  type GerenteEsterno,
  type Socio,
} from "@/lib/fondazione-sagl/dati";
import { PASSI_SAGL, riepilogoQuote, type ControlliPasso, type IdPassoSagl } from "@/lib/fondazione-sagl/passi";
import { leggiNumero, numeroSvizzero } from "@/lib/strumenti/numeri";
import { CampoTesto } from "~/components/campi";
import { Interruttore, LinkFonte, SceltaSchede } from "~/components/strumenti-comuni";
import { Pulsante, Scheda, Testo, tocco } from "~/components/ui";
import { nuovoIdSagl } from "~/lib/sagl";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export type Aggiorna = (cambia: (d: DatiFondazione) => DatiFondazione) => void;

type PropsPasso = { dati: DatiFondazione; aggiorna: Aggiorna };

const MASSIMO_SOCI = 20;
const MASSIMO_GERENTI_ESTERNI = 10;

function imposta<K extends keyof DatiFondazione>(aggiorna: Aggiorna, chiave: K, valore: DatiFondazione[K]) {
  aggiorna((d) => ({ ...d, [chiave]: valore }));
}

/** Testo piccolo sotto un campo, con dentro i link alle fonti. */
function Aiuto({ children }: { children: ReactNode }) {
  return (
    <Testo variante="piccolo" attenuato>
      {children}
    </Testo>
  );
}

/** Un importo o un numero di quote: si scrive libero (20'000, 20 000), si salva quando è un numero. */
function CampoCifra({
  etichetta,
  valore,
  onCambia,
  chfDavanti = true,
  decimali = true,
}: {
  etichetta: string;
  valore: number;
  onCambia: (n: number) => void;
  chfDavanti?: boolean;
  decimali?: boolean;
}) {
  const [testo, setTesto] = useState<string | null>(null);
  const mostrato = testo ?? numeroSvizzero(valore, decimali && !Number.isInteger(valore) ? 2 : 0);
  return (
    <CampoTesto
      etichetta={chfDavanti ? `${etichetta} (CHF)` : etichetta}
      valore={mostrato}
      tastiera="decimal-pad"
      onCambia={(v) => {
        setTesto(v);
        const n = leggiNumero(v);
        if (n !== null && n >= 0) onCambia(decimali ? n : Math.round(n));
      }}
      onFine={() => setTesto(null)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Indice dei passi e navigazione                                      */
/* ------------------------------------------------------------------ */

export function IndicePassi({
  passo,
  visitati,
  controlli,
  onVai,
}: {
  passo: number;
  visitati: ReadonlySet<number>;
  controlli: Record<IdPassoSagl, ControlliPasso>;
  onVai: (indice: number) => void;
}) {
  const c = useColori();
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="etichetta" attenuato>
        PASSO {passo + 1} DI {PASSI_SAGL.length}
      </Testo>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }} accessibilityRole="tablist">
        {PASSI_SAGL.map((p, i) => {
          const attuale = i === passo;
          const daSistemare = p.id !== "documenti" && controlli[p.id].errori.length > 0;
          const visto = visitati.has(i) && !attuale;
          const stato = visto ? (daSistemare ? ", da completare" : ", a posto") : "";
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                tocco();
                onVai(i);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: attuale }}
              accessibilityLabel={`Passo ${i + 1}: ${p.titolo}${stato}`}
              hitSlop={4}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: attuale ? c.marchio : visto && daSistemare ? c.accento : c.bordo,
                backgroundColor: attuale ? c.marchio : c.scheda,
              }}
            >
              {visto && !daSistemare && p.id !== "documenti" ? (
                <Ionicons name="checkmark" size={20} color={c.marchio} />
              ) : (
                <Testo variante="forte" colore={attuale ? c.sulMarchio : visto && daSistemare ? c.accento : c.testo}>
                  {i + 1}
                </Testo>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Navigazione({ passo, onVai }: { passo: number; onVai: (indice: number) => void }) {
  const prossimo = PASSI_SAGL[passo + 1];
  return (
    <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
      {passo > 0 ? (
        <Pulsante titolo="Indietro" variante="secondario" onPress={() => onVai(passo - 1)} style={{ flex: 1, paddingHorizontal: SPAZIO.m }} />
      ) : null}
      {prossimo ? (
        <Pulsante
          titolo="Avanti"
          icona="arrow-forward"
          onPress={() => onVai(passo + 1)}
          suggerimento={`Passo ${passo + 2}: ${prossimo.titolo}`}
          style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
        />
      ) : null}
    </View>
  );
}

/** Cosa manca o non va in questo passo (stessi controlli del sito). */
export function ControlliDelPasso({ controlli }: { controlli: ControlliPasso }) {
  if (controlli.errori.length + controlli.avvisi.length === 0) return null;
  return (
    <Scheda style={{ gap: SPAZIO.s }}>
      <Testo variante="forte">{controlli.errori.length ? "Da completare" : "Da sapere"}</Testo>
      <ElencoControlli controlli={controlli} />
    </Scheda>
  );
}

export function ElencoControlli({ controlli }: { controlli: ControlliPasso }) {
  const c = useColori();
  const righe = [...controlli.errori.map((x) => ({ ...x, errore: true })), ...controlli.avvisi.map((x) => ({ ...x, errore: false }))];
  return (
    <View style={{ gap: SPAZIO.s }} accessibilityLiveRegion="polite">
      {righe.map((r) => (
        <View key={r.id} style={{ flexDirection: "row", gap: SPAZIO.s }}>
          <Ionicons
            name={r.errore ? "alert-circle-outline" : "information-circle-outline"}
            size={18}
            color={r.errore ? c.pericolo : c.marchio}
            style={{ marginTop: 1 }}
            accessibilityElementsHidden
          />
          <Testo variante="piccolo" style={{ flex: 1 }}>
            {r.testo}
            {r.fonte ? (
              <>
                {" "}
                (<LinkFonte fonte={r.fonte} />)
              </>
            ) : null}
          </Testo>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 1. La società                                                       */
/* ------------------------------------------------------------------ */

export function PassoSocieta({ dati, aggiorna }: PropsPasso) {
  return (
    <View style={{ gap: SPAZIO.l }}>
      <View style={{ gap: SPAZIO.xs }}>
        <CampoTesto
          etichetta="Nome (ditta)"
          valore={dati.ditta}
          onCambia={(v) => imposta(aggiorna, "ditta", v)}
          segnaposto="Rossi & Bianchi Sagl"
          massimo={120}
          maiuscole="words"
        />
        <Aiuto>
          Con la forma giuridica, per esempio «Sagl» (<LinkFonte fonte={fontiPercorso.co950} />
          ). Prima di decidere, verificatelo al registro di commercio.
        </Aiuto>
      </View>
      <CampoTesto
        etichetta="Sede (Comune)"
        valore={dati.sede}
        onCambia={(v) => imposta(aggiorna, "sede", v)}
        segnaposto="Bellinzona"
        massimo={80}
        maiuscole="words"
      />
      <CampoTesto
        etichetta="Scopo: cosa fa la società"
        valore={dati.scopo}
        onCambia={(v) => imposta(aggiorna, "scopo", v)}
        segnaposto="Riparazione e vendita di biciclette, accessori e ricambi."
        aiuto="Una descrizione breve e precisa dell'attività."
        righe={4}
        massimo={800}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Capitale e quote                                                 */
/* ------------------------------------------------------------------ */

export function PassoCapitale({ dati, aggiorna }: PropsPasso) {
  return (
    <View style={{ gap: SPAZIO.l }}>
      <Testo>
        Almeno {chf(regole.capitaleMinimoSagl.valore)} (<LinkFonte fonte={regole.capitaleMinimoSagl.fonte} />
        ), da versare per intero alla fondazione (<LinkFonte fonte={fontiPercorso.co777c} />
        ). Ogni quota vale più di zero (<LinkFonte fonte={fontiPercorso.co774} />
        ).
      </Testo>
      <CampoCifra etichetta="Capitale sociale" valore={dati.capitale} onCambia={(n) => imposta(aggiorna, "capitale", n)} />
      <CampoCifra etichetta="Valore di una quota" valore={dati.valoreQuota} onCambia={(n) => imposta(aggiorna, "valoreQuota", n)} />
      <Scheda tenue>
        <Testo accessibilityLiveRegion="polite">{riepilogoQuote(dati)}</Testo>
      </Scheda>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 3. I soci                                                           */
/* ------------------------------------------------------------------ */

export function PassoSoci({ dati, aggiorna }: PropsPasso) {
  const socio = (id: string, modifica: Partial<Socio>) =>
    aggiorna((d) => ({ ...d, soci: d.soci.map((s) => (s.id === id ? { ...s, ...modifica } : s)) }));
  return (
    <View style={{ gap: SPAZIO.l }}>
      <Testo>
        Ogni socio ha almeno una quota (<LinkFonte fonte={fontiPercorso.co772} />
        ). Chi porta dei beni invece dei soldi fa un conferimento «in natura».
      </Testo>
      {dati.soci.map((s, i) => (
        <Scheda key={s.id} style={{ gap: SPAZIO.m }}>
          <Testo variante="sottotitolo">Socio {i + 1}</Testo>
          <CampoTesto
            etichetta="Nome e cognome"
            valore={s.nome}
            onCambia={(v) => socio(s.id, { nome: v })}
            massimo={120}
            maiuscole="words"
          />
          <CampoTesto
            etichetta="Domicilio"
            valore={s.domicilio}
            onCambia={(v) => socio(s.id, { domicilio: v })}
            massimo={120}
            maiuscole="words"
          />
          <CampoCifra
            etichetta="Quote"
            valore={s.quote}
            chfDavanti={false}
            decimali={false}
            onCambia={(n) => socio(s.id, { quote: Math.max(0, Math.round(n)) })}
          />
          <Testo variante="piccolo" attenuato>
            Importo: {chf(s.quote * dati.valoreQuota, 2)}
          </Testo>
          <Interruttore etichetta="Porta dei beni (in natura)" valore={s.inNatura} onCambia={(v) => socio(s.id, { inNatura: v })} />
          <Interruttore
            etichetta="Domiciliato in Svizzera"
            valore={s.domiciliatoInSvizzera}
            onCambia={(v) => socio(s.id, { domiciliatoInSvizzera: v })}
          />
          {dati.soci.length > 1 ? (
            <Pulsante
              titolo={`Togli il socio ${i + 1}`}
              variante="testo"
              icona="trash-outline"
              onPress={() => aggiorna((d) => ({ ...d, soci: d.soci.filter((x) => x.id !== s.id) }))}
              style={{ alignSelf: "flex-start" }}
            />
          ) : null}
        </Scheda>
      ))}
      {dati.soci.length < MASSIMO_SOCI ? (
        <Pulsante
          titolo="Aggiungi un socio"
          variante="secondario"
          icona="person-add-outline"
          onPress={() => aggiorna((d) => ({ ...d, soci: [...d.soci, nuovoSocio(nuovoIdSagl())] }))}
        />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Chi dirige                                                       */
/* ------------------------------------------------------------------ */

export function PassoDirezione({ dati, aggiorna }: PropsPasso) {
  const socio = (id: string, modifica: Partial<Socio>) =>
    aggiorna((d) => ({ ...d, soci: d.soci.map((s) => (s.id === id ? { ...s, ...modifica } : s)) }));
  const gerente = (id: string, modifica: Partial<GerenteEsterno>) =>
    aggiorna((d) => ({ ...d, gerentiEsterni: d.gerentiEsterni.map((g) => (g.id === id ? { ...g, ...modifica } : g)) }));
  return (
    <View style={{ gap: SPAZIO.l }}>
      <Testo>
        Per legge i soci dirigono tutti insieme; lo statuto può affidare la gestione a dei gerenti, anche non soci (
        <LinkFonte fonte={fontiPercorso.co809} />
        ). Almeno una persona che rappresenta la società deve essere domiciliata in Svizzera (
        <LinkFonte fonte={fontiPercorso.co814} />
        ).
      </Testo>
      <SceltaSchede
        etichetta="Chi dirige la società"
        valore={dati.direzione}
        onCambia={(v) => imposta(aggiorna, "direzione", v)}
        opzioni={[
          { valore: "tutti", etichetta: "Tutti i soci insieme (regola della legge)" },
          { valore: "gerenti", etichetta: "Uno o più gerenti, scelti tra i soci o fuori" },
        ]}
      />
      {dati.direzione === "gerenti" ? (
        <>
          <Scheda style={{ gap: SPAZIO.xs }}>
            <Testo variante="forte">Quali soci sono gerenti?</Testo>
            {dati.soci.map((s, i) => (
              <Interruttore
                key={s.id}
                etichetta={`${s.nome.trim() || `Socio ${i + 1}`}: è gerente`}
                valore={s.gerente}
                onCambia={(v) => socio(s.id, { gerente: v })}
              />
            ))}
          </Scheda>
          <Testo variante="piccolo" attenuato>
            Qui sotto puoi aggiungere gerenti che non sono soci.
          </Testo>
          {dati.gerentiEsterni.map((g, i) => (
            <Scheda key={g.id} style={{ gap: SPAZIO.m }}>
              <Testo variante="sottotitolo">Gerente esterno {i + 1}</Testo>
              <CampoTesto
                etichetta="Nome e cognome"
                valore={g.nome}
                onCambia={(v) => gerente(g.id, { nome: v })}
                massimo={120}
                maiuscole="words"
              />
              <CampoTesto
                etichetta="Domicilio"
                valore={g.domicilio}
                onCambia={(v) => gerente(g.id, { domicilio: v })}
                massimo={120}
                maiuscole="words"
              />
              <Interruttore
                etichetta="Domiciliato in Svizzera"
                valore={g.domiciliatoInSvizzera}
                onCambia={(v) => gerente(g.id, { domiciliatoInSvizzera: v })}
              />
              <Pulsante
                titolo={`Togli il gerente ${i + 1}`}
                variante="testo"
                icona="trash-outline"
                onPress={() => aggiorna((d) => ({ ...d, gerentiEsterni: d.gerentiEsterni.filter((x) => x.id !== g.id) }))}
                style={{ alignSelf: "flex-start" }}
              />
            </Scheda>
          ))}
          {dati.gerentiEsterni.length < MASSIMO_GERENTI_ESTERNI ? (
            <Pulsante
              titolo="Aggiungi un gerente esterno"
              variante="secondario"
              icona="person-add-outline"
              onPress={() => aggiorna((d) => ({ ...d, gerentiEsterni: [...d.gerentiEsterni, nuovoGerenteEsterno(nuovoIdSagl())] }))}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Banca, revisione e comunicazioni                                 */
/* ------------------------------------------------------------------ */

export function PassoBanca({ dati, aggiorna }: PropsPasso) {
  return (
    <View style={{ gap: SPAZIO.l }}>
      <View style={{ gap: SPAZIO.xs }}>
        <CampoTesto
          etichetta="Banca per il conto vincolato"
          valore={dati.banca}
          onCambia={(v) => imposta(aggiorna, "banca", v)}
          massimo={120}
        />
        <Aiuto>
          Ci versate il capitale; dopo l&apos;iscrizione la banca lo rilascia (<LinkFonte fonte={fonti.pmiChecklist} />
          ).
        </Aiuto>
      </View>
      <View style={{ gap: SPAZIO.xs }}>
        <SceltaSchede
          etichetta="Revisione dei conti"
          valore={dati.revisione}
          onCambia={(v) => imposta(aggiorna, "revisione", v)}
          opzioni={[
            { valore: "da-decidere", etichetta: "Da decidere con il fiduciario" },
            { valore: "ufficio", etichetta: "Con un ufficio di revisione" },
            { valore: "rinuncia", etichetta: "Rinuncia alla revisione limitata" },
          ]}
        />
        <Aiuto>
          La rinuncia richiede il consenso di tutti i soci e al massimo 10 posti a tempo pieno (
          <LinkFonte fonte={fontiPercorso.co727a} />, <LinkFonte fonte={fontiPercorso.co818} />
          ).
        </Aiuto>
      </View>
      <View style={{ gap: SPAZIO.xs }}>
        <SceltaSchede
          etichetta="Comunicazioni della società ai soci"
          valore={dati.comunicazioni}
          onCambia={(v) => imposta(aggiorna, "comunicazioni", v)}
          opzioni={[
            { valore: "scritto-email", etichetta: "Per iscritto o per e-mail" },
            { valore: "scritto", etichetta: "Per iscritto" },
          ]}
        />
        <Aiuto>
          Lo statuto deve dirlo (<LinkFonte fonte={fontiPercorso.co776} />
          ).
        </Aiuto>
      </View>
    </View>
  );
}

/** Riquadro «I tuoi dati restano su questo telefono», con «Cancella i dati di questo strumento». */
export function DatiSulTelefono({ onCancella }: { onCancella: () => void }) {
  const c = useColori();
  return (
    <View
      style={{ backgroundColor: c.marchioTenue, borderRadius: RAGGIO.l, padding: SPAZIO.l, gap: SPAZIO.s }}
      accessibilityRole="summary"
    >
      <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
        <Ionicons name="phone-portrait-outline" size={20} color={c.marchio} style={{ marginTop: 2 }} />
        <Testo style={{ flex: 1 }}>
          <Testo variante="forte">I tuoi dati restano su questo telefono.</Testo> Li salviamo solo qui, mentre scrivi: Bleo
          non li riceve. Quelli scritti sul sito restano nel browser.
        </Testo>
      </View>
      <Pulsante
        titolo="Cancella i dati di questo strumento"
        variante="testo"
        icona="trash-outline"
        onPress={onCancella}
        style={{ alignSelf: "flex-start" }}
      />
    </View>
  );
}
