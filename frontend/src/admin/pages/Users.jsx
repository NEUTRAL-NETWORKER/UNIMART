import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../styles/tokens";
import adminApi from "../api/adminApi";
import { AdminTable, StatusBadge, Pagination } from "../components/AdminTable";
import { useToast } from "../components/AdminToast";

function ConfirmModal({ title, message, identifier, onConfirm, onCancel }) {
  const [text, setText] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.xl, padding: 28, minWidth: 360, fontFamily: tokens.fontBody }}
      >
        <h3 style={{ color: tokens.textPrimary, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{title}</h3>
        <p style={{ color: tokens.textSecondary, fontSize: 13, marginBottom: 20 }}>{message}</p>
        <p style={{ color: tokens.textMuted, fontSize: 12, marginBottom: 8 }}>Type <strong style={{ color: tokens.textSecondary, fontFamily: tokens.fontMono }}>{identifier}</strong> to confirm:</p>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", background: tokens.bgElevated, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, color: tokens.textPrimary, fontSize: 13, fontFamily: tokens.fontMono, outline: "none", boxSizing: "border-box", marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", background: "none", border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, color: tokens.textSecondary, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button
            onClick={() => text === identifier && onConfirm()}
            disabled={text !== identifier}
            style={{ padding: "8px 16px", background: text === identifier ? tokens.danger : tokens.border, border: "none", borderRadius: tokens.radius.md, color: text === identifier ? "#fff" : tokens.textDisabled, cursor: text === identifier ? "pointer" : "not-allowed", fontSize: 13 }}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Users() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const { addToast } = useToast();

  const load = (p = page, s = search) => {
    setLoading(true);
    adminApi.get("/admin/users", { params: { page: p, page_size: 20, search: s || undefined } })
      .then((r) => setData(r.data))
      .catch(() => addToast("Failed to load users", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const doAction = async (action, registerNumber, extra = {}) => {
    try {
      if (action === "suspend") {
        await adminApi.post(`/admin/users/${registerNumber}/suspend`, extra);
        addToast("User suspended", "success");
      } else if (action === "reinstate") {
        await adminApi.post(`/admin/users/${registerNumber}/reinstate`);
        addToast("User reinstated", "success");
      } else if (action === "delete") {
        await adminApi.delete(`/admin/users/${registerNumber}`);
        addToast("User deleted", "success");
      }
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error");
    }
    setModal(null);
  };

  const columns = [
    { key: "register_number", label: "REG NO", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 12 }}>{r.register_number}</span> },
    { key: "username", label: "USERNAME" },
    { key: "full_name", label: "NAME" },
    { key: "department", label: "DEPT" },
    { key: "status", label: "STATUS", render: (r) => <StatusBadge status={r.is_suspended ? "SUSPENDED" : "ACTIVE"} /> },
    { key: "actions", label: "ACTIONS", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        {!r.is_suspended ? (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setModal({ type: "suspend", registerNumber: r.register_number })}
            style={{ padding: "4px 10px", background: tokens.dangerGlow, border: `1px solid ${tokens.danger}`, borderRadius: tokens.radius.md, color: tokens.danger, fontSize: 11, cursor: "pointer", fontFamily: tokens.fontBody }}>
            Suspend
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => doAction("reinstate", r.register_number)}
            style={{ padding: "4px 10px", background: tokens.accentGlow, border: `1px solid ${tokens.accent}`, borderRadius: tokens.radius.md, color: tokens.accent, fontSize: 11, cursor: "pointer", fontFamily: tokens.fontBody }}>
            Reinstate
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setModal({ type: "delete", registerNumber: r.register_number })}
          style={{ padding: "4px 10px", background: "none", border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, color: tokens.textMuted, fontSize: 11, cursor: "pointer", fontFamily: tokens.fontBody }}>
          Delete
        </motion.button>
      </div>
    )},
  ];

  return (
    <div>
      <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 24px" }}>Users</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load(1, search))}
          placeholder="Search by register no or username…"
          style={{ flex: 1, padding: "8px 14px", background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, color: tokens.textPrimary, fontSize: 13, outline: "none", fontFamily: tokens.fontBody }}
        />
        <button onClick={() => { setPage(1); load(1, search); }} style={{ padding: "8px 16px", background: tokens.primary, border: "none", borderRadius: tokens.radius.md, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: tokens.fontBody }}>
          Search
        </button>
      </div>

      <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.lg, overflow: "hidden" }}>
        <AdminTable columns={columns} rows={data?.items || []} loading={loading} />
      </div>

      {data && <Pagination page={page} totalPages={data.total_pages} onChange={(p) => { setPage(p); load(p, search); }} />}

      <AnimatePresence>
        {modal?.type === "suspend" && (
          <ConfirmModal
            title="Suspend User"
            message="This will prevent the user from logging in. You can reinstate them at any time."
            identifier={modal.registerNumber}
            onConfirm={() => doAction("suspend", modal.registerNumber, { reason: "Admin action" })}
            onCancel={() => setModal(null)}
          />
        )}
        {modal?.type === "delete" && (
          <ConfirmModal
            title="Delete User"
            message="This will soft-delete the user. Their orders and chat history are preserved."
            identifier={modal.registerNumber}
            onConfirm={() => doAction("delete", modal.registerNumber)}
            onCancel={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
