import { useEffect, useState } from "react";
import { tokens } from "../styles/tokens";
import adminApi from "../api/adminApi";
import { AdminTable, Pagination } from "../components/AdminTable";
import { useToast } from "../components/AdminToast";

// Tab: "admin" = admin audit logs, "user" = user activity logs
export default function AuditLogs() {
  const [tab, setTab] = useState("admin");
  const [adminData, setAdminData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const loadAdmin = (p = 1) => {
    setLoading(true);
    adminApi.get("/admin/audit-logs", { params: { page: p, page_size: 20 } })
      .then((r) => setAdminData(r.data))
      .catch(() => addToast("Failed to load admin logs", "error"))
      .finally(() => setLoading(false));
  };

  const loadUser = (p = 1) => {
    setLoading(true);
    adminApi.get("/admin/user-activity-logs", { params: { page: p, page_size: 20 } })
      .then((r) => setUserData(r.data))
      .catch(() => addToast("Failed to load user activity logs", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === "admin") { setPage(1); loadAdmin(1); }
    else                  { setPage(1); loadUser(1); }
  }, [tab]);

  const adminColumns = [
    { key: "id",             label: "ID",          render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.id}</span> },
    { key: "admin_username", label: "ADMIN",        render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 12, color: tokens.primary }}>{r.admin_username}</span> },
    { key: "action",         label: "ACTION",       render: (r) => <span style={{ padding: "2px 8px", borderRadius: tokens.radius.pill, background: tokens.primaryGlow, color: tokens.primary, fontSize: 11, fontFamily: tokens.fontMono }}>{r.action}</span> },
    { key: "target_type",    label: "TARGET TYPE",  render: (r) => <span style={{ color: tokens.textSecondary, fontSize: 12 }}>{r.target_type}</span> },
    { key: "target_id",      label: "TARGET ID",    render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.target_id}</span> },
    { key: "ip_address",     label: "IP",           render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.textMuted }}>{r.ip_address || "—"}</span> },
    { key: "created_at",     label: "TIMESTAMP",    render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : "—" },
  ];

  const userColumns = [
    { key: "id",               label: "ID",           render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.id}</span> },
    { key: "register_number",  label: "REG NO",       render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.accent }}>{r.register_number}</span> },
    { key: "username",         label: "USERNAME",     render: (r) => <span style={{ fontSize: 12 }}>{r.username || "—"}</span> },
    { key: "action",           label: "ACTION",       render: (r) => <span style={{ padding: "2px 8px", borderRadius: tokens.radius.pill, background: tokens.accentGlow, color: tokens.accent, fontSize: 11, fontFamily: tokens.fontMono }}>{r.action}</span> },
    { key: "details",          label: "DETAILS",      render: (r) => <span style={{ color: tokens.textSecondary, fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>{r.details || "—"}</span> },
    { key: "ip_address",       label: "IP",           render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.textMuted }}>{r.ip_address || "—"}</span> },
    { key: "created_at",       label: "TIMESTAMP",    render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : "—" },
  ];

  const currentData = tab === "admin" ? adminData : userData;

  return (
    <div>
      <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 24px" }}>Audit Logs</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: tokens.bgElevated, padding: 4, borderRadius: tokens.radius.md, width: "fit-content" }}>
        {[
          { key: "admin", label: "Admin Actions" },
          { key: "user", label: "User Activity" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: "7px 18px", borderRadius: tokens.radius.sm, border: "none", cursor: "pointer",
              fontSize: 13, fontFamily: tokens.fontBody,
              fontWeight: tab === t.key ? 600 : 400,
              background: tab === t.key ? tokens.primary : "transparent",
              color: tab === t.key ? "#fff" : tokens.textSecondary,
              transition: "all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.lg, overflow: "hidden" }}>
        <AdminTable
          columns={tab === "admin" ? adminColumns : userColumns}
          rows={currentData?.items || []}
          loading={loading}
        />
      </div>

      {currentData && (
        <Pagination
          page={page}
          totalPages={currentData.total_pages}
          onChange={(p) => { setPage(p); tab === "admin" ? loadAdmin(p) : loadUser(p); }}
        />
      )}
    </div>
  );
}
