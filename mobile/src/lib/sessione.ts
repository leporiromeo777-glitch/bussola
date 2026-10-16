import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";

/** La sessione di accesso. `pronta` diventa true dopo la prima lettura dal telefono. */
export function useSessione(): { pronta: boolean; sessione: Session | null } {
  const [stato, setStato] = useState<{ pronta: boolean; sessione: Session | null }>({
    pronta: supabase() === null,
    sessione: null,
  });

  useEffect(() => {
    const client = supabase();
    if (!client) return;
    let attivo = true;
    void client.auth.getSession().then(({ data }) => {
      if (attivo) setStato({ pronta: true, sessione: data.session });
    });
    const { data } = client.auth.onAuthStateChange((_evento, sessione) => {
      if (attivo) setStato({ pronta: true, sessione });
    });
    // Rinnova il token solo con l'app aperta (consiglio di Supabase per React Native).
    const iscrizione = AppState.addEventListener("change", (s) => {
      if (s === "active") void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    });
    return () => {
      attivo = false;
      data.subscription.unsubscribe();
      iscrizione.remove();
    };
  }, []);

  return stato;
}
