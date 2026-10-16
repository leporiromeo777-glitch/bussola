import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { Pulsante, Schermata, Testo } from "~/components/ui";
import { apriSito } from "~/lib/apri";
import { supabase } from "~/lib/supabase";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accesso senza password: email, poi il codice ricevuto per email. */
export default function Accedi() {
  const c = useColori();
  const [email, setEmail] = useState("");
  const [codice, setCodice] = useState("");
  const [fase, setFase] = useState<"email" | "codice">("email");
  const [attesa, setAttesa] = useState(false);
  const [errore, setErrore] = useState("");

  const stileCampo = {
    borderWidth: 1.5,
    borderColor: c.bordo,
    borderRadius: RAGGIO.m,
    padding: SPAZIO.m,
    fontSize: 18,
    color: c.testo,
    backgroundColor: c.scheda,
  } as const;

  async function mandaCodice() {
    const client = supabase();
    const pulita = email.trim().toLowerCase();
    if (!client) return setErrore("L'accesso non è ancora attivo in questa versione di prova.");
    if (!EMAIL.test(pulita)) return setErrore("Controlla l'indirizzo email.");
    setErrore("");
    setAttesa(true);
    const { error } = await client.auth.signInWithOtp({ email: pulita, options: { shouldCreateUser: true } });
    setAttesa(false);
    if (error) {
      setErrore(
        error.status === 429
          ? "Hai chiesto troppi codici: aspetta qualche minuto e riprova."
          : "Non sono riuscito a mandare il codice. Riprova tra poco.",
      );
      return;
    }
    setFase("codice");
  }

  async function verifica() {
    const client = supabase();
    if (!client) return;
    const pulito = codice.replace(/\D/g, "");
    if (pulito.length < 6) return setErrore("Scrivi tutte le cifre del codice che hai ricevuto.");
    setErrore("");
    setAttesa(true);
    const { error } = await client.auth.verifyOtp({ email: email.trim().toLowerCase(), token: pulito, type: "email" });
    setAttesa(false);
    if (error) {
      setErrore("Codice sbagliato o scaduto. Controlla l'email o chiedine uno nuovo.");
      return;
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Schermata>
        {fase === "email" ? (
          <>
            <Testo variante="titolo">Accedi a Bleo</Testo>
            <Testo attenuato>Ti mando un codice via email. Niente password.</Testo>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="La tua email"
              placeholderTextColor={c.attenuato}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              accessibilityLabel="Email"
              onSubmitEditing={() => void mandaCodice()}
              style={stileCampo}
            />
            <Pulsante titolo="Mandami il codice" caricamento={attesa} onPress={() => void mandaCodice()} />
          </>
        ) : (
          <>
            <Testo variante="titolo">Scrivi il codice</Testo>
            <Testo attenuato>
              L&apos;abbiamo mandato a {email.trim()}. Se non lo trovi, guarda anche nella posta indesiderata.
            </Testo>
            <TextInput
              value={codice}
              onChangeText={setCodice}
              placeholder="12345678"
              placeholderTextColor={c.attenuato}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={10}
              accessibilityLabel="Codice ricevuto per email"
              onSubmitEditing={() => void verifica()}
              style={[stileCampo, { letterSpacing: 6, fontSize: 24, textAlign: "center" }]}
            />
            <Pulsante titolo="Accedi" caricamento={attesa} onPress={() => void verifica()} />
            <Pulsante
              titolo="Cambia email o chiedi un nuovo codice"
              variante="testo"
              onPress={() => {
                setCodice("");
                setFase("email");
              }}
            />
          </>
        )}
        {errore ? (
          <Testo colore={c.pericolo} accessibilityLiveRegion="polite">
            {errore}
          </Testo>
        ) : null}
        <Testo variante="piccolo" attenuato>
          Con l&apos;accesso salviamo la tua email e le domande alla chat, come spiegato nell&apos;informativa sulla privacy.
        </Testo>
        <Pulsante titolo="Informativa sulla privacy" variante="testo" onPress={() => void apriSito("/privacy")} />
      </Schermata>
    </KeyboardAvoidingView>
  );
}
