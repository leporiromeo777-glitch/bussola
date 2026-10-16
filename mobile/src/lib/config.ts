import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { sitoUrl?: string };

/** Il sito di Bleo: la chat e le pagine legali stanno lì. */
export const SITO_URL = (process.env.EXPO_PUBLIC_SITO_URL || extra.sitoUrl || "https://bussola-ticino.netlify.app").replace(
  /\/+$/,
  "",
);

/** Supabase per l'accesso (chiave pubblicabile: può stare nell'app). Vuote = versione di prova senza accesso. */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || "";
export const SUPABASE_CHIAVE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

export const VERSIONE_APP = Constants.expoConfig?.version ?? "0.1.0";
