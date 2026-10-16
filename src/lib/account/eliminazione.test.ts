import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const stato = vi.hoisted(() => ({
  configurato: true,
  deleteUser: null as unknown as ReturnType<typeof vi.fn>,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => (stato.configurato ? { auth: { admin: { deleteUser: stato.deleteUser } } } : null),
}));

const { eliminaAccount } = await import("./eliminazione");

const UTENTE = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  stato.configurato = true;
  stato.deleteUser = vi.fn(async () => ({ data: { user: null }, error: null }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("eliminaAccount", () => {
  it("cancella davvero l'utente da Supabase Auth (non solo disattivato)", async () => {
    expect(await eliminaAccount(UTENTE)).toEqual({ ok: true });
    expect(stato.deleteUser).toHaveBeenCalledWith(UTENTE, false);
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
