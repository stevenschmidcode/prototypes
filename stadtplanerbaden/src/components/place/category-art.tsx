import { cn } from "@/lib/utils";

/**
 * Neutrale, hochwertige Platzhalter-Grafik im Bauhaus-Stil – wird verwendet,
 * wenn für einen Ort kein lizenzfreies Foto vorliegt. Jede Kategorie hat eine
 * eigene Komposition aus Grundformen in den Markenfarben.
 */
const COMPOSITIONS: Record<string, { bg: string; shapes: React.ReactNode }> = {
  entdecken: {
    bg: "#E8E1D5",
    shapes: (
      <>
        <rect x="0" y="210" width="400" height="90" fill="#303E34" />
        <path d="M60 210 L140 110 L220 210 Z" fill="#B96D52" />
        <rect x="230" y="120" width="60" height="90" fill="#F8F7F3" />
        <circle cx="320" cy="70" r="28" fill="#B96D52" opacity="0.85" />
      </>
    ),
  },
  "essen-trinken": {
    bg: "#F1EDE5",
    shapes: (
      <>
        <circle cx="200" cy="160" r="96" fill="#E8E1D5" />
        <circle cx="200" cy="160" r="60" fill="#F8F7F3" />
        <rect x="70" y="70" width="14" height="180" rx="7" fill="#303E34" />
        <rect x="316" y="70" width="14" height="180" rx="7" fill="#303E34" />
        <circle cx="200" cy="160" r="18" fill="#B96D52" />
      </>
    ),
  },
  wellness: {
    bg: "#303E34",
    shapes: (
      <>
        <circle cx="200" cy="300" r="170" fill="#3d4d41" />
        <path d="M0 200 Q100 160 200 200 T400 200 V300 H0 Z" fill="#B96D52" opacity="0.9" />
        <path d="M0 240 Q100 200 200 240 T400 240 V300 H0 Z" fill="#E8E1D5" />
        <circle cx="300" cy="80" r="30" fill="#F8F7F3" />
      </>
    ),
  },
  kultur: {
    bg: "#F8F7F3",
    shapes: (
      <>
        <rect x="60" y="80" width="280" height="24" fill="#303E34" />
        {[90, 150, 210, 270].map((x) => (
          <rect key={x} x={x} y="110" width="30" height="130" fill="#E8E1D5" />
        ))}
        <rect x="50" y="240" width="300" height="22" fill="#303E34" />
        <circle cx="200" cy="50" r="22" fill="#B96D52" />
      </>
    ),
  },
  natur: {
    bg: "#E3E8E2",
    shapes: (
      <>
        <path d="M-20 300 L120 120 L260 300 Z" fill="#303E34" />
        <path d="M150 300 L280 150 L420 300 Z" fill="#4a5d4f" />
        <circle cx="90" cy="70" r="34" fill="#B96D52" />
        <rect x="0" y="270" width="400" height="30" fill="#E8E1D5" />
      </>
    ),
  },
  shopping: {
    bg: "#E8E1D5",
    shapes: (
      <>
        <rect x="120" y="110" width="160" height="150" fill="#B96D52" />
        <path d="M160 110 V85 a40 40 0 0 1 80 0 V110" stroke="#303E34" strokeWidth="14" fill="none" />
        <circle cx="330" cy="220" r="40" fill="#303E34" />
        <rect x="40" y="60" width="50" height="50" fill="#F8F7F3" />
      </>
    ),
  },
  veranstaltungen: {
    bg: "#B96D52",
    shapes: (
      <>
        <circle cx="130" cy="150" r="80" fill="#E8E1D5" />
        <circle cx="270" cy="150" r="80" fill="#303E34" opacity="0.92" />
        <rect x="185" y="40" width="30" height="220" fill="#F8F7F3" opacity="0.9" />
      </>
    ),
  },
  unterkunft: {
    bg: "#E8E1D5",
    shapes: (
      <>
        <rect x="110" y="90" width="180" height="180" fill="#303E34" />
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect key={`${row}-${col}`} x={135 + col * 50} y={115 + row * 50} width="30" height="30" fill={row === 1 && col === 1 ? "#B96D52" : "#F8F7F3"} />
          )),
        )}
        <rect x="0" y="270" width="400" height="30" fill="#F1EDE5" />
      </>
    ),
  },
};

export function CategoryArt({ category, className, label }: { category: string; className?: string; label?: string }) {
  const composition = COMPOSITIONS[category] ?? COMPOSITIONS.entdecken;
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={cn("size-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width="400" height="300" fill={composition.bg} />
      {composition.shapes}
    </svg>
  );
}
