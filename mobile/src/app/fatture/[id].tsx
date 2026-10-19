import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import type { Cliente } from "@/lib/clienti/tipi";
import {
  controllaDocumento,
  duplicaDocumento,
  LUNGHEZZE_DOCUMENTO,
  NOMI_TIPO,
  normalizzaNumeroIva,
  preventivoInFattura,
  type Documento,
  type Emittente,
} from "@/lib/strumenti/documenti";
import { formattaIban, indirizzoCompleto } from "@/lib/strumenti/qr";
import { righeIndirizzo } from "@/lib/strumenti/stampa-documento";
import { CampoTesto, Scelta } from "~/components/campi";
import { CaricamentoFatture, ConAccesso, StatoSalvataggio } from "~/components/fatture/accesso";
import { AnteprimaDocumento } from "~/components/fatture/anteprima";
import {
  CampoData,
  ControlliDocumento,
  SceltaRiferimentoQr,
  SceltaScadenza,
  TotaliDocumento,
  VociDocumento,
  type Modifica,
} from "~/components/fatture/campi-documento";
import { CampiIndirizzo, ModuloEmittente, RigaCasella } from "~/components/fatture/modulo-emittente";
import { Foglio } from "~/components/ore/foglio";
import { Pillola, Pulsante, Schermata, Scheda, Separatore, Testo } from "~/components/ui";
import { avvisa, chiediConferma } from "~/lib/conferma";
import { chiama } from "~/lib/conti";
import {
  archivioFatture,
  condividiPdf,
  contesto,
  PDF_DISPONIBILE,
  registraNeiConti,
  stampaPdf,
  useArchivioFatture,
} from "~/lib/fatture";
import { SPAZIO, useColori } from "~/lib/tema";

/** Un preventivo o una fattura: si modifica qui, si salva da solo nell'account. */
export default function ModificaDocumento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ConAccesso>
      <Editor id={typeof id === "string" ? id : ""} />
    </ConAccesso>
  );
}

type FoglioAperto = "emittente" | "anteprima" | "clienti" | null;

function Editor({ id }: { id: string }) {
  const stato = useArchivioFatture();
  const [foglio, setFoglio] = useState<FoglioAperto>(null);
  const [attesa, setAttesa] = useState<"pdf" | "stampa" | "conti" | null>(null);
  const [nelConti, setNelConti] = useState<string | null>(null);

  if (stato.caricamento !== "pronto" || !stato.documenti) return <CaricamentoFatture stato={stato} />;
  const doc = stato.documenti.find((d) => d.id === id);
  if (!doc) {
    return (
      <Schermata>
        <Testo>Questo documento non c&apos;è più: forse l&apos;hai eliminato sul sito o su un altro telefono.</Testo>
        <Pulsante titolo="Torna ai documenti" variante="secondario" onPress={() => router.back()} />
      </Schermata>
    );
  }

  const nomi = NOMI_TIPO[doc.tipo];
  const e = doc.emittente;
  const problemi = controllaDocumento(doc);

  const onCambia: Modifica = (modifica) =>
    archivioFatture.aggiornaDocumenti((lista) =>
      lista.map((d) => (d.id === id ? { ...modifica(d), aggiornatoIl: new Date().toISOString() } : d)),
    );
  const imposta = <K extends keyof Documento>(campo: K, valore: Documento[K]) => onCambia((d) => ({ ...d, [campo]: valore }));

  // Come sul sito: i tuoi dati cambiano nel documento e nel profilo, per i prossimi documenti.
  const cambiaEmittente = (modifica: Partial<Emittente>) => {
    onCambia((d) => ({ ...d, emittente: { ...d.emittente, ...modifica }, ...(modifica.ivaIscritto ? { valuta: "CHF" as const } : {}) }));
    archivioFatture.aggiornaEmittente((p) => ({ ...(p ?? doc.emittente), ...modifica }));
  };

  const apriNuovo = (nuovo: Documento) => {
    archivioFatture.aggiornaDocumenti((lista) => [...lista, nuovo]);
    router.push({ pathname: "/fatture/[id]", params: { id: nuovo.id } });
  };

  const conPdf = (azione: "pdf" | "stampa") => {
    const esegui = async () => {
      setAttesa(azione);
      try {
        if (azione === "pdf") await condividiPdf(doc);
        else await stampaPdf(doc);
      } catch {
        // Chiudere la stampa senza stampare non è un errore da mostrare.
        if (azione === "pdf") avvisa("PDF non creato", "Non sono riuscito a creare o condividere il PDF. Riprova tra poco.");
      } finally {
        setAttesa(null);
      }
    };
    if (problemi.length === 0) return void esegui();
    chiediConferma({
      titolo: "Mancano ancora delle cose",
      messaggio: `${problemi.map((p) => `• ${p.messaggio}`).join("\n")}\n\nVuoi creare il PDF lo stesso?`,
      conferma: "Crea il PDF",
      onConferma: () => void esegui(),
    });
  };

  const registra = async () => {
    setAttesa("conti");
    const esito = await registraNeiConti(doc);
    setAttesa(null);
    if (!esito.ok) return avvisa("Non registrata", esito.messaggio);
    setNelConti(`Fatto: la fattura ${esito.fattura.numero} è in «I tuoi conti». Quando il cliente paga, segnala come pagata.`);
  };

  const elimina = () => {
    chiediConferma({
      titolo: `Eliminare ${doc.tipo === "fattura" ? "la fattura" : "il preventivo"} ${doc.numero}?`,
      messaggio:
        doc.tipo === "fattura"
          ? "La cancelliamo dal tuo account, anche sul sito. Se l'hai registrata in «I tuoi conti», lì resta."
          : "Lo cancelliamo dal tuo account, anche sul sito.",
      conferma: "Elimina",
      pericolo: true,
      onConferma: () => {
        archivioFatture.aggiornaDocumenti((lista) => lista.filter((d) => d.id !== id));
        router.back();
      },
    });
  };

  return (
    <Schermata>
      <Stack.Screen options={{ title: `${nomi.singolare} ${doc.numero}`.trim() }} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPAZIO.m }}>
        <Pillola
          testo={problemi.length === 0 ? "Pronto da mandare" : `Da completare: ${problemi.length}`}
          tono={problemi.length === 0 ? "marchio" : "accento"}
        />
        <Pulsante titolo="Anteprima" variante="testo" icona="eye-outline" onPress={() => setFoglio("anteprima")} />
      </View>
      {doc.daPreventivo ? (
        <Testo variante="piccolo" attenuato>
          Nata dal preventivo {doc.daPreventivo}.
        </Testo>
      ) : null}

      <Sezione titolo="I tuoi dati">
        <View>
          <Testo variante="forte">{e.nome || "Nome da scrivere"}</Testo>
          {righeIndirizzo(e).map((r) => (
            <Testo key={r} attenuato>
              {r}
            </Testo>
          ))}
          <Testo attenuato>{e.iban ? `IBAN ${formattaIban(e.iban)}` : "IBAN da scrivere"}</Testo>
          <Testo attenuato>
            {e.ivaIscritto ? (normalizzaNumeroIva(e.numeroIva) ?? "Numero IVA da scrivere") : "Non iscritto all'IVA"}
          </Testo>
        </View>
        <Pulsante titolo="Modifica i tuoi dati" variante="secondario" icona="create-outline" onPress={() => setFoglio("emittente")} />
      </Sezione>

      <Sezione titolo="Cliente">
        <Pulsante titolo="Scegli dai tuoi clienti" variante="testo" icona="people-outline" onPress={() => setFoglio("clienti")} />
        <CampiIndirizzo
          valore={doc.cliente}
          onCambia={(m) => onCambia((d) => ({ ...d, cliente: { ...d.cliente, ...m } }))}
          etichettaNome="Nome del cliente (persona o azienda)"
        />
        {doc.tipo === "fattura" && !indirizzoCompleto(doc.cliente) ? (
          <Testo variante="piccolo" attenuato>
            Senza indirizzo completo (NPA, località, paese) il cliente non va nella sezione pagamento: resta il riquadro vuoto.
          </Testo>
        ) : null}
      </Sezione>

      <Sezione titolo={`Dati ${nomi.conDel}`}>
        <CampoTesto
          etichetta="Numero"
          valore={doc.numero}
          onCambia={(v) => imposta("numero", v)}
          maiuscole="characters"
          massimo={LUNGHEZZE_DOCUMENTO.numero}
        />
        <CampoData etichetta="Data" iso={doc.data} onCambia={(v) => imposta("data", v)} />
        <CampoData etichetta={nomi.scadenza} iso={doc.scadenza} onCambia={(v) => imposta("scadenza", v)} facoltativa />
        <SceltaScadenza doc={doc} onCambia={onCambia} />
        <CampoTesto
          etichetta="Oggetto (se vuoi)"
          valore={doc.oggetto}
          onCambia={(v) => imposta("oggetto", v)}
          segnaposto="Per esempio: Sito web per Bar Centrale"
          massimo={LUNGHEZZE_DOCUMENTO.oggetto}
        />
        <CampoTesto
          etichetta="Data o periodo della prestazione"
          valore={doc.periodoPrestazione}
          onCambia={(v) => imposta("periodoPrestazione", v)}
          segnaposto="Per esempio: ottobre 2026"
          aiuto="Se è diverso dalla data del documento."
          massimo={LUNGHEZZE_DOCUMENTO.periodoPrestazione}
        />
        {e.ivaIscritto ? (
          <Testo variante="piccolo" attenuato>
            Valuta: CHF. Con l&apos;IVA questo strumento prepara documenti solo in franchi.
          </Testo>
        ) : (
          <Scelta
            etichetta="Valuta"
            valore={doc.valuta}
            onCambia={(v) => imposta("valuta", v)}
            opzioni={[
              { valore: "CHF", etichetta: "CHF" },
              { valore: "EUR", etichetta: "EUR" },
            ]}
          />
        )}
        {doc.valuta === "CHF" ? (
          <RigaCasella etichetta="Arrotonda il totale ai 5 centesimi" spuntata={doc.arrotonda5} onCambia={(v) => imposta("arrotonda5", v)} />
        ) : null}
      </Sezione>

      <Sezione titolo="Voci">
        <VociDocumento doc={doc} onCambia={onCambia} />
        <TotaliDocumento doc={doc} />
      </Sezione>

      <Sezione titolo="Note (se vuoi)">
        <CampoTesto
          etichetta="Testo in fondo al documento"
          valore={doc.note}
          onCambia={(v) => imposta("note", v)}
          righe={3}
          segnaposto={doc.tipo === "fattura" ? "Per esempio: Grazie per la fiducia!" : "Per esempio: tempi di consegna, cosa è incluso e cosa no."}
          massimo={LUNGHEZZE_DOCUMENTO.note}
        />
      </Sezione>

      {doc.tipo === "fattura" ? (
        <Sezione titolo="Pagamento con QR-fattura">
          <SceltaRiferimentoQr doc={doc} onCambia={onCambia} />
        </Sezione>
      ) : null}

      <ControlliDocumento doc={doc} />

      <View style={{ gap: SPAZIO.s }}>
        {PDF_DISPONIBILE ? (
          <>
            <Pulsante titolo="Condividi il PDF" icona="share-outline" caricamento={attesa === "pdf"} disabilitato={attesa !== null} onPress={() => conPdf("pdf")} />
            <Pulsante
              titolo="Stampa o guarda il PDF"
              variante="secondario"
              icona="print-outline"
              caricamento={attesa === "stampa"}
              disabilitato={attesa !== null}
              onPress={() => conPdf("stampa")}
            />
          </>
        ) : (
          <Testo variante="piccolo" attenuato>
            Il PDF si crea nell&apos;app sul telefono.
          </Testo>
        )}
        <Pulsante titolo="Anteprima" variante="secondario" icona="eye-outline" onPress={() => setFoglio("anteprima")} />
        {doc.tipo === "preventivo" ? (
          <Pulsante
            titolo="Trasforma in fattura"
            variante="secondario"
            icona="receipt-outline"
            onPress={() => apriNuovo(preventivoInFattura(doc, stato.documenti ?? [], contesto()))}
          />
        ) : null}
      </View>

      {doc.tipo === "fattura" ? (
        <Scheda>
          <Testo variante="forte">I tuoi conti</Testo>
          {nelConti ? (
            <>
              <Testo accessibilityLiveRegion="polite">{nelConti}</Testo>
              <Pulsante titolo="Vai a I tuoi conti" variante="testo" onPress={() => router.push("/conti")} />
            </>
          ) : doc.valuta !== "CHF" ? (
            <Testo attenuato>«I tuoi conti» per ora tiene solo le fatture in franchi (CHF).</Testo>
          ) : problemi.length > 0 ? (
            <Testo attenuato>Quando la fattura è completa puoi registrarla nei tuoi conti.</Testo>
          ) : (
            <>
              <Testo attenuato>
                Salva numero, cliente, date, totale e riferimento: così vedi cosa devi ancora incassare. Si può ripetere dopo una
                correzione.
              </Testo>
              <Pulsante
                titolo="Registra in I tuoi conti"
                variante="secondario"
                icona="wallet-outline"
                caricamento={attesa === "conti"}
                disabilitato={attesa !== null}
                onPress={() => void registra()}
              />
            </>
          )}
        </Scheda>
      ) : null}

      <View style={{ gap: SPAZIO.s }}>
        <Pulsante
          titolo="Duplica"
          variante="testo"
          icona="copy-outline"
          onPress={() => apriNuovo(duplicaDocumento(doc, stato.documenti ?? [], contesto()))}
        />
        <Pulsante titolo={`Elimina ${nomi.minuscolo}`} variante="testo" icona="trash-outline" onPress={elimina} />
      </View>

      <StatoSalvataggio stato={stato} />
      <Testo variante="piccolo" attenuato>
        Bleo ti aiuta a preparare il documento, ma non fa la contabilità né le dichiarazioni per te. Per IVA e imposte, per il tuo
        caso, rivolgiti a un fiduciario autorizzato.
      </Testo>

      <Foglio visibile={foglio === "emittente"} titolo="I tuoi dati" onChiudi={() => setFoglio(null)}>
        <Testo attenuato>Cambiano in questo documento e nei prossimi.</Testo>
        <ModuloEmittente valore={doc.emittente} onCambia={cambiaEmittente} />
        <Pulsante titolo="Fatto" onPress={() => setFoglio(null)} />
      </Foglio>

      <Foglio visibile={foglio === "anteprima"} titolo="Anteprima" onChiudi={() => setFoglio(null)}>
        <AnteprimaDocumento doc={doc} />
        {PDF_DISPONIBILE ? (
          <Pulsante titolo="Condividi il PDF" icona="share-outline" caricamento={attesa === "pdf"} disabilitato={attesa !== null} onPress={() => conPdf("pdf")} />
        ) : null}
      </Foglio>

      <Foglio visibile={foglio === "clienti"} titolo="I tuoi clienti" onChiudi={() => setFoglio(null)}>
        <SceltaCliente
          onScegli={(cliente) => {
            onCambia((d) => ({
              ...d,
              cliente: {
                nome: cliente.nome,
                via: cliente.via,
                numero: cliente.numero,
                npa: cliente.npa,
                localita: cliente.localita,
                paese: cliente.paese,
              },
            }));
            setFoglio(null);
          }}
        />
      </Foglio>
    </Schermata>
  );
}

function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <Scheda style={{ gap: SPAZIO.m }}>
      <Testo variante="sottotitolo">{titolo}</Testo>
      {children}
    </Scheda>
  );
}

/** I clienti di «Clienti e ore»: uno tocco e l'indirizzo va nel documento. */
function SceltaCliente({ onScegli }: { onScegli: (cliente: Cliente) => void }) {
  const c = useColori();
  const [stato, setStato] = useState<{ clienti: Cliente[] | null; errore: string | null }>({ clienti: null, errore: null });
  useEffect(() => {
    let attivo = true;
    void chiama<{ clienti?: Cliente[] }>("/api/conti/clienti").then((esito) => {
      if (!attivo) return;
      setStato({ clienti: esito.ok ? (esito.dati.clienti ?? []) : null, errore: esito.ok ? null : esito.messaggio });
    });
    return () => {
      attivo = false;
    };
  }, []);
  if (stato.errore) return <Testo accessibilityLiveRegion="polite">{stato.errore}</Testo>;
  if (!stato.clienti) return <ActivityIndicator color={c.marchio} />;
  if (stato.clienti.length === 0) {
    return (
      <Testo attenuato>
        Non hai ancora clienti salvati. Li aggiungi in «Clienti e ore», dalla pagina Conti; intanto scrivi qui nome e indirizzo.
      </Testo>
    );
  }
  return (
    <Scheda style={{ gap: 0, paddingVertical: SPAZIO.s }}>
      {stato.clienti.map((cliente, i) => (
        <View key={cliente.id}>
          {i > 0 ? <Separatore /> : null}
          <Pressable
            onPress={() => onScegli(cliente)}
            accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: SPAZIO.m, minHeight: 52, paddingVertical: SPAZIO.s, opacity: pressed ? 0.6 : 1 })}
          >
            <View style={{ flex: 1 }}>
              <Testo variante="forte">{cliente.nome}</Testo>
              <Testo variante="piccolo" attenuato>
                {righeIndirizzo(cliente).join(", ") || "Senza indirizzo"}
              </Testo>
            </View>
            <Ionicons name="add-circle-outline" size={22} color={c.marchio} />
          </Pressable>
        </View>
      ))}
    </Scheda>
  );
}
