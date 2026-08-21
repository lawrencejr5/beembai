"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "../../../../admin.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const categoryId = params.id as Id<"categories">;
  const router = useRouter();
  const category = useQuery(api.admin.getCategoryByIdAdmin, { categoryId });
  const updateCategory = useMutation(api.admin.updateCategory);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    bannerImage: "",
    filterValue: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        slug: category.slug,
        description: category.description,
        bannerImage: category.bannerImage,
        filterValue: category.filterValue,
      });
    }
  }, [category]);

  if (category === undefined) return <div className={styles.adminContent} style={{ color: "#6b6540" }}>Loading…</div>;
  if (!category) return <div className={styles.adminContent}><p>Category not found.</p></div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateCategory({ categoryId, ...form });
      router.push("/admin/categories");
    } catch (err: any) {
      setError(err.message ?? "Failed to update category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminContent}>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/admin/categories" style={{ fontSize: 13, color: "#6b6540" }}>← Categories</Link>
          </div>
          <h1 className={styles.pageTitle}>Edit Category</h1>
          <p className={styles.pageSubtitle}>Editing: {category.name}</p>
        </div>
      </div>

      <div className={styles.adminCard} style={{ maxWidth: 680 }}>
        <div className={styles.adminCardHeader}>
          <h3 className={styles.adminCardTitle}>Category Details</h3>
        </div>
        <div className={styles.adminCardBody}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {error && (
              <div style={{ background: "rgba(166,62,38,0.08)", border: "1px solid rgba(166,62,38,0.2)", borderRadius: 8, padding: "12px 16px", color: "#a63e26", fontSize: 14 }}>
                {error}
              </div>
            )}

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="cat-name">Category Name *</label>
                <input id="cat-name" type="text" className={styles.formInput} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="cat-slug">Slug *</label>
                <input id="cat-slug" type="text" className={styles.formInput} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="cat-desc">Description *</label>
              <textarea id="cat-desc" className={styles.formTextarea} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="cat-banner">Banner Image URL</label>
              <input id="cat-banner" type="url" className={styles.formInput} placeholder="https://..." value={form.bannerImage} onChange={(e) => setForm((f) => ({ ...f, bannerImage: e.target.value }))} />
              {form.bannerImage && (
                <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", height: 100 }}>
                  <img src={form.bannerImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="cat-filter">Filter Value</label>
              <input id="cat-filter" type="text" className={styles.formInput} value={form.filterValue} onChange={(e) => setForm((f) => ({ ...f, filterValue: e.target.value }))} />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading} id="update-category-submit">
                {loading ? "Saving…" : "Save Changes"}
              </button>
              <Link href="/admin/categories" className={`${styles.btn} ${styles.btnGhost}`}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
