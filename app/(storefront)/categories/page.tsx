"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { getAllCategories } from "@/app/data/data";
import styles from "./categories.module.css";

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className={styles.container}>
      <Navbar />

      <main className={styles.mainContent}>
        <div className={styles.headerSection}>
          <span className={styles.sectionSubtitle}>Discover Beembai</span>
          <h1 className={styles.sectionTitle}>Shop by Category</h1>
          <p className={styles.sectionDesc}>
            Explore our curated collections of premium design and lifestyle essentials. Handpicked to elevate your daily routine.
          </p>
        </div>

        <div className={styles.categoriesGrid}>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={styles.categoryCard}
              style={{ backgroundImage: `url('${category.bannerImage}')` }}
            >
              <div className={styles.cardOverlay} />
              
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{category.name}</h2>
                <p className={styles.cardDescription}>{category.description}</p>
                <div className={styles.exploreBtn}>
                  <span>Explore Collection</span>
                  <span className={styles.arrowIcon}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
