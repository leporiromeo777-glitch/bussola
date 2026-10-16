import { useId } from "react";
import { descriviVestito, type Vestito, VESTITO_PREDEFINITO } from "@/lib/mascotte/vestito";

const COLORI = {
  inchiostro: "#15171a",
  pelle: "#ffffff",
  ombraPelle: "#e7e2d8",
  pancia: "#f3ead9",
  contorno: "#d8d0c2",
  cuoio: "#9a7552",
  cuoioScuro: "#7a5a3d",
  teal: "#0f5e6b",
  quadrante: "#f6f0e3",
  ago: "#e0533f",
} as const;

const CAPPELLINI = { "cappellino-nero": "#1f2124", "cappellino-beige": "#cdb89a" } as const;
const BERRETTI = { "berretto-ruggine": "#b4542f", "berretto-blu": "#26324d" } as const;
const SCIARPE = { verde: "#7f9469", beige: "#d6c09d" } as const;

/**
 * La mascotte disegnata (versione vettoriale delle immagini 3D), con gli
 * accessori scelti. Con `bussolina` mostra anche il piccolo amico a forma di
 * bussola.
 */
export function MascotteSvg({
  vestito = VESTITO_PREDEFINITO,
  bussolina = true,
  className,
}: {
  vestito?: Vestito;
  bussolina?: boolean;
  className?: string;
}) {
  const id = useId();
  const pelle = `${id}-pelle`;
  const etichetta = `Il tuo compagno di viaggio ${descriviVestito(vestito)}${bussolina ? ", con la bussolina accanto" : ""}`;

  return (
    <svg viewBox="0 0 230 260" role="img" aria-label={etichetta} className={className}>
      <defs>
        <radialGradient id={pelle} cx="0.38" cy="0.3" r="0.75">
          <stop offset="0" stopColor={COLORI.pelle} />
          <stop offset="1" stopColor={COLORI.ombraPelle} />
        </radialGradient>
      </defs>

      {/* ombra a terra */}
      <ellipse cx="118" cy="240" rx="92" ry="9" fill={COLORI.inchiostro} opacity="0.07" />

      {/* corpo */}
      <g fill={`url(#${pelle})`} stroke={COLORI.contorno} strokeWidth="1.5">
        <ellipse cx="66" cy="168" rx="12" ry="23" transform="rotate(18 66 168)" />
        <ellipse cx="156" cy="132" rx="11" ry="23" transform="rotate(-38 156 132)" />
        <ellipse cx="86" cy="226" rx="17" ry="13" />
        <ellipse cx="120" cy="226" rx="17" ry="13" />
        <ellipse cx="103" cy="176" rx="40" ry="48" />
      </g>
      <ellipse cx="103" cy="184" rx="25" ry="29" fill={COLORI.pancia} />

      {/* sciarpa (sotto la testa) */}
      {vestito.sciarpa !== "nessuna" ? <SciarpaSvg colore={SCIARPE[vestito.sciarpa]} /> : null}

      {/* borsa a tracolla */}
      <path d="M134 136 L76 196" stroke={COLORI.cuoioScuro} strokeWidth="5" strokeLinecap="round" />
      <rect x="56" y="186" width="32" height="25" rx="7" fill={COLORI.cuoio} />
      <path d="M56 194 Q72 202 88 194 L88 192 Q88 186 81 186 L63 186 Q56 186 56 192 Z" fill={COLORI.cuoioScuro} />
      <circle cx="72" cy="199" r="2.2" fill={COLORI.quadrante} />

      {/* testa */}
      <circle cx="103" cy="84" r="60" fill={`url(#${pelle})`} stroke={COLORI.contorno} strokeWidth="1.5" />

      {/* occhi e sorriso */}
      <ellipse cx="83" cy="90" rx="7" ry="9.5" fill={COLORI.inchiostro} />
      <ellipse cx="123" cy="90" rx="7" ry="9.5" fill={COLORI.inchiostro} />
      <circle cx="85.5" cy="86" r="2.3" fill="#fff" />
      <circle cx="125.5" cy="86" r="2.3" fill="#fff" />
      <path d="M95 106 Q103 113 111 106" stroke={COLORI.inchiostro} strokeWidth="3" fill="none" strokeLinecap="round" />

      {vestito.occhiali !== "nessuno" ? <OcchialiSvg tipo={vestito.occhiali} /> : null}
      {vestito.cappello !== "nessuno" ? <CappelloSvg tipo={vestito.cappello} /> : null}

      {bussolina ? <BussolinaSvg /> : null}
    </svg>
  );
}

function CappelloSvg({ tipo }: { tipo: Exclude<Vestito["cappello"], "nessuno"> }) {
  if (tipo === "pescatore") {
    return (
      <g>
        <path d="M54 62 Q55 20 103 18 Q151 20 152 62 Z" fill="#7d8f68" />
        <ellipse cx="103" cy="62" rx="68" ry="12" fill="#6c7d58" />
        <path d="M56 54 Q103 62 150 54" stroke="#5e6e4c" strokeWidth="2" fill="none" />
      </g>
    );
  }
  if (tipo === "berretto-ruggine" || tipo === "berretto-blu") {
    const colore = BERRETTI[tipo];
    return (
      <g>
        <path d="M44 74 Q44 18 103 16 Q162 18 162 74 Z" fill={colore} />
        {[64, 80, 96, 112, 128, 144].map((x) => (
          <path key={x} d={`M${x} 26 L${x} 58`} stroke="#000" strokeOpacity="0.12" strokeWidth="2" />
        ))}
        <rect x="40" y="56" width="126" height="22" rx="11" fill={colore} />
        <rect x="40" y="56" width="126" height="22" rx="11" fill="#000" opacity="0.1" />
      </g>
    );
  }
  const colore = CAPPELLINI[tipo];
  const alContrario = tipo === "cappellino-nero";
  return (
    <g>
      <path d="M44 72 A59 56 0 0 1 162 72 Z" fill={colore} />
      <circle cx="103" cy="20" r="4" fill={colore} />
      {alContrario ? (
        <>
          <path d="M48 66 Q22 70 14 82 Q36 84 52 76 Z" fill={colore} />
          <rect x="88" y="60" width="30" height="8" rx="4" fill="#000" opacity="0.25" />
        </>
      ) : (
        <path d="M158 66 Q186 68 196 80 Q172 84 154 76 Z" fill={colore} />
      )}
    </g>
  );
}

function OcchialiSvg({ tipo }: { tipo: Exclude<Vestito["occhiali"], "nessuno"> }) {
  if (tipo === "sole") {
    return (
      <g fill={COLORI.inchiostro}>
        <rect x="64" y="78" width="36" height="24" rx="11" />
        <rect x="106" y="78" width="36" height="24" rx="11" />
        <path d="M100 86 L106 86" stroke={COLORI.inchiostro} strokeWidth="4" />
        <path d="M64 84 L46 80 M142 84 L160 80" stroke={COLORI.inchiostro} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M70 84 Q76 80 82 82" stroke="#fff" strokeOpacity="0.35" strokeWidth="2.5" fill="none" />
      </g>
    );
  }
  const tondi = tipo === "tondi";
  const montatura = tondi ? "#b8954d" : "#6b4428";
  return (
    <g>
      <circle cx="83" cy="90" r="16" fill={tondi ? "#c98b2e" : "#fff"} fillOpacity={tondi ? 0.55 : 0.12} stroke={montatura} strokeWidth="3" />
      <circle cx="123" cy="90" r="16" fill={tondi ? "#c98b2e" : "#fff"} fillOpacity={tondi ? 0.55 : 0.12} stroke={montatura} strokeWidth="3" />
      <path d="M99 88 Q103 85 107 88" stroke={montatura} strokeWidth="3" fill="none" />
      <path d="M67 88 L46 84 M139 88 L160 84" stroke={montatura} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function SciarpaSvg({ colore }: { colore: string }) {
  return (
    <g>
      <rect x="62" y="132" width="82" height="20" rx="10" fill={colore} />
      <rect x="114" y="140" width="18" height="44" rx="7" fill={colore} />
      <rect x="114" y="140" width="18" height="44" rx="7" fill="#000" opacity="0.08" />
      {[117, 122, 127].map((x) => (
        <path key={x} d={`M${x} 184 L${x} 191`} stroke={colore} strokeWidth="3" strokeLinecap="round" />
      ))}
      <path d="M72 138 L72 146 M84 137 L84 147 M96 137 L96 147" stroke="#000" strokeOpacity="0.1" strokeWidth="2" />
    </g>
  );
}

function BussolinaSvg() {
  return (
    <g transform="translate(184 196)">
      <ellipse cx="-12" cy="34" rx="7" ry="5" fill={COLORI.pelle} stroke={COLORI.ombraPelle} />
      <ellipse cx="12" cy="34" rx="7" ry="5" fill={COLORI.pelle} stroke={COLORI.ombraPelle} />
      <ellipse cx="-29" cy="4" rx="5" ry="9" transform="rotate(25 -29 4)" fill={COLORI.pelle} stroke={COLORI.ombraPelle} />
      <ellipse cx="29" cy="-6" rx="5" ry="9" transform="rotate(-35 29 -6)" fill={COLORI.pelle} stroke={COLORI.ombraPelle} />
      <path d="M-4 -26 L0 -46 L4 -26 Z" fill={COLORI.ago} />
      <circle cx="0" cy="-27" r="4" fill={COLORI.teal} />
      <circle cx="0" cy="0" r="27" fill={COLORI.teal} />
      <circle cx="0" cy="0" r="20" fill={COLORI.quadrante} />
      <ellipse cx="-7" cy="-1" rx="3.2" ry="4.2" fill={COLORI.inchiostro} />
      <ellipse cx="7" cy="-1" rx="3.2" ry="4.2" fill={COLORI.inchiostro} />
      <path d="M-4 7 Q0 10 4 7" stroke={COLORI.inchiostro} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M0 -17 L0 -14 M0 14 L0 17 M-17 0 L-14 0 M14 0 L17 0" stroke={COLORI.teal} strokeWidth="2" />
    </g>
  );
}
