import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tokens } from "../styles/tokens";
import adminApi from "../api/adminApi";
import { AdminTable, StatusBadge, Pagination } from "../components/AdminTable";
import { useToast } from "../components/AdminToast";

export default function Orders() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const load = (p = page, s = search) => {
    setLoading(true);
    adminApi.get("/admin/orders", { params: { page: p, page_size: 20, search: s || undefined } })
      .then((r) => setData(r.data))
      .catch(() => addToast("Failed to load orders", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const overrideStatus = async (id, newStatus) => {
    const reason = window.prompt(`Reason for changing order #${id} to ${newStatus}:`);
    if (!reason) return;
    try {
      await adminApi.patch(`/admin/orders/${id}/status`, { order_status: newStatus, reason });
      addToast("Order status updated", "success");
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error");
    }
  };

  const columns = [
    { key: "id", label: "ORDER", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 12 }}>#{r.id}</span> },
    { key: "product_title", label: "PRODUCT" },
    { key: "buyer_register_number", label: "BUYER", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.buyer_register_number}</span> },
    { key: "seller_register_number", label: "SELLER", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.seller_register_number}</span> },
    { key: "order_status", label: "STATUS", render: (r) => <StatusBadge status={r.order_status} /> },
    { key: "created_at", label: "CREATED", render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : "—" },
    { key: "actions", label: "ACTIONS", render: (r) => (
      <div style={{ display: "flex", gap: 4 }}>
        {["COMPLETED", "CANCELLED"].map((s) => (
          <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => overrideStatus(r.id, s)}
            style={{ padding: "3px 8px", background: "none", border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, color: tokens.textMuted, fontSize: 10, cursor: "pointer", fontFamily: tokens.fontBody }}>
            → {s}
          </motion.button>
        ))}
      </div>
    )},
  ];

  return (
    <div>
      <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 24px" }}>Orders</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load(1, search))}
          placeholder="Search by buyer / seller register no…"
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
    </div>
  );
}
