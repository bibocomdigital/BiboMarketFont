function visibleCartTarget(): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-cart-target]");
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

/** Fait voler une pastille depuis le bouton jusqu’à l’icône panier. */
export function flyToCart(origin?: Element | null, imageUrl?: string | null) {
  const target = visibleCartTarget();
  if (!target || typeof document === "undefined") return;

  const from = origin?.getBoundingClientRect() ?? {
    left: window.innerWidth / 2 - 22,
    top: window.innerHeight * 0.55,
    width: 44,
    height: 44,
  };
  const to = target.getBoundingClientRect();
  const startX = from.left + from.width / 2 - 22;
  const startY = from.top + from.height / 2 - 22;
  const endX = to.left + to.width / 2 - 22;
  const endY = to.top + to.height / 2 - 22;
  const dx = endX - startX;
  const dy = endY - startY;

  const flyer = document.createElement("div");
  flyer.setAttribute("aria-hidden", "true");
  flyer.style.position = "fixed";
  flyer.style.left = `${startX}px`;
  flyer.style.top = `${startY}px`;
  flyer.style.width = "44px";
  flyer.style.height = "44px";
  flyer.style.borderRadius = "999px";
  flyer.style.zIndex = "80";
  flyer.style.pointerEvents = "none";
  flyer.style.background = imageUrl ? `center / cover no-repeat url("${imageUrl}")` : "#FF7E5F";
  flyer.style.boxShadow = "0 10px 24px rgba(10, 37, 64, 0.28)";
  flyer.style.border = "2px solid white";
  document.body.appendChild(flyer);

  const motion = flyer.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.55}px, ${Math.min(dy * 0.2, -28) - 90}px) scale(0.85)`, opacity: 1, offset: 0.42 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.15, offset: 1 },
    ],
    { duration: 720, easing: "cubic-bezier(0.22, 0.7, 0.25, 1)", fill: "forwards" },
  );

  motion.onfinish = () => {
    flyer.remove();
    target.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.28)" },
        { transform: "scale(1)" },
      ],
      { duration: 320, easing: "ease-out" },
    );
  };
}
