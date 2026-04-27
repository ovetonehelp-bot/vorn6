## What's actually wrong

Two real bugs, not a mixup on your end:

**1. Hero swaps to a product photo.**
In `src/routes/index.tsx` I'm currently passing the first Shopify product image as the hero:
```ts
const heroImage = products[0]?.images[0]?.src;
<Hero image={heroImage} />
```
So on first render you see your uploaded "SET THE TONE" photo (the default in `Hero.tsx`), then once Shopify products load it gets overwritten with a product photo. That's the flicker you're seeing.

**2. Popup never shows up for you.**
`DiscountPopup.tsx` checks `localStorage.getItem("ovetone_discount_popup_v1")` and `..._minimized_v1`. From earlier sessions those keys are already set in your browser, so the popup is permanently suppressed. New visitors would see it, but you won't until those keys are cleared OR the key name changes.

## Fix

**`src/routes/index.tsx`** — always use the uploaded hero, never swap:
- Remove the `heroImage` calculation.
- Render `<Hero />` with no `image` prop so it always uses your uploaded `hero-set-the-tone.png`.

**`src/components/store/DiscountPopup.tsx`** — bump the storage keys so the popup re-appears for everyone (including you), and shorten the show delay so it's obvious:
- `STORAGE_KEY` → `"ovetone_discount_popup_v2"`
- `MINIMIZED_KEY` → `"ovetone_discount_popup_minimized_v2"`
- `SHOW_DELAY_MS` → `2500` (down from 4000)

That's it — two small, targeted edits. No other behavior changes. After this, the hero stays as your courtyard photo permanently, and the popup will pop up ~2.5 s after you load the homepage.
