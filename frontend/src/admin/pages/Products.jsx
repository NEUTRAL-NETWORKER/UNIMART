import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../styles/tokens";
import adminApi from "../api/adminApi";
import { AdminTable, StatusBadge, Pagination } from "../components/AdminTable";
import { useToast } from "../components/AdminToast";

export default function Products() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const { addToast } = useToast();

  const load = (p = page, s = search) => {
    setLoading(true);
    adminApi.get("/admin/products", { params: { page: p, page_size: 20, search: s || undefined } })
      .then((r) => setData(r.data))
      .catch(() => addToast("Failed to load products", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fetchProductDetail = async (id) => {
    try {
      const r = await adminApi.get(`/admin/products/${id}`);
      setDetailProduct(r.data);
    } catch {
      addToast("Failed to load product details", "error");
    }
  };

  const flagProduct = async (id) => {
    try {
      await adminApi.post(`/admin/products/${id}/flag`);
      addToast("Product flagged", "warning");
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/admin/products/${id}`);
      addToast("Product deleted", "success");
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error");
    }
  };

  const columns = [
    { key: "id", label: "ID", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 12 }}>#{r.id}</span> },
    { key: "title", label: "TITLE", render: (r) => (
      <span
        onClick={() => fetchProductDetail(r.id)}
        style={{ color: tokens.primary, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}
      >
        {r.title}
      </span>
    )},
    { key: "price", label: "PRICE", render: (r) => <span style={{ fontFamily: tokens.fontMono }}>₹{r.price}</span> },
    { key: "product_status", label: "STATUS", render: (r) => <StatusBadge status={r.product_status} /> },
    { key: "is_flagged", label: "FLAGGED", render: (r) => r.is_flagged ? <span style={{ color: tokens.danger, fontSize: 12 }}>⚑ Flagged</span> : <span style={{ color: tokens.textMuted, fontSize: 12 }}>—</span> },
    { key: "seller", label: "SELLER", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.seller_username}</span> },
    { key: "actions", label: "ACTIONS", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        {!r.is_flagged && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => flagProduct(r.id)}
            style={{ padding: "4px 10px", background: tokens.warningGlow, border: `1px solid ${tokens.warning}`, borderRadius: tokens.radius.md, color: tokens.warning, fontSize: 11, cursor: "pointer", fontFamily: tokens.fontBody }}>
            Flag
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => deleteProduct(r.id)}
          style={{ padding: "4px 10px", background: tokens.dangerGlow, border: `1px solid ${tokens.danger}`, borderRadius: tokens.radius.md, color: tokens.danger, fontSize: 11, cursor: "pointer", fontFamily: tokens.fontBody }}>
          Delete
        </motion.button>
      </div>
    )},
  ];

  return (
    <div>
      <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 24px" }}>Products</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load(1, search))}
          placeholder="Search by title…"
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

      {/* Product Detail Modal */}
      <AnimatePresence>
        {detailProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailProduct(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.xl, padding: 28, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", fontFamily: tokens.fontBody }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <h3 style={{ color: tokens.textPrimary, fontSize: 18, fontWeight: 700, margin: 0, fontFamily: tokens.fontDisplay }}>
                  Product Details
                </h3>
                <button onClick={() => setDetailProduct(null)} style={{ background: "none", border: "none", color: tokens.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
              </div>

              {/* Details grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
                {[
                  ["Title",       detailProduct.title],
                  ["Price",       `₹${detailProduct.price}`],
                  ["Status",      detailProduct.product_status],
                  ["Category",    detailProduct.category || "—"],
                  ["Seller",      detailProduct.seller_username],
                  ["Reg No.",     detailProduct.seller_register_number],
                  ["Flagged",     detailProduct.is_flagged ? "⚑ Yes" : "No"],
                  ["Listed On",   detailProduct.created_at ? new Date(detailProduct.created_at).toLocaleString() : "—"],
                  ["Sold At",     detailProduct.sold_at ? new Date(detailProduct.sold_at).toLocaleString() : "—"],
                  ["Description", detailProduct.description || "—"],
                ].map(([label, value]) => (
                  <div key={label} style={{ gridColumn: label === "Description" ? "1 / -1" : "auto" }}>
                    <div style={{ color: tokens.textMuted, fontSize: 10, letterSpacing: "0.06em", marginBottom: 3 }}>{label.toUpperCase()}</div>
                    <div style={{ color: tokens.textPrimary, fontWeight: 500, wordBreak: "break-word" }}>{String(value)}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                {!detailProduct.is_flagged && (
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { flagProduct(detailProduct.id); setDetailProduct(null); }}
                    style={{ padding: "8px 16px", background: tokens.warningGlow, border: `1px solid ${tokens.warning}`, borderRadius: tokens.radius.md, color: tokens.warning, fontSize: 12, cursor: "pointer" }}>
                    Flag Product
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => { deleteProduct(detailProduct.id); setDetailProduct(null); }}
                  style={{ padding: "8px 16px", background: tokens.dangerGlow, border: `1px solid ${tokens.danger}`, borderRadius: tokens.radius.md, color: tokens.danger, fontSize: 12, cursor: "pointer" }}>
                  Delete Product
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
