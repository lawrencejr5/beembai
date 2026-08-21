"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../admin.module.css";
import Link from "next/link";

const CategoryCard = React.memo(({
  cat,
  setDeleteTarget,
}: {
  cat: any;
  setDeleteTarget: (target: { id: Id<"categories">; name: string }) => void;
}) => {
  return (
    <div style={{
      border: "1px solid #e8e2d0",
      borderRadius: 12,
      overflow: "hidden",
      background: "#fafaf5",
      transition: "box-shadow 0.15s ease, transform 0.15s ease",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(40,38,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {/* Banner */}
      <div style={{ height: 100, background: "#f0ebe0", position: "relative", overflow: "hidden" }}>
        {cat.bannerImage && (
          <img src={cat.bannerImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(26,25,0,0.5), transparent)",
        }} />
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#282600" }}>{cat.name}</h3>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9e9970", background: "#f0ebe0", padding: "2px 8px", borderRadius: 100, flexShrink: 0 }}>
            {cat.slug}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#6b6540", lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {cat.description}
        </p>
        <div style={{ fontSize: 11, color: "#9e9970", marginBottom: 14 }}>
          Filter: <code style={{ background: "#f0ebe0", padding: "1px 6px", borderRadius: 4 }}>{cat.filterValue}</code>
        </div>
        <div className={styles.flexRow}>
          <Link href={`/admin/categories/${cat._id}/edit`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} style={{ flex: 1, justifyContent: "center" }} id={`edit-category-${cat._id}`}>
            Edit
          </Link>
          <button
            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
            onClick={() => setDeleteTarget({ id: cat._id, name: cat.name })}
            id={`delete-category-${cat._id}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

CategoryCard.displayName = "CategoryCard";

export default function AdminCategoriesPage() {
  const categories = useQuery(api.admin.getAllCategoriesAdmin);
  const deleteCategory = useMutation(api.admin.deleteCategory);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"categories">; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return categories ?? [];
    return (categories ?? []).filter((c) =>
      c.name.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term)
    );
  }, [categories, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    await deleteCategory({ categoryId: deleteTarget.id });
    setDeleteTarget(null);
    setLoading(false);
  };

  return (
    <div className={styles.adminContent}>
      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Category</h3>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: 14, color: "#6b6540" }}>
                Permanently delete <strong style={{ color: "#282600" }}>{deleteTarget.name}</strong>? Products in this category won't be deleted but will no longer be linked to an active category.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleDelete} disabled={loading} id="confirm-delete-category">
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Categories</h1>
          <p className={styles.pageSubtitle}>Manage product categories and their display settings</p>
        </div>
        <Link href="/admin/categories/new" className={`${styles.btn} ${styles.btnPrimary}`} id="new-category-btn">
          + New Category
        </Link>
      </div>

      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <h3 className={styles.adminCardTitle}>{filtered.length} categories</h3>
          <div className={styles.searchBox} style={{ maxWidth: 260 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="categories-search"
            />
          </div>
        </div>

        {!categories ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, padding: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ border: "1px solid #e8e2d0", borderRadius: 12, overflow: "hidden", background: "#fafaf5", padding: 16 }}>
                <div className={styles.skeleton} style={{ height: 100, borderRadius: 8, marginBottom: 12 }} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                  <div className={styles.skeleton} style={{ width: "50%", height: 16 }} />
                  <div className={styles.skeleton} style={{ width: "20%", height: 12 }} />
                </div>
                <div className={styles.skeleton} style={{ width: "90%", height: 12, marginBottom: 6 }} />
                <div className={styles.skeleton} style={{ width: "70%", height: 12, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 12 }}>
                  <div className={styles.skeleton} style={{ flex: 1, height: 32, borderRadius: 8 }} />
                  <div className={styles.skeleton} style={{ width: 80, height: 32, borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🏷️</div>
            <h3 className={styles.emptyStateTitle}>No categories yet</h3>
            <p className={styles.emptyStateText}>Create your first category to organize products</p>
            <Link href="/admin/categories/new" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 16 }}>
              Create Category
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, padding: 20 }}>
            {filtered.map((cat) => (
              <CategoryCard
                key={cat._id}
                cat={cat}
                setDeleteTarget={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
