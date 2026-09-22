export type ProductVideoSource =
  | { kind: 'youtube'; src: string }
  | { kind: 'file'; src: string };

/** Transforme une URL YouTube ou un fichier en source lisible par le lecteur. */
export function resolveProductVideo(
  url: string | null | undefined,
): ProductVideoSource | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (match?.[1]) {
    return {
      kind: 'youtube',
      src: `https://www.youtube.com/embed/${match[1]}`,
    };
  }
  return { kind: 'file', src: trimmed };
}
