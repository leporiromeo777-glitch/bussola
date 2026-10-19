import { Pressable, View } from "react-native";
import { fonti, fontiStrumenti, regole } from "@/data/svizzera";
import { LUNGHEZZE_EMITTENTE, normalizzaNumeroIva, type Emittente } from "@/lib/strumenti/documenti";
import { importo } from "@/lib/strumenti/numeri";
import { validaIbanPerQr } from "@/lib/strumenti/qr";
import { CampoTesto } from "~/components/campi";
import { Casella, ElencoFonti, Testo, tocco } from "~/components/ui";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** Una casella con l'etichetta accanto: tutta la riga si tocca (almeno 44 punti). */
export function RigaCasella({
  etichetta,
  spuntata,
  onCambia,
}: {
  etichetta: string;
  spuntata: boolean;
  onCambia: (spuntata: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tocco();
        onCambia(!spuntata);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: spuntata }}
      accessibilityLabel={etichetta}
      style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m, minHeight: 44 }}
    >
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Casella spuntata={spuntata} onCambia={onCambia} etichetta={etichetta} />
      </View>
      <Testo style={{ flex: 1 }}>{etichetta}</Testo>
    </Pressable>
  );
}

/** Indirizzo strutturato come lo vuole la QR-fattura: via e numero separati, NPA, località, paese. */
export function CampiIndirizzo({
  valore,
  onCambia,
  etichettaNome,
  aiutoNome,
}: {
  valore: Pick<Emittente, "nome" | "via" | "numero" | "npa" | "localita" | "paese">;
  onCambia: (modifica: Partial<Emittente>) => void;
  etichettaNome: string;
  aiutoNome?: string;
}) {
  const L = LUNGHEZZE_EMITTENTE;
  return (
    <View style={{ gap: SPAZIO.l }}>
      <CampoTesto
        etichetta={etichettaNome}
        valore={valore.nome}
        onCambia={(v) => onCambia({ nome: v })}
        aiuto={aiutoNome}
        massimo={L.nome}
        maiuscole="words"
      />
      <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
        <View style={{ flex: 3 }}>
          <CampoTesto etichetta="Via" valore={valore.via} onCambia={(v) => onCambia({ via: v })} massimo={L.via} maiuscole="words" />
        </View>
        <View style={{ flex: 1 }}>
          <CampoTesto etichetta="Numero" valore={valore.numero} onCambia={(v) => onCambia({ numero: v })} massimo={L.numero} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
        <View style={{ flex: 1 }}>
          <CampoTesto
            etichetta="NPA"
            valore={valore.npa}
            onCambia={(v) => onCambia({ npa: v })}
            tastiera="numbers-and-punctuation"
            massimo={L.npa}
          />
        </View>
        <View style={{ flex: 2 }}>
          <CampoTesto
            etichetta="Località"
            valore={valore.localita}
            onCambia={(v) => onCambia({ localita: v })}
            massimo={L.localita}
            maiuscole="words"
          />
        </View>
      </View>
      <CampoTesto
        etichetta="Paese"
        valore={valore.paese}
        onCambia={(v) => onCambia({ paese: v.toUpperCase().slice(0, 2) })}
        aiuto="Il codice di 2 lettere: CH, IT…"
        maiuscole="characters"
        massimo={2}
      />
    </View>
  );
}

/**
 * I tuoi dati per preventivi e fatture: nome, indirizzo, contatti, IBAN e
 * IVA. Gli stessi campi e controlli dello strumento del sito.
 */
export function ModuloEmittente({ valore: e, onCambia }: { valore: Emittente; onCambia: (modifica: Partial<Emittente>) => void }) {
  const c = useColori();
  const iban = e.iban.trim() ? validaIbanPerQr(e.iban) : null;
  const numeroIva = normalizzaNumeroIva(e.numeroIva);
  return (
    <View style={{ gap: SPAZIO.l }}>
      <CampiIndirizzo
        valore={e}
        onCambia={onCambia}
        etichettaNome="Nome e cognome (o nome della ditta)"
        aiutoNome="Il nome di una ditta individuale deve contenere il tuo cognome. Se sei iscritto nel registro di commercio, scrivilo esattamente come è iscritto."
      />
      <CampoTesto
        etichetta="Email"
        valore={e.email}
        onCambia={(v) => onCambia({ email: v })}
        tastiera="email-address"
        massimo={LUNGHEZZE_EMITTENTE.email}
      />
      <CampoTesto
        etichetta="Telefono (se vuoi)"
        valore={e.telefono}
        onCambia={(v) => onCambia({ telefono: v })}
        tastiera="phone-pad"
        massimo={LUNGHEZZE_EMITTENTE.telefono}
      />
      <CampoTesto
        etichetta="IBAN o QR-IBAN del tuo conto"
        valore={e.iban}
        onCambia={(v) => onCambia({ iban: v })}
        errore={iban && !iban.ok ? iban.errore : undefined}
        aiuto={
          iban?.ok
            ? iban.qrIban
              ? "QR-IBAN riconosciuto: la fattura userà il riferimento QR."
              : "IBAN valido."
            : "Lo trovi nell'e-banking o sulla carta del conto. Conti svizzeri o del Liechtenstein."
        }
        maiuscole="characters"
        massimo={LUNGHEZZE_EMITTENTE.iban}
      />

      <View style={{ gap: SPAZIO.s, borderTopWidth: 1, borderTopColor: c.bordo, paddingTop: SPAZIO.l }}>
        <RigaCasella
          etichetta="Sono iscritto all'IVA (ho un numero IVA)"
          spuntata={e.ivaIscritto}
          onCambia={(v) => onCambia({ ivaIscritto: v })}
        />
        <Testo variante="piccolo" attenuato>
          L&apos;iscrizione è obbligatoria da {importo(regole.sogliaIva.valore, 0)} di cifra d&apos;affari annua, sotto è
          facoltativa.
        </Testo>
        {e.ivaIscritto ? (
          <CampoTesto
            etichetta="Numero IVA"
            valore={e.numeroIva}
            onCambia={(v) => onCambia({ numeroIva: v })}
            onFine={() => {
              if (numeroIva && numeroIva !== e.numeroIva) onCambia({ numeroIva });
            }}
            errore={e.numeroIva.trim() && !numeroIva ? "Formato: CHE-123.456.789 IVA" : undefined}
            aiuto="Nel formato CHE-123.456.789 IVA. I prezzi delle voci li scrivi senza IVA: la calcoliamo per aliquota."
            segnaposto="CHE-123.456.789 IVA"
            maiuscole="characters"
            massimo={LUNGHEZZE_EMITTENTE.numeroIva}
          />
        ) : (
          <View style={{ backgroundColor: c.marchioTenue, borderRadius: RAGGIO.m, padding: SPAZIO.m }}>
            <Testo variante="piccolo">
              Non sei iscritto all&apos;IVA: in fattura non puoi indicare l&apos;IVA. Se la indichi, la devi comunque
              all&apos;AFC. Per questo i campi IVA non compaiono.
            </Testo>
          </View>
        )}
      </View>
      <ElencoFonti fonti={[fonti.co945, fontiStrumenti.co954a, fonti.liva10, fonti.liva27, fontiStrumenti.afcIdi]} />
    </View>
  );
}
