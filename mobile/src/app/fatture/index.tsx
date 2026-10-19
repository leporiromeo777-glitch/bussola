import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { emittenteCompilato, statoDocumento } from "@/lib/strumenti/account";
import { calcolaTotali, dataIsoValida, NOMI_TIPO, nuovoDocumento, type Documento, type TipoDocumento } from "@/lib/strumenti/documenti";
import { importo } from "@/lib/strumenti/numeri";
import { formattaIban } from "@/lib/strumenti/qr";
import { Scelta } from "~/components/campi";
import { CaricamentoFatture, ConAccesso, StatoSalvataggio } from "~/components/fatture/accesso";
import { ImmagineMascotte } from "~/components/mascotte";
import { NotaInformazione, Pillola, Pulsante, Schermata, Scheda, Separatore, Testo } from "~/components/ui";
import { archivioFatture, contesto, profiloAttuale, useArchivioFatture } from "~/lib/fatture";
import { SPAZIO, useColori } from "~/lib/tema";

/** «Preventivo e fattura»: elenco dei documenti salvati nell'account. Si apre da Conti e da Calcoli e strumenti. */
export default function PreventiviFatture() {
  return (
    <ConAccesso>
      <Elenco />
    </ConAccesso>
  );
}

function Elenco() {
  const c = useColori();
  const stato = useArchivioFatture();
  const [tipo, setTipo] = useState<TipoDocumento>("fattura");
  const [aggiornando, setAggiornando] = useState(false);
  const documenti = stato.documenti;
  const elenco = useMemo(
    () => (documenti ?? []).filter((d) => d.tipo === tipo).sort((a, b) => b.aggiornatoIl.localeCompare(a.aggiornatoIl)),
    [documenti, tipo],
  );

  if (stato.caricamento !== "pronto" || !documenti) return <CaricamentoFatture stato={stato} />;

  const nomi = NOMI_TIPO[tipo];
  const profilo = profiloAttuale(stato);

  function crea() {
    const nuovo = nuovoDocumento(tipo, profilo, archivioFatture.istantanea().documenti ?? [], contesto());
    archivioFatture.aggiornaDocumenti((lista) => [...lista, nuovo]);
    router.push({ pathname: "/fatture/[id]", params: { id: nuovo.id } });
  }

  async function aggiorna() {
    setAggiornando(true);
    await archivioFatture.carica({ forza: true });
    setAggiornando(false);
  }

  return (
    <Schermata refreshControl={<RefreshControl refreshing={aggiornando} onRefresh={() => void aggiorna()} tintColor={c.marchio} />}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="scrivania" larghezza={88} />
        <Testo attenuato style={{ flex: 1 }}>
          Prepari il preventivo, lo trasformi in fattura con il codice QR e la mandi in PDF. Tutto resta nel tuo account: lo
          ritrovi anche sul sito.
        </Testo>
      </View>

      <Scheda>
        <Pressable
          onPress={() => router.push("/fatture/profilo")}
          accessibilityRole="button"
          accessibilityHint="Apre i tuoi dati per preventivi e fatture"
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: SPAZIO.m, minHeight: 52, opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="person-circle-outline" size={28} color={c.marchio} />
          <View style={{ flex: 1, gap: 2 }}>
            <Testo variante="forte">I tuoi dati</Testo>
            {emittenteCompilato(stato.emittente) ? (
              <Testo variante="piccolo" attenuato>
                {[profilo.nome, profilo.iban ? formattaIban(profilo.iban) : "IBAN da scrivere"].filter(Boolean).join(" · ")}
                {profilo.ivaIscritto ? " · IVA" : ""}
              </Testo>
            ) : (
              <Testo variante="piccolo" colore={c.accento}>
                Scrivili una volta (nome, indirizzo, IBAN): li usiamo in tutti i documenti.
              </Testo>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.attenuato} />
        </Pressable>
      </Scheda>

      <Scelta
        etichetta="Documenti"
        valore={tipo}
        onCambia={setTipo}
        opzioni={[
          { valore: "fattura", etichetta: "Fatture" },
          { valore: "preventivo", etichetta: "Preventivi" },
        ]}
      />

      <Pulsante titolo={nomi.nuovo} icona="add" onPress={crea} />

      {elenco.length === 0 ? (
        <Scheda tenue>
          <Testo>
            Non hai ancora {nomi.plurale}.
            {tipo === "fattura" ? " Puoi partire da zero, da un preventivo o dalle ore in «Clienti e ore»." : ""}
          </Testo>
        </Scheda>
      ) : (
        <Scheda style={{ gap: 0, paddingVertical: SPAZIO.s }}>
          {elenco.map((d, i) => (
            <View key={d.id}>
              {i > 0 ? <Separatore /> : null}
              <RigaDocumento doc={d} />
            </View>
          ))}
        </Scheda>
      )}

      <StatoSalvataggio stato={stato} />
      <NotaInformazione />
    </Schermata>
  );
}

function RigaDocumento({ doc }: { doc: Documento }) {
  const c = useColori();
  const pronto = statoDocumento(doc) === "pronto";
  const totale = calcolaTotali(doc).totale;
  const nomi = NOMI_TIPO[doc.tipo];
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/fatture/[id]", params: { id: doc.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${nomi.singolare} ${doc.numero || "senza numero"}, ${doc.cliente.nome || "cliente da scrivere"}, ${importo(totale, 2, doc.valuta)}, ${pronto ? "pronto" : "da completare"}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: SPAZIO.m, paddingVertical: SPAZIO.m, minHeight: 56, opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Testo variante="forte">
          {doc.numero || "Senza numero"}
          <Testo attenuato> · {doc.cliente.nome || "cliente da scrivere"}</Testo>
        </Testo>
        <Testo variante="piccolo" attenuato>
          {[dataIsoValida(doc.data) ? dataSvizzera(doc.data) : null, importo(totale, 2, doc.valuta), doc.daPreventivo ? `da ${doc.daPreventivo}` : null]
            .filter(Boolean)
            .join(" · ")}
        </Testo>
        <Pillola testo={pronto ? "Pronto" : "Da completare"} tono={pronto ? "marchio" : "accento"} />
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.attenuato} />
    </Pressable>
  );
}
