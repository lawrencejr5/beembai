"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "../../admin.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewCategoryPage() {
  const router = useRouter();
  const createCategory = useMutation(api.admin.createCategory);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    bannerImage: "",
    filterValue: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.description) {
      setError("Name, slug, and description are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createCategory({
        name: form.name,
        slug: form.slug,
        description: form.description,
        bannerImage: form.bannerImage,
        filterValue: form.filterValue || form.slug,
      });
      router.push("/admin/categories");
    } catch (err: any) {
      setError(err.message ?? "Failed to create category.");
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
          <h1 className={styles.pageTitle}>New Category</h1>
          <p className={styles.pageSubtitle}>Create a new product category</p>
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
                <input
                  id="cat-name"
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Electronics"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="cat-slug">Slug *</label>
                <input
                  id="cat-slug"
                  type="text"
                  className={styles.formInput}
                  placeholder="electronics"
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="cat-desc">Description *</label>
              <textarea
                id="cat-desc"
                className={styles.formTextarea}
                placeholder="Describe this category..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="cat-banner">Banner Image URL</label>
              <input
                id="cat-banner"
                type="url"
                className={styles.formInput}
                placeholder="https://..."
                value={form.bannerImage}
                onChange={(e) => setForm((f) => ({ ...f, bannerImage: e.target.value }))}
              />
              {form.bannerImage && (
                <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", height: 100 }}>
                  <img src={form.bannerImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="cat-filter">Filter Value</label>
              <input
                id="cat-filter"
                type="text"
                className={styles.formInput}
                placeholder="Used for filtering products (defaults to slug)"
                value={form.filterValue}
                onChange={(e) => setForm((f) => ({ ...f, filterValue: e.target.value }))}
              />
              <span style={{ fontSize: 12, color: "#9e9970" }}>Leave blank to use the slug as the filter value</span>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading} id="create-category-submit">
                {loading ? "Creating…" : "Create Category"}
              </button>
              <Link href="/admin/categories" className={`${styles.btn} ${styles.btnGhost}`}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
