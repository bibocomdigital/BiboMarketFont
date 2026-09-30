const PENDING_CART_KEY = "bibocom-pending-cart";

export type PendingCartItem = {
  productId: number;
  quantity: number;
  name: string;
};

export function rememberPendingCart(item: PendingCartItem) {
  sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(item));
}

export function readPendingCart(): PendingCartItem | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCartItem>;
    if (!parsed || typeof parsed.productId !== "number") return null;
    return {
      productId: parsed.productId,
      quantity: typeof parsed.quantity === "number" && parsed.quantity > 0 ? parsed.quantity : 1,
      name: typeof parsed.name === "string" ? parsed.name : "Produit",
    };
  } catch {
    return null;
  }
}

export function clearPendingCart() {
  sessionStorage.removeItem(PENDING_CART_KEY);
}
