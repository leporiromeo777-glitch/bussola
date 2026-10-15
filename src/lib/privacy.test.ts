import { describe, expect, it } from "vitest";
import {
  contieneSegnaposto,
  ELENCO_DPF,
  fornitoreHosting,
  GARANZIE_USA,
  informativaDa,
  luogoDatabase,
} from "./privacy";

const titolareCompleto = { nome: "Maria Rossi", indirizzo: "Via Nassa 1, 6900 Lugano", email: "ciao@esempio.ch" };

describe("luogoDatabase", () => {
  it("indica la Svizzera per la regione di Zurigo", () => {
    expect(luogoDatabase("svizzera")).toBe("in Svizzera (Zurigo)");
    expect(luogoDatabase(" Svizzera ")).toBe("in Svizzera (Zurigo)");
  });

  it("indica l'Unione europea per la regione di Francoforte", () => {
    expect(luogoDatabase("ue")).toBe("nell'Unione europea (Francoforte, Germania)");
  });

  it("senza un valore valido lascia la parte da completare", () => {
    for (const valore of [undefined, "", "zurigo"]) {
      expect(luogoDatabase(valore)).toContain("[da indicare prima del lancio]");
    }
  });
});

describe("contieneSegnaposto", () => {
  it("riconosce le parti tra parentesi quadre", () => {
    expect(contieneSegnaposto("Netlify [da indicare prima del lancio]")).toBe(true);
    expect(contieneSegnaposto("[email di contatto]")).toBe(true);
    expect(contieneSegnaposto("Vercel Inc. (USA)")).toBe(false);
    expect(contieneSegnaposto("vuote []")).toBe(false);
  });
});

describe("fornitoreHosting", () => {
  it("nomina il fornitore e la sua garanzia per gli USA", () => {
    expect(fornitoreHosting("vercel")).toEqual({ nome: "Vercel Inc. (USA)", garanzia: GARANZIE_USA.vercel });
    expect(fornitoreHosting("netlify").nome).toBe("Netlify, Inc. (USA)");
  });

  it("senza fornitore lascia la parte da completare", () => {
    expect(contieneSegnaposto(fornitoreHosting(undefined).nome)).toBe(true);
    expect(fornitoreHosting("").garanzia).toBeNull();
  });
});

describe("GARANZIE_USA", () => {
  it("indica per ogni fornitore la certificazione DPF o le clausole standard", () => {
    for (const garanzia of Object.values(GARANZIE_USA)) {
      expect(garanzia).toMatch(/Swiss-U\.S\. Data Privacy Framework|clausole contrattuali standard \(art\. 16 cpv\. 2 lett\. d LPD\)/);
    }
    expect(ELENCO_DPF.url).toMatch(/^https:\/\//);
    expect(ELENCO_DPF.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("informativaDa", () => {
  it("è incompleta finché resta una parte tra parentesi quadre", () => {
    const informativa = informativaDa({ regioneDati: "svizzera", hosting: "vercel", titolare: titolareCompleto });
    // Le clausole standard e la durata dei log vanno ancora confermate a mano.
    expect(informativa.incompleta).toBe(true);
    expect(informativa.daCompletare).toContain("durata dei dati tecnici");
    expect(informativa.daCompletare).toContain("garanzia per gli USA di anthropic");
    expect(informativa.daCompletare).not.toContain("fornitore di hosting");
    expect(informativa.daCompletare).not.toContain("dati del titolare");
  });

  it("segnala titolare, regione e hosting mancanti", () => {
    const informativa = informativaDa({
      regioneDati: undefined,
      hosting: undefined,
      titolare: { ...titolareCompleto, email: "[email di contatto]" },
    });
    expect(informativa.daCompletare).toEqual(
      expect.arrayContaining([
        "dati del titolare",
        "luogo del database (NEXT_PUBLIC_SUPABASE_REGIONE_DATI)",
        "fornitore di hosting",
      ]),
    );
  });
});
