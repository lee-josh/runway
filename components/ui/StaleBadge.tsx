export default function StaleBadge() {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        background: "rgba(148,103,189,0.15)",
        color: "#c084fc",
        border: "1px solid rgba(148,103,189,0.3)",
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
        whiteSpace: "nowrap",
      }}
    >
      ⏸ Stale
    </span>
  );
}
