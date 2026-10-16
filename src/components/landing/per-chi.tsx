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

// Esempi di attività (le categorie del questionario), sparsi come pillole.
const ATTIVITA = [
  { nome: "Grafica", ruota: -6 },
  { nome: "Fotografia", ruota: 4 },
  { nome: "Lezioni private", ruota: -3 },
  { nome: "Imbianchino", ruota: 7 },
  { nome: "Corriere", ruota: -8 },
  { nome: "Negozio online", ruota: 3 },
  { nome: "Bar e caffè", ruota: -4 },
  { nome: "Personal trainer", ruota: 6 },
  { nome: "Parrucchiera", ruota: -5 },
  { nome: "Traduzioni", ruota: 5 },
  { nome: "Falegname", ruota: -2 },
  { nome: "Social media", ruota: 8 },
] as const;

export function PerChi() {
  return (
    <Sezione
      id="per-chi"
      sopratitolo="Per chi"
      titolo="Funziona per la tua idea"
      introduzione={
        <p>
          Qualunque sia la tua idea, i primi passi sono simili: AVS da indipendente, registro di commercio, IVA,
          assicurazioni, prima fattura. Bleo ti mostra quali valgono per te.
        </p>
      }
    >
      <ul aria-label="Alcuni esempi di attività" className="mx-auto mb-14 flex max-w-3xl flex-wrap justify-center gap-3">
        {ATTIVITA.map((a, i) => (
          <li
            key={a.nome}
            style={{ transform: `rotate(${a.ruota}deg)` }}
            className={`rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm sm:text-base ${
              i % 3 === 0 ? "text-brand" : i % 3 === 1 ? "text-accent" : "text-foreground"
            }`}
          >
            {a.nome}
          </li>
        ))}
      </ul>
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
