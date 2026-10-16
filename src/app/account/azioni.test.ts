import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const stato = vi.hoisted(() => ({
  collegamento: null as unknown,
  esito: { ok: true } as unknown,
  eliminati: [] as string[],
  signOut: vi.fn<(opzioni: unknown) => Promise<{ error: null }>>(async () => ({ error: null })),
  redirect: vi.fn<(destinazione: string) => void>(),
}));
vi.mock("next/navigation", () => ({ redirect: stato.redirect }));
vi.mock("@/lib/percorso/account", () => ({ utenteCollegato: async () => stato.collegamento }));
vi.mock("@/lib/account/eliminazione", () => ({
  eliminaAccount: async (id: string) => {
    stato.eliminati.push(id);
    return stato.esito;
  },
}));

const { eliminaIlMioAccount } = await import("./azioni");
const { MESSAGGI_ACCOUNT } = await import("@/lib/account/esiti");

const UTENTE = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  stato.signOut.mockClear();
  stato.redirect.mockClear();
  stato.eliminati = [];
  stato.esito = { ok: true };
  stato.collegamento = { ok: true, supabase: { auth: { signOut: stato.signOut } }, userId: UTENTE, email: null };
});

describe("eliminaIlMioAccount", () => {
  it("elimina l'account, chiude la sessione nel browser e torna alla pagina iniziale", async () => {
    await eliminaIlMioAccount();
    expect(stato.eliminati).toEqual([UTENTE]);
    expect(stato.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(stato.redirect).toHaveBeenCalledWith("/");
  });

  it("se l'eliminazione non riesce resta collegato e lo dice", async () => {
    stato.esito = { ok: false, motivo: "errore" };
    expect(await eliminaIlMioAccount()).toEqual({
      stato: "errore",
      messaggio: MESSAGGI_ACCOUNT.errore,
    });
    expect(stato.signOut).not.toHaveBeenCalled();
    expect(stato.redirect).not.toHaveBeenCalled();
  });

  it("senza accesso o in modalità demo non elimina nulla", async () => {
    stato.collegamento = { ok: false, motivo: "non_collegato" };
    expect(await eliminaIlMioAccount()).toEqual({
      stato: "errore",
      messaggio: MESSAGGI_ACCOUNT.nonCollegato,
    });
    stato.collegamento = { ok: false, motivo: "non_configurato" };
    expect(await eliminaIlMioAccount()).toEqual({
      stato: "errore",
      messaggio: MESSAGGI_ACCOUNT.nonConfigurato,
    });
    expect(stato.eliminati).toEqual([]);
  });
});
