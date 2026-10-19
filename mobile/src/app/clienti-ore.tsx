import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { clientiInOrdine, durata, meseDi, nomeMese, riepilogoMese, spostaMese } from "@/lib/clienti/ore";
import type { GruppoCliente } from "@/lib/clienti/ore";
import type { Cliente, DettaglioFattura, Mese, RispostaOre, VoceOre } from "@/lib/clienti/tipi";
import { importo } from "@/lib/strumenti/numeri";
import { indirizzoCompleto } from "@/lib/strumenti/qr";
import { RigaChip } from "~/components/ore/chip";
import { Foglio } from "~/components/ore/foglio";
import { GruppoOre, testoTotali } from "~/components/ore/gruppo";
import { bozzaCliente, ModuloCliente } from "~/components/ore/modulo-cliente";
import { bozzaOre, ModuloOre } from "~/components/ore/modulo-ore";
import { Pulsante, Schermata, Scheda, Separatore, Testo } from "~/components/ui";
import { avvisa, chiediConferma } from "~/lib/conferma";
import {
  aggiornaCliente,
  aggiornaVoce,
  annullaFatturaOre,
  apriFatturaOre,
  caricaOre,
  creaCliente,
  creaFatturaOre,
  creaVoce,
  eliminaCliente,
  eliminaVoce,
  type DatiCliente,
  type DatiVoce,
} from "~/lib/ore";
import { creaFatturaDaOre } from "~/lib/fatture";
import { useSessione } from "~/lib/sessione";
import { oggiLocale } from "~/lib/stato";
import { supabase } from "~/lib/supabase";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** «Clienti e ore»: si apre dalla scheda Conti. */
export default function ClientiOre() {
  const { pronta, sessione } = useSessione();
  if (!supabase()) {
    return (
      <Schermata>
        <Scheda tenue>
          <Testo>In questa versione di prova clienti e ore non sono ancora attivi.</Testo>
        </Scheda>
      </Schermata>
    );
  }
  if (!pronta) return <Schermata>{null}</Schermata>;
  if (!sessione) {
    return (
      <Schermata>
        <Testo>Accedi per segnare le ore dei tuoi clienti e preparare le fatture.</Testo>
        <Pulsante titolo="Accedi" icona="arrow-forward" onPress={() => router.push("/accedi")} />
      </Schermata>
    );
  }
  return <ClientiOreUtente />;
}

type Errore = { messaggio: string; stato: number | null };
type FoglioAperto = { tipo: "voce"; voce: VoceOre } | { tipo: "cliente"; cliente: Cliente | null } | null;

function ClientiOreUtente() {
  const c = useColori();
  const oggi = oggiLocale();
  const meseCorrente = meseDi(oggi);
  const [mese, setMese] = useState<Mese>(meseCorrente);
  const [dati, setDati] = useState<RispostaOre | null>(null);
  const [errore, setErrore] = useState<Errore | null>(null);
  const [aggiornando, setAggiornando] = useState(false);
  const [avviso, setAvviso] = useState("");
  const [foglio, setFoglio] = useState<FoglioAperto>(null);
  const [inFattura, setInFattura] = useState<string | null>(null);
  /** L'ultimo cliente aggiunto: il modulo delle ore lo propone subito. */
  const [clienteNuovo, setClienteNuovo] = useState<string | undefined>(undefined);
  const richiesta = useRef(0);

  const carica = useCallback(
    async (modo: "silenzioso" | "tirato" = "silenzioso") => {
      const numero = ++richiesta.current;
      if (modo === "tirato") setAggiornando(true);
      const esito = await caricaOre(mese);
      if (numero !== richiesta.current) return;
      setAggiornando(false);
      if (esito.ok) {
        setDati(esito.dati);
        setErrore(null);
      } else {
        setErrore({ messaggio: esito.messaggio, stato: esito.stato });
      }
    },
    [mese],
  );

  // Aggiorna quando la schermata torna in primo piano (per esempio dopo la fattura sul sito) e quando cambia il mese.
  useFocusEffect(
    useCallback(() => {
      void carica();
    }, [carica]),
  );

  function cambiaMese(nuovo: Mese) {
    richiesta.current++;
    setDati((d) => (d && d.mese === nuovo ? d : null));
    setMese(nuovo);
  }

  async function segnaOre(voce: DatiVoce): Promise<boolean> {
    const esito = await creaVoce(voce);
    if (!esito.ok) {
      avvisa("Ore non segnate", esito.messaggio);
      return false;
    }
    const cliente = dati?.clienti.find((x) => x.id === voce.clienteId)?.nome ?? "il cliente";
    setAvviso(`Segnato: ${durata(voce.minuti)} per ${cliente}, ${dataSvizzera(voce.data)}.`);
    if (meseDi(voce.data) !== mese) cambiaMese(meseDi(voce.data));
    else void carica();
    return true;
  }

  async function salvaVoce(v: VoceOre, modifiche: DatiVoce): Promise<boolean> {
    const esito = await aggiornaVoce(v.id, modifiche);
    if (!esito.ok) {
      avvisa("Non è stato possibile salvare", esito.messaggio);
      return false;
    }
    setFoglio(null);
    void carica();
    return true;
  }

  function chiediEliminaVoce(v: VoceOre) {
    chiediConferma({
      titolo: "Eliminare questa voce?",
      messaggio: `${durata(v.minuti)} del ${dataSvizzera(v.data)}.`,
      conferma: "Elimina",
      pericolo: true,
      onConferma: () => void elimina(),
    });
    async function elimina() {
      setFoglio(null);
      const esito = await eliminaVoce(v.id);
      if (!esito.ok) avvisa("Non è stato possibile eliminare", esito.messaggio);
      void carica();
    }
  }

  async function togliSegnoVoce(v: VoceOre) {
    const esito = await aggiornaVoce(v.id, { fatturataIl: null });
    if (!esito.ok) {
      avvisa("Non è stato possibile", esito.messaggio);
      return;
    }
    setFoglio({ tipo: "voce", voce: esito.dati });
    void carica();
  }

  async function salvaCliente(cliente: Cliente | null, nuovi: DatiCliente): Promise<boolean> {
    const esito = cliente ? await aggiornaCliente(cliente.id, nuovi) : await creaCliente(nuovi);
    if (!esito.ok) {
      avvisa("Cliente non salvato", esito.messaggio);
      return false;
    }
    setFoglio(null);
    if (!cliente) setClienteNuovo(esito.dati.id);
    setAvviso(cliente ? `Dati di ${esito.dati.nome} salvati.` : `${esito.dati.nome} aggiunto ai tuoi clienti.`);
    void carica();
    return true;
  }

  function chiediEliminaCliente(cliente: Cliente) {
    chiediConferma({
      titolo: `Eliminare ${cliente.nome}?`,
      messaggio: "Si cancellano il cliente e tutte le ore segnate per lui, anche quelle già fatturate.",
      conferma: "Elimina",
      pericolo: true,
      onConferma: () => void elimina(),
    });
    async function elimina() {
      setFoglio(null);
      const esito = await eliminaCliente(cliente.id);
      if (!esito.ok) avvisa("Non è stato possibile eliminare", esito.messaggio);
      void carica();
    }
  }

  function creaFattura(g: GruppoCliente, dettaglio: DettaglioFattura, importoOre: number | null) {
    const voci = g.daFatturare.voci;
    chiediConferma({
      titolo: `Fattura per ${g.cliente.nome}?`,
      messaggio:
        `${voci === 1 ? "1 voce" : `${voci} voci`} di ${nomeMese(mese)}` +
        `${importoOre !== null ? ` (${importo(importoOre)})` : ""}: si segnano come fatturate oggi e si apre la fattura già ` +
        "compilata: la controlli e la mandi in PDF. La prima volta scrivi i tuoi dati e l'IBAN: restano nel tuo account.",
      conferma: "Crea la fattura",
      onConferma: () => void crea(),
    });
    async function crea() {
      setInFattura(g.cliente.id);
      const esito = await creaFatturaOre({ clienteId: g.cliente.id, mese, dettaglio });
      setInFattura(null);
      void carica();
      if (!esito.ok) {
        avvisa("Fattura non preparata", esito.messaggio);
        return;
      }
      setAvviso(`Ore di ${g.cliente.nome} segnate come fatturate il ${dataSvizzera(esito.dati.fatturataIl)}.`);
      // La fattura si apre nell'app; se i documenti dell'account non si leggono, sul sito (che la salva lo stesso nell'account).
      const id = await creaFatturaDaOre(esito.dati.precompilazione);
      if (id) router.push({ pathname: "/fatture/[id]", params: { id } });
      else await apriFatturaOre(esito.dati);
      void carica();
    }
  }

  function togliSegno(g: GruppoCliente, giorno: string) {
    chiediConferma({
      titolo: "Togliere il segno «fatturata»?",
      messaggio: `Fallo solo se la fattura del ${dataSvizzera(giorno)} per ${g.cliente.nome} non l'hai mandata: le ore tornano da fatturare.`,
      conferma: "Togli il segno",
      onConferma: () => void togli(),
    });
    async function togli() {
      const esito = await annullaFatturaOre(g.cliente.id, mese, giorno);
      if (!esito.ok) avvisa("Non è stato possibile", esito.messaggio);
      void carica();
    }
  }

  const tirato = <RefreshControl refreshing={aggiornando} onRefresh={() => void carica("tirato")} tintColor={c.marchio} />;
  const clienti = dati ? clientiInOrdine(dati.clienti) : [];
  const riepilogo = dati ? riepilogoMese(dati.voci, dati.clienti) : null;
  const altriMesi = dati ? dati.daFatturare.filter((m) => m.mese !== mese) : [];

  return (
    <Schermata refreshControl={tirato}>
      {errore ? <ErroreOre errore={errore} onRiprova={() => void carica("tirato")} /> : null}

      {!dati ? (
        errore ? null : (
          <View style={{ paddingVertical: SPAZIO.xxl, alignItems: "center", gap: SPAZIO.m }}>
            <ActivityIndicator color={c.marchio} />
            <Testo attenuato>Carico clienti e ore…</Testo>
          </View>
        )
      ) : (
        <>
          <Scheda evidenziata style={{ gap: SPAZIO.m }}>
            <Testo variante="sottotitolo">Segna le ore</Testo>
            {clienti.length === 0 ? (
              <>
                <Testo attenuato>Per iniziare aggiungi il tuo primo cliente.</Testo>
                <Pulsante titolo="Aggiungi un cliente" icona="person-add-outline" onPress={() => setFoglio({ tipo: "cliente", cliente: null })} />
              </>
            ) : (
              <ModuloOre
                key={clienteNuovo ?? "ore"}
                clienti={clienti}
                oggi={oggi}
                iniziale={bozzaOre(clienti, oggi, null, clienteNuovo)}
                titoloSalva="Segna le ore"
                onSalva={segnaOre}
              />
            )}
            {avviso ? (
              <Testo variante="forte" colore={c.marchio} accessibilityLiveRegion="polite">
                {avviso}
              </Testo>
            ) : null}
          </Scheda>

          <SceltaMese mese={mese} massimo={meseCorrente} onCambia={cambiaMese} />

          {riepilogo && riepilogo.gruppi.length > 0 ? (
            <>
              <Scheda>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: SPAZIO.m }}>
                  <Testo attenuato>Ore del mese</Testo>
                  <Testo variante="forte">{durata(riepilogo.totale.minuti)}</Testo>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: SPAZIO.m }}>
                  <Testo attenuato>Da fatturare</Testo>
                  <Testo variante="forte" colore={riepilogo.daFatturare.voci > 0 ? c.accento : undefined}>
                    {riepilogo.daFatturare.voci === 0 ? "Niente" : testoTotali(riepilogo.daFatturare)}
                  </Testo>
                </View>
              </Scheda>
              {riepilogo.gruppi.map((g) => (
                <GruppoOre
                  key={g.cliente.id}
                  gruppo={g}
                  mese={mese}
                  attesa={inFattura === g.cliente.id}
                  onModificaVoce={(voce) => setFoglio({ tipo: "voce", voce })}
                  onCreaFattura={(dettaglio, importoOre) => creaFattura(g, dettaglio, importoOre)}
                  onTogliSegno={(giorno) => togliSegno(g, giorno)}
                />
              ))}
            </>
          ) : (
            <Scheda tenue>
              <Testo>Nessuna ora segnata in {nomeMese(mese)}.</Testo>
            </Scheda>
          )}

          {altriMesi.length > 0 ? (
            <View style={{ gap: SPAZIO.s }}>
              <Testo variante="forte">Ore ancora da fatturare in altri mesi</Testo>
              <RigaChip
                etichetta="Mesi da fatturare"
                opzioni={altriMesi.map((m) => ({ chiave: m.mese, testo: `${nomeMese(m.mese)}: ${durata(m.minuti)}` }))}
                onScegli={(m) => cambiaMese(m)}
              />
            </View>
          ) : null}

          <View style={{ gap: SPAZIO.s }}>
            <Testo variante="sottotitolo">I tuoi clienti{clienti.length > 0 ? ` (${clienti.length})` : ""}</Testo>
            {clienti.length > 0 ? (
              <Scheda style={{ gap: 0 }}>
                {clienti.map((cliente, i) => (
                  <View key={cliente.id}>
                    {i > 0 ? <Separatore /> : null}
                    <RigaCliente cliente={cliente} onPress={() => setFoglio({ tipo: "cliente", cliente })} />
                  </View>
                ))}
              </Scheda>
            ) : null}
            <Pulsante
              titolo="Aggiungi un cliente"
              variante="secondario"
              icona="person-add-outline"
              onPress={() => setFoglio({ tipo: "cliente", cliente: null })}
            />
          </View>
        </>
      )}

      <Testo variante="piccolo" attenuato>
        La fattura si prepara qui, con il codice QR, e resta nel tuo account con i tuoi preventivi e fatture. Bleo ti aiuta a
        tenere in ordine ore e fatture, ma non fa la contabilità per te: per IVA e imposte rivolgiti a un fiduciario autorizzato.
      </Testo>

      <Foglio
        visibile={foglio?.tipo === "voce"}
        titolo="Modifica le ore"
        onChiudi={() => setFoglio(null)}
      >
        {foglio?.tipo === "voce" ? (
          foglio.voce.fatturataIl ? (
            <View style={{ gap: SPAZIO.m }}>
              <Testo>
                {durata(foglio.voce.minuti)} del {dataSvizzera(foglio.voce.data)}: questa voce è già in una fattura (
                {dataSvizzera(foglio.voce.fatturataIl)}). Per cambiarla togli prima il segno «fatturata».
              </Testo>
              <Pulsante titolo="Togli il segno «fatturata»" variante="secondario" onPress={() => void togliSegnoVoce(foglio.voce)} />
              <Pulsante titolo="Elimina questa voce" variante="testo" onPress={() => chiediEliminaVoce(foglio.voce)} />
            </View>
          ) : (
            <>
              <ModuloOre
                key={foglio.voce.id}
                clienti={clienti}
                oggi={oggi}
                iniziale={bozzaOre(clienti, oggi, foglio.voce)}
                titoloSalva="Salva le modifiche"
                onSalva={(modifiche) => salvaVoce(foglio.voce, modifiche)}
                onAnnulla={() => setFoglio(null)}
              />
              <Pulsante titolo="Elimina questa voce" variante="testo" onPress={() => chiediEliminaVoce(foglio.voce)} />
            </>
          )
        ) : null}
      </Foglio>

      <Foglio
        visibile={foglio?.tipo === "cliente"}
        titolo={foglio?.tipo === "cliente" && foglio.cliente ? "Modifica il cliente" : "Nuovo cliente"}
        onChiudi={() => setFoglio(null)}
      >
        {foglio?.tipo === "cliente" ? (
          <>
            <ModuloCliente
              key={foglio.cliente?.id ?? "nuovo"}
              iniziale={bozzaCliente(foglio.cliente)}
              titoloSalva={foglio.cliente ? "Salva le modifiche" : "Aggiungi il cliente"}
              onSalva={(nuovi) => salvaCliente(foglio.cliente, nuovi)}
              onAnnulla={() => setFoglio(null)}
            />
            {foglio.cliente ? (
              <Pulsante
                titolo="Elimina questo cliente"
                variante="testo"
                onPress={() => foglio.cliente && chiediEliminaCliente(foglio.cliente)}
              />
            ) : null}
          </>
        ) : null}
      </Foglio>
    </Schermata>
  );
}

function RigaCliente({ cliente, onPress }: { cliente: Cliente; onPress: () => void }) {
  const c = useColori();
  const via = [cliente.via, cliente.numero].filter(Boolean).join(" ");
  const luogo = [cliente.npa, cliente.localita].filter(Boolean).join(" ");
  const indirizzo = [via, luogo].filter(Boolean).join(", ");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Apre il cliente per modificarlo"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: SPAZIO.m,
        paddingVertical: SPAZIO.m,
        minHeight: 52,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Testo variante="forte">{cliente.nome}</Testo>
        <Testo variante="piccolo" attenuato>
          {indirizzo || "Senza indirizzo"}
          {cliente.tariffa !== null ? ` · ${importo(cliente.tariffa)} all'ora` : ""}
        </Testo>
        {!indirizzoCompleto(cliente) ? (
          <Testo variante="piccolo" colore={c.accento}>
            Indirizzo incompleto per la QR-fattura
          </Testo>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.attenuato} />
    </Pressable>
  );
}

function SceltaMese({ mese, massimo, onCambia }: { mese: Mese; massimo: Mese; onCambia: (mese: Mese) => void }) {
  const c = useColori();
  const freccia = (verso: -1 | 1) => {
    const nuovo = spostaMese(mese, verso);
    const spenta = verso > 0 && nuovo > massimo;
    return (
      <Pressable
        onPress={() => onCambia(nuovo)}
        disabled={spenta}
        accessibilityRole="button"
        accessibilityLabel={verso < 0 ? `Mese precedente, ${nomeMese(nuovo)}` : `Mese seguente, ${nomeMese(nuovo)}`}
        accessibilityState={{ disabled: spenta }}
        hitSlop={8}
        style={{
          width: 44,
          height: 44,
          borderRadius: RAGGIO.pillola,
          alignItems: "center",
          justifyContent: "center",
          opacity: spenta ? 0.3 : 1,
        }}
      >
        <Ionicons name={verso < 0 ? "chevron-back" : "chevron-forward"} size={22} color={c.marchio} />
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPAZIO.s }}>
      {freccia(-1)}
      <Testo variante="sottotitolo" style={{ minWidth: 160, textAlign: "center" }} accessibilityLabel={`Ore di ${nomeMese(mese)}`}>
        {nomeMese(mese)}
      </Testo>
      {freccia(1)}
    </View>
  );
}

function ErroreOre({ errore, onRiprova }: { errore: Errore; onRiprova: () => void }) {
  const c = useColori();
  if (errore.stato === 503) {
    return (
      <Scheda tenue>
        <Testo>Clienti e ore non sono ancora attivi. Torna a trovarci presto.</Testo>
      </Scheda>
    );
  }
  return (
    <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
      <Testo accessibilityLiveRegion="polite">{errore.messaggio}</Testo>
      {errore.stato === 401 ? (
        <Pulsante titolo="Accedi di nuovo" onPress={() => router.push("/accedi")} />
      ) : (
        <Pulsante titolo="Riprova" variante="secondario" icona="refresh" onPress={onRiprova} />
      )}
    </Scheda>
  );
}
