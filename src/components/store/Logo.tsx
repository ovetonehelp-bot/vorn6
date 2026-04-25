import logo from "@/assets/ovetone-crown.png";

type Props = {
  variant?: "mark" | "lockup" | "wordmark";
  className?: string;
  invert?: boolean;
};

export function Logo({ variant = "mark", className = "", invert = false }: Props) {
  if (variant === "wordmark") {
    return (
      <span
        className={`font-display tracking-brand-wide font-extrabold ${className}`}
        style={{ color: invert ? "var(--paper)" : "var(--ink)" }}
      >
        OVETONE
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={logo}
        alt="Ovetone"
        width={96}
        height={96}
        className="h-16 w-16 md:h-20 md:w-20 object-contain"
        style={invert ? { filter: "invert(1)" } : undefined}
      />
      {variant === "lockup" && (
        <span
          className="font-display tracking-brand-wide font-extrabold text-lg"
          style={{ color: invert ? "var(--paper)" : "var(--ink)" }}
        >
          OVETONE
        </span>
      )}
    </span>
  );
}