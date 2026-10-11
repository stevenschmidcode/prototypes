import Image from "next/image";
import { CategoryArt } from "@/components/place/category-art";
import type { ImageInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  image: ImageInfo | null;
  category: string;
  sizes: string;
  /** Bild vorab laden (LCP, z. B. oberstes Bild der Seite) */
  preload?: boolean;
  className?: string;
  /** Alternativtext für den Platzhalter */
  fallbackLabel?: string;
};

/** Foto eines Ortes oder – falls keines vorhanden – die Platzhalter-Grafik der Kategorie. */
export function PlaceImage({ image, category, sizes, preload, className, fallbackLabel }: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-sand", className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <CategoryArt category={category} label={fallbackLabel} />
      )}
    </div>
  );
}
