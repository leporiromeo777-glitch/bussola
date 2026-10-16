import Image from "next/image";
import { Sezione } from "./sezione";

// Foto con licenza Unsplash (uso gratuito), in public/foto. Le persone sono
// modelli delle foto, non utenti di Bleo: le didascalie non lo fanno credere.
const FOTO = [
  {
    src: "/foto/lavoro-portatile.webp",
    w: 1600,
    h: 1066,
    titolo: "Lavori al computer",
    testo: "Grafica, sviluppo, traduzioni, social media: il tuo ufficio è il portatile.",
    alt: "Una giovane donna seduta sul davanzale di una finestra lavora al computer portatile, sorridendo.",
    credito: { nome: "Rodeo Project Management Software", url: "https://unsplash.com/photos/zWQsz8ol8Uo" },
  },
  {
    src: "/foto/bottega.webp",
    w: 1600,
    h: 1167,
    titolo: "Hai un laboratorio",
    testo: "Ceramica, falegnameria, bici, parrucchiere: lavori con le mani e vendi quello che crei.",
    alt: "Una giovane ceramista con il grembiule lavora l'argilla nel suo laboratorio e sorride; intorno vasi e tazze fatti a mano.",
    credito: { nome: "Mina Rad", url: "https://unsplash.com/photos/lz_zy3NEyDI" },
  },
  {
    src: "/foto/cibo.webp",
    w: 1600,
    h: 1066,
    titolo: "Apri un locale",
    testo: "Caffè, take-away, food truck: servono anche le autorizzazioni giuste, e il percorso te le indica.",
    alt: "Un giovane barista con occhiali e grembiule prepara il caffè al bancone di un piccolo locale in legno.",
    credito: { nome: "Brooke Cagle", url: "https://unsplash.com/photos/_rraO9NirHE" },
  },
] as const;

const classeCredito = "underline underline-offset-2 hover:text-foreground";

export function PerChi() {
  return (
    <Sezione
      id="per-chi"
      sopratitolo="Per chi"
      titolo="Qualunque sia la tua idea, i primi passi sono simili"
      introduzione={
        <p>
          AVS da indipendente, registro di commercio, IVA, assicurazioni, prima fattura: Bleo ti mostra quali valgono
          per te.
        </p>
      }
    >
      <ul className="grid gap-6 md:grid-cols-3">
        {FOTO.map((f) => (
          <li key={f.src} className="overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src={f.src}
              width={f.w}
              height={f.h}
              alt={f.alt}
              sizes="(min-width: 768px) 320px, 100vw"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="p-5">
              <h3 className="font-semibold">{f.titolo}</h3>
              <p className="mt-1 text-sm text-muted">{f.testo}</p>
              <p className="mt-3 text-xs text-muted">
                Foto:{" "}
                <a href={f.credito.url} target="_blank" rel="noopener noreferrer" className={classeCredito}>
                  {f.credito.nome}, Unsplash
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <figure className="relative mt-10 overflow-hidden rounded-2xl">
        <Image
          src="/foto/ticino.webp"
          width={1600}
          height={1063}
          alt="Vista dall'alto di Lugano: il lago azzurro, il Monte San Salvatore e la città lungo la riva."
          sizes="(min-width: 1024px) 992px, 100vw"
          className="h-64 w-full object-cover sm:h-80"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-white sm:p-8 sm:pt-20">
          <p className="text-xl font-semibold sm:text-2xl">Pensato per il Ticino e il Grigioni italiano</p>
          <p className="mt-1 max-w-xl text-sm text-white/85">
            Uffici, moduli e regole della Svizzera italiana, in italiano.
          </p>
          <p className="mt-3 text-xs text-white/70">
            Foto:{" "}
            <a
              href="https://unsplash.com/photos/J0kFxRQvFFk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white"
            >
              Antonio Sessa, Unsplash
            </a>
          </p>
        </figcaption>
      </figure>
    </Sezione>
  );
}
