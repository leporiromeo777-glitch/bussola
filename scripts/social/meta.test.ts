import { describe, expect, it } from "vitest";
import { pubblicaFacebook, pubblicaInstagram, type ConfigMeta } from "./meta";

type Chiamata = { metodo: string; url: string; parametri: Record<string, string> };

/** Una Graph API finta: risponde in base a metodo e percorso, e registra le chiamate. */
function graphFinta(risposte: (c: Chiamata) => unknown) {
  const chiamate: Chiamata[] = [];
  const f = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const metodo = init?.method ?? "GET";
    const parametri = Object.fromEntries(metodo === "GET" ? url.searchParams : new URLSearchParams(String(init?.body)));
    const chiamata = { metodo, url: `${url.origin}${url.pathname}`, parametri };
    chiamate.push(chiamata);
    const corpo = risposte(chiamata);
    return new Response(JSON.stringify(corpo), { status: corpo && typeof corpo === "object" && "error" in corpo ? 400 : 200 });
  }) as typeof fetch;
  const cfg: ConfigMeta = { token: "segreto", versione: "v24.0", fetch: f, attesa: async () => {} };
  return { cfg, chiamate };
}

const IMMAGINI = ["https://img.example/01.jpg", "https://img.example/02.jpg"];

describe("pubblicaInstagram", () => {
  it("crea i contenitori delle immagini, il carosello e lo pubblica quando è pronto", async () => {
    let figlio = 0;
    let controlliCarosello = 0;
    const { cfg, chiamate } = graphFinta((c) => {
      if (c.url.endsWith("/17/media") && c.parametri.is_carousel_item) return { id: `figlio-${++figlio}` };
      if (c.url.endsWith("/17/media")) return { id: "carosello" };
      if (c.url.endsWith("/carosello")) return { status_code: ++controlliCarosello < 2 ? "IN_PROGRESS" : "FINISHED" };
      if (c.metodo === "GET") return { status_code: "FINISHED" };
      if (c.url.endsWith("/17/media_publish")) return { id: "post-ig" };
      throw new Error(`chiamata inattesa ${c.url}`);
    });

    expect(await pubblicaInstagram(cfg, "17", IMMAGINI, "Didascalia")).toBe("post-ig");

    const post = chiamate.filter((c) => c.metodo === "POST");
    expect(post.map((c) => c.url)).toEqual([
      "https://graph.facebook.com/v24.0/17/media",
      "https://graph.facebook.com/v24.0/17/media",
      "https://graph.facebook.com/v24.0/17/media",
      "https://graph.facebook.com/v24.0/17/media_publish",
    ]);
    expect(post[0].parametri).toMatchObject({ image_url: IMMAGINI[0], is_carousel_item: "true", access_token: "segreto" });
    expect(post[2].parametri).toMatchObject({ media_type: "CAROUSEL", children: "figlio-1,figlio-2", caption: "Didascalia" });
    expect(post[3].parametri).toMatchObject({ creation_id: "carosello" });
    expect(controlliCarosello).toBe(2);
  });

  it("si ferma con il messaggio di Meta, senza mostrare il token", async () => {
    const { cfg } = graphFinta(() => ({ error: { message: "Invalid OAuth access token." } }));
    const errore = await pubblicaInstagram(cfg, "17", IMMAGINI, "x").catch((e: Error) => e);
    expect(errore).toBeInstanceOf(Error);
    expect((errore as Error).message).toContain("Invalid OAuth access token.");
    expect((errore as Error).message).not.toContain("segreto");
  });

  it("si ferma se un contenitore va in errore", async () => {
    const { cfg } = graphFinta((c) => (c.metodo === "GET" ? { status_code: "ERROR" } : { id: "x" }));
    await expect(pubblicaInstagram(cfg, "17", IMMAGINI, "x")).rejects.toThrow("stato ERROR");
  });

  it("rifiuta caroselli con meno di 2 o più di 10 immagini", async () => {
    const { cfg } = graphFinta(() => ({ id: "x" }));
    await expect(pubblicaInstagram(cfg, "17", IMMAGINI.slice(0, 1), "x")).rejects.toThrow("da 2 a 10");
  });
});

describe("pubblicaFacebook", () => {
  it("carica le foto non pubblicate e le allega a un solo post", async () => {
    let foto = 0;
    const { cfg, chiamate } = graphFinta((c) => (c.url.endsWith("/photos") ? { id: `foto-${++foto}` } : { id: "pagina_post" }));

    expect(await pubblicaFacebook(cfg, "99", IMMAGINI, "Messaggio")).toBe("pagina_post");

    expect(chiamate.map((c) => c.url)).toEqual([
      "https://graph.facebook.com/v24.0/99/photos",
      "https://graph.facebook.com/v24.0/99/photos",
      "https://graph.facebook.com/v24.0/99/feed",
    ]);
    expect(chiamate[0].parametri).toMatchObject({ url: IMMAGINI[0], published: "false" });
    expect(chiamate[2].parametri).toMatchObject({
      message: "Messaggio",
      "attached_media[0]": '{"media_fbid":"foto-1"}',
      "attached_media[1]": '{"media_fbid":"foto-2"}',
    });
  });
});
