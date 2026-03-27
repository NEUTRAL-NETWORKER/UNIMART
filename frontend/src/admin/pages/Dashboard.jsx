import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../styles/tokens";
import adminApi from "../api/adminApi";
import { useToast } from "../components/AdminToast";

const STAT_CARDS = (stats) => [
  { label: "Total Users",    value: stats.total_users,    color: tokens.primary },
  { label: "Active Users",   value: stats.active_users,   color: tokens.success },
  { label: "Total Products", value: stats.total_products, color: tokens.accent },
  { label: "Total Orders",   value: stats.total_orders,   color: tokens.warning },
  { label: "Suspended",      value: stats.suspended_users, color: tokens.danger },
  { label: "New Users (7d)", value: stats.recent_registrations_7d, color: tokens.primary },
  { label: "New Orders (7d)", value: stats.recent_orders_7d, color: tokens.accent },
  { label: "Completed Orders", value: stats.completed_orders, color: tokens.success },
];

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { addToast } = useToast();

  const fetchStats = useCallback(() => {
    adminApi.get("/admin/dashboard/stats")
      .then((r) => {
        setStats(r.data);
        setLastUpdated(new Date());
      })
      .catch(() => addToast("Failed to load dashboard stats", "error"));
  }, [addToast]);

  useEffect(() => {
    fetchStats(); // load immediately on mount

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, REFRESH_INTERVAL);

    return () => clearInterval(interval); // cleanup on unmount
  }, [fetchStats]);

  return (
    <div>
      {/* Header with Live Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ color: tokens.textMuted, fontSize: 14, marginTop: 4 }}>Platform overview</p>
        </div>
        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            background: tokens.accentGlow,
            border: `1px solid ${tokens.accent}`,
            borderRadius: tokens.radius.pill,
            fontSize: 11, fontWeight: 600,
            color: tokens.accent,
            letterSpacing: "0.04em",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: tokens.accent,
              animation: "pulse 1.5s ease-in-out infinite",
              boxShadow: `0 0 6px ${tokens.accent}`,
            }} />
            LIVE · 30s
          </div>
          {lastUpdated && (
            <span style={{ fontSize: 10, color: tokens.textMuted, fontFamily: tokens.fontMono }}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {stats ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {STAT_CARDS(stats).map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                style={{
                  background: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: tokens.radius.lg,
                  padding: "20px 24px",
                  cursor: "default",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                whileHover={{ y: -2 }}
              >
                <div style={{ fontSize: 28, fontWeight: 700, color: card.color, fontFamily: tokens.fontMono }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 13, color: tokens.textSecondary, marginTop: 4 }}>{card.label}</div>
              </motion.div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Product Status Breakdown */}
            <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.lg, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: tokens.textPrimary, marginBottom: 16 }}>Product Status</div>
              {[
                { label: "Available", value: stats.available_products, total: stats.total_products, color: tokens.success },
                { label: "Reserved",  value: stats.reserved_products,  total: stats.total_products, color: tokens.warning },
                { label: "Sold Out",  value: stats.sold_products,      total: stats.total_products, color: tokens.textMuted },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: tokens.textSecondary, marginBottom: 4 }}>
                    <span>{row.label}</span><span>{row.value}</span>
                  </div>
                  <div style={{ height: 6, background: tokens.border, borderRadius: tokens.radius.pill, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: row.total ? `${(row.value / row.total) * 100}%` : "0%" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", background: row.color, borderRadius: tokens.radius.pill }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Order Status Breakdown */}
            <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.lg, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: tokens.textPrimary, marginBottom: 16 }}>Order Status</div>
              {[
                { label: "Pending",   value: stats.pending_orders,   color: tokens.warning },
                { label: "Completed", value: stats.completed_orders, color: tokens.success },
                { label: "Cancelled", value: stats.cancelled_orders, color: tokens.danger },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: tokens.textSecondary, marginBottom: 4 }}>
                    <span>{row.label}</span><span>{row.value}</span>
                  </div>
                  <div style={{ height: 6, background: tokens.border, borderRadius: tokens.radius.pill, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: stats.total_orders ? `${(row.value / stats.total_orders) * 100}%` : "0%" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", background: row.color, borderRadius: tokens.radius.pill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: tokens.textMuted, textAlign: "center", padding: 60 }}>Loading…</div>
      )}
    </div>
  );
}
