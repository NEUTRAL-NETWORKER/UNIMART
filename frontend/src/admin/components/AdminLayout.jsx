import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Package, ShoppingCart, Shield, LogOut } from "lucide-react";
import { tokens } from "../styles/tokens";
import { useAdminAuth } from "../AdminAuthContext";
import "../pages/admin.css";

const NAV = [
  { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "DASHBOARD",  path: "/admin" },
  { id: "users",     icon: <Users size={16} />,           label: "USERS",       path: "/admin/users" },
  { id: "products",  icon: <Package size={16} />,         label: "PRODUCTS",    path: "/admin/products" },
  { id: "orders",    icon: <ShoppingCart size={16} />,    label: "ORDERS",      path: "/admin/orders" },
  { id: "audit",     icon: <Shield size={16} />,          label: "AUDIT LOGS",  path: "/admin/audit" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: tokens.bg, fontFamily: tokens.fontBody }}>
      {/* Scanlines overlay */}
      <div className="admin-scanlines" />

      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: tokens.bgElevated,
        borderRight: `1px solid ${tokens.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ padding: "0 20px", marginBottom: 32 }}>
          <div style={{
            fontFamily: tokens.fontDisplay,
            fontSize: 20,
            fontWeight: 800,
            color: tokens.primary,
            letterSpacing: "0.2em",
            textShadow: "0 0 12px rgba(0,255,65,0.6)",
          }}>
            UNIMART
          </div>
          <div style={{
            fontSize: 9,
            color: "#ff0033",
            letterSpacing: "0.3em",
            marginTop: 2,
            textShadow: "0 0 8px rgba(255,0,51,0.6)",
          }}>
            ADMIN PANEL
          </div>
          <div style={{ width: "100%", height: 1, background: tokens.border, marginTop: 12 }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {NAV.map((item, i) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 20 }}
                style={{ position: "relative", marginBottom: 2 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: tokens.primary,
                      boxShadow: "0 0 8px rgba(0,255,65,0.8)",
                    }}
                  />
                )}
                <Link
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px 9px 16px",
                    borderRadius: "2px",
                    color: isActive ? tokens.primary : tokens.textSecondary,
                    background: isActive ? "rgba(0,255,65,0.06)" : "transparent",
                    textDecoration: "none",
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 400,
                    letterSpacing: "0.12em",
                    transition: "all 0.15s",
                    textShadow: isActive ? "0 0 8px rgba(0,255,65,0.6)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(0,255,65,0.04)";
                      e.currentTarget.style.color = tokens.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = tokens.textSecondary;
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Admin info + logout */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${tokens.border}` }}>
          {admin && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: tokens.primary, fontWeight: 700, letterSpacing: "0.1em" }}>{admin.displayName?.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: tokens.textMuted, letterSpacing: "0.1em", marginTop: 2 }}>@{admin.username}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "1px solid #003d0c",
              borderRadius: "2px",
              color: tokens.textSecondary,
              fontSize: 10,
              cursor: "pointer",
              padding: "7px 12px",
              width: "100%",
              fontFamily: tokens.fontBody,
              letterSpacing: "0.15em",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ff0033";
              e.currentTarget.style.color = "#ff0033";
              e.currentTarget.style.textShadow = "0 0 8px rgba(255,0,51,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#003d0c";
              e.currentTarget.style.color = tokens.textSecondary;
              e.currentTarget.style.textShadow = "none";
            }}
          >
            <LogOut size={12} />
            DISCONNECT
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: 32, position: "relative", zIndex: 5 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

