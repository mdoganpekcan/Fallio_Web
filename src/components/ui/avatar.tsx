import { clsx } from "clsx";
import Image from "next/image";

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const placeholder = name?.charAt(0)?.toUpperCase() ?? "F";
  return (
    <div
      className={clsx(
        "relative flex items-center justify-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-sm font-semibold text-white",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "avatar"}
          fill
          className="object-cover"
          sizes={`${size}px`}
          unoptimized
        />
      ) : (
        <span>{placeholder}</span>
      )}
    </div>
  );
}
