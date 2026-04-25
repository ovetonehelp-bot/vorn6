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
        width={40}
        height={40}
        className="h-9 w-9 object-contain"
        style={invert ? { filter: "invert(1)" } : undefined}
      />
      {variant === "lockup" && (
        <span
          className="font-display tracking-brand-wide font-extrabold text-base"
          style={{ color: invert ? "var(--paper)" : "var(--ink)" }}
        >
          OVETONE
        </span>
      )}
    </span>
  );
}