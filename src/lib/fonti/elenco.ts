import { z } from "zod";

/** Una voce di `supabase/fonti/elenco.json`: una pagina ufficiale della base di fonti. */
export const schemaFonte = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "L'id usa solo minuscole, cifre e trattini (es. 'ahv-2-02-indipendenti')."),
    url: z.url({ protocol: /^https$/, error: "L'URL deve essere completo e iniziare con https://." }),
    titolo: z.string().trim().min(3),
    ente: z.string().trim().min(2),
    livello: z.enum(["federale", "cantonale", "comunale", "altro"]),
    cantone: z.enum(["TI", "GR"]).nullable(),
    argomenti: z.array(z.string().trim().min(2)).default([]),
    verificato_il: z.iso.date({ error: "verificato_il deve essere una data AAAA-MM-GG." }),
    verificato_da: z.string().trim().min(2),
    /** Facoltativo: false per togliere la fonte dalla chat senza cancellarla. */
    attiva: z.boolean().default(true),
  })
  .strict()
  .refine((f) => (f.livello === "federale" ? f.cantone === null : true), {
    message: "Una fonte federale non ha cantone (usa null).",
    path: ["cantone"],
  });

export type FonteElenco = z.infer<typeof schemaFonte>;

export const schemaElenco = z.array(schemaFonte).superRefine((fonti, ctx) => {
  const visti = new Map<string, number>();
  fonti.forEach((fonte, i) => {
    for (const chiave of [`id:${fonte.id}`, `url:${fonte.url}`]) {
      const precedente = visti.get(chiave);
      if (precedente !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Doppione (${chiave}) con la voce ${precedente + 1}.`,
          path: [i],
        });
      }
      visti.set(chiave, i);
    }
  });
});

/** Valida il contenuto di elenco.json; in caso di errore restituisce messaggi leggibili. */
export function leggiElenco(json: unknown): { ok: true; fonti: FonteElenco[] } | { ok: false; errori: string[] } {
  const esito = schemaElenco.safeParse(json);
  if (esito.success) return { ok: true, fonti: esito.data };
  return {
    ok: false,
    errori: esito.error.issues.map((issue) => `${issue.path.join(".") || "(radice)"}: ${issue.message}`),
  };
}
