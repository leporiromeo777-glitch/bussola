import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Errore = { name: string; message: string } | null;

const stato = vi.hoisted(() => ({
  configurato: true,
  deleteUser: null as unknown as ReturnType<typeof vi.fn>,
  /** File nella cartella dell'utente, a pagine. */
  pagine: [] as { name: string }[][],
  erroreElenco: null as Errore,
  erroreRimozione: null as Errore,
  rimossi: [] as string[][],
  bucket: "",
  ordine: [] as string[],
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    stato.configurato
      ? {
          auth: { admin: { deleteUser: stato.deleteUser } },
          storage: {
            from: (bucket: string) => {
              stato.bucket = bucket;
              return {
                list: async () => {
                  stato.ordine.push("list");
                  if (stato.erroreElenco) return { data: null, error: stato.erroreElenco };
                  return { data: stato.pagine.shift() ?? [], error: null };
                },
                remove: async (percorsi: string[]) => {
                  stato.rimossi.push(percorsi);
                  return { data: [], error: stato.erroreRimozione };
                },
              };
            },
          },
        }
      : null,
}));

const { eliminaAccount } = await import("./eliminazione");

const UTENTE = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  stato.configurato = true;
  stato.pagine = [];
  stato.erroreElenco = null;
  stato.erroreRimozione = null;
  stato.rimossi = [];
  stato.ordine = [];
  stato.deleteUser = vi.fn(async () => {
    stato.ordine.push("deleteUser");
    return { data: { user: null }, error: null };
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("eliminaAccount", () => {
  it("cancella davvero l'utente da Supabase Auth (non solo disattivato)", async () => {
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: true });
    expect(stato.deleteUser).toHaveBeenCalledWith(UTENTE, false);
  });

  it("prima cancella i file delle ricevute dell'utente, a gruppi, poi l'utente", async () => {
    stato.pagine = [[{ name: "a.jpg" }, { name: "b.pdf" }], [{ name: "c.txt" }], []];
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: true });
    expect(stato.bucket).toBe("ricevute");
    expect(stato.rimossi).toEqual([[`${UTENTE}/a.jpg`, `${UTENTE}/b.pdf`], [`${UTENTE}/c.txt`]]);
    expect(stato.ordine.at(-1)).toBe("deleteUser");
  });

  it("se i file non si cancellano l'account resta (si riprova)", async () => {
    stato.pagine = [[{ name: "a.jpg" }]];
    stato.erroreRimozione = { name: "StorageApiError", message: "errore" };
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: false, motivo: "errore" });
    expect(stato.deleteUser).not.toHaveBeenCalled();
  });

  it("senza il bucket (migrazione dei conti non eseguita) cancella l'utente lo stesso", async () => {
    stato.erroreElenco = { name: "StorageApiError", message: "Bucket not found" };
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: true });
    expect(stato.deleteUser).toHaveBeenCalled();
  });

  it("senza chiave segreta: non configurato", async () => {
    stato.configurato = false;
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: false, motivo: "non_configurato" });
  });

  it("se Supabase risponde con un errore o non risponde: errore", async () => {
    stato.deleteUser = vi.fn(async () => ({ data: null, error: { status: 500, code: "x", message: "no" } }));
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: false, motivo: "errore" });
    stato.deleteUser = vi.fn(async () => {
      throw new Error("rete");
    });
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: false, motivo: "errore" });
  });
});
