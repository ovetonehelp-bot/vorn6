const messages = [
  "FREE SHIPPING ON U.S. ORDERS OVER $100",
  "001 GIVEAWAY: 1 PIECE = 1 ENTRY",
  "DROP 001 — LIMITED QUANTITIES, NO RESTOCKS",
];

export function Announcement() {
  // Duplicate for seamless marquee
  const loop = [...messages, ...messages, ...messages, ...messages];
  return (
    <div className="bg-foreground text-background overflow-hidden">
      <div className="flex whitespace-nowrap py-2.5 animate-marquee">
        {loop.map((m, i) => (
          <span
            key={i}
            className="mx-8 text-[11px] tracking-brand-wide font-medium uppercase shrink-0"
          >
            {m}
            <span className="ml-8 opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}