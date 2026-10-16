"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CLASSE =
  "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 font-medium text-muted hover:text-foreground";

/**
 * «Accedi» nel menu, oppure «Account» se hai già fatto l'accesso. La sessione
 * si legge nel browser: l'header resta statico e uguale per tutti.
 */
export function LinkAccesso() {
  const [collegato, setCollegato] = useState(false);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    let attivo = true;
    void client.auth.getSession().then(({ data }) => {
      if (attivo) setCollegato(Boolean(data.session));
    });
    const { data } = client.auth.onAuthStateChange((_evento, sessione) => setCollegato(Boolean(sessione)));
    return () => {
      attivo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return collegato ? (
    <Link href="/account" className={CLASSE}>
      Account
    </Link>
  ) : (
    <Link href="/accedi" className={CLASSE}>
      Accedi
    </Link>
  );
}
