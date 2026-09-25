"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { resolveProductVideo } from "@/lib/product-video";

type Props = {
  title?: string;
  url: string;
  onClose: () => void;
};

/** Mini-lecteur flottant, lecture automatique, bouton fermer. */
export default function ProductMiniPlayer({ title, url, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const source = resolveProductVideo(url, { autoplay: true });

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const play = node.play();
    if (play) {
      play.catch(() => {
        /* le navigateur peut exiger un second geste */
      });
    }
  }, [url]);

  if (!source) return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[70] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl bg-black shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-2 bg-black/80 px-2 py-1.5">
        <p className="min-w-0 truncate text-xs text-white">{title || "Vidéo du produit"}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-white/15 p-1 text-white hover:bg-white/30"
          aria-label="Fermer la vidéo"
        >
          <X size={14} />
        </button>
      </div>
      <div className="relative aspect-video bg-black">
        {source.kind === "youtube" ? (
          <iframe
            src={source.src}
            title={title || "Vidéo du produit"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={source.src}
            controls
            autoPlay
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-contain"
          >
            Votre navigateur ne peut pas lire cette vidéo.
          </video>
        )}
      </div>
    </div>
  );
}
