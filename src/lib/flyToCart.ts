/**
 * Animate a clone of `sourceEl`'s image flying into the cart icon
 * (an element with [data-cart-icon]). Triggers a `cart:shake` event
 * when the clone arrives so the cart icon can shake.
 */
export function flyToCart(sourceEl: HTMLElement, imageUrl: string, onArrive?: () => void) {
  if (typeof window === "undefined") {
    onArrive?.();
    return;
  }
  const cartIcon = document.querySelector<HTMLElement>("[data-cart-icon]");
  if (!cartIcon) {
    onArrive?.();
    return;
  }
  const srcRect = sourceEl.getBoundingClientRect();
  const dstRect = cartIcon.getBoundingClientRect();

  const size = 64;
  const startX = srcRect.left + srcRect.width / 2 - size / 2;
  const startY = srcRect.top + srcRect.height / 2 - size / 2;
  const endX = dstRect.left + dstRect.width / 2 - size / 2;
  const endY = dstRect.top + dstRect.height / 2 - size / 2;

  const clone = document.createElement("div");
  clone.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    width: ${size}px;
    height: ${size}px;
    border-radius: 8px;
    background: url("${imageUrl}") center/cover no-repeat #eee;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    z-index: 100;
    pointer-events: none;
    will-change: transform, opacity;
    transition: transform 0.45s cubic-bezier(0.55, -0.2, 0.4, 1.1), opacity 0.45s ease-in;
  `;
  document.body.appendChild(clone);

  // force reflow
  void clone.offsetWidth;

  const dx = endX - startX;
  const dy = endY - startY;
  clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
  clone.style.opacity = "0.4";

  const cleanup = () => {
    clone.remove();
    window.dispatchEvent(new CustomEvent("cart:shake"));
    onArrive?.();
  };
  clone.addEventListener("transitionend", cleanup, { once: true });
  // safety timeout
  window.setTimeout(cleanup, 700);
}