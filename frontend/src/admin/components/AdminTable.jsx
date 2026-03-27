import { motion } from "framer-motion";
import { tokens } from "../styles/tokens";

export function StatusBadge({ status }) {
  const map = {
    AVAILABLE:   { bg: "rgba(34,212,126,0.12)", color: "#22d47e" },
    RESERVED:    { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
    SOLD_OUT:    { bg: "rgba(124,136,163,0.12)", color: "#7c88a3" },
    REMOVED:     { bg: "rgba(255,77,109,0.12)",  color: "#ff4d6d" },
    PENDING:     { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
    CONFIRMED:   { bg: "rgba(108,99,255,0.12)",  color: "#6c63ff" },
    IN_DELIVERY: { bg: "rgba(0,212,170,0.12)",   color: "#00d4aa" },
    COMPLETED:   { bg: "rgba(34,212,126,0.12)",  color: "#22d47e" },
    CANCELLED:   { bg: "rgba(255,77,109,0.12)",  color: "#ff4d6d" },
    DELETED:     { bg: "rgba(255,77,109,0.12)",  color: "#ff4d6d" },
    SUSPENDED:   { bg: "rgba(255,77,109,0.12)",  color: "#ff4d6d" },
    ACTIVE:      { bg: "rgba(34,212,126,0.12)",  color: "#22d47e" },
  };
  const s = map[status] || { bg: tokens.border, color: tokens.textSecondary };
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: tokens.radius.pill,
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.05em",
      fontFamily: tokens.fontMono,
    }}>
      {status}
    </span>
  );
}

export function AdminTable({ columns, rows, loading }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: tokens.fontBody }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: "10px 14px",
                textAlign: "left",
                fontSize: 11,
                color: tokens.textMuted,
                fontWeight: 600,
                letterSpacing: "0.08em",
                fontFamily: tokens.fontBody,
                whiteSpace: "nowrap",
                position: "sticky",
                top: 0,
                background: tokens.surface,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ padding: 40, textAlign: "center", color: tokens.textMuted }}>Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: 40, textAlign: "center", color: tokens.textMuted }}>No records found</td></tr>
          ) : rows.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              style={{
                borderBottom: `1px solid ${tokens.border}`,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = tokens.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "10px 14px", fontSize: 13, color: tokens.textSecondary, verticalAlign: "middle" }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginTop: 20 }}>
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        style={{
          padding: "6px 14px", borderRadius: tokens.radius.md,
          background: page <= 1 ? tokens.border : tokens.surface,
          border: `1px solid ${tokens.border}`, color: page <= 1 ? tokens.textDisabled : tokens.textSecondary,
          cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 13, fontFamily: tokens.fontBody,
        }}
      >
        ← Prev
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            padding: "6px 12px", borderRadius: tokens.radius.md,
            background: p === page ? tokens.primary : tokens.surface,
            border: `1px solid ${p === page ? tokens.primary : tokens.border}`,
            color: p === page ? "#fff" : tokens.textSecondary,
            cursor: "pointer", fontSize: 13, fontFamily: tokens.fontBody,
          }}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        style={{
          padding: "6px 14px", borderRadius: tokens.radius.md,
          background: page >= totalPages ? tokens.border : tokens.surface,
          border: `1px solid ${tokens.border}`, color: page >= totalPages ? tokens.textDisabled : tokens.textSecondary,
          cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 13, fontFamily: tokens.fontBody,
        }}
      >
        Next →
      </button>
    </div>
  );
}
